import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const APPLICATIONS_URL = 'https://topcvxme.base44.app/functions/nexoraApplications';
const COMPANY_URL = 'https://topcvxme.base44.app/functions/nexoraCompany';
const COMPANY_NAME = 'Nexora Technology';
const SOURCE = 'topcvxme';

function firstValue(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return undefined;
}

function toIso(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.applications)) return payload.applications;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.company?.applications)) return payload.company.applications;
  return [];
}

async function fetchList(url, apiKey) {
  const headers = { Accept: 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) return { found: false, list: [] };
  const payload = await res.json();
  return { found: true, list: extractList(payload) };
}

function normalizeTitle(value) {
  return String(value || '').toLowerCase().trim();
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let apiKey;
    try {
      apiKey = secrets.get('TOPCV_API_KEY');
    } catch (e) {
      apiKey = undefined;
    }

    const primary = await fetchList(APPLICATIONS_URL, apiKey);
    let sourceList = primary.list;
    if (!sourceList.length) {
      const fallback = await fetchList(COMPANY_URL, apiKey);
      sourceList = fallback.list;
      if (!sourceList.length) {
        return Response.json({
          ok: false,
          ready: false,
          total: 0,
          created: 0,
          updated: 0,
          message: 'Nguồn TopCV chưa cung cấp dữ liệu hồ sơ ứng tuyển.'
        });
      }
    }

    const jobsPage = await base44.asServiceRole.entities.Job.filter({ company: COMPANY_NAME }, { limit: 200 });
    const jobs = jobsPage?.items || [];

    const existingPage = await base44.asServiceRole.entities.Application.filter(
      { external_source: SOURCE },
      { limit: 500 }
    );
    const existing = existingPage?.items || [];

    const toCreate = [];
    const toUpdate = [];
    let skipped = 0;

    for (const item of sourceList) {
      const sourceId = firstValue(item, ['id', 'application_id', 'applicationId', 'external_id']);
      const fullName = firstValue(item, ['full_name', 'fullName', 'candidate_name', 'candidateName', 'name']);
      const email = firstValue(item, ['email', 'candidate_email', 'candidateEmail']);
      if (!sourceId || !fullName || !email) {
        skipped += 1;
        continue;
      }

      const sourceJobId = firstValue(item, ['job_id', 'jobId', 'job_external_id']);
      const jobTitle = firstValue(item, ['job_title', 'jobTitle', 'position', 'job', 'title']);
      const job =
        jobs.find((j) => sourceJobId && j.external_id === String(sourceJobId)) ||
        jobs.find((j) => normalizeTitle(j.title) === normalizeTitle(jobTitle)) ||
        jobs.find((j) => jobTitle && normalizeTitle(j.title).includes(normalizeTitle(jobTitle)));
      if (!job) {
        skipped += 1;
        continue;
      }

      const cvUrl = firstValue(item, ['cv_source_url', 'cv_url', 'cvUrl', 'cv_file_url', 'cv_link', 'resume_url']);
      const contact = {
        full_name: String(fullName),
        email: String(email),
        phone: firstValue(item, ['phone', 'phone_number', 'candidate_phone']),
        job_id: job.id,
        job_title: job.title,
        company: COMPANY_NAME,
        cv_source: SOURCE,
        cv_source_url: cvUrl,
        portfolio_url: firstValue(item, ['portfolio_url', 'portfolio', 'website']),
        cover_letter: firstValue(item, ['cover_letter', 'coverLetter', 'note', 'message']),
        external_id: String(sourceId),
        external_source: SOURCE
      };

      const match = existing.find((a) => a.external_id === String(sourceId));
      if (match) {
        toUpdate.push({
          id: match.id,
          full_name: contact.full_name,
          email: contact.email,
          phone: contact.phone,
          cv_source_url: contact.cv_source_url,
          portfolio_url: contact.portfolio_url,
          last_synced_at: new Date().toISOString()
        });
      } else {
        toCreate.push({
          ...contact,
          status: 'cv_screening',
          last_synced_at: new Date().toISOString(),
          notes: `Hồ sơ đồng bộ từ TopCV lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Saigon' })}`
        });
      }
    }

    if (toCreate.length) await base44.asServiceRole.entities.Application.bulkCreate(toCreate);
    if (toUpdate.length) await base44.asServiceRole.entities.Application.bulkUpdate(toUpdate);

    return Response.json({
      ok: true,
      ready: true,
      total: sourceList.length,
      created: toCreate.length,
      updated: toUpdate.length,
      skipped,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}