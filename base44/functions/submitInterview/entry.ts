import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildEmail, appOrigin } from "../../shared/stageEmails.ts";
import { authorizeApplicationAccess, accessDeniedMessage } from "../../shared/applicationAccess.ts";

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
    if (!(await authorizeApplicationAccess(base44, app, user))) return Response.json({ error: accessDeniedMessage(app, user) }, { status: 403 });
    if (app.status !== 'interview_invited') return Response.json({ error: 'Bạn chưa được mời phỏng vấn' }, { status: 400 });

    const submittedAt = new Date().toISOString();
    await base44.asServiceRole.entities.Application.update(applicationId, {
      interview_submitted_at: submittedAt,
      status: 'interview_submitted'
    });

    // Lấy các câu trả lời video
    const res = await base44.asServiceRole.entities.InterviewAnswer.filter({ application_id: applicationId }, { sort: "question_index", limit: 50 });
    const answers = res.items || [];

    // Chuyển lời thoại từng câu
    const transcripts: { q: string; t: string }[] = [];
    await Promise.allSettled(answers.map(async (a) => {
      let transcript = "";
      if (a.video_uri) {
        try {
          const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: a.video_uri, expires_in: 600 });
          const tr = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: signed_url });
          transcript = typeof tr === "string" ? tr : (tr.text || "");
        } catch (e) {}
      }
      transcripts.push({ q: a.question_text || `Câu ${a.question_index + 1}`, t: transcript });
      if (transcript) {
        try { await base44.asServiceRole.entities.InterviewAnswer.update(a.id, { transcript }); } catch (e) {}
      }
    }));

    // AI phân tích tổng hợp
    let analysis = "";
    let score: number | null = null;
    try {
      const qaBlock = transcripts.map((x, i) => `Câu ${i + 1}: ${x.q}\nTrả lời: ${x.t || "(không có lời thoại rõ)"}`).join("\n\n");
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Bạn là hội đồng tuyển dụng Nexora. Phân tích câu trả lời phỏng vấn video vòng 3 cho vị trí "${app.job_title}".
Chỉ dựa trên lời thoại đã chuyển đổi. Đánh giá tính logic, sự tự tin thể hiện qua nội dung, mức độ ngắn gọn/rõ ràng.

${qaBlock}

Trả về JSON tiếng Việt:
{ "score": số 0-100, "analysis": nhận xét tổng hợp 3-5 câu, kèm lưu ý kết quả này chỉ mang tính tham khảo và hội đồng con người sẽ ra quyết định cuối }`,
        response_json_schema: { type: "object", properties: { score: { type: "number" }, analysis: { type: "string" } } }
      });
      score = typeof llm.score === "number" ? llm.score : null;
      analysis = llm.analysis || "";
    } catch (e) {}

    await base44.asServiceRole.entities.Application.update(applicationId, { interview_score: score, interview_ai_analysis: analysis });

    const origin = appOrigin(req);
    const mail = buildEmail("interview_submitted_ack", { candidateName: app.full_name, jobTitle: app.job_title, company: app.company, origin });
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: app.email, subject: mail.subject, html: mail.html });
    } catch (e) {}

    return Response.json({ ok: true, score, analysis });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}