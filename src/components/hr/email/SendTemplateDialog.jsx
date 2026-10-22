import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Search, Send } from "lucide-react";
import { fillPreview } from "@/lib/rmsTemplates";
import { SAMPLE_CANDIDATE } from "@/lib/emailTemplates";

export default function SendTemplateDialog({ open, onOpenChange, template, onSent }) {
  const [apps, setApps] = useState([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedId("");
    setQ("");
    setError("");
  }, [open, template]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const query = q.trim() ? { full_name: { $regex: q.trim(), $options: "i" } } : {};
        const res = await base44.entities.Application.filter(query, { sort: "-created_date", limit: 30 });
        if (alive) setApps(res.items || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, q]);

  const selected = apps.find((a) => a.id === selectedId) || null;

  const send = async () => {
    if (!selected) {
      setError("Vui lòng chọn ứng viên nhận email.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await base44.functions.invoke("rmsCandidateActions", {
        action: "send_custom",
        application_ids: [selected.id],
        subject: template.subject,
        body: template.body,
        title: template.name,
      });
      const data = res.data || res;
      if (data.error) {
        setError(data.error);
        return;
      }
      const warnings = (data.results || []).flatMap((r) => r.warnings || []);
      onOpenChange(false);
      onSent?.({ warnings, count: (data.results || []).length });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Không gửi được email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Gửi “{template?.name}”</DialogTitle>
          <DialogDescription>
            Chọn ứng viên trong danh sách hồ sơ. Nội dung có thẻ tự điền sẽ được điền riêng cho người nhận.
          </DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên ứng viên..."
              className="pl-9"
            />
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải hồ sơ...
              </div>
            ) : apps.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Không có hồ sơ phù hợp.</div>
            ) : (
              apps.map((a) => {
                const active = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={`flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-0 ${
                      active ? "bg-primary/10" : "hover:bg-muted/60"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-600 ${active ? "text-primary" : ""}`}>
                        {a.full_name || "Ứng viên"}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {a.job_title || "—"} · {a.email || ""}
                      </span>
                    </span>
                    {a.rms_status && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-600 text-muted-foreground">
                        {a.rms_status}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Xem trước</div>
            <div className="mt-1 text-sm font-600">{fillPreview(template?.subject || "", selected || SAMPLE_CANDIDATE)}</div>
            <pre className="mt-1 max-h-52 overflow-y-auto whitespace-pre-wrap font-body text-[13px] leading-relaxed text-foreground/80">
              {fillPreview(template?.body || "", selected || SAMPLE_CANDIDATE)}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Hủy
          </Button>
          <Button onClick={send} disabled={sending} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}