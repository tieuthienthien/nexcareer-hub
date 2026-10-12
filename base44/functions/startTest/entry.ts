import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const applicationId = body?.application_id;
    if (!applicationId) return Response.json({ error: 'Thiếu application_id' }, { status: 400 });

    const app = await base44.entities.Application.get(applicationId);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    if (app.created_by_id !== user.id) return Response.json({ error: 'Không có quyền' }, { status: 403 });
    if (app.status !== 'test_invited') return Response.json({ error: 'Bạn chưa được mời làm bài thi' }, { status: 400 });

    let startedAt = app.test_started_at;
    if (!startedAt) {
      startedAt = new Date().toISOString();
      await base44.asServiceRole.entities.Application.update(applicationId, { test_started_at: startedAt });
    }

    const job = await base44.entities.Job.get(app.job_id);
    return Response.json({
      ok: true,
      test_started_at: startedAt,
      duration_min: job?.test_duration_min || 15,
      test_type: job?.test_type,
      test_prompt: job?.test_prompt,
      test_char_limit: job?.test_char_limit,
      test_language: job?.test_language,
      test_starter_code: job?.test_starter_code
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}