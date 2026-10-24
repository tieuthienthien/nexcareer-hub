// Bộ dựng nội dung email cho các chặng quy trình tuyển dụng 2 vòng + đặt lịch phỏng vấn.
// Dùng chung cho các backend function: screenCv, advanceStage, submitExam, bookInterviewSlot, interviewReminders.

export function appOrigin(req: Request): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return "https://nexcareerhubbyxme.base44.app";
  }
}

function link(origin: string, path: string, label: string): string {
  return `<a href="${origin}${path}" style="display:inline-block;margin-top:18px;padding:12px 22px;background:#564be7;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">${label}</a>`;
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:'Be Vietnam Pro',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:28px 20px;">
    <div style="background:#564be7;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0;">
      <div style="font-size:13px;opacity:.85;letter-spacing:.5px;">NEXCAREER HUB</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px;">${title}</div>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 14px 14px;border:1px solid #e2e8f0;color:#0f1729;line-height:1.6;font-size:14px;">
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">Email tự động từ NexCareer Hub — vui lòng không trả lời.</p>
  </div></body></html>`;
}

export type EmailContext = {
  candidateName?: string;
  jobTitle?: string;
  company?: string;
  matchScore?: number | null;
  analysis?: string;
  round?: string;
  origin: string;
  scheduleUrl?: string;
  slotText?: string;
  interviewerName?: string;
  mode?: string;
  place?: string;
  finalResult?: string;
  note?: string;
  missing?: string[];
  accountEmail?: string;
};

export function buildEmail(stage: string, ctx: EmailContext): { subject: string; html: string } {
  const name = ctx.candidateName || "Ứng viên";
  const job = ctx.jobTitle || "vị trí";
  const company = ctx.company || "";
  const origin = ctx.origin;
  const jc = company ? ` · ${company}` : "";
  const scoreBlock = (ctx.matchScore != null)
    ? `<p style="margin:14px 0;padding:12px 16px;background:#f9f6fd;border-radius:10px;"><b>Điểm phù hợp theo barem:</b> <b>${ctx.matchScore}/100</b></p>`
    : "";
  const slotBlock = ctx.slotText
    ? `<p style="margin:14px 0;padding:12px 16px;background:#f9f6fd;border-radius:10px;"><b>Thời gian:</b> ${ctx.slotText}<br/><b>Hình thức:</b> ${ctx.mode === "onsite" ? "Tại văn phòng" : "Online"}<br/><b>Địa điểm / link:</b> ${ctx.place || "—"}${ctx.interviewerName ? `<br/><b>Người phỏng vấn:</b> ${ctx.interviewerName}` : ""}</p>`
    : "";

  switch (stage) {
    case "application_confirmed":
      return {
        subject: `Bạn đã nộp CV thành công — ${job}`,
        html: shell("Đã nhận hồ sơ ứng tuyển", `<p>Xin chào <b>${name}</b>,</p><p>Bạn đã nộp CV thành công cho vị trí <b>${job}</b>${jc}. Kết quả sẽ được thông báo trong vòng 7 ngày.</p><p style="color:#475569;">Bạn có thể theo dõi trạng thái hồ sơ bất cứ lúc nào trong Candidate Room.</p>${link(origin, "/candidate-room", "Theo dõi hồ sơ")}`)
      };
    case "cv_received":
      return {
        subject: `Đã nhận hồ sơ ứng tuyển — ${job}`,
        html: shell("Đã nhận hồ sơ ứng tuyển", `<p>Xin chào <b>${name}</b>,</p><p>Hệ thống đã nhận hồ sơ ứng tuyển của bạn cho vị trí <b>${job}</b>${jc}. Kết quả sẽ được thông báo trong vòng 7 ngày.</p>${scoreBlock}${link(origin, "/candidate-room", "Mở Candidate Room")}`)
      };
    case "round1_pass": {
      const accountBlock = ctx.accountEmail
        ? `<div style="margin:16px 0;padding:14px 16px;background:#f9f6fd;border:1px solid #e7dcfb;border-radius:10px;">
            <p style="margin:0 0 6px;"><b>Tài khoản NexCareer Hub của bạn:</b> ${ctx.accountEmail}</p>
            <p style="margin:0;color:#475569;font-size:13px;">Tài khoản đã được tạo sẵn với chính email bạn dùng nộp hồ sơ trên TopCV, và CV đã nộp đã có trong tài khoản. Lần đầu đăng nhập, hãy mở email mời để đặt mật khẩu, hoặc chọn “Đăng nhập bằng Google” với email này. Nếu quên mật khẩu, dùng mục “Quên mật khẩu”.</p>
          </div>`
        : "";
      return {
        subject: `Chúc mừng! Bạn đã đậu vòng 1 — ${job}`,
        html: shell("Kết quả vòng 1: ĐẬU", `<p>Chào <b>${name}</b>,</p><p>Chúc mừng bạn đã vượt qua vòng sàng lọc CV cho vị trí <b>${job}</b>${jc}.${scoreBlock}</p>${accountBlock}<p>Bước tiếp theo: <b>Vòng 2 — Job Simulation</b>, bài mô phỏng công việc thực tế đúng vị trí bạn ứng tuyển. Đăng nhập bằng tài khoản ở trên để xem lời mời và bắt đầu làm bài.</p>${link(origin, "/login?returnTo=/candidate-room", "Đăng nhập & vào Vòng 2")}`)
      };
    }
    case "round1_fail":
      return {
        subject: `Kết quả vòng 1 — ${job}`,
        html: shell("Kết quả vòng 1", `<p>Chào <b>${name}</b>,</p><p>Cảm ơn bạn đã ứng tuyển vị trí <b>${job}</b>${jc}. Sau khi đối chiếu hồ sơ với yêu cầu của vị trí, lần này hồ sơ của bạn <b>chưa đạt vòng 1</b>.${scoreBlock}</p>${ctx.missing && ctx.missing.length ? `<p style="color:#475569;">Yêu cầu bắt buộc chưa thể hiện trong CV: ${ctx.missing.join(", ")}.</p>` : ""}<p style="color:#475569;">Rất mong được đồng hành cùng bạn trong các cơ hội phù hợp khác.</p>${link(origin, "/viec-lam", "Xem việc làm khác")}`)
      };
    case "round2_invite":
      return {
        subject: `Mời làm bài thi vòng 2 — ${job}`,
        html: shell("Mời làm bài thi vòng 2", `<p>Chào <b>${name}</b>,</p><p>Bạn đã đạt vòng sàng lọc hồ sơ cho vị trí <b>${job}</b>${jc}. Chúng tôi trân trọng mời bạn làm bài thi vòng 2 ngay trên hệ thống.</p><p style="color:#475569;">Bài thi có giới hạn thời gian. Vui lòng chuẩn bị môi trường yên tĩnh và đọc kỹ hướng dẫn trước khi bắt đầu.</p>${link(origin, "/candidate-room", "Vào làm bài thi")}`)
      };
    case "round2_pass":
      return {
        subject: `Chúc mừng! Bạn đã đậu vòng 2 — ${job}`,
        html: shell("Kết quả vòng 2: ĐẬU", `<p>Chào <b>${name}</b>,</p><p>Bạn đã vượt qua bài thi vòng 2 cho vị trí <b>${job}</b>${jc}. Bước tiếp theo là <b>chọn lịch phỏng vấn</b> với hội đồng tuyển dụng.</p><p style="color:#475569;">Vui lòng chọn một khung giờ còn trống. Bạn có thể đổi lịch 1 lần, trước giờ phỏng vấn ít nhất 24 giờ.</p>${link(origin, ctx.scheduleUrl || "/candidate-room", "Chọn lịch phỏng vấn")}`)
      };
    case "round2_fail":
      return {
        subject: `Kết quả vòng 2 — ${job}`,
        html: shell("Kết quả vòng 2", `<p>Chào <b>${name}</b>,</p><p>Cảm ơn bạn đã hoàn thành bài thi vòng 2 cho vị trí <b>${job}</b>${jc}. Lần này kết quả bài thi <b>chưa đạt</b> yêu cầu của vị trí.</p><p style="color:#475569;">Rất mong được gặp bạn ở các cơ hội phù hợp khác.</p>${link(origin, "/viec-lam", "Xem việc làm khác")}`)
      };
    case "round3_invite":
      return {
        subject: `Mời phỏng vấn — ${job}`,
        html: shell("Mời phỏng vấn", `<p>Chào <b>${name}</b>,</p><p>Bạn đã qua vòng thi vòng 2 cho vị trí <b>${job}</b>${jc}. Hãy chọn lịch phỏng vấn với hội đồng tuyển dụng.</p>${link(origin, ctx.scheduleUrl || "/candidate-room", "Chọn lịch phỏng vấn")}`)
      };
    case "interview_booked":
      return {
        subject: `Xác nhận lịch phỏng vấn — ${job}`,
        html: shell("Xác nhận lịch phỏng vấn", `<p>Chào <b>${name}</b>,</p><p>Lịch phỏng vấn cho vị trí <b>${job}</b>${jc} đã được xác nhận.</p>${slotBlock}<p style="color:#475569;">Bạn có thể xem lại lịch, thêm vào Google Calendar hoặc tải file .ics trong Candidate Room.</p>${link(origin, "/candidate-room", "Xem lịch phỏng vấn")}`)
      };
    case "interview_reminder":
      return {
        subject: `Nhắc lịch phỏng vấn — ${job}`,
        html: shell("Nhắc lịch phỏng vấn", `<p>Chào <b>${name}</b>,</p><p>Bạn có buổi phỏng vấn vị trí <b>${job}</b>${jc} sắp diễn ra.</p>${slotBlock}${link(origin, "/candidate-room", "Xem lịch phỏng vấn")}`)
      };
    case "schedule_nudge":
      return {
        subject: `Bạn chưa chọn lịch phỏng vấn — ${job}`,
        html: shell("Chọn lịch phỏng vấn", `<p>Chào <b>${name}</b>,</p><p>Bạn đã đậu vòng 2 cho vị trí <b>${job}</b>${jc} nhưng chưa chọn lịch phỏng vấn.</p><p style="color:#475569;">Hãy chọn một khung giờ còn trống để hội đồng tuyển dụng sắp xếp buổi gặp với bạn.</p>${link(origin, ctx.scheduleUrl || "/candidate-room", "Chọn lịch phỏng vấn")}`)
      };
    case "schedule_hr_alert":
      return {
        subject: `Ứng viên quá hạn chọn lịch phỏng vấn — ${job}`,
        html: shell("Ứng viên quá hạn chọn lịch", `<p><b>${name}</b> (${ctx.note || "không rõ email"}) đã đậu vòng 2 vị trí <b>${job}</b>${jc} nhưng chưa chọn lịch sau 7 ngày.</p><p style="color:#475569;">Vui lòng liên hệ ứng viên hoặc mở HR Studio để xử lý.</p>${link(origin, "/hr-studio/schedule", "Mở lịch phỏng vấn")}`)
      };
    case "final_result": {
      const map: Record<string, { title: string; body: string }> = {
        hired: { title: "Kết quả cuối: NHẬN VIỆC", body: `<p>Chúc mừng <b>${name}</b>, bạn đã được <b>nhận vào làm</b> vị trí <b>${job}</b>${jc}.</p><p style="color:#475569;">Bộ phận HR sẽ liên hệ để hoàn tất thủ tục tiếp theo.</p>` },
        rejected: { title: "Kết quả cuối", body: `<p>Chào <b>${name}</b>,</p><p>Cảm ơn bạn đã dành thời gian cho vị trí <b>${job}</b>${jc}. Sau buổi phỏng vấn, lần này chúng tôi <b>chưa thể mời bạn về làm việc</b>.</p><p style="color:#475569;">Rất mong có cơ hội đồng hành cùng bạn trong tương lai.</p>` },
        review: { title: "Kết quả cuối: ĐANG XEM XÉT THÊM", body: `<p>Chào <b>${name}</b>,</p><p>Hồ sơ của bạn cho vị trí <b>${job}</b>${jc} đang được hội đồng <b>xem xét thêm</b>. Chúng tôi sẽ sớm thông báo kết quả cuối cùng.</p>` }
      };
      const picked = map[ctx.finalResult || "review"] || map.review;
      return {
        subject: `${picked.title} — ${job}`,
        html: shell(picked.title, `${picked.body}${ctx.note ? `<p style="color:#475569;"><i>${ctx.note}</i></p>` : ""}${link(origin, "/candidate-room", "Xem hồ sơ")}`)
      };
    }
    case "hired":
      return {
        subject: `Chúc mừng! Bạn đã trúng tuyển — ${job}`,
        html: shell("Kết quả tuyển dụng", `<p>Chào <b>${name}</b>,</p><p>Chúc mừng bạn đã trúng tuyển vị trí <b>${job}</b>${jc}.</p><p>Chúng tôi sẽ liên hệ sớm để hoàn tất các thủ tục tiếp theo.</p>${link(origin, "/candidate-room", "Xem hồ sơ của bạn")}`)
      };
    case "rejected":
      return {
        subject: `Kết quả ứng tuyển — ${job}`,
        html: shell("Kết quả ứng tuyển", `<p>Chào <b>${name}</b>,</p><p>Cảm ơn bạn đã quan tâm và ứng tuyển vị trí <b>${job}</b>${jc}. Lần này hồ sơ của bạn chưa phù hợp ở vòng <b>${ctx.round || "sàng lọc"}</b>.</p>${link(origin, "/viec-lam", "Xem việc làm khác")}`)
      };
    case "test_submitted_ack":
      return {
        subject: `Đã nhận bài thi vòng 2 — ${job}`,
        html: shell("Đã nhận bài thi", `<p>Chào <b>${name}</b>,</p><p>Hệ thống đã nhận bài thi vòng 2 của bạn cho vị trí <b>${job}</b>${jc}. HR sẽ đánh giá và phản hồi trong thời gian sớm nhất.</p>${link(origin, "/candidate-room", "Theo dõi trạng thái")}`)
      };
    case "interview_submitted_ack":
      return {
        subject: `Đã nhận phỏng vấn — ${job}`,
        html: shell("Đã nhận phỏng vấn", `<p>Chào <b>${name}</b>,</p><p>Hệ thống đã ghi nhận buổi phỏng vấn cho vị trí <b>${job}</b>${jc}. Hội đồng tuyển dụng sẽ xem xét và ra quyết định cuối cùng.</p>${link(origin, "/candidate-room", "Theo dõi trạng thái")}`)
      };
    default:
      return { subject: "NexCareer Hub", html: shell("NexCareer Hub", `<p>Xin chào <b>${name}</b>,</p><p>Có cập nhật về hồ sơ ứng tuyển của bạn.</p>${link(origin, "/candidate-room", "Mở Candidate Room")}`) };
  }
}