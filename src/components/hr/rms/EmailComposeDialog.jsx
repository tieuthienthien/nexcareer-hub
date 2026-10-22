import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Send } from "lucide-react";
import { fillPreview, interviewTemplate, offerTemplate, rejectionTemplate } from "@/lib/rmsTemplates";

export default function EmailComposeDialog({ open, onOpenChange, apps = [], mode = "interview", notificationId, onSent }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !apps.length) return;
    const first = apps[0];
    const tpl = mode === "offer" ? offerTemplate(first) : mode === "rejection" ? rejectionTemplate(first) : interviewTemplate(first);
    setSubject(tpl.subject);
    setBody(tpl.body);
    setError("");
  }, [open, mode, apps]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Vui lòng nhập tiêu đề và nội dung email.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const action = mode === "offer" ? "send_offer" : mode === "rejection" ? "send_rejection" : "approve_cv";
      const res = await base44.functions.invoke("rmsCandidateActions", {
        action,
        application_ids: apps.map((a) => a.id),
        subject,
        body,
        notification_id: notificationId,
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
      setError(e.response?.data?.error || e.message || "Không gửi được email.");
    } finally {
      setSending(false);
    }
  };

  const first = apps[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {mode === "offer" ? "Mail mời nhận việc" : mode === "rejection" ? "Mail cảm ơn / từ chối" : "Mail mời phỏng vấn"}
          </DialogTitle>
          <DialogDescription>
            {apps.length > 1
              ? `Gửi cho ${apps.length} ứng viên đã chọn. Thẻ {{name}}, {{job}}, {{slot}} sẽ được điền riêng cho từng người.`
              : `Gửi tới ${first?.full_name || "ứng viên"} · ${first?.email || ""}`}
          </DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Tiêu đề</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Nội dung (chỉnh sửa được)</label>
            <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-[13px] leading-relaxed" />
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Xem trước</div>
            <div className="mt-1 text-sm font-600">{fillPreview(subject, first)}</div>
            <pre className="mt-1 whitespace-pre-wrap font-body text-[13px] leading-relaxed text-foreground/80">{fillPreview(body, first)}</pre>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>Hủy</Button>
          <Button onClick={send} disabled={sending} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}