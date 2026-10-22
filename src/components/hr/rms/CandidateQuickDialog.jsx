import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function CandidateQuickDialog({ app, mode, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !app) return;
    setError("");
    setForm({
      department: app.department || "",
      years_experience: app.years_experience ?? "",
      education_level: app.education_level || "",
      skills: (app.skills || []).join(", "),
      cv_match_score: app.cv_match_score ?? "",
      hr_note: app.hr_note || app.notes || "",
    });
  }, [open, app]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload =
        mode === "note"
          ? { hr_note: form.hr_note }
          : {
              department: form.department,
              years_experience: form.years_experience === "" ? null : Number(form.years_experience),
              education_level: form.education_level,
              skills: String(form.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
              cv_match_score: form.cv_match_score === "" ? null : Number(form.cv_match_score),
            };
      const updated = await base44.entities.Application.update(app.id, payload);
      onOpenChange(false);
      onSaved?.(updated);
    } catch (e) {
      setError(e?.message || "Không lưu được thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "note" ? "Ghi chú HR" : "Sửa thông tin hồ sơ"}</DialogTitle>
          <DialogDescription>{app?.full_name} · {app?.job_title}</DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {mode === "note" ? (
          <Textarea
            rows={6}
            value={form.hr_note || ""}
            onChange={(e) => setForm({ ...form, hr_note: e.target.value })}
            placeholder="Ghi chú nội bộ về ứng viên..."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Phòng ban</Label>
              <Input value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Số năm kinh nghiệm</Label>
              <Input type="number" min="0" step="0.5" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Bằng cấp</Label>
              <Input value={form.education_level || ""} onChange={(e) => setForm({ ...form, education_level: e.target.value })} placeholder="VD: Đại học" />
            </div>
            <div className="space-y-1.5">
              <Label>Match score (%)</Label>
              <Input type="number" min="0" max="100" value={form.cv_match_score} onChange={(e) => setForm({ ...form, cv_match_score: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Kỹ năng (cách nhau bằng dấu phẩy)</Label>
              <Input value={form.skills || ""} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Python, SQL, IELTS 7.5" />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Hủy</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}