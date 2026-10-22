// Bộ dựng nội dung email cho quy trình RMS (mời phỏng vấn, offer, từ chối, báo Line Manager).
// Dùng chung cho rmsCandidateActions và managerReview. HR có thể sửa tiêu đề/nội dung trước khi gửi,
// nên phần thân chỉ cần render từ văn bản thuần kèm các thẻ merge {{name}}, {{job}}, {{slot}}, {{company}}, {{code}}.

export function appOrigin(req: Request): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return "https://nexcareerhubbyxme.base44.app";
  }
}

export function mergeTags(text: string, app: any): string {
  const map: Record<string, string> = {
    name: app?.full_name || "Ứng viên",
    job: app?.job_title || "vị trí ứng tuyển",
    company: app?.company || "Nexora Technology",
    slot: app?.interview_slot || "(thời gian sẽ được xác nhận)",
    code: app?.candidate_code || ""
  };
  return String(text || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => map[key] ?? "");
}

function escapeHtml(text: string): string {
  return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function bodyToHtml(raw: string): string {
  return String(raw || "")
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 12px;">${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function renderEmail(title: string, bodyText: string, app: any, origin: string): string {
  const body = bodyToHtml(mergeTags(bodyText, app));
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:'Be Vietnam Pro',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:28px 20px;">
    <div style="background:#564be7;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0;">
      <div style="font-size:13px;opacity:.85;letter-spacing:.5px;">NEXCAREER HUB</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px;">${escapeHtml(title)}</div>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 14px 14px;border:1px solid #e2e8f0;color:#0f1729;line-height:1.65;font-size:14px;">
      ${body}
      <a href="${origin}/candidate-room" style="display:inline-block;margin-top:8px;padding:12px 22px;background:#564be7;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">Mở Candidate Room</a>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">Email từ NexCareer Hub — vui lòng không trả lời.</p>
  </div></body></html>`;
}

export function buildManagerBrief(app: any, managerName: string, origin: string): { subject: string; html: string } {
  const slot = app?.interview_slot || (app?.interview_at ? new Date(app.interview_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "chưa chốt");
  return {
    subject: `[NexCareer Hub] Hồ sơ mới cần bạn đánh giá — ${app?.full_name || "Ứng viên"} · ${app?.job_title || ""}`,
    html: `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:'Be Vietnam Pro',Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;padding:28px 20px;">
        <div style="background:#564be7;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0;">
          <div style="font-size:13px;opacity:.85;">NEXCAREER HUB · LINE MANAGER</div>
          <div style="font-size:18px;font-weight:700;margin-top:4px;">Hồ sơ chuyển cho bạn đánh giá</div>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 14px 14px;color:#0f1729;font-size:14px;line-height:1.65;">
          <p>Chào <b>${escapeHtml(managerName || "anh/chị")}</b>,</p>
          <p>HR đã duyệt CV và chuyển hồ sơ sau cho bạn:</p>
          <p style="padding:12px 16px;background:#f9f6fd;border-radius:10px;">
            <b>Ứng viên:</b> ${escapeHtml(app?.full_name || "")}<br/>
            <b>Vị trí:</b> ${escapeHtml(app?.job_title || "")}<br/>
            <b>Phòng ban:</b> ${escapeHtml(app?.department || "—")}<br/>
            <b>Khung giờ ứng viên đã chọn:</b> ${escapeHtml(slot)}
          </p>
          <p>Vui lòng mở HR Studio → Workspace Line Manager để xem CV, chấp thuận lịch và đánh giá ứng viên.</p>
          <a href="${origin}/hr-studio/manager" style="display:inline-block;margin-top:8px;padding:12px 22px;background:#564be7;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">Mở Workspace</a>
        </div>
      </div></body></html>`
  };
}