import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const SOURCE_URL = 'https://topcvxme.base44.app/functions/nexoraCompany';

function parseSalary(text) {
  const nums = String(text || '').match(/\d+/g);
  if (!nums || nums.length === 0) return { min: undefined, max: undefined };
  const min = Number(nums[0]);
  const max = nums.length > 1 ? Number(nums[1]) : min;
  return { min, max };
}

function parseDeadline(text) {
  const m = String(text || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function experienceLevel(text) {
  const n = Number((String(text || '').match(/\d+/) || [0])[0]);
  if (n >= 5) return 'senior';
  if (n >= 2) return 'mid';
  if (n >= 1) return 'junior';
  return 'entry';
}

function workType(tags, extraText) {
  const list = [...(tags || []), String(extraText || '')].map((t) => String(t).toLowerCase());
  if (list.some((t) => t.includes('remote'))) return 'remote';
  if (list.some((t) => t.includes('hybrid'))) return 'hybrid';
  return 'onsite';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return Response.json({ error: 'Không đọc được dữ liệu nguồn' }, { status: 502 });

    const payload = await res.json();
    const company = payload?.company || {};
    const sourceJobs = Array.isArray(company.jobs) ? company.jobs : [];
    const companyName = 'Nexora Technology';

    const existingPage = await base44.asServiceRole.entities.Job.filter(
      { company: companyName },
      { limit: 200 }
    );
    const existing = existingPage?.items || [];

    const toCreate = [];
    const toUpdate = [];

    for (const job of sourceJobs) {
      if (!job?.id || !job?.title) continue;
      const salary = parseSalary(job.salary);
      const fields = {
        title: job.title,
        company: companyName,
        location: job.location || company.location || 'Hà Nội',
        work_type: workType(job.tags, (company.benefits || []).join(' ')),
        employment_type: 'full-time',
        salary_min: salary.min,
        salary_max: salary.max,
        salary_visible: true,
        category: company.industry || 'Công nghệ phần mềm',
        experience_level: experienceLevel(job.experience),
        skills: (job.tags || []).filter((t) => !/hybrid|remote|full-time/i.test(String(t))),
        vacancy: job.quantity || 1,
        deadline: parseDeadline(job.deadline),
        status: 'published',
        external_id: job.id,
        external_source: 'topcvxme'
      };

      const match =
        existing.find((j) => j.external_id === job.id) ||
        existing.find((j) => j.title === job.title);

      if (match) {
        toUpdate.push({
          id: match.id,
          ...fields,
          description: match.description || job.description || '',
          benefits: match.benefits || (company.benefits || []).join('\n')
        });
      } else {
        toCreate.push({
          ...fields,
          description: job.description || '',
          benefits: (company.benefits || []).join('\n')
        });
      }
    }

    if (toCreate.length) await base44.asServiceRole.entities.Job.bulkCreate(toCreate);
    if (toUpdate.length) await base44.asServiceRole.entities.Job.bulkUpdate(toUpdate);

    return Response.json({
      ok: true,
      created: toCreate.length,
      updated: toUpdate.length,
      total: sourceJobs.length,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}