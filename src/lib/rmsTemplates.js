// Mẫu email cho quy trình RMS. HR có thể chỉnh sửa trước khi gửi.
// Các thẻ {{name}}, {{job}}, {{slot}}, {{company}}, {{code}} được hệ thống thay tự động cho từng ứng viên.
import { interviewSlotLabel } from "@/lib/rms";

export const MERGE_TAGS = ["{{name}}", "{{job}}", "{{slot}}", "{{company}}", "{{code}}"];

export function fillPreview(text, app) {
  const map = {
    name: app?.full_name || "Ứng viên",
    job: app?.job_title || "vị trí ứng tuyển",
    company: app?.company || "Nexora Technology",
    slot: interviewSlotLabel(app) || "(thời gian sẽ được xác nhận)",
    code: app?.candidate_code || "",
  };
  return String(text || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => map[key] ?? "");
}

export function interviewTemplate(app) {
  return {
    subject: "Thư mời phỏng vấn — {{job}}",
    body: `Xin chào {{name}},

Cảm ơn bạn đã ứng tuyển vị trí {{job}} tại {{company}}. Hồ sơ của bạn đã vượt qua vòng sàng lọc CV và chúng tôi trân trọng mời bạn tham dự buổi phỏng vấn.

Thời gian: {{slot}}
Mã ứng viên: {{code}}

Vui lòng xác nhận tham dự bằng cách phản hồi email này. Nếu khung giờ trên chưa phù hợp, bạn có thể đề xuất thời gian khác để bộ phận tuyển dụng sắp xếp lại.

Rất mong được gặp bạn.

Trân trọng,
Bộ phận Tuyển dụng ${app?.company || "Nexora Technology"}`,
  };
}

export function offerTemplate(app) {
  return {
    subject: "Thư mời nhận việc — {{job}}",
    body: `Xin chào {{name}},

Chúc mừng bạn! Sau quá trình đánh giá, chúng tôi vui mừng mời bạn về làm việc tại {{company}} với vị trí {{job}}.

Mã ứng viên của bạn là {{code}}. Bộ phận Nhân sự sẽ liên hệ để trao đổi chi tiết về mức lương, thời gian bắt đầu và các thủ tục tiếp theo.

Vui lòng phản hồi email này để xác nhận bạn đồng ý nhận lời mời.

Trân trọng,
Bộ phận Tuyển dụng ${app?.company || "Nexora Technology"}`,
  };
}

export function rejectionTemplate() {
  return {
    subject: "Cảm ơn bạn đã ứng tuyển — {{job}}",
    body: `Xin chào {{name}},

Cảm ơn bạn đã dành thời gian ứng tuyển và trao đổi cùng chúng tôi cho vị trí {{job}}.

Sau khi cân nhắc kỹ lưỡng, lần này chúng tôi chưa thể mời bạn về làm việc. Hồ sơ và những chia sẻ của bạn đã được ghi nhận, chúng tôi sẽ chủ động liên hệ khi có cơ hội phù hợp hơn.

Chúc bạn nhiều thành công trong thời gian tới.

Trân trọng,
Bộ phận Tuyển dụng ${"{{company}}"}`,
  };
}