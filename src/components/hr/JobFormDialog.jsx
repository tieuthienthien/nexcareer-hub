import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save, Sparkles } from "lucide-react";
import { workTypeLabel, employmentTypeLabel, experienceLabel } from "@/lib/jobUtils";

const empty = {
  title: "", company: "", location: "", work_type: "onsite", employment_type: "full-time",
  salary_min: "", salary_max: "", salary_visible: true, category: "", experience_level: "mid",
  description: "", requirements: "", benefits: "", skillsText: "", vacancy: 1, deadline: "",
  status: "published", featured: false,
  exam_group: "lap-trinh", exam_question_count: 10, exam_duration_min: 60,
  test_type: "none", test_duration_min: 15, test_prompt: "", test_char_limit: 2000,
  test_language: "", test_starter_code: "", interviewQuestionsText: "",
  simulation_id: "",
};

export default function JobFormDialog({ job, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sims, setSims] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [jdHints, setJdHints] = useState("");

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
        exam_group: job.exam_group || "lap-trinh",
        exam_question_count: job.exam_question_count || 10,
        exam_duration_min: job.exam_duration_min || 60,
        test_type: job.test_type || "none",
        test_duration_min: job.test_duration_min || 15,
        test_prompt: job.test_prompt || "",
        test_char_limit: job.test_char_limit || 2000,
        test_language: job.test_language || "",
        test_starter_code: job.test_starter_code || "",
        interviewQuestionsText: (job.interview_questions || []).join("\n"),
      });
    } else {
      setForm(empty);
    }
  }, [open, job]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setJdHints("");
    setAiError("");
    base44.entities.JobSimulation.filter({ status: "active" }, { sort: "-created_date", limit: 50 })
      .then((res) => {
        const items = res.items || [];
        setSims(items);
        if (job?.id) {
          const assigned = items.find((s) => s.job_id === job.id);
          if (assigned) set("simulation_id", assigned.id);
        }
      })
      .catch(() => setSims([]));
  }, [open, job]);

  const generateJd = async () => {
    if (!form.title) { setAiError("Nhập tên vị trí trước khi tạo JD."); return; }
    setAiBusy(true);
    setAiError("");
    try {
      const res = await base44.functions.invoke("generateJd", {
        mode: "hints",
        title: form.title,
        company: form.company,
        location: form.location,
        experience: experienceLabel[form.experience_level] || "",
        hints: jdHints,
        skills: form.skillsText.split(",").map((s) => s.trim()).filter(Boolean),
      });
      const d = res.data || {};
      if (d.error) throw new Error(d.error);
      setForm((f) => ({
        ...f,
        description: d.description || f.description,
        requirements: d.requirements || f.requirements,
        benefits: d.benefits || f.benefits,
        skillsText: d.skills?.length ? d.skills.join(", ") : f.skillsText,
      }));
    } catch (e) {
      setAiError(e.response?.data?.error || e.message || "Không tạo được JD.");
    } finally {
      setAiBusy(false);
    }
  };

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
        exam_group: form.exam_group, exam_question_count: Number(form.exam_question_count) || 10,
        exam_duration_min: Math.min(60, Number(form.exam_duration_min) || 60),
        test_type: form.test_type, test_duration_min: Number(form.test_duration_min) || 15,
        test_prompt: form.test_prompt, test_char_limit: Number(form.test_char_limit) || 2000,
        test_language: form.test_language, test_starter_code: form.test_starter_code,
        interview_questions: form.interviewQuestionsText.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      let saved;
      if (job?.id) saved = await base44.entities.Job.update(job.id, payload);
      else saved = await base44.entities.Job.create(payload);
      const savedId = saved?.id || job?.id;
      if (form.simulation_id && savedId) {
        await base44.entities.JobSimulation.update(form.simulation_id, { job_id: savedId }).catch(() => null);
      }
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

          <div className="sm:col-span-2 mt-2 border-t border-border pt-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-sm font-700">✨ AI tạo JD</h3>
                <p className="mt-1 text-xs text-muted-foreground">Nhập vài ý (kinh nghiệm, kỹ năng chính, điểm cần nhấn mạnh) — AI sinh mô tả, yêu cầu, quyền lợi và nhãn kỹ năng để bạn chỉnh trước khi lưu.</p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={generateJd} disabled={aiBusy} className="gap-2">
                {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} AI tạo JD
              </Button>
            </div>
            <Textarea rows={2} className="mt-2 text-sm" value={jdHints} onChange={(e) => setJdHints(e.target.value)} placeholder="VD: 2 năm Node.js, làm sản phẩm fintech, cần giao tiếp tốt với Product..." />
            {aiError && <p className="mt-1 text-xs text-rose-700">{aiError}</p>}
          </div>

          <div className="sm:col-span-2 border-t border-border pt-4">
            <h3 className="font-heading text-sm font-700">Job Simulation áp dụng cho vị trí này</h3>
            <p className="mt-1 text-xs text-muted-foreground">Dùng cho Vòng 2 — gửi trực tiếp cho ứng viên đã qua Vòng 1 trong hồ sơ ứng viên.</p>
            <Select value={form.simulation_id || "none"} onValueChange={(v) => set("simulation_id", v === "none" ? "" : v)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn Job Simulation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chưa gán</SelectItem>
                {sims.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu việc làm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}