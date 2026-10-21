import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CalendarCheck, CalendarClock, CheckCircle2, Loader2, RefreshCw, Unlink } from "lucide-react";

const CONNECTOR_ID = "6ad8a9f25d7949301dc25629";

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
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const apply = (data) => {
    setConnected(!!data?.connected);
    setEmail(data?.my_email || "");
    setPending(data?.pending || 0);
    setEvents(data?.events || []);
  };

  const load = async () => {
    setLoading(true);
    try {
      let data = (await base44.functions.invoke("interviewCalendar", { action: "status" }))?.data || {};
      if (data.connected && (data.pending || 0) > 0) {
        const synced = (await base44.functions.invoke("interviewCalendar", { action: "sync" }))?.data || {};
        if (synced.synced > 0) onSynced?.();
        data = synced;
      }
      apply(data);
    } catch (e) {
      setConnected(false);
      setError(e.message || "Không kiểm tra được kết nối Google Calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) load();
      else setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    setBusy("connect");
    setError("");
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setBusy("");
          load();
        }
      }, 500);
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
      apply(data);
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
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
      setEvents([]);
      setPending(0);
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
              {connected
                ? `Đang kết nối ${email} — lịch phỏng vấn được tạo trên lịch của bạn và ứng viên nhận lời mời qua email.`
                : "Kết nối Google Calendar để tự động tạo lời mời phỏng vấn cho các ứng viên bạn phụ trách."}
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
          ) : (
            <Button size="sm" className="gap-2" onClick={handleConnect} disabled={!!busy}>
              {busy === "connect" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarCheck className="h-3.5 w-3.5" />}
              Kết nối Google Calendar
            </Button>
          )}
        </div>
      </div>

      {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}

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