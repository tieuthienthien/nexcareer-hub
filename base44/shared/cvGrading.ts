import { AI_MODEL } from './aiModel.ts';

export type RubricItem = { group: string; label: string; band?: string; requirement: string; weight: number };

const GROUPS: { key: string; label: string }[] = [
  { key: 'skills', label: 'Kỹ năng' },
  { key: 'certificates', label: 'Bằng cấp / Chứng chỉ' },
  { key: 'experience', label: 'Kinh nghiệm' },
  { key: 'level', label: 'Cấp bậc' },
  { key: 'work_type', label: 'Hình thức làm việc' },
  { key: 'salary', label: 'Mức lương' }
];

export function flattenRubric(job: any): RubricItem[] {
  const rubric = job?.rubric || {};
  const out: RubricItem[] = [];
  for (const g of GROUPS) {
    const items = Array.isArray(rubric[g.key]) ? rubric[g.key] : [];
    for (const item of items) {
      const label = String(item?.label || '').trim();
      if (!label) continue;
      out.push({
        group: g.label,
        label,
        band: item?.band ? String(item.band) : '',
        requirement: item?.requirement === 'preferred' ? 'preferred' : 'required',
        weight: Number(item?.weight) > 0 ? Number(item.weight) : 1
      });
    }
  }
  if (out.length) return out.slice(0, 40);
  // Barem dự phòng khi vị trí chưa có phần thô: lấy từ kỹ năng của tin tuyển dụng.
  return (job?.skills || []).slice(0, 20).map((s: string) => ({
    group: 'Kỹ năng', label: String(s), band: '', requirement: 'required', weight: 1
  }));
}

/** Đọc nội dung CV của hồ sơ: ưu tiên file đính kèm, sau đó tới dữ liệu đồng bộ / thư ứng tuyển. */
export async function readCv(base44: any, app: any): Promise<{ cvText: string; cvMeta: any }> {
  let cvText = '';
  let cvMeta: any = null;
  if (app.cv_file_uri) {
    try {
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: app.cv_file_uri, expires_in: 600 });
      const extracted = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url: signed_url,
        json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            certificates: { type: 'array', items: { type: 'string' } },
            education: { type: 'string' },
            experience_years: { type: 'number' },
            recent_roles: { type: 'array', items: { type: 'string' } },
            raw_text: { type: 'string' }
          }
        }
      });
      cvMeta = extracted?.output || null;
      cvText = JSON.stringify(extracted?.output || {});
    } catch (e) {
      cvText = '';
    }
  }
  if (!cvText && (app.cv_snapshot || app.cover_letter || app.english_certificate || app.github_url)) {
    cvText = [
      app.cv_snapshot ? `CV (nguồn): ${app.cv_snapshot}` : '',
      app.cover_letter ? `Thư ứng tuyển: ${app.cover_letter}` : '',
      app.english_certificate ? `Chứng chỉ tiếng Anh: ${app.english_certificate}` : '',
      app.github_url ? `GitHub: ${app.github_url}` : '',
      app.portfolio_url ? `Portfolio: ${app.portfolio_url}` : ''
    ].filter(Boolean).join('\n').slice(0, 8000);
  }
  return { cvText, cvMeta };
}

