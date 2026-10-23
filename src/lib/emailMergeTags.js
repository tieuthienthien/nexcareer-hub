// Biến tự động điền (merge tags) dùng trong trình soạn email tuyển dụng.
import { formatDateTime } from "@/lib/rms";

export const MERGE_TAGS = [
  { key: "ten_ung_vien", label: "Tên ứng viên" },
  { key: "vi_tri", label: "Vị trí" },
  { key: "ten_cong_ty", label: "Tên công ty" },
  { key: "ten_hr", label: "Tên HR" },
  { key: "chuc_danh_hr", label: "Chức danh HR" },
  { key: "email_hr", label: "Email HR" },
  { key: "sdt_hr", label: "SĐT HR" },
  { key: "han_nop_simulation", label: "Hạn nộp simulation" },
  { key: "link_job_simulation", label: "Link Job Simulation" },
  { key: "thoi_luong", label: "Thời lượng (phút)" },
  { key: "ngay_gio_phong_van", label: "Ngày giờ phỏng vấn" },
  { key: "hinh_thuc_phong_van", label: "Hình thức phỏng vấn" },
  { key: "dia_diem_hoac_link", label: "Địa điểm / link họp" },
  { key: "ten_line_manager", label: "Tên Line Manager" },
  { key: "chuc_danh_line_manager", label: "Chức danh Line Manager" },
  { key: "muc_luong", label: "Mức lương" },
  { key: "ngay_bat_dau", label: "Ngày bắt đầu" },
  { key: "han_phan_hoi_offer", label: "Hạn phản hồi offer" },
];

export const HR_IDENTITY_KEY = "nexcareer_email_identity";

export function loadHrIdentity() {
  try {
    return JSON.parse(localStorage.getItem(HR_IDENTITY_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

export function saveHrIdentity(identity) {
  try {
    localStorage.setItem(HR_IDENTITY_KEY, JSON.stringify(identity));
  } catch (e) {}
}

function salaryLabel(job) {
  if (!job) return "";
  const min = Number(job.salary_min);
  const max = Number(job.salary_max);
  const hasMin = !Number.isNaN(min) && min > 0;
  const hasMax = !Number.isNaN(max) && max > 0;
  if (hasMin && hasMax) return `${min} – ${max} triệu VND/tháng`;
  if (hasMin) return `từ ${min} triệu VND/tháng`;
  if (hasMax) return `tới ${max} triệu VND/tháng`;
  return "";
}

export function buildMergeContext({ app, invite, booking, job, simulation, hr, identity = {}, preset = {} }) {
  const company = app?.company || job?.company || "Nexora Technology";
  const interviewAt = booking?.date ? formatDateTime(`${booking.date}T${booking.start_time}:00+07:00`) : app?.interview_slot || "";
  const context = {
    ten_ung_vien: app?.full_name || "",
    vi_tri: app?.job_title || job?.title || "",
    ten_cong_ty: company,
    ten_hr: identity.ten_hr || hr?.full_name || "",
    chuc_danh_hr: identity.chuc_danh_hr || "Chuyên viên Tuyển dụng",
    email_hr: identity.email_hr || hr?.email || "",
    sdt_hr: identity.sdt_hr || "",
    han_nop_simulation: invite?.expires_at ? formatDateTime(invite.expires_at) : "",
    link_job_simulation:
      preset.link_job_simulation ||
      (invite?.token ? `${window.location.origin}/job-simulation/${invite.token}` : ""),
    thoi_luong: String(preset.thoi_luong || simulation?.duration_min || ""),
    ngay_gio_phong_van: interviewAt,
    hinh_thuc_phong_van: booking?.mode === "online" ? "Phỏng vấn trực tuyến (online)" : booking?.mode === "onsite" ? "Phỏng vấn trực tiếp tại văn phòng" : "",
    dia_diem_hoac_link: booking?.meeting_link || booking?.location || "",
    ten_line_manager: booking?.interviewer_name || "",
    chuc_danh_line_manager: booking?.interviewer_name ? "Quản lý trực tiếp" : "",
    muc_luong: identity.muc_luong || salaryLabel(job),
    ngay_bat_dau: identity.ngay_bat_dau || "",
    han_phan_hoi_offer: identity.han_phan_hoi_offer || "",
  };
  Object.entries(preset || {}).forEach(([key, value]) => {
    if (value) context[key] = String(value);
  });
  return context;
}

export function fillTags(text, context) {
  return String(text || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => context?.[key] ?? "");
}

export function missingTags(text, context) {
  const found = String(text || "").match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
  const keys = [...new Set(found.map((token) => token.replace(/[{}\s]/g, "")))];
  return keys
    .filter((key) => !String(context?.[key] ?? "").trim())
    .map((key) => MERGE_TAGS.find((tag) => tag.key === key)?.label || key);
}