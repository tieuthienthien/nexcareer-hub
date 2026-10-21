import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Filter, RefreshCw, Sparkles } from "lucide-react";
import { applicationStatusLabel, applicationStatusColor, STATUS_OPTIONS } from "@/lib/jobUtils";
import ApplicationDetailDialog from "@/components/hr/ApplicationDetailDialog";

const SORTS = [
  { value: "newest", label: "Mới nhất" },
  { value: "score_desc", label: "Điểm CV cao → thấp" },
  { value: "score_asc", label: "Điểm CV thấp → cao" },
];

export default function HrApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [scoring, setScoring] = useState("");
  const [scoreProgress, setScoreProgress] = useState({ done: 0, total: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const query = {};
      if (q.trim()) query.full_name = { $regex: q.trim(), $options: "i" };
      if (status !== "all") query.status = status;
      const opts = sort === "score_desc"
        ? { sort: "-cv_match_score", limit: 100 }
        : sort === "score_asc"
        ? { sort: "cv_match_score", limit: 100 }
        : { sort: "-created_date", limit: 100 };
      const res = await base44.entities.Application.filter(query, opts);
      setApps(res.items || []);
    } catch (e) {
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, sort, q]);

  const syncTopcv = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await base44.functions.invoke("syncTopcvApplications", {});
      const data = res.data || res;
      if (data.error) setSyncMsg(data.error);
      else if (data.ready === false) setSyncMsg(data.message || "Nguồn TopCV chưa cung cấp dữ liệu hồ sơ.");
      else {
        setSyncMsg(`Đã nhận ${data.total} hồ sơ · tạo mới ${data.created} · cập nhật ${data.updated}${data.needsReview ? ` · ${data.needsReview} hồ sơ cần rà soát` : ""}`);
        await load();
      }
    } catch (e) {
      setSyncMsg(e.response?.data?.error || e.message || "Không đồng bộ được hồ sơ.");
    } finally {
      setSyncing(false);
    }
  };

  const scorePending = async () => {
    const pending = apps.filter((a) => a.status === "cv_screening").slice(0, 10);
    if (!pending.length) { setSyncMsg("Không có hồ sơ nào đang chờ chấm CV."); return; }
    setScoring("batch");
    setScoreProgress({ done: 0, total: pending.length });
    for (let i = 0; i < pending.length; i += 1) {
      try {
        await base44.functions.invoke("screenCv", { application_id: pending[i].id });
      } catch (e) {}
      setScoreProgress({ done: i + 1, total: pending.length });
    }
    setScoring("");
    setScoreProgress({ done: 0, total: 0 });
    await load();
  };

  const handleUpdated = (updated) => {
    setApps((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setSelected(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-700">Quản lý ứng viên</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vòng 1 chấm CV theo barem · Vòng 2 bài thi online · Đặt lịch phỏng vấn</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={scorePending} disabled={!!scoring} className="gap-2">
            {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {scoring ? `Đang chấm ${scoreProgress.done}/${scoreProgress.total}` : "Chấm AI hàng loạt"}
          </Button>
          <Button variant="outline" size="sm" onClick={syncTopcv} disabled={syncing} className="gap-2">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Đồng bộ từ TopCV
          </Button>
        </div>
      </div>

      {syncMsg && <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{syncMsg}</div>}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên ứng viên..." className="h-10 border-0 bg-muted/40 pl-9 shadow-none" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 lg:w-60 gap-2"><Filter className="h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-10 lg:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>{SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chưa có ứng viên nào.</div>
        ) : (
          apps.map((a) => (
            <button key={a.id} onClick={() => setSelected(a)} className="flex w-full flex-col gap-3 border-b border-border/60 p-4 text-left last:border-0 hover:bg-muted/30 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-700 text-primary">{(a.full_name || "?")[0].toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-600">{a.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.job_title} · {a.company}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-700 text-primary">
                  {a.cv_match_score != null ? `${a.cv_match_score}/100` : "Chưa chấm"}
                </span>
                {a.test_score != null && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-700 text-sky-700">Thi {a.test_score}</span>}
                {a.interview_at && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-600 text-indigo-700">Đã đặt lịch</span>}
                {a.needs_review && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-600 text-amber-700">Cần rà soát</span>}
                <span className="text-xs text-muted-foreground">{new Date(a.created_date).toLocaleDateString("vi-VN")}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-600 ${applicationStatusColor[a.status]}`}>{applicationStatusLabel[a.status]}</span>
              </div>
            </button>
          ))
        )}
      </div>

      <ApplicationDetailDialog
        application={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}