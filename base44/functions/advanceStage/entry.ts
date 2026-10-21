import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildEmail, appOrigin } from "../../shared/stageEmails.ts";

const ACTIONS: Record<string, { status: string; email?: string; finalResult?: string }> = {
  approve_round1: { status: 'cv_passed', email: 'round1_pass' },
  reject_round1: { status: 'cv_rejected', email: 'round1_fail' },
  approve_round2: { status: 'test_passed', email: 'round2_pass' },
  reject_round2: { status: 'test_rejected', email: 'round2_fail' },
  mark_interviewed: { status: 'interview_submitted' },
  hire: { status: 'hired', email: 'final_result', finalResult: 'hired' },
  reject_round3: { status: 'rejected', email: 'final_result', finalResult: 'rejected' },
  final_hired: { status: 'hired', email: 'final_result', finalResult: 'hired' },
  final_rejected: { status: 'rejected', email: 'final_result', finalResult: 'rejected' },
  final_review: { status: 'final_review', email: 'final_result', finalResult: 'review' }
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được thao tác' }, { status: 403 });

    const body = await req.json();
    const applicationId = body?.application_id;
    const action = body?.action;
    const note = body?.note || body?.final_notes || '';
    const decisionReason = body?.hr_decision_reason || '';
    const next = ACTIONS[action];
    if (!applicationId || !next) return Response.json({ error: 'Tham số không hợp lệ' }, { status: 400 });

    const app = await base44.asServiceRole.entities.Application.get(applicationId);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    const now = new Date().toISOString();
    const updateData: any = { status: next.status };
    if (note) { updateData.final_notes = note; updateData.final_result_note = note; }
    if (decisionReason) updateData.hr_decision_reason = decisionReason;
    if (action === 'approve_round1' || action === 'reject_round1') updateData.round1_decided_at = now;
    if (action === 'approve_round2' || action === 'reject_round2') updateData.round2_decided_at = now;
    if (action === 'mark_interviewed') updateData.interview_submitted_at = now;
    if (next.finalResult) updateData.final_result = next.finalResult;

    const updated = await base44.asServiceRole.entities.Application.update(applicationId, updateData);

    if (next.email) {
      const origin = appOrigin(req);
      const mail = buildEmail(next.email, {
        candidateName: app.full_name,
        jobTitle: app.job_title,
        company: app.company,
        matchScore: next.email === 'round1_pass' || next.email === 'round1_fail' ? app.cv_match_score : null,
        missing: app.cv_required_missing || [],
        finalResult: next.finalResult,
        note,
        scheduleUrl: `/lich-phong-van/${app.id}`,
        origin
      });
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: app.email, subject: mail.subject, html: mail.html });
      } catch (e) {}
    }

    return Response.json({ ok: true, status: next.status, application: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}