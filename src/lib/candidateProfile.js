// Hồ sơ ứng viên (Candidate Room) là nơi lưu mọi thông tin dùng để ứng tuyển.
// Các mục BẮT BUỘC phải có thì mới ứng tuyển được; sửa danh sách này để đổi yêu cầu.
export const REQUIRED_ITEMS = [
  { key: "full_name", label: "Họ và tên", tab: "profile", ok: (p) => !!p?.full_name?.trim() },
  { key: "email", label: "Email", tab: "profile", ok: (p) => !!p?.email?.trim() },
  { key: "cv", label: "CV (PDF/DOC/DOCX)", tab: "cv", ok: (p) => !!p?.cv_file_uri },
];

export function getMissingItems(profile) {
  return REQUIRED_ITEMS.filter((it) => !it.ok(profile));
}

// Tab của Candidate Room cần mở để bổ sung (ưu tiên mục đầu tiên còn thiếu).
export function tabToFix(missing) {
  return missing?.[0]?.tab || "profile";
}

export const fileNameOf = (uri) => {
  const last = String(uri || "").split("/").pop() || "";
  const i = last.indexOf("_");
  return (i > -1 ? last.slice(i + 1) : last) || "tệp đính kèm";
};

// Tên nhãn các link dự án (mỗi dòng một link) -> mảng
export function splitLinks(text) {
  return String(text || "").split("\n").map((s) => s.trim()).filter(Boolean);
}
