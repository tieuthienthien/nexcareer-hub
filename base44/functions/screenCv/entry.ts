import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildEmail, appOrigin } from "../../shared/stageEmails.ts";

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

    const job = await base44.entities.Job.get(app.job_id);

    let matchScore: number | null = null;
    let analysis = "";
    let strengths = "";
    let gaps = "";
    let qualitySignals = "";

    if (app.cv_file_uri) {
      let cvText = "";
      try {
        const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: app.cv_file_uri, expires_in: 600 });
        const extracted = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
          file_url: signed_url,
          json_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              skills: { type: "array", items: { type: "string" } },
              experience_years: { type: "number" },
              education: { type: "string" },
              recent_roles: { type: "array", items: { type: "string" } }
            }
          }
        });
        cvText = JSON.stringify(extracted.output || {});
      } catch (e) {
        cvText = "(Không trích xuất được nội dung CV)";
      }

      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Bạn là chuyên gia tuyển dụng của NexCareer Hub. Đánh giá mức độ phù hợp của CV với mô tả công việc theo ngữ nghĩa (không chỉ khớp từ khóa). Phân biệt rõ: (1) sự kiện/kinh nghiệm trích xuất được từ CV, (2) tuyên bố của ứng viên, (3) suy luận của AI, (4) thông tin còn thiếu/chưa xác minh. KHÔNG coi thiếu thông tin là bằng chứng ứng viên thiếu kỹ năng. KHÔNG chấm điểm chỉ vì lặp từ khóa. KHÔNG kết luận CV là giả mạo chỉ vì văn phong lạ hoặc thiếu chi tiết.

Vị trí: ${job.title} - ${job.company || ""}
Mô tả công việc: ${job.description || ""}
Yêu cầu: ${job.requirements || ""}
Kỹ năng cần: ${(job.skills || []).join(", ")}
Cấp bậc: ${job.experience_level || ""}

Thông tin trích từ CV: ${cvText}

Trả về JSON tiếng Việt:
{
  "match_score": số 0-100,
  "analysis": nhận xét 2-3 câu, nêu rõ cơ sở,
  "strengths": điểm mạnh cụ thể dựa trên bằng chứng từ CV (mỗi ý gạch đầu dòng ngắn),
  "gaps": thông tin thiếu / chưa rõ / cần xác minh (không suy diễn thành thiếu năng lực),
  "quality_signals": tín hiệu đánh giá: mục nào mơ hồ, ngày tháng thiếu, kỹ năng không có ví dụ, trùng lặp, bất thường phân tích — đây là tín hiệu tham khảo, KHÔNG phải bằng chứng lừa đảo
}
Chỉ trả JSON hợp lệ.`,
        response_json_schema: {
          type: "object",
          properties: {
            match_score: { type: "number" },
            analysis: { type: "string" },
            strengths: { type: "string" },
            gaps: { type: "string" },
            quality_signals: { type: "string" }
          }
        }
      });
      matchScore = typeof llm.match_score === "number" ? llm.match_score : null;
      analysis = llm.analysis || "";
      strengths = llm.strengths || "";
      gaps = llm.gaps || "";
      qualitySignals = llm.quality_signals || "";
    }

    await base44.asServiceRole.entities.Application.update(applicationId, {
      cv_match_score: matchScore,
      cv_ai_analysis: analysis,
      cv_strengths: strengths,
      cv_gaps: gaps,
      cv_quality_signals: qualitySignals
    });

    const origin = appOrigin(req);
    const mail = buildEmail("cv_received", { candidateName: app.full_name, jobTitle: app.job_title, company: app.company, matchScore, analysis, origin });
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: app.email, subject: mail.subject, html: mail.html });
    } catch (e) {}

    return Response.json({ ok: true, match_score: matchScore, analysis });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}