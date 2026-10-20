import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { CV_CATEGORIES } from "@/lib/cvUtils";
import { employmentTypeLabel, workTypeLabel, experienceLabel } from "@/lib/jobUtils";

const blank = {
  title: "",
  company: "Nexora Technology",
  category: CV_CATEGORIES[0],
  employment_type: "full-time",
  work_type: "onsite",
  experience_level: "mid",
  salary_min: "",
  salary_max: "",
  salary_negotiable: false,
  vacancies: 1,
  deadline: "",
  description: "",
  requirements: "",
  benefits: "",
  skills: [],
  status: "published",
  featured: false,
  is_nexora: true,
};

export default function CvJobFormDialog({ open, onOpenChange, job, onSaved }) {
  const [form, setForm] = useState(blank);
  const [skillsText, setSkillsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (job) {
      setForm({ ...blank, ...job });
      setSkillsText((job.skills || []).join(", "));
    } else {
      setForm(blank);
      setSkillsText("");
    }
    setError("");
  }, [open, job]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.title.trim()) return setError("Vui lòng nhập tên vị trí.");
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      salary_min: form.salary_min === "" ? null : Number(form.salary_min),
      salary_max: form.salary_max === "" ? null : Number(form.salary_max),
      vacancies: Number(form.vacancies) || 1,
      skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      const saved = job?.id
        ? await base44.entities.CvJob.update(job.id, payload)
        : await base44.entities.CvJob.create(payload);
      onSaved(saved);
      onOpenChange(false);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Không lưu được tin tuyển dụng.");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">{job ? "Sửa tin tuyển dụng" : "Đăng tin trên nền tảng CV"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Tên vị trí</Label>
              <Input value={form.title} onChange={(e) => set("title")(e.target.value)} className="mt-1.5" placeholder="Lập trình viên Frontend (ReactJS)" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Công ty</Label>
              <Input value={form.company} onChange={(e) => set("company")(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Ngành nghề</Label>
              <Select value={form.category} onValueChange={set("category")}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{CV_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Loại hình</Label>
              <Select value={form.employment_type} onValueChange={set("employment_type")}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(employmentTypeLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Hình thức</Label>
              <Select value={form.work_type} onValueChange={set("work_type")}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(workTypeLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cấp độ</Label>
              <Select value={form.experience_level} onValueChange={set("experience_level")}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(experienceLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Hạn nhận hồ sơ</Label>
              <Input value={form.deadline || ""} onChange={(e) => set("deadline")(e.target.value)} type="date" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Lương từ (triệu)</Label>
              <Input value={form.salary_min ?? ""} onChange={(e) => set("salary_min")(e.target.value)} type="number" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Lương đến (triệu)</Label>
              <Input value={form.salary_max ?? ""} onChange={(e) => set("salary_max")(e.target.value)} type="number" className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Kỹ năng (cách nhau bởi dấu phẩy)</Label>
              <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className="mt-1.5" placeholder="ReactJS, TypeScript, REST API" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Mô tả công việc</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => set("description")(e.target.value)} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Yêu cầu ứng viên</Label>
              <Textarea rows={3} value={form.requirements} onChange={(e) => set("requirements")(e.target.value)} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Quyền lợi</Label>
              <Textarea rows={2} value={form.benefits} onChange={(e) => set("benefits")(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!form.is_nexora} onCheckedChange={(v) => set("is_nexora")(!!v)} />
              Của Nexora Technology (đồng bộ sang NexCareer Hub)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!form.featured} onCheckedChange={(v) => set("featured")(!!v)} />
              Tin nổi bật
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.status === "published"} onCheckedChange={(v) => set("status")(v ? "published" : "closed")} />
              Đang hiển thị
            </label>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu tin
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}