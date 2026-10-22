import { interviewTemplate, offerTemplate, rejectionTemplate } from "@/lib/rmsTemplates";

export const TEMPLATE_CATEGORIES = [
  { key: "interview", label: "Mời phỏng vấn" },
  { key: "offer", label: "Mời nhận việc" },
  { key: "rejection", label: "Cảm ơn / Từ chối" },
  { key: "reminder", label: "Nhắc lịch" },
  { key: "other", label: "Khác" },
];

export function categoryLabel(key) {
  return TEMPLATE_CATEGORIES.find((c) => c.key === key)?.label || "Khác";
}

// Ứng viên mẫu để xem trước nội dung có thẻ tự điền
export const SAMPLE_CANDIDATE = {
  full_name: "Nguyễn Văn A",
  job_title: "Lập trình viên",
  company: "Nexora Technology",
  interview_slot: "09:00 · 25/10/2026",
  candidate_code: "NC-8F2A19",
};

export const TEMPLATE_SUGGESTIONS = [
  {
    key: "interview",
    name: "Thư mời phỏng vấn",
    category: "interview",
    build: () => interviewTemplate(SAMPLE_CANDIDATE),
  },
  {
    key: "offer",
    name: "Thư mời nhận việc",
    category: "offer",
    build: () => offerTemplate(SAMPLE_CANDIDATE),
  },
  {
    key: "rejection",
    name: "Thư cảm ơn / từ chối",
    category: "rejection",
    build: () => rejectionTemplate(SAMPLE_CANDIDATE),
  },
];