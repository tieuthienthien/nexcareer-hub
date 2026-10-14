import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CATEGORIES = ["suggestion", "bug", "usability", "other"];
const clamp = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const overall = Number(body?.overall_rating);
    if (!Number.isFinite(overall) || overall < 1 || overall > 5) {
      return Response.json({ error: "Vui lòng chọn đánh giá tổng quan 1–5 sao." }, { status: 400 });
    }
    const category = String(body?.category || "");
    if (!CATEGORIES.includes(category)) {
      return Response.json({ error: "Loại góp ý không hợp lệ." }, { status: 400 });
    }
    const comment = (body?.comment || "").toString().slice(0, 1000);
    const anonymous = !!body?.anonymous;
    const consentPublic = !!body?.consent_public;
    const displayName = (body?.display_name || "").toString().slice(0, 80);

    const ease = clamp(body?.ease_rating);
    const iface = clamp(body?.interface_rating);
    const perf = clamp(body?.performance_rating);
    const supp = clamp(body?.support_rating);

    let user = null;
    try { user = await base44.auth.me(); } catch {}

    // Ngăn gửi trùng cho người đã đăng nhập (trong 10 phút)
    if (user) {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      try {
        const res = await base44.asServiceRole.entities.Feedback.filter(
          { user_id: user.id, created_date: { $gte: since } },
          { limit: 1 }
        );
        if ((res.items || []).length) {
          return Response.json({ error: "Bạn vừa gửi phản hồi rồi, vui lòng đợi vài phút trước khi gửi tiếp." }, { status: 429 });
        }
      } catch {}
    }

    const record = await base44.asServiceRole.entities.Feedback.create({
      user_id: user?.id || null,
      overall_rating: overall,
      ease_rating: ease,
      interface_rating: iface,
      performance_rating: perf,
      support_rating: supp,
      category,
      comment: comment || null,
      status: "new",
      is_featured: false,
      anonymous,
      display_name: anonymous
        ? (displayName || "Ẩn danh")
        : (user?.full_name || user?.email || displayName || "Người dùng"),
      consent_public: consentPublic,
    });

    return Response.json({ ok: true, id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}