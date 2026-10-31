export const workTypeLabel = {
  remote: "Làm từ xa",
  hybrid: "Lai trộn",
  onsite: "Tại văn phòng",
};

export const employmentTypeLabel = {
  "full-time": "Toàn thời gian",
  "part-time": "Bán thời gian",
  contract: "Hợp đồng",
  intern: "Thực tập",
};

export const experienceLabel = {
  entry: "Mới / Intern",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Team Lead",
  manager: "Manager",
};

// Quy trình 2 vòng + đặt lịch phỏng vấn
export const applicationStatusLabel = {
  cv_screening: "Chờ chấm CV",
  cv_passed: "Đậu vòng 1",
  cv_rejected: "Rớt vòng 1",
  test_invited: "Chờ làm bài thi",
  test_submitted: "Đang chờ chấm",
  test_passed: "Đậu vòng 2 · Chờ chọn lịch",
  test_rejected: "Rớt vòng 2",
  interview_invited: "Chờ chọn lịch",
  scheduled: "Đã đặt lịch phỏng vấn",
  interview_submitted: "Đã phỏng vấn",
  final_review: "Cần xem xét thêm",
  hired: "Nhận việc",
  rejected: "Không nhận",
};

export const applicationStatusColor = {
  cv_screening: "bg-blue-100 text-blue-700",
  cv_passed: "bg-emerald-100 text-emerald-700",
  cv_rejected: "bg-rose-100 text-rose-700",
  test_invited: "bg-amber-100 text-amber-700",
  test_submitted: "bg-sky-100 text-sky-700",
  test_passed: "bg-emerald-100 text-emerald-700",
  test_rejected: "bg-rose-100 text-rose-700",
  interview_invited: "bg-violet-100 text-violet-700",
  scheduled: "bg-indigo-100 text-indigo-700",
  interview_submitted: "bg-cyan-100 text-cyan-700",
  final_review: "bg-amber-100 text-amber-800",
  hired: "bg-primary/15 text-primary",
  rejected: "bg-rose-100 text-rose-700",
};

export const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "cv_screening", label: "Chờ chấm CV" },
  { value: "cv_passed", label: "Đậu vòng 1" },
  { value: "cv_rejected", label: "Rớt vòng 1" },
  { value: "test_invited", label: "Chờ làm bài thi" },
  { value: "test_submitted", label: "Đang chờ chấm" },
  { value: "test_passed", label: "Đậu vòng 2 · Chờ chọn lịch" },
  { value: "test_rejected", label: "Rớt vòng 2" },
  { value: "scheduled", label: "Đã đặt lịch" },
  { value: "interview_submitted", label: "Đã phỏng vấn" },
  { value: "final_review", label: "Cần xem xét thêm" },
  { value: "hired", label: "Nhận việc" },
  { value: "rejected", label: "Không nhận" },
];

export const ROUNDS = [
  { id: 1, title: "Vòng 1 — Chấm CV tự động", desc: "AI đối chiếu barem, HR quyết định" },
  { id: 2, title: "Vòng 2 — Bài thi online", desc: "Tối đa 60 phút, tự nộp khi hết giờ" },
  { id: 3, title: "Đặt lịch & phỏng vấn", desc: "Ứng viên chọn khung giờ, HR chốt kết quả" },
];

export function getStageInfo(status) {
  const map = {
    cv_screening: { round: 1, state: "active" },
    cv_passed: { round: 1, state: "passed" },
    cv_rejected: { round: 1, state: "rejected" },
    test_invited: { round: 2, state: "active" },
    test_submitted: { round: 2, state: "active" },
    test_passed: { round: 2, state: "passed" },
    test_rejected: { round: 2, state: "rejected" },
    interview_invited: { round: 3, state: "active" },
    scheduled: { round: 3, state: "active" },
    interview_submitted: { round: 3, state: "active" },
    final_review: { round: 3, state: "active" },
    hired: { round: 3, state: "passed" },
    rejected: { round: 3, state: "rejected" },
  };
  return map[status] || { round: 1, state: "active" };
}

export function isFinalStatus(status) {
  return ["hired", "rejected", "cv_rejected", "test_rejected"].includes(status);
}

export function formatSalary(job) {
  if (!job.salary_visible) return "Thỏa thuận";
  if (job.salary_min == null && job.salary_max == null) return "Thỏa thuận";
  const fmt = (n) => `${n} triệu`;
  if (job.salary_min != null && job.salary_max != null) return `${fmt(job.salary_min)} - ${fmt(job.salary_max)}`;
  if (job.salary_min != null) return `Từ ${fmt(job.salary_min)}`;
  return `Lên đến ${fmt(job.salary_max)}`;
}

export function companyInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const palette = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-purple-500",
];

export function companyGradient(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// Ảnh đại diện cho từng vị trí tuyển dụng (public/images/vieclam).
// Khớp theo từ khóa trong tiêu đề, không phụ thuộc dấu tiếng Việt.
const JOB_IMAGES = [
  [/backend|node\.?js/, "/images/vieclam/tuyen-dung-l-p-tr-nh-vi-n-backend-node-js-.png"],
  [/frontend|react/, "/images/vieclam/tuyen-dung-l-p-tr-nh-vi-n-frontend-reactjs-.png"],
  [/iot|embedded/, "/images/vieclam/tuyen-dung-k-s-iot-embedded-.png"],
  [/ux\s*\/?\s*ui/, "/images/vieclam/tuyen-dung-ux-ui-designer.png"],
  [/\bhr\b|nhan su/, "/images/vieclam/tuyen-dung-hr-executive-nh-n-s-.png"],
  [/mobile|flutter/, "/images/vieclam/tuyen-dung-mobile-developer-flutter-.png"],
  [/marketing/, "/images/vieclam/tuyen-dung-digital-marketing-specialist.png"],
];

export function jobImage(job) {
  const title = (job?.title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
  const hit = JOB_IMAGES.find(([re]) => re.test(title));
  return hit ? hit[1] : job?.company_logo || null;
}