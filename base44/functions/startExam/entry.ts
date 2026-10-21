import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { authorizeApplicationAccess, accessDeniedMessage } from "../../shared/applicationAccess.ts";

const MAX_MINUTES = 60;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const applicationId = body?.application_id;
    if (!applicationId) return Response.json({ error: 'Thiếu application_id' }, { status: 400 });

    const app = await base44.asServiceRole.entities.Application.get(applicationId);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    if (!(await authorizeApplicationAccess(base44, app, user))) return Response.json({ error: accessDeniedMessage(app, user) }, { status: 403 });
    if (!['cv_passed', 'test_invited'].includes(app.status)) {
      return Response.json({ error: 'Chỉ ứng viên đã đậu vòng 1 mới vào được bài thi vòng 2' }, { status: 403 });
    }

    // Đã có bài thi đang làm → tiếp tục
    if (app.exam_attempt_id) {
      const existing = await base44.asServiceRole.entities.ExamAttempt.get(app.exam_attempt_id).catch(() => null);
      if (existing) {
        if (existing.submitted_at) return Response.json({ error: 'Bạn đã nộp bài thi này rồi' }, { status: 400 });
        return Response.json({
          ok: true,
          resumed: true,
          attempt_id: existing.id,
          started_at: existing.started_at,
          duration_min: existing.duration_min || MAX_MINUTES,
          questions: existing.questions || [],
          answers: existing.answers || []
        });
      }
    }

    const job = await base44.asServiceRole.entities.Job.get(app.job_id).catch(() => null);
    const group = job?.exam_group || 'lap-trinh';
    const duration = Math.min(Number(job?.exam_duration_min) || MAX_MINUTES, MAX_MINUTES);
    const wanted = Math.max(1, Number(job?.exam_question_count) || 10);

    const { items } = await base44.asServiceRole.entities.ExamQuestion.filter({ group, active: true }, { sort: 'order', limit: 40 });
    const bank = items || [];
    if (!bank.length) {
      return Response.json({ error: 'Ngân hàng đề của nhóm này chưa có câu hỏi. Vui lòng liên hệ HR.' }, { status: 400 });
    }
    const picked = bank.slice(0, wanted);

    const startedAt = new Date().toISOString();
    const attempt = await base44.asServiceRole.entities.ExamAttempt.create({
      application_id: applicationId,
      job_id: app.job_id,
      job_title: app.job_title,
      candidate_id: user.id,
      candidate_name: app.full_name,
      candidate_email: app.email,
      group,
      duration_min: duration,
      started_at: startedAt,
      questions: picked.map((q: any, i: number) => ({
        question_id: q.id,
        order: i + 1,
        difficulty: q.difficulty || 'easy',
        type: q.type || 'short',
        title: q.title || '',
        prompt: q.prompt || '',
        media_type: q.media_type || 'none',
        media_url: q.media_url || '',
        options: q.options || [],
        points: Number(q.points) || 10
      })),
      answers: []
    });

    await base44.asServiceRole.entities.Application.update(applicationId, {
      exam_attempt_id: attempt.id,
      test_started_at: startedAt,
      status: 'test_invited'
    });

    return Response.json({
      ok: true,
      attempt_id: attempt.id,
      started_at: startedAt,
      duration_min: duration,
      questions: attempt.questions,
      answers: []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}