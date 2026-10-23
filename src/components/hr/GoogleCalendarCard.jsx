import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CalendarCheck, CalendarClock, CheckCircle2, Loader2, RefreshCw, Settings2, Unlink } from "lucide-react";
import GoogleCredentialForm from "@/components/hr/GoogleCredentialForm";

const REDIRECT_PATH = "/hr-studio/schedule";
const STATE_KEY = "gcal_oauth_state";

function formatEventTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function GoogleCalendarCard({ onSynced }) {
  const redirectUri = `${window.location.origin}${REDIRECT_PATH}`;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(false);
  const [clientId, setClientId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [pending, setPending] = useState(0);
  const [events, setEvents] = useState([]);
  const pollRef = useRef(null);

  const invoke = async (payload) => (await base44.functions.invoke("gcalAuth", payload))?.data || {};

  const applyStatus = (data) => {
    setConfigured(!!data.configured);
    setClientId(data.client_id || "");
    setGoogleEmail(data.google_email || "");
    setShowForm(!data.configured);
  };

  const loadCalendar = async () => {
    try {
      const data = (await base44.functions.invoke("interviewCalendar", { action: "status" }))?.data || {};
      setConnected(!!data.connected);
      setPending(data.pending || 0);
      setEvents(data.events || []);
    } catch (e) {
      setConnected(false);
      setError(e.message || "Không tải được sự kiện Google Calendar.");
    }
  };

  const handleCallback = async (code, state) => {
    const expected = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);
    if (expected && state !== expected) {
      setError("Phiên kết nối Google không khớp. Vui lòng bấm kết nối lại.");
      return;
    }
    setBusy("callback");
    try {
      await invoke({ action: "callback", code });
      const status = await invoke({ action: "status" });
      applyStatus(status);
      setShowForm(false);
      await loadCalendar();
    } catch (e) {
      setError(e.message || "Không hoàn tất được kết nối Google.");
    } finally {
      setBusy("");
    }
  };

  const cleanUrl = () => {
    const params = new URLSearchParams(window.location.search);
    ["code", "state", "scope", "authuser", "prompt", "iss", "hd"].forEach((k) => params.delete(k));
    const query = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const finishConnect = async (data) => {
    stopPolling();
    applyStatus(data);
    setShowForm(false);
    await loadCalendar();
    setBusy("");
  };

  // Chờ cửa sổ Google hoàn tất cấp quyền rồi tự cập nhật trạng thái kết nối.
  const watchConnection = (win) => {
    stopPolling();
    const started = Date.now();
    pollRef.current = setInterval(async () => {
      let status = {};
      try {
        status = await invoke({ action: "status" });
      } catch {
        status = {};
      }
      if (status.connected) {
        await finishConnect(status);
        if (win && !win.closed) win.close();
        return;
      }
      if (win && win.closed) {
        stopPolling();
        setTimeout(async () => {
          let final = {};
          try {
            final = await invoke({ action: "status" });
          } catch {
            final = {};
          }
          if (final.connected) await finishConnect(final);
          else {
            setBusy("");
            setError("Chưa hoàn tất kết nối Google. Hãy bấm Kết nối lại và chọn tài khoản khi cửa sổ Google mở ra.");
          }
        }, 1500);
        return;
      }
      if (Date.now() - started > 180000) {
        stopPolling();
        setBusy("");
        setError("Hết thời gian chờ cấp quyền Google. Vui lòng bấm Kết nối lại.");
      }
    }, 2500);
  };

  useEffect(() => {
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!authed) return;
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        if (code) {
          cleanUrl();
          await handleCallback(code, state);
        }
        const status = await invoke({ action: "status" });
        applyStatus(status);
        await loadCalendar();
      } catch (e) {
        setError(e.message || "Không kiểm tra được kết nối Google Calendar.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleConnect = async () => {
    setBusy("connect");
    setError("");
    try {
      const state = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      sessionStorage.setItem(STATE_KEY, state);
      const data = await invoke({ action: "start", state, redirect_uri: redirectUri });
      if (!data.url) throw new Error(data.error || "Không tạo được liên kết kết nối Google.");
      const win = window.open(data.url, "gcal_connect", "width=600,height=760");
      if (!win) {
        setBusy("");
        setError(
          "Trình duyệt đang chặn cửa sổ Google. Hãy mở app ở tab riêng (nexcareerhubbyxme.base44.app), vào Lịch phỏng vấn và bấm Kết nối Google Calendar lại."
        );
        return;
      }
      watchConnection(win);
    } catch (e) {
      setError(e.message || "Không mở được trang kết nối Google.");
      setBusy("");
    }
  };

  const handleSync = async () => {
    setBusy("sync");
    setError("");
    try {
      const data = (await base44.functions.invoke("interviewCalendar", { action: "sync" }))?.data || {};
      setConnected(!!data.connected);
      setPending(data.pending || 0);
      setEvents(data.events || []);
      if (data.synced > 0) onSynced?.();
      if ((data.failures || []).length > 0) setError(`Không đồng bộ được: ${data.failures.join(", ")}`);
    } catch (e) {
      setError(e.message || "Không đồng bộ được lịch.");
    } finally {
      setBusy("");
    }
  };

  const handleDisconnect = async () => {
    setBusy("disconnect");
    try {
      await invoke({ action: "disconnect" });
      setConnected(false);
      setEvents([]);
      setPending(0);
      setGoogleEmail("");
    } catch (e) {
      setError(e.message || "Không ngắt được kết nối.");
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Đang kiểm tra kết nối Google Calendar...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-700">Google Calendar của tôi</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {busy === "callback"
                ? "Đang hoàn tất kết nối với Google..."
                : connected
                  ? `Đang kết nối ${googleEmail} — lịch phỏng vấn được tạo trên lịch của bạn và ứng viên nhận lời mời qua email.`
                  : configured
                    ? `Đã lưu cấu hình Google (${clientId ? `Client ID …${clientId.slice(-14)}` : "Client ID/Secret"}) — bấm Kết nối Google Calendar để cấp quyền.`
                    : "Nhập Google OAuth Client ID/Secret một lần để bật tạo lời mời phỏng vấn trên Google Calendar."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {connected ? (
            <>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleSync} disabled={!!busy}>
                {busy === "sync" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Đồng bộ lịch
              </Button>
              <Button size="sm" variant="ghost" className="gap-2 text-muted-foreground" onClick={handleDisconnect} disabled={!!busy}>
                {busy === "disconnect" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                Ngắt kết nối
              </Button>
            </>
          ) : configured ? (
            <>
              <Button size="sm" className="gap-2" onClick={handleConnect} disabled={!!busy}>
                {busy === "connect" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarCheck className="h-3.5 w-3.5" />}
                Kết nối Google Calendar
              </Button>
              <Button size="sm" variant="ghost" className="gap-2 text-muted-foreground" onClick={() => setShowForm((v) => !v)} disabled={!!busy}>
                <Settings2 className="h-3.5 w-3.5" />
                Đổi cấu hình
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}

      {!connected && (showForm || !configured) && (
        <GoogleCredentialForm
          clientId={clientId}
          redirectUri={redirectUri}
          configured={configured}
          onSaved={(data) => {
            applyStatus(data);
            setShowForm(false);
          }}
          onCancel={configured ? () => setShowForm(false) : null}
          onConnect={handleConnect}
        />
      )}

      {connected && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-600 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Đã kết nối
            </span>
            <span className={pending > 0 ? "font-600 text-amber-700" : "text-muted-foreground"}>
              {pending > 0 ? `${pending} buổi phỏng vấn chờ đồng bộ` : "Tất cả lịch phỏng vấn của bạn đã được đồng bộ"}
            </span>
          </div>
          {events.length > 0 && (
            <div className="rounded-xl border border-border/70 p-3">
              <div className="flex items-center gap-1.5 text-xs font-600 text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> Sự kiện sắp tới trên lịch của bạn
              </div>
              <div className="mt-2 space-y-1.5">
                {events.map((ev) => (
                  <a
                    key={ev.id}
                    href={ev.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-xs hover:bg-muted/50"
                  >
                    <span className="truncate font-500">{ev.summary}</span>
                    <span className="text-muted-foreground">{formatEventTime(ev.start)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}