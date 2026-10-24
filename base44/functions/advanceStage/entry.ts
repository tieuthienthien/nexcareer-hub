import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { appOrigin } from "../../shared/stageEmails.ts";
import { sendStageMail } from "../../shared/mailer.ts";
import { provisionCandidateAccount } from "../../shared/candidateAccount.ts";

const ACTIONS: Record<string, { status: string; email?: string; finalResult?: string; rms: string }> = {
  approve_round1: { status: 'cv_passed', email: 'round1_pass', rms: 'cv_approved' },
  reject_round1: { status: 'cv_rejected', email: 'round1_fail', rms: 'fail' },
  approve_round2: { status: 'test_passed', email: 'round2_pass', rms: 'pending_manager' },
  reject_round2: { status: 'test_rejected', email: 'round2_fail', rms: 'fail' },
  mark_interviewed: { status: 'interview_submitted', rms: 'interviewed' },
  hire: { status: 'hired', email: 'final_result', finalResult: 'hired', rms: 'pass' },
  reject_round3: { status: 'rejected', email: 'final_result', finalResult: 'rejected', rms: 'fail' },
  final_hired: { status: 'hired', email: 'final_result', finalResult: 'hired', rms: 'pass' },
  final_rejected: { status: 'rejected', email: 'final_result', finalResult: 'rejected', rms: 'fail' },
  final_review: { status: 'final_review', email: 'final_result', finalResult: 'review', rms: 'interviewed' }
};

// Mỗi quyết định đều thuộc một vòng → bắt buộc vòng đó đã có Điểm HR chính thức.
const ROUND_OF: Record<string, string> = {
  approve_round1: 'cv',
  reject_round1: 'cv',
  approve_round2: 'simulation',
  reject_round2: 'simulation',
  hire: 'interview',
  reject_round3: 'interview',
  final_hired: 'interview',
  final_rejected: 'interview'
};

const ROUND_LABEL: Record<string, string> = {
  cv: 'Vòng 1 (duyệt CV)',
  simulation: 'Vòng 2 (Job Simulation)',
  interview: 'Vòng 3 (phỏng vấn)'
};

// Giữ bộ cờ 5 bước của sơ đồ tiến trình đồng bộ với trạng thái cũ.
const RMS_STEPS: Record<string, (now: string) => Record<string, any>> = {
  approve_round1: (now) => ({ step2_done: true, step2_at: now }),
  reject_round1: (now) => ({
    step2_done: true, step2_at: now, step5_done: true, step5_at: now,
    manager_decision: 'fail', decision_at: now
  }),
  reject_round2: (now) => ({
    step5_done: true, step5_at: now, manager_decision: 'fail', decision_at: now
  }),
  mark_interviewed: (now) => ({ step4_done: true, step4_at: now }),
  hire: (now) => ({ step5_done: true, step5_at: now, manager_decision: 'pass', decision_at: now }),
  final_hired: (now) => ({ step5_done: true, step5_at: now, manager_decision: 'pass', decision_at: now }),
  reject_round3: (now) => ({
    step5_done: true, step5_at: now, manager_decision: 'fail', decision_at: now
  }),
  final_rejected: (now) => ({
    step5_done: true, step5_at: now, manager_decision: 'fail', decision_at: now
  })
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

    // Chặn chuyển vòng / chốt kết quả khi vòng hiện tại chưa có Điểm HR.
    const round = ROUND_OF[action];
    if (round) {
      const scoreRes = await base44.asServiceRole.entities.RoundScore.filter(
        { application_id: applicationId, round },
        { limit: 1 }
      );
      const scored = (scoreRes.items || [])[0];
      if (!scored || scored.hr_score == null) {
        return Response.json(
          { error: `Chưa có Điểm HR của ${ROUND_LABEL[round]}. Vui lòng chấm điểm HR trước khi chuyển vòng hoặc chốt kết quả.` },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const updateData: any = { status: next.status, rms_status: next.rms, ...(RMS_STEPS[action]?.(now) || {}) };
    if (note) { updateData.final_notes = note; updateData.final_result_note = note; }
    if (decisionReason) updateData.hr_decision_reason = decisionReason;
    if (action === 'approve_round1' || action === 'reject_round1') updateData.round1_decided_at = now;
    if (action === 'approve_round2' || action === 'reject_round2') updateData.round2_decided_at = now;
    if (action === 'mark_interviewed') updateData.interview_submitted_at = now;
    if (next.finalResult) updateData.final_result = next.finalResult;

    const updated = await base44.asServiceRole.entities.Application.update(applicationId, updateData);

    // Đậu vòng 1: đảm bảo ứng viên có tài khoản NexCareer Hub + hồ sơ kèm CV đã nộp
    let account = null;
    if (action === 'approve_round1') {
      try {
        account = await provisionCandidateAccount(base44, app);
      } catch (e) {
        account = null;
      }
    }

    // Email tự động cho ứng viên ở mọi bước có thông báo.
    let emailSent = false;
    let emailError = '';
    if (next.email) {
      const mail = await sendStageMail(base44, app, next.email, {
        finalResult: next.finalResult,
        note,
        accountEmail: account?.email || undefined,
        scheduleUrl: `/lich-phong-van/${app.id}`,
        origin: appOrigin(req)
      });
      emailSent = mail.sent;
      emailError = mail.error;
    }

    return Response.json({
      ok: true,
      status: next.status,
      application: updated,
      email_sent: emailSent,
      email_error: emailError || undefined
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}