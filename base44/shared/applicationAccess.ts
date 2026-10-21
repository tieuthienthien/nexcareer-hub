// Kiểm tra quyền truy cập hồ sơ ứng tuyển.
// Hồ sơ đồng bộ từ TopCV được tạo bằng service role nên created_by_id không phải ứng viên,
// vì vậy email đã xác thực của tài khoản cũng được xem là chủ hồ sơ.

export function sameEmail(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

export function canAccessApplication(app: any, user: any, allowAdmin = false): boolean {
  if (!app || !user) return false;
  if (allowAdmin && user.role === 'admin') return true;
  if (app.created_by_id && app.created_by_id === user.id) return true;
  return sameEmail(app.email, user.email);
}