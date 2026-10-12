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

export const applicationStatusLabel = {
  cv_screening: "Đang sàng lọc CV",
  cv_passed: "Đạt sàng lọc CV",
  cv_rejected: "Trượt sàng lọc CV",
  test_invited: "Mời làm bài thi",
  test_submitted: "Đã nộp bài thi",
  test_passed: "Đạt bài thi",
  test_rejected: "Trượt bài thi",
  interview_invited: "Mời phỏng vấn",
  interview_submitted: "Đã phỏng vấn",
  hired: "Đã trúng tuyển",
  rejected: "Không đạt",
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
  interview_submitted: "bg-indigo-100 text-indigo-700",
  hired: "bg-primary/15 text-primary",
  rejected: "bg-rose-100 text-rose-700",
};

// Quy ước 3 vòng. Mỗi status -> { round, state }
export const ROUNDS = [
  { id: 1, title: "Sàng lọc hồ sơ", desc: "AI quét CV & HR duyệt" },
  { id: 2, title: "Bài thi kỹ thuật / tình huống", desc: "Làm bài trong phòng thi giới hạn" },
  { id: 3, title: "Phỏng vấn video AI", desc: "Ghi hình & hội đồng đánh giá" },
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
    interview_submitted: { round: 3, state: "active" },
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