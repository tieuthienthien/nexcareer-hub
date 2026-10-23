import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import CandidatePanel from "@/components/hr/jobs/CandidatePanel";
import CandidateFilters from "@/components/hr/rms/CandidateFilters";
import CandidateTable from "@/components/hr/rms/CandidateTable";
import CandidateQuickDialog from "@/components/hr/rms/CandidateQuickDialog";
import EmailComposeDialog from "@/components/hr/rms/EmailComposeDialog";
import { matchesKeyword, matchesYears } from "@/lib/rms";

const emptyFilters = { keyword: "", position: "all", status: "all", years: "all", education: "all" };

export default function HrApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(emptyFilters);
  const [positions, setPositions] = useState([]);
  const [educations, setEducations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quick, setQuick] = useState(null);
  const [compose, setCompose] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [scoring, setScoring] = useState("");
  const [scoreProgress, setScoreProgress] = useState({ done: 0, total: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const query = {};
      if (filters.position !== "all") query.job_title = filters.position;
      if (filters.status !== "all") {
        if (filters.status === "new") query.$or = [{ rms_status: "new" }, { rms_status: { $exists: false } }];
        else query.rms_status = filters.status;
      }
      const res = await base44.entities.Application.filter(query, { sort: "-created_date", limit: 300 });
      setApps(res.items || []);
    } catch (e) {
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.position, filters.status]);

  useEffect(() => {
    (async () => {
      try {
        const [pos, edu] = await Promise.all([
          base44.entities.Application.list({ distinct: "job_title" }),
          base44.entities.Application.list({ distinct: "education_level" }),
        ]);
        setPositions((pos.items || []).filter(Boolean));
        setEducations((edu.items || []).filter(Boolean));
      } catch (e) {}
    })();
  }, []);

  const visible = useMemo(
    () =>
      apps.filter(
        (a) =>
          matchesKeyword(a, filters.keyword) &&
          matchesYears(a, filters.years) &&
          (filters.education === "all" || a.education_level === filters.education)
      ),
    [apps, filters.keyword, filters.years, filters.education]
  );

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
    const pending = visible.filter((a) => !a.rms_status || a.rms_status === "new").slice(0, 10);
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-700">Quản lý hồ sơ ứng viên</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bảng dữ liệu đầy đủ · lọc theo vị trí, kỹ năng, kinh nghiệm, bằng cấp và trạng thái.</p>
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

      <CandidateFilters
        filters={filters}
        onChange={setFilters}
        positions={positions}
        educations={educations}
        onClear={() => setFilters(emptyFilters)}
      />

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <CandidateTable
          apps={visible}
          onViewDetail={(a) => setSelected(a)}
          onCompose={(list) => setCompose(list)}
          onOpenPipeline={(a) => setSelected(a)}
          onEdit={(a) => setQuick({ app: a, mode: "edit" })}
          onNote={(a) => setQuick({ app: a, mode: "note" })}
        />
      )}

      <CandidatePanel
        applicationId={selected?.id}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChanged={load}
      />

      <CandidateQuickDialog
        app={quick?.app}
        mode={quick?.mode || "edit"}
        open={!!quick}
        onOpenChange={(v) => !v && setQuick(null)}
        onSaved={() => load()}
      />

      <EmailComposeDialog
        open={!!compose}
        onOpenChange={(v) => !v && setCompose(null)}
        apps={compose || []}
        mode="interview"
        onSent={({ warnings }) => {
          setSyncMsg(warnings?.length ? `Đã duyệt CV. Lưu ý: ${warnings.join(" ")}` : "Đã duyệt CV và gửi mail mời phỏng vấn.");
          load();
        }}
      />
    </div>
  );
}