// Tiện ích dùng chung cho luồng Google OAuth (Client ID/Secret nhập trong app).
// Dùng bởi gcalAuth và interviewCalendar.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
].join(" ");

export function normalizeEmail(value?: string | null): string {
  return String(value || "").trim().toLowerCase();
}

export async function getSetting(base44: any) {
  const res = await base44.asServiceRole.entities.CalendarSetting.list({ sort: "-created_date", limit: 1 });
  return (res.items || [])[0] || null;
}

export async function saveSetting(base44: any, patch: Record<string, any>) {
  const existing = await getSetting(base44);
  if (existing) return base44.asServiceRole.entities.CalendarSetting.update(existing.id, patch);
  return base44.asServiceRole.entities.CalendarSetting.create(patch);
}

export async function getTokenRecord(base44: any, email: string) {
  const target = normalizeEmail(email);
  if (!target) return null;
  const res = await base44.asServiceRole.entities.CalendarToken.filter({ user_email: target }, { limit: 1 });
  return (res.items || [])[0] || null;
}

export async function saveToken(base44: any, user: any, tokens: any, googleEmail: string) {
  const email = normalizeEmail(user?.email);
  const payload = {
    user_id: user?.id || "",
    user_email: email,
    google_email: normalizeEmail(googleEmail) || email,
    access_token: tokens.access_token || "",
    refresh_token: tokens.refresh_token || "",
    expires_at: new Date(Date.now() + (Number(tokens.expires_in) || 3600) * 1000).toISOString(),
    scope: tokens.scope || GOOGLE_SCOPES,
  };
  const existing = await getTokenRecord(base44, email);
  if (existing) {
    const merged = { ...payload, refresh_token: payload.refresh_token || existing.refresh_token || "" };
    return base44.asServiceRole.entities.CalendarToken.update(existing.id, merged);
  }
  return base44.asServiceRole.entities.CalendarToken.create(payload);
}

export function buildAuthUrl({ clientId, redirectUri, state, loginHint }: Record<string, string>) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode({ clientId, clientSecret, code, redirectUri }: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Google từ chối mã xác thực. Kiểm tra lại Redirect URI và Client Secret.");
  }
  return data;
}

async function refreshTokens({ clientId, clientSecret, refreshToken }: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || "Không làm mới được token Google.");
  return data;
}

export async function googleEmailFor(accessToken: string) {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return "";
  const data = await res.json().catch(() => ({}));
  return normalizeEmail(data.email);
}

// Trả về access token còn hiệu lực của HR (tự làm mới nếu đã hết hạn).
export async function accessTokenFor(base44: any, email: string) {
  const setting = await getSetting(base44);
  const record = await getTokenRecord(base44, email);
  if (!setting?.google_client_id || !setting?.google_client_secret || !record) return "";

  const expiresAt = new Date(record.expires_at || 0).getTime();
  if (record.access_token && expiresAt > Date.now() + 60_000) return record.access_token;
  if (!record.refresh_token) return "";

  const data = await refreshTokens({
    clientId: setting.google_client_id,
    clientSecret: setting.google_client_secret,
    refreshToken: record.refresh_token,
  });
  const expires = new Date(Date.now() + (Number(data.expires_in) || 3600) * 1000).toISOString();
  await base44.asServiceRole.entities.CalendarToken.update(record.id, {
    access_token: data.access_token,
    expires_at: expires,
  });
  return data.access_token;
}

export async function revokeAccess(base44: any, email: string) {
  const record = await getTokenRecord(base44, email);
  if (!record) return;
  const token = record.refresh_token || record.access_token;
  if (token) {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => null);
  }
  await base44.asServiceRole.entities.CalendarToken.delete(record.id);
}