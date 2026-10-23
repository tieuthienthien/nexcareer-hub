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

// Trạng thái cũ (status) vẫn được các luồng chấm CV / chuyển vòng cập nhật.
// Quy đổi sang trạng thái RMS để sơ đồ tiến trình và nhãn luôn phản ánh đúng thực tế.
const LEGACY_STAGE = {
  cv_screening: "new",
  cv_passed: "cv_approved",
  cv_rejected: "fail",
  test_invited: "cv_approved",
  test_submitted: "cv_approved",
  test_passed: "pending_manager",
  test_rejected: "fail",
  interview_invited: "pending_manager",
  scheduled: "pending_manager",
  interview_submitted: "interviewed",
  final_review: "interviewed",
  hired: "pass",
  rejected: "fail",
};

export function legacyStage(app) {
  return LEGACY_STAGE[app?.status] || "new";
}

export function rmsStatus(app) {
  const raw = app?.rms_status;
  if (raw && raw !== "new") return raw;
  return legacyStage(app);
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

const AFTER_CV = [
  "cv_passed",
  "cv_rejected",
  "test_invited",
  "test_submitted",
  "test_passed",
  "test_rejected",
  "interview_invited",
  "scheduled",
  "interview_submitted",
  "final_review",
  "hired",
  "rejected",
];

const WITH_MANAGER = [
  "test_passed",
  "interview_invited",
  "scheduled",
  "interview_submitted",
  "final_review",
  "hired",
];

const WITH_SCHEDULE = ["interview_submitted", "final_review", "hired"];

export function stepItems(app) {
  const status = app?.status || "";
  const stage = rmsStatus(app);
  const rejectedEarly = status === "cv_rejected";
  const rejectedLate = app?.manager_decision === "fail" || status === "rejected" || status === "test_rejected";

  const step2Done =
    !!app?.step2_done ||
    !!app?.round1_decided_at ||
    AFTER_CV.includes(status) ||
    ["cv_approved", "pending_manager", "interviewed", "pass"].includes(stage);
  const step3Done = !!app?.step3_done || !!app?.assigned_manager_email || WITH_MANAGER.includes(status);
  const step4Done = !!app?.step4_done || app?.interview_confirmed === true || WITH_SCHEDULE.includes(status) || stage === "interviewed";
  const step5Done =
    !!app?.step5_done || !!app?.manager_decision || status === "hired" || status === "rejected" || stage === "pass";

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
      desc: rejectedEarly ? "HR từ chối ở vòng CV" : "HR duyệt CV và gửi thư mời phỏng vấn",
      done: step2Done,
      at: app?.step2_at || app?.round1_decided_at,
      failed: rejectedEarly,
    },
    {
      key: "step3",
      title: "Chuyển Line Manager",
      desc: app?.assigned_manager_email ? `Phụ trách: ${app.assigned_manager_email}` : "Chưa gán Line Manager cho vị trí",
      done: step3Done,
      at: app?.step3_at || app?.manager_opened_at,
    },
    {
      key: "step4",
      title: "Manager chấp thuận lịch",
      desc: interviewSlotLabel(app) || "Ứng viên chưa chọn khung giờ",
      done: step4Done,
      at: app?.step4_at || app?.interview_at,
    },
    {
      key: "step5",
      title: "Kết quả & nhận việc",
      desc:
        rejectedLate || rejectedEarly
          ? "Hồ sơ không được chọn"
          : status === "hired" || stage === "pass"
            ? "Đã nhận việc"
            : "Line Manager quyết định Pass/Fail",
      done: step5Done || rejectedLate || rejectedEarly,
      at: app?.step5_at || app?.decision_at || app?.round2_decided_at,
      failed: rejectedLate || rejectedEarly,
    },
  ];
}