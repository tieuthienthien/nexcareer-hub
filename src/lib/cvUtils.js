export const CV_TEMPLATES = [
  { id: "nexora", name: "Nexora", desc: "Hiện đại, nhấn mạnh kết quả", dot: "bg-teal-600" },
  { id: "editorial", name: "Editorial", desc: "Trang nhã, nhiều khoảng trắng", dot: "bg-slate-700" },
  { id: "signal", name: "Signal", desc: "Gọn, hai cột, tập trung kỹ năng", dot: "bg-orange-500" },
];

export const CV_CATEGORIES = [
  "Công nghệ thông tin",
  "Thiết kế",
  "Kinh doanh",
  "Marketing",
  "Tài chính - Ngân hàng",
  "Nhân sự",
];

export function emptyCv(user = {}) {
  return {
    title: "CV mới",
    template: "nexora",
    is_default: false,
    full_name: user.full_name || "",
    email: user.email || "",
    phone: "",
    address: "",
    birth_date: "",
    headline: "",
    summary: "",
    skills: [],
    languages: [],
    certificates: [],
    experience: [],
    education: [],
  };
}

export function dateRange(start, end) {
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" – ");
}

export function cvSalary(job) {
  if (job.salary_negotiable) return "Thỏa thuận";
  if (job.salary_min == null && job.salary_max == null) return "Thỏa thuận";
  const fmt = (n) => `${n} triệu`;
  if (job.salary_min != null && job.salary_max != null) return `${fmt(job.salary_min)} - ${fmt(job.salary_max)}`;
  if (job.salary_min != null) return `Từ ${fmt(job.salary_min)}`;
  return `Lên đến ${fmt(job.salary_max)}`;
}

export function daysLeft(deadline) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return diff;
}

export function buildCvSnapshot(cv) {
  if (!cv) return "";
  const lines = [];
  lines.push(cv.full_name || cv.title || "Ứng viên");
  if (cv.headline) lines.push(cv.headline);
  const contact = [cv.email, cv.phone, cv.address].filter(Boolean).join(" · ");
  if (contact) lines.push(contact);

  if (cv.summary) {
    lines.push("", "GIỚI THIỆU", cv.summary);
  }
  if ((cv.experience || []).length) {
    lines.push("", "KINH NGHIỆM LÀM VIỆC");
    cv.experience.forEach((e) => {
      const head = [e.role, e.company].filter(Boolean).join(" — ");
      const time = dateRange(e.start_date, e.end_date);
      lines.push(`- ${head}${time ? ` (${time})` : ""}`);
      if (e.description) lines.push(`  ${e.description}`);
    });
  }
  if ((cv.education || []).length) {
    lines.push("", "HỌC VẤN");
    cv.education.forEach((e) => {
      const head = [e.school, e.major].filter(Boolean).join(" — ");
      const time = dateRange(e.start_date, e.end_date);
      lines.push(`- ${head}${time ? ` (${time})` : ""}`);
      if (e.description) lines.push(`  ${e.description}`);
    });
  }
  if ((cv.skills || []).length) lines.push("", "KỸ NĂNG", cv.skills.join(", "));
  if ((cv.certificates || []).length) lines.push("", "CHỨNG CHỈ", cv.certificates.join(", "));
  if ((cv.languages || []).length) lines.push("", "NGOẠI NGỮ", cv.languages.join(", "));
  return lines.join("\n");
}