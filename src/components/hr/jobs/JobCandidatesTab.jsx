import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ChevronRight, Sparkles } from "lucide-react";
import CandidatePanel from "@/components/hr/jobs/CandidatePanel";
import { RMS_OPTIONS, formatDate, matchesKeyword, rmsMeta, rmsStatus } from "@/lib/rms";

function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(-2).map((s) => s[0]).join("").toUpperCase();
}

export default function JobCandidatesTab({ job, onChanged }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [scoring, setScoring] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.entities.Application.filter({ job_id: job.id }, { sort: "-created_date", limit: 200 });
      setApps(res.items || []);
    } catch (e) {
      setError(e.message || "Không tải được danh sách ứng viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [job.id]);

  const scorePending = async () => {
    const pending = apps.filter((a) => !a.cv_match_score && (!a.rms_status || a.rms_status === "new")).slice(0, 5);
    if (!pending.length) return;
    setScoring(true);
    for (const app of pending) {
      try {
        await base44.functions.invoke("screenCv", { application_id: app.id });
      } catch (e) {}
    }
    setScoring(false);
    await load();
  };

  const visible = useMemo(() => {
    const list = apps.filter((a) => {
      const statusOk = status === "all" || rmsStatus(a) === status;
      return statusOk && matchesKeyword(a, keyword);
    });
    if (sort === "score") return [...list].sort((a, b) => (b.cv_match_score || 0) - (a.cv_match_score || 0));
    if (sort === "oldest") return [...list].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    return list;
  }, [apps, keyword, status, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm theo tên, email, kỹ năng..." className="h-10 border-0 bg-muted/40 pl-9 shadow-none" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{RMS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-10 sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nộp trước</SelectItem>
            <SelectItem value="oldest">Cũ nhất trước</SelectItem>
            <SelectItem value="score">Điểm khớp cao nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <span className="text-xs font-600 text-muted-foreground">{visible.length} hồ sơ ứng tuyển vào vị trí này</span>
          <button onClick={scorePending} disabled={scoring} className="inline-flex items-center gap-1.5 text-xs font-600 text-primary hover:underline disabled:opacity-50">
            {scoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Chấm AI cho hồ sơ mới
          </button>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : error ? (
          <p className="px-4 py-10 text-center text-sm text-rose-700">{error}</p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">Chưa có ứng viên nào phù hợp bộ lọc.</p>
        ) : (
          <div className="divide-y divide-border/60">
            <div className="hidden grid-cols-[2.2fr_1fr_0.9fr_0.9fr_auto] gap-3 bg-muted/30 px-4 py-2 text-[11px] font-700 uppercase tracking-wide text-muted-foreground lg:grid">
              <span>Ứng viên</span><span>Ngày nộp</span><span>Điểm khớp JD</span><span>Trạng thái</span><span />
            </div>
            {visible.map((app) => {
              const meta = rmsMeta(app);
              return (
                <button key={app.id} onClick={() => setSelected(app)} className="grid w-full grid-cols-1 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30 lg:grid-cols-[2.2fr_1fr_0.9fr_0.9fr_auto] lg:gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-700 text-primary">{initials(app.full_name)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-600">{app.full_name || "Chưa có tên"}</div>
                      <div className="truncate text-xs text-muted-foreground">{app.email}</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(app.created_date)}</span>
                  <span className="text-xs font-600">{app.cv_match_score != null ? `${app.cv_match_score}/100` : "—"}</span>
                  <Badge className={`w-fit rounded-full border-0 ${meta.color}`}>{meta.label}</Badge>
                  <ChevronRight className="hidden h-4 w-4 text-muted-foreground lg:block" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CandidatePanel
        applicationId={selected?.id}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        onChanged={() => { load(); onChanged?.(); }}
      />
    </div>
  );
}