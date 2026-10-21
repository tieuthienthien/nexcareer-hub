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

  let invited = false;
  try {
    const users = await base44.asServiceRole.entities.User.filter({ email }, { limit: 1 });
    if (!users?.items?.length) {
      await base44.users.inviteUser(email, 'user');
      invited = true;
    }
  } catch (e) {
    invited = false;
  }

  return { email, invited, profileReady };
}