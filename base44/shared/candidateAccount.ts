// Tạo sẵn hồ sơ ứng viên (kèm CV từ TopCV) và mời tài khoản NexCareer Hub.
// Dùng chung cho syncTopcvApplications và advanceStage.

export function normalizeEmail(value?: string): string | null {
  if (!value) return null;
  const email = String(value).trim().toLowerCase();
  if (!email || email.includes('*')) return null;
  if (email.endsWith('@topcvxme.local')) return null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  return email;
}

function compact(data: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export type ProvisionResult = { email: string | null; invited: boolean; profileReady: boolean };

export type EnsureUserResult = { registered: boolean; invited: boolean; error?: string };

// Đảm bảo ứng viên có tài khoản trong app để hệ thống gửi được email cho họ.
// Người chưa có tài khoản sẽ được mời ngay tại đây.
export async function ensureCandidateUser(base44: any, rawEmail?: string): Promise<EnsureUserResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { registered: false, invited: false, error: 'Hồ sơ không có địa chỉ email hợp lệ' };
  try {
    const users = await base44.asServiceRole.entities.User.filter({ email }, { limit: 1 });
    if (users?.items?.length) return { registered: true, invited: false };
  } catch (e) {}
  try {
    await base44.users.inviteUser(email, 'user');
    return { registered: true, invited: true };
  } catch (e: any) {
    return { registered: false, invited: false, error: e?.message || 'Không tạo được tài khoản cho ứng viên' };
  }
}

export async function provisionCandidateAccount(base44: any, app: any): Promise<ProvisionResult> {
  const email = normalizeEmail(app?.email);
  if (!email) return { email: null, invited: false, profileReady: false };

  const profileData = compact({
    email,
    full_name: app.full_name,
    phone: app.phone,
    headline: app.job_title,
    cv_source_url: app.cv_source_url,
    portfolio_url: app.portfolio_url,
  });

  let profileReady = false;
  try {
    const existing = await base44.asServiceRole.entities.CandidateProfile.filter({ email }, { limit: 1 });
    const found = existing?.items?.[0];
    if (found) {
      await base44.asServiceRole.entities.CandidateProfile.update(found.id, profileData);
    } else {
      await base44.asServiceRole.entities.CandidateProfile.create(profileData);
    }
    profileReady = true;
  } catch (e) {
    profileReady = false;
  }

  const ensured = await ensureCandidateUser(base44, email);

  return { email, invited: ensured.invited, profileReady };
}