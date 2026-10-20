import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CvJobFormDialog from "@/components/cv/CvJobFormDialog";
import { employmentTypeLabel, companyInitials, companyGradient } from "@/lib/jobUtils";
import { cvSalary } from "@/lib/cvUtils";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";

export default function HrCvJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const query = {};
    if (q.trim()) query.title = { $regex: q.trim(), $options: "i" };
    if (status !== "all") query.status = status;
    const res = await base44.entities.CvJob.filter(query, { sort: "-created_date", limit: 100 });
    setJobs(res.items || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [q, status]);

  const toggleStatus = async (job) => {
    setBusyId(job.id);
    await base44.entities.CvJob.update(job.id, { status: job.status === "published" ? "closed" : "published" });
    await load();
    setBusyId(null);
  };

  const remove = async (job) => {
    if (!window.confirm(`Xoá tin "${job.title}"?`)) return;
    setBusyId(job.id);
    await base44.entities.CvJob.delete(job.id);
    await load();
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-700">Tin trên nền tảng CV</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tin của Nexora Technology tự đồng bộ hồ sơ sang NexCareer Hub</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Đăng tin
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên vị trí..." className="h-10 border-0 bg-muted/40 pl-9 shadow-none" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="published">Đang hiển thị</SelectItem>
            <SelectItem value="closed">Đã đóng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chưa có tin tuyển dụng nào trên nền tảng CV.</div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="flex flex-col gap-3 border-b border-border/60 p-4 last:border-0 sm:flex-row sm:items-center">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${companyGradient(job.company)} text-[11px] font-700 text-white`}>
                {companyInitials(job.company)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-600">{job.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {job.company} · {employmentTypeLabel[job.employment_type]} · {cvSalary(job)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {job.is_nexora && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-600 text-primary">Nexora</span>}
                <button
                  onClick={() => toggleStatus(job)}
                  disabled={busyId === job.id}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-600 ${job.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                >
                  {busyId === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : job.status === "published" ? "Đang hiển thị" : "Đã đóng"}
                </button>
                <Button size="icon" variant="ghost" onClick={() => { setEditing(job); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => remove(job)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <CvJobFormDialog open={open} onOpenChange={setOpen} job={editing} onSaved={load} />
    </div>
  );
}