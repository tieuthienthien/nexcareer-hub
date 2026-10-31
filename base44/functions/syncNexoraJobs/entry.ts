// Đã TẮT đồng bộ tự động từ topcvxme.
// Trước đây workflow "Đồng bộ tin tuyển dụng Nexora" chạy mỗi ngày lúc 2h sáng và tạo lại
// các việc làm cũ (Frontend ReactJS, Backend Node.js, Kỹ sư IoT) sau khi bạn đã xóa.
// 6 việc làm chuẩn hiện được quản lý bằng nút "Nạp 6 việc Nexora" trong HR Studio.
export default async function (_req) {
  return Response.json({
    ok: true,
    skipped: true,
    message: 'Đồng bộ tự động đã tắt. Dùng nút "Nạp 6 việc Nexora" trong HR Studio.',
  });
}
