import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Sparkles, Clock, Award, Users, Trash2, Eye, Pencil } from "lucide-react";
import { formatDateTime } from "@/lib/rms";

const emptyForm = { name: "", role_title: "", job_id: "", description: "", duration_min: 60, pass_score: 80, cheat_threshold: 3, status: "active" };
const emptyTask = { id: "", title: "", type: "code", prompt: "", points: 20, starter_code: "" };

export default function HrJobSimulations() {
  const [sims, setSims] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [detail, setDetail] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [tasks, setTasks] = useState([{ ...emptyTask, id: "task1" }]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [res, jobRes] = await Promise.all([
        base44.entities.JobSimulation.list({ sort: "-created_date", limit: 50 }),
        base44.entities.Job.list({ sort: "-created_date", limit: 100 }),
      ]);
      const items = res.items || [];
      setSims(items);
      setJobs(jobRes.items || []);
      try {
        const agg = await base44.entities.SimulationAttempt.aggregate({
          query: { status: "submitted" },
          groupBy: "simulation_id",
          avg: ["score"],
        });
        const map = {};
        (agg.rows || []).forEach((r) => { map[r.simulation_id] = { count: r.count, avg: r.avg_score }; });
        setStats(map);
      } catch (e) {
        setStats({});
      }
    } catch (e) {
      setError(e.message || "Không tải được danh sách Job Simulation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const seedSample = async () => {
    setBusy("seed");
    setError("");
    try {
      const res = await base44.functions.invoke("seedJobSimulation", {});
      if (res.data?.error) throw new Error(res.data.error);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không tạo được bài mẫu.");
    } finally {
      setBusy("");
    }
  };

  const openDetail = async (sim) => {
    setDetail(sim);
    setAttempts([]);
    try {
      const res = await base44.entities.SimulationAttempt.filter({ simulation_id: sim.id, status: "submitted" }, { sort: "-submitted_at", limit: 50 });
      setAttempts(res.items || []);
    } catch (e) {
      setAttempts([]);
    }
  };

  const openEdit = (sim) => {
    setEditingId(sim.id);
    setForm({
      name: sim.name || "",
      role_title: sim.role_title || "",
      job_id: sim.job_id || "",
      description: sim.description || "",
      duration_min: sim.duration_min || 60,
        pass_score: sim.pass_score || 80,
        cheat_threshold: sim.cheat_threshold || 3,
      status: sim.status || "active",
    });
    const list = Array.isArray(sim.tasks) && sim.tasks.length ? sim.tasks : [{ ...emptyTask, id: "task1" }];
    setTasks(list.map((t, i) => ({ ...emptyTask, ...t, id: t.id || `task${i + 1}` })));
    setCreateOpen(true);
  };

  const closeDialog = (open) => {
    setCreateOpen(open);
    if (!open) {
      setEditingId(null);
      setForm(emptyForm);
      setTasks([{ ...emptyTask, id: "task1" }]);
    }
  };

  const saveNew = async () => {
    if (!form.name) { setError("Nhập tên bài mô phỏng."); return; }
    setBusy("create");
    setError("");
    try {
      const payload = {
        ...form,
        duration_min: Number(form.duration_min) || 60,
        pass_score: Number(form.pass_score) || 80,
        cheat_threshold: Math.max(1, Number(form.cheat_threshold) || 3),
        criteria: `Tổng ${tasks.reduce((s, t) => s + (Number(t.points) || 0), 0)} điểm · Đạt từ ${Number(form.pass_score) || 80} điểm`,
        tasks: tasks.filter((t) => t.title).map((t, i) => ({ ...t, id: t.id || `task${i + 1}`, points: Number(t.points) || 10 })),
      };
      if (editingId) await base44.entities.JobSimulation.update(editingId, payload);
      else await base44.entities.JobSimulation.create(payload);
      closeDialog(false);
      await load();
    } catch (e) {
      setError(e.message || "Không lưu được bài mô phỏng.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-700">Job Simulation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bài mô phỏng công việc thật dùng cho Vòng 2 — ứng viên chỉ làm khi được HR mời.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={seedSample} disabled={!!busy} className="gap-2">
            {busy === "seed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Tạo simulation mẫu
          </Button>
          <Button onClick={() => closeDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> Tạo simulation</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">{error}</div>}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : sims.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Chưa có bài mô phỏng nào. Bấm “Tạo simulation mẫu” để bắt đầu với bài Software Engineer hoàn chỉnh.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sims.map((sim) => {
            const stat = stats[sim.id] || {};
            return (
              <div key={sim.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-700">{sim.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{sim.role_title || "Chưa gán vị trí"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-600 ${sim.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {sim.status === "active" ? "Đang dùng" : "Nháp"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{sim.duration_min || 60} phút</span>
                  <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" />Đạt từ {sim.pass_score || 80}</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{stat.count || 0} ứng viên đã làm</span>
                  <span>{stat.avg != null ? `TB ${Math.round(stat.avg * 10) / 10} điểm` : "Chưa có điểm"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openDetail(sim)} className="gap-1.5"><Eye className="h-3.5 w-3.5" /> Xem đề & kết quả</Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(sim)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Sửa kịch bản</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-foreground/80">{detail.description}</div>
              <div>
                <h4 className="text-xs font-700 uppercase tracking-wide text-muted-foreground">Nhiệm vụ</h4>
                <div className="mt-2 space-y-2">
                  {(detail.tasks || []).map((t) => (
                    <div key={t.id} className="rounded-xl border border-border/70 p-3">
                      <div className="flex items-center justify-between text-xs font-700">
                        <span>{t.title}</span>
                        <span className="text-muted-foreground">{t.points} điểm · {t.type}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">{t.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-700 uppercase tracking-wide text-muted-foreground">Kết quả ứng viên</h4>
                {attempts.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">Chưa có ứng viên nào nộp bài.</p>
                ) : (
                  <div className="mt-2 divide-y divide-border/60 rounded-xl border border-border/70">
                    {attempts.map((a) => (
                      <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                        <span className="font-600">{a.candidate_name || a.candidate_email}</span>
                        <span className={a.passed ? "font-700 text-emerald-700" : "font-700 text-amber-700"}>{a.score}/100 · {a.passed ? "Đạt" : "Chưa đạt"}</span>
                        <span className="text-muted-foreground">{formatDateTime(a.submitted_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Chỉnh sửa Job Simulation" : "Tạo Job Simulation"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Tên bài mô phỏng</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Vị trí áp dụng</Label><Input value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Gắn với tin tuyển dụng (dùng để tự chọn bài cho ứng viên)</Label>
              <Select value={form.job_id || "none"} onValueChange={(v) => setForm({ ...form, job_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Chọn vị trí đang tuyển" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không gắn vị trí cụ thể</SelectItem>
                  {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Bối cảnh doanh nghiệp</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Thời lượng (phút)</Label><Input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Ngưỡng đạt</Label><Input type="number" value={form.pass_score} onChange={(e) => setForm({ ...form, pass_score: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ngưỡng cảnh báo gian lận (số sự kiện)</Label>
              <Input type="number" min={1} value={form.cheat_threshold} onChange={(e) => setForm({ ...form, cheat_threshold: e.target.value })} />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Nhiệm vụ</Label>
              <Button size="sm" variant="ghost" onClick={() => setTasks([...tasks, { ...emptyTask, id: `task${tasks.length + 1}` }])} className="gap-1 text-primary">
                <Plus className="h-3.5 w-3.5" /> Thêm nhiệm vụ
              </Button>
            </div>
            {tasks.map((task, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-border/70 p-2.5">
                <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_0.7fr_auto]">
                  <Input className="h-9 text-xs" placeholder="Tên nhiệm vụ" value={task.title} onChange={(e) => setTasks(tasks.map((t, j) => (j === i ? { ...t, title: e.target.value } : t)))} />
                  <Select value={task.type} onValueChange={(v) => setTasks(tasks.map((t, j) => (j === i ? { ...t, type: v } : t)))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">Viết code</SelectItem>
                      <SelectItem value="mcq">Trắc nghiệm</SelectItem>
                      <SelectItem value="writing">Viết văn bản</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="h-9 text-xs" type="number" value={task.points} onChange={(e) => setTasks(tasks.map((t, j) => (j === i ? { ...t, points: e.target.value } : t)))} />
                  <Button size="icon" variant="ghost" onClick={() => setTasks(tasks.filter((_, j) => j !== i))} disabled={tasks.length === 1}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                </div>
                <Textarea rows={2} className="text-xs" placeholder="Đề bài" value={task.prompt} onChange={(e) => setTasks(tasks.map((t, j) => (j === i ? { ...t, prompt: e.target.value } : t)))} />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog(false)}>Hủy</Button>
            <Button onClick={saveNew} disabled={busy === "create"} className="gap-2">{busy === "create" && <Loader2 className="h-4 w-4 animate-spin" />} Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}