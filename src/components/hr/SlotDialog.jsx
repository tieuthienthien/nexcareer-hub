import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save, Repeat } from "lucide-react";

const WEEKDAYS = [
  { value: 1, label: "T2" }, { value: 2, label: "T3" }, { value: 3, label: "T4" },
  { value: 4, label: "T5" }, { value: 5, label: "T6" }, { value: 6, label: "T7" }, { value: 0, label: "CN" },
];

const emptyForm = {
  job_id: "",
  date: new Date().toISOString().slice(0, 10),
  times: "09:00, 10:00, 14:00, 15:00",
  duration_min: 45,
  mode: "online",
  location: "",
  meeting_link: "",
  interviewer_name: "",
  interviewer_email: "",
  max_candidates: 1,
  repeat: false,
  weekdays: [2, 4],
  weeks: 4,
};

export default function SlotDialog({ open, onOpenChange, jobs, slot, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (slot) {
      setForm({
        ...emptyForm,
        job_id: slot.job_id,
        date: slot.date,
        times: String(slot.start_time).slice(0, 5),
        duration_min: slot.duration_min || 45,
        mode: slot.mode || "online",
        location: slot.location || "",
        meeting_link: slot.meeting_link || "",
        interviewer_name: slot.interviewer_name || "",
        interviewer_email: slot.interviewer_email || "",
        max_candidates: slot.max_candidates || 1,
        repeat: false,
      });
    } else {
      setForm({ ...emptyForm, job_id: jobs[0]?.id || "" });
    }
  }, [open, slot, jobs]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setError("");
    if (!form.job_id) { setError("Chọn vị trí tuyển dụng."); return; }
    if (!form.date) { setError("Chọn ngày phỏng vấn."); return; }
    const times = String(form.times).split(",").map((t) => t.trim()).filter((t) => /^\d{1,2}:\d{2}$/.test(t));
    if (!times.length) { setError("Nhập ít nhất một giờ hợp lệ, VD 09:00, 14:00."); return; }
    if (form.mode === "online" && !form.meeting_link.trim()) { setError("Nhập link họp cho buổi phỏng vấn online."); return; }
    if (form.mode === "onsite" && !form.location.trim()) { setError("Nhập địa điểm phỏng vấn tại văn phòng."); return; }

    setSaving(true);
    try {
      const job = jobs.find((j) => j.id === form.job_id);
      const base = {
        job_id: form.job_id,
        job_title: job?.title || "",
        duration_min: Number(form.duration_min) || 45,
        mode: form.mode,
        location: form.location.trim(),
        meeting_link: form.meeting_link.trim(),
        interviewer_name: form.interviewer_name.trim(),
        interviewer_email: form.interviewer_email.trim(),
        max_candidates: Math.max(1, Number(form.max_candidates) || 1),
        status: "open",
      };

      if (slot?.id) {
        await base44.entities.InterviewSlot.update(slot.id, { ...base, date: form.date, start_time: times[0] });
      } else {
        const payload = [];
        if (form.repeat) {
          const start = new Date(`${form.date}T00:00:00`);
          for (let w = 0; w < Math.max(1, Math.min(12, Number(form.weeks) || 1)); w += 1) {
            for (let d = 0; d < 7; d += 1) {
              const day = new Date(start);
              day.setDate(start.getDate() + w * 7 + d);
              if (!form.weekdays.includes(day.getDay())) continue;
              const iso = day.toISOString().slice(0, 10);
              if (iso < new Date().toISOString().slice(0, 10)) continue;
              for (const t of times) payload.push({ ...base, date: iso, start_time: t, booked_count: 0 });
            }
          }
        } else {
          for (const t of times) payload.push({ ...base, date: form.date, start_time: t, booked_count: 0 });
        }
        if (!payload.length) throw new Error("Không có khung giờ nào được tạo.");
        await base44.entities.InterviewSlot.bulkCreate(payload);
      }

      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không lưu được khung giờ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{slot ? "Sửa khung giờ phỏng vấn" : "Tạo khung giờ phỏng vấn"}</DialogTitle>
          <DialogDescription>HR mở khung giờ cố định; ứng viên chỉ chọn trong các khung này.</DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="grid gap-4 py-1 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Vị trí *</Label>
            <Select value={form.job_id} onValueChange={(v) => set("job_id", v)}>
              <SelectTrigger><SelectValue placeholder="Chọn vị trí" /></SelectTrigger>
              <SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2"><Label>Ngày *</Label><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
          <div className="space-y-2"><Label>{slot ? "Giờ *" : "Các giờ (cách nhau bởi dấu phẩy) *"}</Label><Input value={form.times} onChange={(e) => set("times", e.target.value)} placeholder="09:00, 10:00, 14:00" /></div>

          <div className="space-y-2"><Label>Thời lượng (phút)</Label><Input type="number" value={form.duration_min} onChange={(e) => set("duration_min", e.target.value)} /></div>
          <div className="space-y-2"><Label>Số ứng viên tối đa</Label><Input type="number" min={1} value={form.max_candidates} onChange={(e) => set("max_candidates", e.target.value)} /></div>

          <div className="space-y-2">
            <Label>Hình thức</Label>
            <Select value={form.mode} onValueChange={(v) => set("mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="onsite">Tại văn phòng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.mode === "online" ? (
            <div className="space-y-2"><Label>Link họp *</Label><Input value={form.meeting_link} onChange={(e) => set("meeting_link", e.target.value)} placeholder="https://meet.google.com/..." /></div>
          ) : (
            <div className="space-y-2"><Label>Địa điểm *</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Tầng 5, Tòa nhà..." /></div>
          )}

          <div className="space-y-2"><Label>Người phỏng vấn</Label><Input value={form.interviewer_name} onChange={(e) => set("interviewer_name", e.target.value)} placeholder="Nguyễn Văn A" /></div>
          <div className="space-y-2"><Label>Email người phỏng vấn</Label><Input type="email" value={form.interviewer_email} onChange={(e) => set("interviewer_email", e.target.value)} placeholder="hr@nexora.vn" /></div>

          {!slot && (
            <div className="sm:col-span-2 rounded-xl border border-border bg-muted/20 p-3">
              <label className="flex items-center gap-2 text-sm font-600">
                <input type="checkbox" checked={form.repeat} onChange={(e) => set("repeat", e.target.checked)} className="h-4 w-4 rounded" />
                <Repeat className="h-3.5 w-3.5" /> Lặp lại hằng tuần (VD: Thứ 3 và Thứ 5)
              </label>
              {form.repeat && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => set("weekdays", form.weekdays.includes(d.value) ? form.weekdays.filter((x) => x !== d.value) : [...form.weekdays, d.value])}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-600 ${form.weekdays.includes(d.value) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Số tuần</Label>
                    <Input type="number" min={1} max={12} value={form.weeks} onChange={(e) => set("weeks", e.target.value)} className="h-8 w-20" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu khung giờ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}