import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { AI_MODEL } from '../../shared/aiModel.ts';
import { flattenRubric, readCv, gradeCv } from '../../shared/cvGrading.ts';
import { gradeSimulation } from '../../shared/simulationGrade.ts';
import { SAMPLE_SIMULATION } from '../../shared/jobSimulation.ts';

const ROUNDS = ['cv', 'simulation', 'interview'];

/**
 * HR cho AI chấm lại bài làm của một vòng.
 * Chỉ cập nhật điểm AI (tham khảo), tuyệt đối không ghi đè Điểm HR.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được chấm lại bài làm' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const applicationId = String(body?.application_id || '').trim();
    const round = String(body?.round || '').trim();
    if (!applicationId || !ROUNDS.includes(round)) {
      return Response.json({ error: 'Thiếu hồ sơ hoặc vòng chấm' }, { status: 400 });
    }

    const app = await base44.asServiceRole.entities.Application.get(applicationId).catch(() => null);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    let oldAi: number | null = null;
    let newAi: number | null = null;
    let note = '';

    if (round === 'cv') {
      const job = app.job_id ? await base44.asServiceRole.entities.Job.get(app.job_id).catch(() => null) : null;
      const rubric = flattenRubric(job);
      const { cvText, cvMeta } = await readCv(base44, app);
      if (!rubric.length || !cvText) {
        return Response.json({ error: 'Chưa đủ dữ liệu để chấm lại CV (thiếu barem hoặc nội dung CV).' }, { status: 400 });
      }
      const g = await gradeCv(base44, { app, job, rubric, cvText, cvMeta, nexoraCerts: app.cv_certificates || [] });
      oldAi = app.cv_match_score ?? null;
      newAi = g.score;
      note = g.analysis;
      await base44.asServiceRole.entities.Application.update(applicationId, {
        ...g.metaFields,
        cv_match_score: g.score,
        cv_ai_analysis: g.analysis,
        cv_strengths: g.strengths,
        cv_gaps: g.gaps,
        cv_quality_signals: g.quality_signals,
        cv_advice: g.advice,
        cv_rubric: g.compared,
        cv_required_missing: g.requiredMissing
      });
    }

    if (round === 'simulation') {
      const attemptRes = await base44.asServiceRole.entities.SimulationAttempt.filter(
        { application_id: applicationId },
        { sort: '-created_date', limit: 1 }
      );
      const attempt = (attemptRes.items || [])[0];
      if (!attempt || attempt.status !== 'submitted') {
        return Response.json({ error: 'Ứng viên chưa nộp bài Vòng 2 nên chưa có gì để chấm lại.' }, { status: 400 });
      }
      const sim = attempt.simulation_id
        ? await base44.asServiceRole.entities.JobSimulation.get(attempt.simulation_id).catch(() => null)
        : null;
      const simulation = sim || SAMPLE_SIMULATION;
      const g = await gradeSimulation(base44, { simulation, attempt, answers: attempt.answers || {} });
      oldAi = attempt.score ?? app.test_score ?? null;
      newAi = g.score;
      note = [g.ai_report.strengths, g.ai_report.improvements].filter(Boolean).join(' — ');

      await base44.asServiceRole.entities.SimulationAttempt.update(attempt.id, {
        score: g.score,
        passed: g.passed,
        task_scores: g.task_scores,
        ai_report: g.ai_report
      });
      if (attempt.invite_id) {
        await base44.asServiceRole.entities.SimulationInvite.update(attempt.invite_id, { score: g.score, passed: g.passed }).catch(() => null);
      }
      await base44.asServiceRole.entities.Application.update(applicationId, {
        test_score: g.score,
        test_ai_analysis: note
      }).catch(() => null);
    }

    if (round === 'interview') {
      const ansRes = await base44.asServiceRole.entities.InterviewAnswer.filter(
        { application_id: applicationId },
        { sort: 'question_index', limit: 50 }
      );
      const answers = ansRes.items || [];
      if (!answers.length) {
        return Response.json({ error: 'Chưa có câu trả lời phỏng vấn để chấm lại.' }, { status: 400 });
      }
      const qaBlock = answers
        .map((a: any, i: number) => `Câu ${i + 1}: ${a.question_text || `Câu ${a.question_index + 1}`}\nTrả lời: ${a.transcript || '(không có lời thoại rõ)'}`)
        .join('\n\n');
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: AI_MODEL,
        prompt: `Bạn là hội đồng tuyển dụng Nexora. Chấm LẠI bài phỏng vấn video vòng 3 cho vị trí "${app.job_title}".
Chỉ dựa trên lời thoại đã chuyển đổi. Đánh giá tính logic, sự tự tin thể hiện qua nội dung, mức độ ngắn gọn/rõ ràng.

${qaBlock}

Trả về JSON tiếng Việt:
{ "score": số 0-100, "analysis": nhận xét tổng hợp 3-5 câu, kèm lưu ý kết quả này chỉ mang tính tham khảo và hội đồng con người sẽ ra quyết định cuối }`,
        response_json_schema: { type: 'object', properties: { score: { type: 'number' }, analysis: { type: 'string' } } }
      });
      oldAi = app.interview_score ?? null;
      newAi = typeof llm?.score === 'number' ? llm.score : null;
      note = llm?.analysis || '';
      await base44.asServiceRole.entities.Application.update(applicationId, {
        interview_score: newAi,
        interview_ai_analysis: note
      });
    }

    // Lưu điểm AI vào bảng điểm của vòng — chỉ trường ai_score, giữ nguyên điểm HR.
    const scoreRes = await base44.asServiceRole.entities.RoundScore.filter({ application_id: applicationId, round }, { limit: 1 });
    const existing = (scoreRes.items || [])[0];
    if (existing) {
      await base44.asServiceRole.entities.RoundScore.update(existing.id, { ai_score: newAi });
    } else {
      await base44.asServiceRole.entities.RoundScore.create({
        application_id: applicationId,
        round,
        ai_score: newAi,
        scored_by_email: user.email
      });
    }

    await base44.asServiceRole.entities.RegradeLog.create({
      application_id: applicationId,
      round,
      old_score: oldAi,
      new_score: newAi,
      note: String(note || '').slice(0, 400),
      regraded_by_email: user.email,
      at: new Date().toISOString()
    });

    return Response.json({ ok: true, round, old_score: oldAi, new_score: newAi, note });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}