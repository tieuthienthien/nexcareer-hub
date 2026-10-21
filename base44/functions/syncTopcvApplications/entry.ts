import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const APPLICATIONS_URL = 'https://topcvxme.base44.app/functions/nexoraApplications';
const COMPANY_URL = 'https://topcvxme.base44.app/functions/nexoraCompany';
const COMPANY_NAME = 'Nexora Technology';
const SOURCE = 'topcvxme';
const UNMATCHED_JOB_ID = 'topcv-unmatched';

function firstValue(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return undefined;
}

function isMasked(value) {
  return typeof value === 'string' && value.includes('*');
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
    }
    if (!sourceList.length) {
      return Response.json({
        ok: true,
        ready: false,
        total: 0,
        created: 0,
        updated: 0,
        needsReview: 0,
        message: 'Nguồn TopCV chưa có hồ sơ nào thuộc Nexora Technology.'
      });
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
    let needsReview = 0;

    for (const item of sourceList) {
      const candidate = item?.candidate || {};
      const sourceJobId = firstValue(item, ['job_id', 'jobId', 'job_external_id']);
      const jobTitle = firstValue(item, ['job_title', 'jobTitle', 'position', 'job', 'title']);
      const appliedAt = firstValue(item, ['applied_at', 'appliedAt', 'created_date', 'createdDate', 'submitted_at']);
      const sourceId =
        firstValue(item, ['id', 'application_id', 'applicationId', 'external_id']) ||
        `${sourceJobId || 'job'}-${appliedAt || ''}`;

      const name = firstValue(candidate, ['full_name', 'fullName', 'name']) ||
        firstValue(item, ['full_name', 'fullName', 'candidate_name', 'candidateName', 'name']);
      const email = firstValue(candidate, ['email', 'candidate_email', 'candidateEmail']) ||
        firstValue(item, ['email', 'candidate_email', 'candidateEmail']);
      const phone = firstValue(candidate, ['phone', 'phone_number']) ||
        firstValue(item, ['phone', 'phone_number', 'candidate_phone']);

      const job =
        jobs.find((j) => sourceJobId && j.external_id === String(sourceJobId)) ||
        jobs.find((j) => normalizeTitle(j.title) === normalizeTitle(jobTitle)) ||
        jobs.find((j) => jobTitle && normalizeTitle(j.title).includes(normalizeTitle(jobTitle)));

      const nameUnusable = !name || isMasked(name);
      const emailUnusable = !email || isMasked(email);
      const flags = [];
      if (nameUnusable || emailUnusable) flags.push('nguồn đang ẩn thông tin cá nhân');
      if (!job) flags.push('chưa ghép được tin tuyển dụng');

      const fallbackName = `Hồ sơ TopCV #${String(sourceId).slice(-6)}`;
      const fallbackEmail = `${String(sourceId).toLowerCase().replace(/[^a-z0-9]/g, '')}@topcvxme.local`;

      const contact = {
        full_name: nameUnusable ? fallbackName : String(name),
        email: emailUnusable ? fallbackEmail : String(email),
        phone,
        job_id: job ? job.id : UNMATCHED_JOB_ID,
        job_title: job ? job.title : (jobTitle || 'Chưa ghép được tin tuyển dụng'),
        company: COMPANY_NAME,
        cv_source: SOURCE,
        cv_source_url: firstValue(item, ['cv_source_url', 'cv_url', 'cvUrl', 'cv_file_url', 'cv_link', 'resume_url']) ||
          firstValue(candidate, ['cv_source_url', 'cv_url', 'cvUrl', 'cv_file_url', 'cv_link']),
        english_certificate: firstValue(candidate, ['english_certificate', 'englishCertificate', 'certificate']) ||
          firstValue(item, ['english_certificate', 'englishCertificate', 'certificate']),
        github_url: firstValue(candidate, ['github_url', 'githubUrl', 'github']) ||
          firstValue(item, ['github_url', 'githubUrl', 'github']),
        certificate_uris: firstValue(candidate, ['certificate_uris', 'certificates']) ||
          firstValue(item, ['certificate_uris', 'certificates']),
        external_id: String(sourceId),
        external_source: SOURCE,
        needs_review: flags.length > 0
      };
      if (flags.length) needsReview += 1;

      const match = existing.find((a) => a.external_id === String(sourceId));
      if (match) {
        toUpdate.push({
          id: match.id,
          full_name: contact.full_name,
          email: contact.email,
          phone: contact.phone || match.phone,
          cv_source_url: contact.cv_source_url || match.cv_source_url,
          ...(contact.english_certificate ? { english_certificate: contact.english_certificate } : {}),
          ...(contact.github_url ? { github_url: contact.github_url } : {}),
          ...(Array.isArray(contact.certificate_uris) && contact.certificate_uris.length
            ? { certificate_uris: contact.certificate_uris }
            : {}),
          job_id: contact.job_id,
          job_title: contact.job_title,
          needs_review: contact.needs_review,
          last_synced_at: new Date().toISOString()
        });
      } else {
        toCreate.push({
          ...contact,
          status: 'cv_screening',
          last_synced_at: new Date().toISOString(),
          notes: flags.length
            ? `Cần rà soát: ${flags.join('; ')}. Đồng bộ từ TopCV lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Saigon' })}`
            : `Hồ sơ đồng bộ từ TopCV lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Saigon' })}`
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
      needsReview,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}