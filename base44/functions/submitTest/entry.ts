import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildEmail, appOrigin } from "../../shared/stageEmails.ts";
import { authorizeApplicationAccess, accessDeniedMessage } from "../../shared/applicationAccess.ts";
import { AI_MODEL } from "../../shared/aiModel.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const applicationId = body?.application_id;
    const answer = body?.answer;
    if (!applicationId) return Response.json({ error: 'Thiếu application_id' }, { status: 400 });
    if (answer == null) return Response.json({ error: 'Thiếu câu trả lời' }, { status: 400 });

    const app = await base44.entities.Application.get(applicationId);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    if (!(await authorizeApplicationAccess(base44, app, user))) return Response.json({ error: accessDeniedMessage(app, user) }, { status: 403 });
    if (app.status !== 'test_invited') return Response.json({ error: 'Bạn không thể nộp bài lúc này' }, { status: 400 });

    const job = await base44.entities.Job.get(app.job_id);
    const durationMin = job?.test_duration_min || 15;
    const startedAt = app.test_started_at ? new Date(app.test_started_at) : new Date();
    const elapsedSec = (Date.now() - startedAt.getTime()) / 1000;
    const auto = elapsedSec > durationMin * 60 + 15;

    const submittedAt = new Date().toISOString();
    await base44.asServiceRole.entities.Application.update(applicationId, {
      test_answer: String(answer),
      test_submitted_at: submittedAt,
      test_auto_submitted: auto,
      status: 'test_submitted'
    });

    // AI chấm bài hỗ trợ
    let score: number | null = null;
    let analysis = "";
    try {
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: AI_MODEL,
        prompt: `Bạn là hội đồng tuyển dụng Nexora. Chấm bài thi vòng 2 cho vị trí "${job?.title}".
Loại bài: ${job?.test_type === "technical" ? "Kỹ thuật (code)" : "Tình huống"}.
Đề bài: ${job?.test_prompt || ""}
Yêu cầu/đặc tả: ${job?.requirements || ""}
Bài làm của ứng viên:
${String(answer).slice(0, 6000)}

Trả về JSON tiếng Việt:
{ "score": số 0-100, "analysis": nhận xét 2-4 câu về tính logic, đúng/sai, sáng kiến }`,
        response_json_schema: { type: "object", properties: { score: { type: "number" }, analysis: { type: "string" } } }
      });
      score = typeof llm.score === "number" ? llm.score : null;
      analysis = llm.analysis || "";
    } catch (e) {}

    await base44.asServiceRole.entities.Application.update(applicationId, { test_score: score, test_ai_analysis: analysis });

    const origin = appOrigin(req);
    const mail = buildEmail("test_submitted_ack", { candidateName: app.full_name, jobTitle: app.job_title, company: app.company, origin });
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: app.email, subject: mail.subject, html: mail.html });
    } catch (e) {}

    return Response.json({ ok: true, auto_submitted: auto, score, analysis });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}