// Nhãn, màu và tiện ích dùng chung cho quy trình tuyển dụng tự động (RMS).
export const RMS_STATUS = {
  new: { label: "Mới nộp", color: "bg-blue-100 text-blue-700", ring: "ring-blue-200" },
  cv_approved: { label: "Đã duyệt CV", color: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-200" },
  pending_manager: { label: "Chờ Line Manager", color: "bg-violet-100 text-violet-700", ring: "ring-violet-200" },
  interviewed: { label: "Đã phỏng vấn", color: "bg-amber-100 text-amber-800", ring: "ring-amber-200" },
  pass: { label: "Pass", color: "bg-emerald-600 text-white", ring: "ring-emerald-300" },
  fail: { label: "Fail", color: "bg-rose-100 text-rose-700", ring: "ring-rose-200" },
};

export const RMS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...Object.entries(RMS_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
];

export function rmsStatus(app) {
  return app?.rms_status || "new";
}

export function rmsMeta(app) {
  return RMS_STATUS[rmsStatus(app)] || RMS_STATUS.new;
}

export function candidateCode(app) {
  if (!app) return "";
  return app.candidate_code || `NC-${String(app.id || "").slice(-6).toUpperCase()}`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function interviewSlotLabel(app) {
  if (!app) return "";
  if (app.interview_slot) return app.interview_slot;
  if (app.interview_at) return formatDateTime(app.interview_at);
  return "";
}

export function appSkills(app) {
  const list = [
    ...(Array.isArray(app?.skills) ? app.skills : []),
    ...(Array.isArray(app?.keywords) ? app.keywords : []),
    app?.english_certificate,
    app?.education_level,
  ];
  return list.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim());
}

export const YEAR_BANDS = [
  { value: "all", label: "Mọi kinh nghiệm" },
  { value: "under1", label: "Dưới 1 năm" },
  { value: "1to3", label: "1–3 năm" },
  { value: "over3", label: "Trên 3 năm" },
];

export function matchesYears(app, band) {
  if (!band || band === "all") return true;
  const y = Number(app?.years_experience);
  if (Number.isNaN(y)) return false;
  if (band === "under1") return y < 1;
  if (band === "1to3") return y >= 1 && y <= 3;
  return y > 3;
}

export function matchesKeyword(app, keyword) {
  const q = String(keyword || "").trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    app?.full_name,
    app?.job_title,
    app?.english_certificate,
    app?.education_level,
    app?.cover_letter,
    ...(appSkills(app) || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function stepItems(app) {
  return [
    {
      key: "step1",
      title: "CV đã nộp",
      desc: "Hệ thống nhận hồ sơ tự động",
      done: app?.step1_done !== false,
      at: app?.step1_at || app?.created_date,
    },
    {
      key: "step2",
      title: "HR check & mail mời PV",
      desc: "HR duyệt CV và gửi thư mời phỏng vấn",
      done: !!app?.step2_done,
      at: app?.step2_at,
    },
    {
      key: "step3",
      title: "Chuyển Line Manager",
      desc: app?.assigned_manager_email ? `Phụ trách: ${app.assigned_manager_email}` : "Chưa gán Line Manager cho vị trí",
      done: !!app?.step3_done,
      at: app?.step3_at,
    },
    {
      key: "step4",
      title: "Manager chấp thuận lịch",
      desc: interviewSlotLabel(app) || "Ứng viên chưa chọn khung giờ",
      done: !!app?.step4_done,
      at: app?.step4_at,
    },
    {
      key: "step5",
      title: "Kết quả & nhận việc",
      desc: app?.manager_decision === "fail" ? "Line Manager từ chối" : "Line Manager quyết định Pass/Fail",
      done: !!app?.step5_done,
      at: app?.step5_at,
      failed: app?.manager_decision === "fail",
    },
  ];
}