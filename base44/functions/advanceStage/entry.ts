import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildEmail, appOrigin } from "../../shared/stageEmails.ts";

const ACTIONS: Record<string, { status: string; email: string; round?: string }> = {
  approve_round1: { status: "test_invited", email: "round2_invite" },
  reject_round1: { status: "cv_rejected", email: "rejected", round: "sàng lọc hồ sơ" },
  approve_round2: { status: "interview_invited", email: "round3_invite" },
  reject_round2: { status: "test_rejected", email: "rejected", round: "thi kỹ thuật" },
  hire: { status: "hired", email: "hired" },
  reject_round3: { status: "rejected", email: "rejected", round: "phỏng vấn" }
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được thao tác' }, { status: 403 });

    const body = await req.json();
    const applicationId = body?.application_id;
    const action = body?.action;
    const finalNotes = body?.final_notes;
    const decisionReason = body?.hr_decision_reason;
    if (!applicationId || !ACTIONS[action]) return Response.json({ error: 'Tham số không hợp lệ' }, { status: 400 });

    const app = await base44.entities.Application.get(applicationId);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    const next = ACTIONS[action];
    const updateData: any = { status: next.status };
    if (finalNotes) updateData.final_notes = finalNotes;
    if (decisionReason) updateData.hr_decision_reason = decisionReason;
    const updated = await base44.entities.Application.update(applicationId, updateData);

    const origin = appOrigin(req);
    const mail = buildEmail(next.email, { candidateName: app.full_name, jobTitle: app.job_title, company: app.company, round: next.round, origin });
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: app.email, subject: mail.subject, html: mail.html });
    } catch (e) {}

    return Response.json({ ok: true, application: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}