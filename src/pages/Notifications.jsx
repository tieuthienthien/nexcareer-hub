import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";

const typeColor = {
  test_invite: "bg-amber-100 text-amber-700",
  interview_invite: "bg-violet-100 text-violet-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejection: "bg-rose-100 text-rose-700",
  stage_update: "bg-sky-100 text-sky-700",
  system: "bg-muted text-muted-foreground",
};
const typeLabel = {
  test_invite: "Mời thi",
  interview_invite: "Phỏng vấn",
  offer: "Trúng tuyển",
  rejection: "Kết quả",
  stage_update: "Cập nhật vòng",
  system: "Hệ thống",
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Notification.filter({}, { sort: "-created_date", limit: 50 });
      setItems(res.items || []);
    } catch { setItems([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try { await base44.entities.Notification.update(id, { read: true }); setItems((s) => s.map((n) => n.id === id ? { ...n, read: true } : n)); } catch {}
  };
  const markAll = async () => {
    const unread = items.filter((n) => !n.read);
    try { await base44.entities.Notification.bulkUpdate(unread.map((n) => ({ id: n.id, read: true }))); setItems((s) => s.map((n) => ({ ...n, read: true }))); } catch {}
  };

  const open = (n) => {
    if (!n.read) markRead(n.id);
    if (n.link) navigate(n.link);
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-800 tracking-tight">Thông báo</h1>
          <p className="mt-2 text-muted-foreground">{unread > 0 ? `Bạn có ${unread} thông báo chưa đọc.` : "Tất cả đã xem."}</p>
        </div>
        {unread > 0 && <Button variant="outline" size="sm" onClick={markAll} className="gap-2"><CheckCheck className="h-4 w-4" /> Đánh dấu đã đọc</Button>}
      </div>

      <div className="mt-8 space-y-2.5">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 font-600">Chưa có thông báo</h3>
            <p className="mt-1 text-sm text-muted-foreground">Thông báo về hồ sơ ứng tuyển sẽ xuất hiện tại đây.</p>
          </div>
        ) : items.map((n) => (
          <button key={n.id} onClick={() => open(n)} className={`flex w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/30 ${n.read ? "border-border" : "border-primary/40 bg-primary/5"}`}>
            <div className="mt-0.5">
              {!n.read ? <span className="block h-2.5 w-2.5 rounded-full bg-primary" /> : <Check className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-600 ${typeColor[n.type] || typeColor.system}`}>{typeLabel[n.type] || n.type}</span>
                <span className="text-[11px] text-muted-foreground">{new Date(n.created_date).toLocaleString("vi-VN")}</span>
              </div>
              <h3 className="mt-1.5 text-sm font-600">{n.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}