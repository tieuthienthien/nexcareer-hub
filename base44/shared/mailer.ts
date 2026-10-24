// Gửi email tự động cho ứng viên ở từng chặng tuyển dụng và ghi lại lịch sử vào EmailLog
// để HR debug khi email không tới được hộp thư ứng viên.
import { buildEmail } from "./stageEmails.ts";
import { ensureCandidateUser, normalizeEmail } from "./candidateAccount.ts";

const STEP_OF: Record<string, string> = {
  cv_received: "Vòng 1",
  application_confirmed: "Vòng 1",
  round1_pass: "Vòng 1",
  round1_fail: "Vòng 1",
  round2_invite: "Vòng 2",
  round2_pass: "Vòng 2",
  round2_fail: "Vòng 2",
  test_submitted_ack: "Vòng 2",
  round3_invite: "Vòng 3",
  interview_booked: "Vòng 3",
  interview_submitted_ack: "Vòng 3",
  final_result: "Kết quả",
  status_changed: "Trạng thái"
};

async function writeLog(base44: any, app: any, stage: string, subject: string, html: string, status: string, error: string) {
  try {
    await base44.asServiceRole.entities.EmailLog.create({
      application_id: app.id,
      job_id: app.job_id || "",
      step: STEP_OF[stage] || "Hệ thống",
      template_key: stage,
      to_email: normalizeEmail(app.email) || app.email || "",
      subject,
      body_html: html || "",
      status,
      error: error || "",
      sent_at: status === "sent" ? new Date().toISOString() : undefined
    });
  } catch (e) {
    // EmailLog là kênh phụ trợ, không được làm hỏng luồng gửi email.
  }
}

export async function sendStageMail(
  base44: any,
  app: any,
  stage: string,
  extra: Record<string, any> = {}
): Promise<{ sent: boolean; error: string; subject: string }> {
  const to = normalizeEmail(app?.email);
  if (!to) return { sent: false, error: "Hồ sơ chưa có email ứng viên", subject: "" };

  // SendEmail chỉ tới được người đã có tài khoản trong app → đảm bảo tài khoản trước khi gửi.
  try {
    const ensured = await ensureCandidateUser(base44, app.email);
    if (!ensured.registered) {
      const error = ensured.error || "Ứng viên chưa có tài khoản trong app nên chưa gửi được email.";
      await writeLog(base44, app, stage, `[Chưa gửi] ${stage}`, "", "failed", error);
      return { sent: false, error, subject: "" };
    }
  } catch (e: any) {
    const error = e?.message || "Không kiểm tra được tài khoản ứng viên.";
    await writeLog(base44, app, stage, `[Chưa gửi] ${stage}`, "", "failed", error);
    return { sent: false, error, subject: "" };
  }

  const mail = buildEmail(stage, {
    candidateName: app.full_name,
    jobTitle: app.job_title,
    company: app.company,
    matchScore: extra.matchScore ?? (stage === "round1_pass" || stage === "round1_fail" ? app.cv_match_score : null),
    missing: app.cv_required_missing || [],
    finalResult: extra.finalResult,
    note: extra.note,
    scheduleUrl: extra.scheduleUrl || `/lich-phong-van/${app.id}`,
    accountEmail: extra.accountEmail,
    slotText: extra.slotText,
    mode: extra.mode,
    place: extra.place,
    interviewerName: extra.interviewerName,
    origin: extra.origin || "https://nexcareerhubbyxme.base44.app"
  });

  try {
    await base44.asServiceRole.integrations.Core.SendEmail({ to, subject: mail.subject, html: mail.html });
  } catch (e: any) {
    const raw = e?.message || "";
    const error = /custom domain/i.test(raw)
      ? "Chưa gửi được email: ứng viên chưa từng đăng nhập nên cần tên miền email đã xác thực (mục Tên miền) mới gửi được."
      : raw || "Không gửi được email cho ứng viên";
    await writeLog(base44, app, stage, mail.subject, mail.html, "failed", error);
    return { sent: false, error, subject: mail.subject };
  }

  await writeLog(base44, app, stage, mail.subject, mail.html, "sent", "");
  return { sent: true, error: "", subject: mail.subject };
}