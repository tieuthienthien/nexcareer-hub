export const CHEAT_LABELS = {
  copy: "Cố sao chép nội dung",
  paste: "Cố dán nội dung",
  cut: "Cố cắt nội dung",
  drag: "Kéo thả văn bản",
  context_menu: "Mở menu chuột phải",
  tab_switch: "Chuyển tab / rời cửa sổ làm bài",
  window_blur: "Rời khỏi cửa sổ làm bài",
  devtools: "Mở DevTools",
  fullscreen_exit: "Thoát chế độ toàn màn hình",
  fast_submit: "Nộp bài nhanh bất thường",
  bulk_paste: "Dán nội dung hàng loạt",
};

export function cheatLabel(type) {
  return CHEAT_LABELS[type] || type || "Hành vi khác";
}

export function cheatTotal(events = []) {
  return events.reduce((sum, e) => sum + (Number(e?.count) || 1), 0);
}