/** AI đối chiếu barem của vị trí với nội dung CV và trả về điểm + nhận xét. */
export async function gradeCv(base44: any, params: { app: any; job: any; rubric: RubricItem[]; cvText: string; cvMeta: any; nexoraCerts: string[] }) {
  const { app, job, rubric, cvText, cvMeta, nexoraCerts } = params;
  const rubricLines = rubric.map((r, i) => `${i + 1}. [${r.group}] ${r.label}${r.band ? ` (${r.band})` : ''} — ${r.requirement === 'required' ? 'Bắt buộc' : 'Ưu tiên'}`).join('\n');
  const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
    model: AI_MODEL,
    prompt: `Bạn là chuyên gia tuyển dụng của Nexora Technology. Đối chiếu từng nhãn trong BAREM với nội dung CV của ứng viên.

BAREM của vị trí "${job?.title || app.job_title}":
${rubricLines}

NỘI DUNG CV (đã trích xuất):
${String(cvText).slice(0, 8000)}

CHỨNG CHỈ DO NEXORA CẤP (hợp lệ, được tính như chứng chỉ trong CV):
${nexoraCerts.length ? nexoraCerts.map((c) => `- ${c}`).join('\n') : '(không có)'}

Quy tắc:
- Chỉ kết luận "matched: true" khi CV có bằng chứng rõ ràng (tên kỹ năng, dự án, số năm, chứng chỉ, bằng cấp).
- Với chứng chỉ có band (VD: IELTS 7.0+), chỉ tính khớp khi CV thể hiện mức bằng hoặc cao hơn.
- Thiếu thông tin trong CV thì matched=false và ghi rõ "không thấy trong CV"; không suy diễn ứng viên yếu kém.
- Mỗi nhãn trả về đúng thứ tự và đúng nhãn như barem.

Trả JSON: items (mảng {label, matched, evidence}), analysis (2-3 câu), strengths, gaps, quality_signals, advice ("pass"|"borderline"|"reject").`,
    response_json_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              matched: { type: 'boolean' },
              evidence: { type: 'string' }
            }
          }
        },
        analysis: { type: 'string' },
        strengths: { type: 'string' },
        gaps: { type: 'string' },
        quality_signals: { type: 'string' },
        advice: { type: 'string' }
      }
    }
  });

  const aiItems: any[] = Array.isArray(llm?.items) ? llm.items : [];
  const byLabel = new Map<string, any>();
  for (const it of aiItems) byLabel.set(String(it?.label || '').toLowerCase().trim(), it);

  const compared = rubric.map((r) => {
    const hit = byLabel.get(r.label.toLowerCase().trim());
    const matched = hit?.matched === true;
    return {
      group: r.group,
      label: r.label,
      band: r.band,
      requirement: r.requirement,
      weight: r.weight,
      matched,
      evidence: String(hit?.evidence || (matched ? '' : 'Không thấy trong CV')),
      score: matched ? r.weight : 0
    };
  });

  const totalWeight = compared.reduce((s, i) => s + i.weight, 0) || 1;
  const gotWeight = compared.reduce((s, i) => s + (i.matched ? i.weight : 0), 0);
  const score = Math.round((gotWeight / totalWeight) * 100);
  const requiredMissing = compared.filter((i) => i.requirement === 'required' && !i.matched).map((i) => `${i.label}${i.band ? ` (${i.band})` : ''}`);
  const advice = requiredMissing.length ? 'reject' : score >= 70 ? 'pass' : 'borderline';

  const metaFields: any = {};
  if (cvMeta) {
    if (typeof cvMeta.experience_years === 'number') metaFields.years_experience = cvMeta.experience_years;
    else if (app.years_experience != null) metaFields.years_experience = app.years_experience;
    if (cvMeta.education) metaFields.education_level = String(cvMeta.education).slice(0, 200);
    if (Array.isArray(cvMeta.skills) && cvMeta.skills.length) metaFields.skills = cvMeta.skills.slice(0, 20).map((s: any) => String(s).slice(0, 80));
    const keywords = [
      ...(Array.isArray(cvMeta.skills) ? cvMeta.skills : []),
      ...(Array.isArray(cvMeta.certificates) ? cvMeta.certificates : [])
    ].slice(0, 25).map((s: any) => String(s).slice(0, 80));
    if (keywords.length) metaFields.keywords = keywords;
  }

  return {
    score,
    analysis: llm?.analysis || '',
    strengths: llm?.strengths || '',
    gaps: llm?.gaps || '',
    quality_signals: llm?.quality_signals || '',
    advice,
    compared,
    requiredMissing,
    metaFields
  };
}