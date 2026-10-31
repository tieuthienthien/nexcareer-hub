import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import JobFormDialog from "@/components/hr/JobFormDialog";
import { formatSalary, employmentTypeLabel } from "@/lib/jobUtils";
import { replaceWithNexoraJobs, NEXORA_JOBS } from "@/lib/nexoraJobs";

export default function HrJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const seedNexora = async () => {
    const ok = confirm(
      `Nạp ${NEXORA_JOBS.length} việc làm chuẩn của Nexora (theo 6 mục chuyên môn)?\n\n` +
      "TẤT CẢ việc làm khác (kể cả bản nháp và đã đóng) sẽ bị XÓA vĩnh viễn, không khôi phục được."
    );
    if (!ok) return;
    setSeeding(true);
    try {
      const r = await replaceWithNexoraJobs(base44);
      alert(`Xong: tạo mới ${r.created}, cập nhật ${r.updated}, đã xóa ${r.removed} việc làm cũ.`);
      await load();
    } catch (e) {
      alert(e.message || "Không thể nạp việc làm.");
    }
    setSeeding(false);
  };

  const load = async () => {
    setLoading(true);
    try {
      const query = {};
      if (status !== "all") query.status = status;
      if (q.trim()) query.title = { $regex: q.trim(), $options: "i" };
      const res = await base44.entities.Job.filter(query, { sort: "-created_date", limit: 100 });
      setJobs(res.items || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [status, q]);

  const remove = async (job) => {
    if (!confirm(`Xóa việc làm "${job.title}"?`)) return;
    setDeleting(job.id);
    try {
      await base44.entities.Job.delete(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (e) { alert(e.message || "Không thể xóa."); }
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-700">Quản lý việc làm</h1>
          <p className="mt-1 text-sm text-muted-foreground">Đăng và quản lý các vị trí tuyển dụng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={seedNexora} disabled={seeding} variant="outline" className="gap-2">
            {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Nạp 6 việc Nexora
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Tạo việc làm</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm việc làm..." className="h-10 border-0 bg-muted/40 pl-9 shadow-none" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="published">Đang tuyển</SelectItem>
            <SelectItem value="draft">Bản nháp</SelectItem>
            <SelectItem value="closed">Đã đóng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chưa có việc làm nào. Nhấn "Đăng việc làm" để bắt đầu.</div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="flex items-center gap-4 border-b border-border/60 p-4 last:border-0 hover:bg-muted/30">
              <Link to={`/hr-studio/jobs/${job.id}`} className="min-w-0 flex-1 group">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-600 group-hover:text-primary">{job.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-600 ${job.status === "published" ? "bg-emerald-100 text-emerald-700" : job.status === "draft" ? "bg-muted text-muted-foreground" : "bg-rose-100 text-rose-700"}`}>
                    {job.status === "published" ? "Đang tuyển" : job.status === "draft" ? "Nháp" : "Đã đóng"}
                  </span>
                  {job.featured && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-600 text-accent">Nổi bật</span>}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{job.company} · {job.location} · {formatSalary(job)} · {employmentTypeLabel[job.employment_type]}</div>
              </Link>
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="icon"><Link to={`/viec-lam/${job.id}`}><ExternalLink className="h-4 w-4" /></Link></Button>
                <Button variant="ghost" size="icon" onClick={() => { setEditing(job); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(job)} disabled={deleting === job.id}>{deleting === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-rose-500" />}</Button>
              </div>
            </div>
          ))
        )}
      </div>

      <JobFormDialog job={editing} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />
    </div>
  );
}