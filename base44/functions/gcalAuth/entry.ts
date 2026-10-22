import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import {
  getSetting,
  saveSetting,
  getTokenRecord,
  saveToken,
  buildAuthUrl,
  exchangeCode,
  googleEmailFor,
  revokeAccess,
  normalizeEmail,
} from "../../shared/googleOAuth.ts";

const REDIRECT_PATTERN = /^https?:\/\/[^/]+\/hr-studio\/schedule$/;

function statusOf(setting: any, token: any) {
  return {
    configured: !!(setting?.google_client_id && setting?.google_client_secret),
    client_id: setting?.google_client_id || "",
    redirect_uri: setting?.redirect_uri || "",
    connected: !!token,
    google_email: token?.google_email || "",
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Chỉ HR được cấu hình Google Calendar" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || "status";
    const setting = await getSetting(base44);
    const record = await getTokenRecord(base44, user.email);

    if (action === "status") {
      return Response.json(statusOf(setting, record));
    }

    if (action === "save") {
      const clientId = String(body?.client_id || "").trim();
      const clientSecret = String(body?.client_secret || "").trim() || setting?.google_client_secret || "";
      const redirectUri = String(body?.redirect_uri || setting?.redirect_uri || "").trim();
      if (!clientId) return Response.json({ error: "Thiếu Client ID" }, { status: 400 });
      if (!clientSecret) return Response.json({ error: "Thiếu Client Secret" }, { status: 400 });
      if (!REDIRECT_PATTERN.test(redirectUri)) {
        return Response.json({ error: "Redirect URI không hợp lệ" }, { status: 400 });
      }
      const saved = await saveSetting(base44, {
        google_client_id: clientId,
        google_client_secret: clientSecret,
        redirect_uri: redirectUri,
        updated_by_email: normalizeEmail(user.email),
      });
      return Response.json(statusOf(saved, record));
    }

    if (action === "start") {
      if (!setting?.google_client_id || !setting?.google_client_secret) {
        return Response.json({ error: "Chưa lưu Client ID/Secret" }, { status: 400 });
      }
      const requested = String(body?.redirect_uri || "").trim();
      const redirectUri = REDIRECT_PATTERN.test(requested) ? requested : setting.redirect_uri;
      if (redirectUri !== setting.redirect_uri) await saveSetting(base44, { redirect_uri: redirectUri });
      const url = buildAuthUrl({
        clientId: setting.google_client_id,
        redirectUri,
        state: String(body?.state || ""),
        loginHint: normalizeEmail(user.email),
      });
      return Response.json({ url, redirect_uri: redirectUri });
    }

    if (action === "callback") {
      const code = String(body?.code || "").trim();
      if (!code) return Response.json({ error: "Thiếu mã xác thực từ Google" }, { status: 400 });
      if (!setting?.google_client_id || !setting?.google_client_secret) {
        return Response.json({ error: "Chưa lưu Client ID/Secret" }, { status: 400 });
      }
      const tokens = await exchangeCode({
        clientId: setting.google_client_id,
        clientSecret: setting.google_client_secret,
        code,
        redirectUri: setting.redirect_uri,
      });
      const googleEmail = (await googleEmailFor(tokens.access_token)) || normalizeEmail(user.email);
      await saveToken(base44, user, tokens, googleEmail);
      return Response.json({ connected: true, google_email: googleEmail });
    }

    if (action === "disconnect") {
      await revokeAccess(base44, user.email);
      return Response.json({ connected: false, configured: statusOf(setting, null).configured });
    }

    return Response.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}