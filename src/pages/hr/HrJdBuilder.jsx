import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Sparkles, Plus } from "lucide-react";
import RubricGroupCard from "@/components/hr/RubricGroupCard";
import JdPreviewPanel from "@/components/hr/JdPreviewPanel";
import { RUBRIC_GROUPS, emptyRubric, rubricWeightTotal } from "@/lib/rubricTags";

const buildRubric = (jobRubric) => {
  const base = emptyRubric();
  if (!jobRubric) return base;
  for (const g of RUBRIC_GROUPS) {
    const items = Array.isArray(jobRubric[g.key]) ? jobRubric[g.key] : [];
    base[g.key] = items.map((i) => ({
      label: i.label,
      band: i.band || "",
      requirement: i.requirement === "preferred" ? "preferred" : "required",
      weight: Number(i.weight) || 1,
    }));
  }
  return base;
};

export default function HrJdBuilder() {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [rubric, setRubric] = useState(emptyRubric());
  const [jd, setJd] = useState({ description: "", requirements: "", benefits: "" });
  const [generatedFor, setGeneratedFor] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customGroup, setCustomGroup] = useState("skills");
  const [newJob, setNewJob] = useState({ title: "", company: "Nexora Technology", location: "" });

  const selectedJob = useMemo(() => jobs.find((j) => j.id === jobId) || null, [jobs, jobId]);
  const rubricKey = JSON.stringify(rubric);
  const dirty = !!jobId && rubricKey !== generatedFor;

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Job.filter({}, { sort: "-created_date", limit: 100 });
      const items = res.items || [];
      setJobs(items);
      if (items.length) setJobId((prev) => prev || items[0].id);
    } catch (e) {
      setError(e.message || "Không tải được danh sách vị trí.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  useEffect(() => {
    if (!selectedJob) return;
    const nextRubric = buildRubric(selectedJob.rubric);
    setRubric(nextRubric);
    setGeneratedFor(JSON.stringify(nextRubric));
    const gen = selectedJob.jd_generated || {};
    setJd({
      description: gen.description ?? selectedJob.description ?? "",
      requirements: gen.requirements ?? selectedJob.requirements ?? "",
      benefits: gen.benefits ?? selectedJob.benefits ?? "",
    });
    setMessage("");
    setError("");
  }, [selectedJob?.id]);

  const generate = async () => {
    if (!selectedJob) return;
    const total = rubricWeightTotal(rubric);
    if (!total) { setError("Hãy thêm ít nhất một nhãn vào phần thô trước khi tạo JD."); return; }
    setError("");
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateJd", {
        rubric,
        title: selectedJob.title,
        company: selectedJob.company,
        location: selectedJob.location,
      });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setJd({
        description: data.description || "",
        requirements: data.requirements || "",
        benefits: data.benefits || "",
      });
      setGeneratedFor(rubricKey);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "AI chưa tạo được JD.");
    } finally {
      setGenerating(false);
    }
  };

  // Tự cập nhật JD khi phần thô thay đổi (debounce)
  useEffect(() => {
    if (!jobId || rubricKey === generatedFor) return;
    if (!rubricWeightTotal(rubric)) return;
    const timer = setTimeout(() => { generate(); }, 1400);
    return () => clearTimeout(timer);
  }, [rubricKey, generatedFor, jobId]);

  const addTag = (groupKey, tag) => {
    setRubric((prev) => {
      const list = prev[groupKey] || [];
      if (list.some((i) => i.label.toLowerCase() === tag.label.toLowerCase())) return prev;
      return {
        ...prev,
        [groupKey]: [...list, { label: tag.label, band: tag.band || "", requirement: "required", weight: 1 }],
      };
    });
  };

  const removeTag = (groupKey, index) => {
    setRubric((prev) => ({ ...prev, [groupKey]: (prev[groupKey] || []).filter((_, i) => i !== index) }));
  };

  const updateTag = (groupKey, index, patch) => {
    setRubric((prev) => ({
      ...prev,
      [groupKey]: (prev[groupKey] || []).map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    addTag(customGroup, { label });
    setCustomLabel("");
  };

  const save = async () => {
    if (!selectedJob) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await base44.entities.Job.update(selectedJob.id, {
        rubric,
        jd_generated: { ...jd, generated_at: new Date().toISOString() },
        description: jd.description,
        requirements: jd.requirements,
        benefits: jd.benefits,
        skills: (rubric.skills || []).map((s) => s.label),
      });
      setJobs((prev) => prev.map((j) => (j.id === selectedJob.id ? { ...j, rubric, description: jd.description, requirements: jd.requirements, benefits: jd.benefits } : j)));
      setMessage("Đã lưu — phần thô của JD trở thành barem chấm điểm vòng 1 cho vị trí này.");
    } catch (e) {
      setError(e.message || "Không lưu được.");
    } finally {
      setSaving(false);
    }
  };

  const createJob = async () => {
    if (!newJob.title.trim() || !newJob.company.trim() || !newJob.location.trim()) {
      setError("Nhập đủ tên vị trí, công ty và địa điểm.");
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.Job.create({
        ...newJob,
        status: "draft",
        rubric: emptyRubric(),
        exam_group: "lap-trinh",
        exam_question_count: 10,
        exam_duration_min: 60,
      });
      setJobs((prev) => [created, ...prev]);
      setJobId(created.id);
      setNewJob({ title: "", company: "Nexora Technology", location: "" });
      setError("");
    } catch (e) {
      setError(e.message || "Không tạo được vị trí.");
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = rubricWeightTotal(rubric);
  const tagCount = RUBRIC_GROUPS.reduce((s, g) => s + (rubric[g.key] || []).length, 0);

  if (loading) {
    return <div className="mx-auto max-w-md py-20 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" /> Đang tải...</div>;
  }

  if (!jobs.length) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6">
        <h1 className="font-heading text-xl font-700">Tạo JD bằng AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chưa có vị trí nào. Tạo vị trí đầu tiên để bắt đầu.</p>
        <div className="mt-5 space-y-3">
          <div className="space-y-2"><Label>Tên vị trí *</Label><Input value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} placeholder="VD: Lập trình viên Backend" /></div>
          <div className="space-y-2"><Label>Công ty *</Label><Input value={newJob.company} onChange={(e) => setNewJob({ ...newJob, company: e.target.value })} /></div>
          <div className="space-y-2"><Label>Địa điểm *</Label><Input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} placeholder="Hà Nội" /></div>
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Button onClick={createJob} disabled={saving} className="w-full gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tạo vị trí</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-700">Tạo JD bằng AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">Line Manager nhập phần thô → AI viết JD → lưu thành barem chấm điểm vòng 1</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={jobId} onValueChange={setJobId}>
            <SelectTrigger className="h-9 w-[260px]"><SelectValue placeholder="Chọn vị trí" /></SelectTrigger>
            <SelectContent>
              {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu barem
          </Button>
        </div>
      </div>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-600">Phần thô của JD</span>
              <span className="text-xs text-muted-foreground">{tagCount} nhãn · tổng trọng số {totalWeight}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select value={customGroup} onValueChange={setCustomGroup}>
                <SelectTrigger className="h-9 w-[170px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{RUBRIC_GROUPS.map((g) => <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()} placeholder="Thêm nhãn tự do..." className="h-9 flex-1" />
              <Button size="sm" variant="outline" onClick={addCustom} className="gap-1"><Plus className="h-3.5 w-3.5" /> Thêm</Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Kéo nhãn từ thư viện vào từng nhóm, hoặc bấm để thêm nhanh. Mỗi nhãn có mức bắt buộc và trọng số điểm.</p>
          </div>

          {RUBRIC_GROUPS.map((g) => (
            <RubricGroupCard
              key={g.key}
              group={g}
              items={rubric[g.key] || []}
              onAdd={(tag) => addTag(g.key, tag)}
              onRemove={(index) => removeTag(g.key, index)}
              onUpdate={(index, patch) => updateTag(g.key, index, patch)}
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <JdPreviewPanel
            jd={jd}
            loading={generating}
            dirty={dirty}
            onChange={(patch) => setJd((prev) => ({ ...prev, ...patch }))}
            onRegenerate={generate}
          />
          <div className="mt-3 rounded-2xl border border-border bg-primary/5 p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-600 text-primary"><Sparkles className="h-3.5 w-3.5" /> Cách AI chấm vòng 1</div>
            <p className="mt-1.5">Mỗi nhãn bắt buộc/ưu tiên đã có trọng số. AI trích nhãn từ CV, đối chiếu barem và tính điểm theo trọng số (thang 100). HR vẫn là người quyết định Đậu/Rớt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}