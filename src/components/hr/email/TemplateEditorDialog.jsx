import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { fillPreview, MERGE_TAGS } from "@/lib/rmsTemplates";
import { SAMPLE_CANDIDATE, TEMPLATE_CATEGORIES } from "@/lib/emailTemplates";

export default function TemplateEditorDialog({ open, onOpenChange, template, prefill, onSaved }) {
  const [form, setForm] = useState({ name: "", category: "other", subject: "", body: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const source = template || prefill;
    setForm({
      name: source?.name || "",
      category: source?.category || "other",
      subject: source?.subject || "",
      body: source?.body || "",
    });
    setError("");
  }, [open, template, prefill]);

  const set = (patch) => setForm({ ...form, ...patch });

  const insertTag = (tag) => set({ body: `${form.body}${form.body.endsWith(" ") || !form.body ? "" : " "}${tag}` });

  const save = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setError("Vui lòng nhập tên mẫu, tiêu đề và nội dung email.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        subject: form.subject,
        body: form.body,
      };
      if (template?.id) await base44.entities.EmailTemplate.update(template.id, payload);
      else await base44.entities.EmailTemplate.create(payload);
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Không lưu được mẫu email.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{template?.id ? "Sửa mẫu email" : "Tạo mẫu email mới"}</DialogTitle>
          <DialogDescription>
            Thẻ như {"{{name}}"}, {"{{job}}"}, {"{{slot}}"} sẽ được điền riêng cho từng ứng viên khi gửi.
          </DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Tên mẫu</Label>
              <Input
                className="mt-1.5"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="VD: Thư mời phỏng vấn vòng 1"
              />
            </div>
            <div>
              <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Nhóm</Label>
              <Select value={form.category} onValueChange={(v) => set({ category: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Tiêu đề email</Label>
            <Input className="mt-1.5" value={form.subject} onChange={(e) => set({ subject: e.target.value })} />
          </div>

          <div>
            <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Nội dung</Label>
            <Textarea
              rows={10}
              className="mt-1.5 font-mono text-[13px] leading-relaxed"
              value={form.body}
              onChange={(e) => set({ body: e.target.value })}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Chèn thẻ:</span>
              {MERGE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertTag(tag)}
                  className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-foreground/70 hover:border-primary/50 hover:text-primary"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">
              Xem trước với ứng viên mẫu
            </div>
            <div className="mt-1 text-sm font-600">{fillPreview(form.subject, SAMPLE_CANDIDATE)}</div>
            <pre className="mt-1 whitespace-pre-wrap font-body text-[13px] leading-relaxed text-foreground/80">
              {fillPreview(form.body, SAMPLE_CANDIDATE)}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu mẫu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}