// Bộ dựng nội dung email cho các chặng quy trình tuyển dụng.
// Dùng chung cho các backend function: screenCv, advanceStage, submitInterview.

export function appOrigin(req: Request): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return "https://nex-career-pulse.base44.app";
  }
}

function link(origin: string, path: string, label: string): string {
  return `<a href="${origin}${path}" style="display:inline-block;margin-top:18px;padding:12px 22px;background:#4f46e5;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">${label}</a>`;
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:'Be Vietnam Pro',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:28px 20px;">
    <div style="background:#4f46e5;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0;">
      <div style="font-size:13px;opacity:.85;letter-spacing:.5px;">NEXORA CAREERS HUB</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px;">${title}</div>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 14px 14px;border:1px solid #e2e8f0;color:#1e293b;line-height:1.6;font-size:14px;">
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">Email tự động từ Nexora Careers Hub — vui lòng không trả lời.</p>
  </div></body></html>`;
}

export function buildEmail(
  stage: string,
  ctx: { candidateName?: string; jobTitle?: string; company?: string; matchScore?: number|null; analysis?: string; round?: string; origin: string }
): { subject: string; html: string } {
  const name = ctx.candidateName || "Ứng viên";
  const job = ctx.jobTitle || "vị trí";
  const company = ctx.company || "";
  const origin = ctx.origin;
  const jc = company ? ` · ${company}` : "";

  switch (stage) {
    case "cv_received": {
      const scoreText = (ctx.matchScore != null) ? `<p style="margin:14px 0;padding:12px 16px;background:#eef2ff;border-radius:10px;"><b>Kết quả sàng lọc AI (tham khảo):</b> Khớp <b>${ctx.matchScore}%</b> với vị trí.</p>` : "";
      const analysis = ctx.analysis ? `<p style="color:#475569;">${ctx.analysis}</p>` : "";
      return {
        subject: `Đã nhận hồ sơ ứng tuyển — ${job}`,
        html: shell("Đã nhận hồ sơ ứng tuyển", `<p>Xin chào <b>${name}</b>,</p><p>Hệ thống đã nhận hồ sơ ứng tuyển của bạn cho vị trí <b>${job}</b>${jc}.</p>${scoreText}${analysis}<p>Bạn có thể theo dõi trạng thái hồ sơ bất cứ lúc nào trong Dashboard cá nhân.</p>${link(origin, "/candidate-room", "Mở Dashboard cá nhân")}`)
      };
    }
    case "round2_invite": {
      return {
        subject: `Mời làm bài thi vòng 2 — ${job}`,
        html: shell("Mời làm bài thi vòng 2", `<p>Chào <b>${name}</b>,</p><p>Bạn đã đạt vòng sàng lọc hồ sơ cho vị trí <b>${job}</b>${jc}. Chúng tôi trân trọng mời bạn làm bài thi vòng 2 ngay trên hệ thống.</p><p style="color:#475569;">Bài thi sẽ có giới hạn thời gian. Vui lòng chuẩn bị môi trường yên tĩnh và đọc kỹ hướng dẫn trước khi bắt đầu.</p>${link(origin, "/candidate-room", "Vào làm bài thi")}`)
      };
    }
    case "round3_invite": {
      return {
        subject: `Mời phỏng vấn video vòng 3 — ${job}`,
        html: shell("Mời phỏng vấn video vòng 3", `<p>Chào <b>${name}</b>,</p><p>Chúc mừng bạn đã qua vòng thi kỹ thuật cho vị trí <b>${job}</b>${jc}. Chúng tôi trân trọng mời bạn tham gia phỏng vấn video vòng 3 với AI trên hệ thống.</p><p style="color:#475569;">Bạn sẽ cần cấp quyền camera & micro, và chuẩn bị khung hình theo hướng dẫn chống gian lận.</p>${link(origin, "/candidate-room", "Vào phòng phỏng vấn")}`)
      };
    }
    case "hired": {
      return {
        subject: `Chúc mừng! Bạn đã trúng tuyển — ${job}`,
        html: shell("Kết quả tuyển dụng", `<p>Chào <b>${name}</b>,</p><p>Chúc mừng bạn đã trúng tuyển vị trí <b>${job}</b>${jc} tại Nexora! 🎉</p><p>Chúng tôi sẽ liên hệ sớm để hoàn tất các thủ tục tiếp theo.</p>${link(origin, "/candidate-room", "Xem hồ sơ của bạn")}`)
      };
    }
    case "rejected": {
      return {
        subject: `Kết quả ứng tuyển — ${job}`,
        html: shell("Kết quả ứng tuyển", `<p>Chào <b>${name}</b>,</p><p>Cảm ơn bạn đã quan tâm và ứng tuyển vị trí <b>${job}</b>${jc}. Lần này hồ sơ của bạn chưa phù hợp ở vòng <b>${ctx.round || "sàng lọc"}</b>.</p><p style="color:#475569;">Rất mong được đồng hành cùng bạn trong các cơ hội phù hợp khác tại Nexora.</p>${link(origin, "/viec-lam", "Xem việc làm khác")}`)
      };
    }
    case "test_submitted_ack": {
      return {
        subject: `Đã nhận bài thi vòng 2 — ${job}`,
        html: shell("Đã nhận bài thi", `<p>Chào <b>${name}</b>,</p><p>Hệ thống đã nhận bài thi vòng 2 của bạn cho vị trí <b>${job}</b>${jc}. HR sẽ đánh giá và phản hồi trong thời gian sớm nhất.</p>${link(origin, "/candidate-room", "Theo dõi trạng thái")}`)
      };
    }
    case "interview_submitted_ack": {
      return {
        subject: `Đã nhận phỏng vấn vòng 3 — ${job}`,
        html: shell("Đã nhận phỏng vấn", `<p>Chào <b>${name}</b>,</p><p>Hệ thống đã nhận bản ghi phỏng vấn vòng 3 của bạn cho vị trí <b>${job}</b>${jc}. Hội đồng tuyển dụng sẽ xem xét và ra quyết định cuối cùng.</p>${link(origin, "/candidate-room", "Theo dõi trạng thái")}`)
      };
    }
    default:
      return { subject: "Nexora Careers Hub", html: shell("Nexora Careers Hub", `<p>Xin chào <b>${name}</b>,</p><p>Có cập nhật về hồ sơ ứng tuyển của bạn.</p>${link(origin, "/candidate-room", "Mở Dashboard cá nhân")}`) };
  }
}