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
  pending: "Chờ duyệt",
  reviewing: "Đang xét hồ sơ",
  interview: "Mời phỏng vấn",
  offer: "Đề nghị nhận việc",
  rejected: "Từ chối",
  hired: "Đã nhận việc",
};

export const applicationStatusColor = {
  pending: "bg-amber-100 text-amber-700",
  reviewing: "bg-blue-100 text-blue-700",
  interview: "bg-violet-100 text-violet-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  hired: "bg-primary/15 text-primary",
};

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