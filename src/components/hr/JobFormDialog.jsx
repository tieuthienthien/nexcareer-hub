import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { workTypeLabel, employmentTypeLabel, experienceLabel } from "@/lib/jobUtils";

const empty = {
  title: "", company: "", location: "", work_type: "onsite", employment_type: "full-time",
  salary_min: "", salary_max: "", salary_visible: true, category: "", experience_level: "mid",
  description: "", requirements: "", benefits: "", skillsText: "", vacancy: 1, deadline: "",
  status: "published", featured: false,
};

export default function JobFormDialog({ job, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (job) {
      setForm({
        ...empty,
        ...job,
        salary_min: job.salary_min ?? "",
        salary_max: job.salary_max ?? "",
        skillsText: (job.skills || []).join(", "),
        deadline: job.deadline ? job.deadline.slice(0, 10) : "",
      });
    } else {
      setForm(empty);
    }
  }, [open, job]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setError("");
    if (!form.title || !form.company || !form.location) { setError("Vui lòng nhập tên vị trí, công ty và địa điểm."); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title, company: form.company, location: form.location,
        work_type: form.work_type, employment_type: form.employment_type,
        salary_min: form.salary_min === "" ? null : Number(form.salary_min),
        salary_max: form.salary_max === "" ? null : Number(form.salary_max),
        salary_visible: form.salary_visible, category: form.category,
        experience_level: form.experience_level, description: form.description,
        requirements: form.requirements, benefits: form.benefits,
        skills: form.skillsText.split(",").map((s) => s.trim()).filter(Boolean),
        vacancy: Number(form.vacancy) || 1, deadline: form.deadline || null,
        status: form.status, featured: form.featured,
      };
      if (job?.id) await base44.entities.Job.update(job.id, payload);
      else await base44.entities.Job.create(payload);
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || "Không thể lưu việc làm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job ? "Chỉnh sửa việc làm" : "Đăng việc làm mới"}</DialogTitle>
          <DialogDescription>Điền thông tin vị trí tuyển dụng</DialogDescription>
        </DialogHeader>
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Tên vị trí *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="VD: Senior Frontend Engineer" />
          </div>
          <div className="space-y-2"><Label>Công ty *</Label><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
          <div className="space-y-2"><Label>Địa điểm *</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="TP. HCM" /></div>
          <div className="space-y-2">
            <Label>Hình thức làm việc</Label>
            <Select value={form.work_type} onValueChange={(v) => set("work_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(workTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Loại hình</Label>
            <Select value={form.employment_type} onValueChange={(v) => set("employment_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(employmentTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Lương tối thiểu (triệu)</Label><Input type="number" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} placeholder="15" /></div>
          <div className="space-y-2"><Label>Lương tối đa (triệu)</Label><Input type="number" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} placeholder="25" /></div>
          <div className="space-y-2"><Label>Lĩnh vực</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Công nghệ thông tin" /></div>
          <div className="space-y-2">
            <Label>Cấp bậc</Label>
            <Select value={form.experience_level} onValueChange={(v) => set("experience_level", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(experienceLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Số lượng tuyển</Label><Input type="number" value={form.vacancy} onChange={(e) => set("vacancy", e.target.value)} /></div>
          <div className="space-y-2"><Label>Hạn nộp</Label><Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Đang tuyển</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="closed">Đã đóng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-6 sm:col-span-2 pt-1">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.salary_visible} onChange={(e) => set("salary_visible", e.target.checked)} className="h-4 w-4 rounded" /> Hiển thị lương</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 rounded" /> Việc làm nổi bật</label>
          </div>
          <div className="space-y-2 sm:col-span-2"><Label>Kỹ năng (cách nhau bởi dấu phẩy)</Label><Input value={form.skillsText} onChange={(e) => set("skillsText", e.target.value)} placeholder="React, TypeScript" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Mô tả công việc</Label><Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Yêu cầu công việc</Label><Textarea rows={4} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Quyền lợi</Label><Textarea rows={3} value={form.benefits} onChange={(e) => set("benefits", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu việc làm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}