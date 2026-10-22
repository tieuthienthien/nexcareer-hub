import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Bot, Mail, X } from "lucide-react";
import EmailComposeDialog from "./EmailComposeDialog";
import { formatDateTime } from "@/lib/rms";

export default function HrChatbotNotifications() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [compose, setCompose] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await base44.entities.Notification.list({ sort: "-created_date", limit: 30 });
      setItems(res.items || []);
    } catch (e) {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Notification.subscribe(() => load());
    return unsubscribe;
  }, []);

  const unread = items.filter((n) => !n.is_read).length;

  const openAction = async (n) => {
    setBusy(true);
    try {
      await base44.entities.Notification.update(n.id, { is_read: true });
      const app = n.application_id ? await base44.entities.Application.get(n.application_id).catch(() => null) : null;
      if (app && (n.type === "offer_ready" || n.type === "rejection_ready")) {
        setCompose({ app, mode: n.type === "offer_ready" ? "offer" : "rejection", notificationId: n.id });
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg transition-transform hover:scale-105"
        aria-label="HR Chatbot"
      >
        <Bot className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-700 ring-2 ring-background">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex max-h-[70vh] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-700">HR Chatbot</span>
              {unread > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-600">{unread} mới</span>}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng"><X className="h-4 w-4" /></button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {items.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">Chưa có thông báo nào. Khi Line Manager ra quyết định, thông báo sẽ xuất hiện tại đây.</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`rounded-xl border p-3 text-sm ${n.is_read ? "border-border bg-card" : "border-violet-200 bg-violet-50"}`}>
                  <p className="leading-relaxed text-foreground/90">{n.message}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{formatDateTime(n.created_at || n.created_date)}</span>
                    {n.action_done ? (
                      <span className="text-[11px] font-600 text-emerald-600">Đã xử lý</span>
                    ) : (n.type === "offer_ready" || n.type === "rejection_ready") ? (
                      <Button size="sm" className="h-7 gap-1 px-2 text-[11px]" onClick={() => openAction(n)} disabled={busy}>
                        <Mail className="h-3.5 w-3.5" />
                        {n.type === "offer_ready" ? "Gửi Offer" : "Gửi mail từ chối"}
                      </Button>
                    ) : (
                      <button type="button" className="text-[11px] font-600 text-primary hover:underline" onClick={() => openAction(n)}>
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <EmailComposeDialog
        open={!!compose}
        onOpenChange={(v) => !v && setCompose(null)}
        apps={compose ? [compose.app] : []}
        mode={compose?.mode || "offer"}
        notificationId={compose?.notificationId}
        onSent={load}
      />
    </>
  );
}