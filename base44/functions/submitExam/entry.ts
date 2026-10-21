import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildEmail, appOrigin } from "../../shared/stageEmails.ts";
import { canAccessApplication } from "../../shared/applicationAccess.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const applicationId = body?.application_id;
    const answers = Array.isArray(body?.answers) ? body.answers.slice(0, 60) : [];
    if (!applicationId) return Response.json({ error: 'Thiếu application_id' }, { status: 400 });

    const app = await base44.asServiceRole.entities.Application.get(applicationId);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    if (!canAccessApplication(app, user, true)) return Response.json({ error: 'Không có quyền' }, { status: 403 });
    if (!app.exam_attempt_id) return Response.json({ error: 'Bạn chưa bắt đầu bài thi' }, { status: 400 });

    const attempt = await base44.asServiceRole.entities.ExamAttempt.get(app.exam_attempt_id);
    if (!attempt) return Response.json({ error: 'Không tìm thấy bài thi' }, { status: 404 });
    if (attempt.submitted_at) return Response.json({ ok: true, score: attempt.score, already: true });

    const duration = Number(attempt.duration_min) || 60;
    const startedMs = new Date(attempt.started_at || Date.now()).getTime();
    const elapsedSec = (Date.now() - startedMs) / 1000;
    const autoSubmitted = elapsedSec > duration * 60 + 20;

    const questions: any[] = attempt.questions || [];
    const answerMap = new Map<string, string>();
    for (const a of answers) answerMap.set(String(a?.question_id || ''), String(a?.answer ?? '').slice(0, 20000));

    // Chấm phần trắc nghiệm bằng máy
    const ids = questions.map((q) => q.question_id).filter(Boolean);
    let bank: any[] = [];
    if (ids.length) {
      try {
        const res = await base44.asServiceRole.entities.ExamQuestion.filter({ id: { $in: ids } }, { limit: 60 });
        bank = res.items || [];
      } catch (e) {}
    }
    const bankById = new Map(bank.map((q: any) => [q.id, q]));

    let earned = 0;
    let totalPoints = 0;
    const graded: any[] = [];
    const essays: any[] = [];

    for (const q of questions) {
      const pts = Number(q.points) || 10;
      totalPoints += pts;
      const given = (answerMap.get(q.question_id) || '').trim();
      const source = bankById.get(q.question_id);
      if (q.type === 'mcq') {
        const correct = String(source?.answer || '').trim();
        const ok = !!given && given.toLowerCase() === correct.toLowerCase();
        if (ok) earned += pts;
        graded.push({ question_id: q.question_id, prompt: q.prompt, type: 'mcq', answer: given, correct, ok, points: ok ? pts : 0, max: pts });
      } else {
        essays.push({ question_id: q.question_id, prompt: q.prompt, type: q.type, answer: given, points: pts, keywords: source?.keywords || [] });
      }
    }

    // AI chấm phần tự luận / code
    let aiAnalysis = '';
    if (essays.length) {
      try {
        const essayLines = essays.map((e, i) => `Câu ${i + 1} (${e.points} điểm) — ${e.prompt}\nBài làm: ${e.answer ? e.answer.slice(0, 4000) : '(bỏ trống)'}`).join('\n\n');
        const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Bạn là hội đồng tuyển dụng Nexora Technology. Chấm phần tự luận/code của bài thi vòng 2 cho vị trí "${app.job_title}".
Thang điểm từng câu đã ghi rõ. Chấm công bằng, dựa trên tính đúng đắn, độ đầy đủ và tư duy; câu bỏ trống 0 điểm.

${essayLines}

Trả JSON: items (mảng {question_id, points_awarded, feedback}) và analysis (nhận xét tổng 2-4 câu, nêu điểm mạnh và điểm cần cải thiện).`,
          response_json_schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question_id: { type: 'string' },
                    points_awarded: { type: 'number' },
                    feedback: { type: 'string' }
                  }
                }
              },
              analysis: { type: 'string' }
            }
          }
        });
        const aiItems: any[] = Array.isArray(llm?.items) ? llm.items : [];
        aiAnalysis = llm?.analysis || '';
        for (const e of essays) {
          const hit = aiItems.find((i) => String(i?.question_id) === e.question_id);
          const awarded = Math.max(0, Math.min(e.points, Number(hit?.points_awarded) || 0));
          earned += awarded;
          graded.push({
            question_id: e.question_id, prompt: e.prompt, type: e.type, answer: e.answer,
            ok: awarded >= e.points * 0.6, points: awarded, max: e.points, feedback: hit?.feedback || ''
          });
        }
      } catch (e) {
        for (const es of essays) graded.push({ question_id: es.question_id, prompt: es.prompt, type: es.type, answer: es.answer, ok: false, points: 0, max: es.points });
      }
    }

    const score = totalPoints ? Math.round((earned / totalPoints) * 100) : 0;
    const submittedAt = new Date().toISOString();

    await base44.asServiceRole.entities.ExamAttempt.update(attempt.id, {
      answers,
      submitted_at: submittedAt,
      auto_submitted: autoSubmitted,
      score,
      ai_analysis: aiAnalysis,
      auto_score: score,
      graded
    });

    await base44.asServiceRole.entities.Application.update(applicationId, {
      status: 'test_submitted',
      test_submitted_at: submittedAt,
      test_auto_submitted: autoSubmitted,
      test_score: score,
      test_ai_analysis: aiAnalysis
    });

    const origin = appOrigin(req);
    const mail = buildEmail('test_submitted_ack', { candidateName: app.full_name, jobTitle: app.job_title, company: app.company, origin });
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: app.email, subject: mail.subject, html: mail.html });
    } catch (e) {}

    return Response.json({ ok: true, score, analysis: aiAnalysis, auto_submitted: autoSubmitted, graded });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}