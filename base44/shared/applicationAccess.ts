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

// RLS của Application đã giới hạn quyền đọc cho chủ hồ sơ và HR.
// Nếu người dùng đọc được hồ sơ bằng chính token của họ thì đó cũng là bằng chứng sở hữu.
export async function userCanReadApplication(base44: any, applicationId: string): Promise<boolean> {
  try {
    const record = await base44.entities.Application.get(applicationId);
    return !!record?.id;
  } catch (e) {
    return false;
  }
}

// Dùng chung cho mọi hàm backend liên quan tới thi / phỏng vấn để quyền luôn đồng bộ
// với quyền tải hồ sơ trên giao diện.
export async function authorizeApplicationAccess(base44: any, app: any, user: any): Promise<boolean> {
  if (user?.role === 'admin') return true;
  if (canAccessApplication(app, user, false)) return true;
  return userCanReadApplication(base44, app?.id);
}

function maskEmail(value?: string): string {
  const email = String(value || '').trim();
  if (!email || !email.includes('@')) return '';
  const [name, domain] = email.split('@');
  const head = name.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export function accessDeniedMessage(app: any, user: any): string {
  const account = maskEmail(user?.email);
  const owner = maskEmail(app?.email);
  if (!account) {
    return 'Bạn cần đăng nhập bằng tài khoản ứng viên đã ứng tuyển vị trí này để tiếp tục.';
  }
  if (owner && !sameEmail(app?.email, user?.email)) {
    return `Tài khoản đang đăng nhập (${account}) không khớp với email trên hồ sơ ứng tuyển (${owner}). Hãy đăng xuất và đăng nhập bằng đúng email bạn đã dùng để ứng tuyển hoặc email nhận được thư mời.`;
  }
  return 'Bạn không có quyền truy cập hồ sơ ứng tuyển này. Hãy đăng nhập bằng đúng tài khoản đã ứng tuyển.';
}