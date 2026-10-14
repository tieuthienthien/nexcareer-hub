import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Briefcase, Loader2, Plus, Filter } from "lucide-react";
import ApplicationTimeline from "@/components/candidate/ApplicationTimeline";
import { isFinalStatus } from "@/lib/jobUtils";

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "active", label: "Đang xử lý" },
  { id: "hired", label: "Trúng tuyển" },
  { id: "rejected", label: "Chưa đạt" },
];

export default function ApplicationTracking() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, active: 0, hired: 0, rejected: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Application.filter({}, { sort: "-created_date", limit: 50 });
        const list = res.items || [];
        setApps(list);
        const active = list.filter((a) => !isFinalStatus(a.status)).length;
        const hired = list.filter((a) => a.status === "hired").length;
        const rejected = list.filter((a) => ["cv_rejected", "test_rejected", "rejected"].includes(a.status)).length;
        setStats({ total: list.length, active, hired, rejected });
      } catch { setApps([]); }
      setLoading(false);
    })();
  }, []);

  const visible = apps.filter((a) => {
    if (filter === "all") return true;
    if (filter === "active") return !isFinalStatus(a.status);
    if (filter === "hired") return a.status === "hired";
    if (filter === "rejected") return ["cv_rejected", "test_rejected", "rejected"].includes(a.status);
    return true;
  });

  const statCards = [
    { label: "Tổng hồ sơ", value: stats.total, color: "text-primary" },
    { label: "Đang xử lý", value: stats.active, color: "text-amber-600" },
    { label: "Trúng tuyển", value: stats.hired, color: "text-emerald-600" },
    { label: "Chưa đạt", value: stats.rejected, color: "text-rose-600" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-800 tracking-tight">Theo dõi hồ sơ</h1>
          <p className="mt-2 text-muted-foreground">Tiến trình 3 vòng và quyết định cuối cho từng hồ sơ ứng tuyển.</p>
        </div>
        <Button asChild className="gap-2"><Link to="/viec-lam"><Plus className="h-4 w-4" /> Tìm việc</Link></Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className={`font-heading text-2xl font-800 ${s.color}`}>{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-500 transition-colors ${filter === f.id ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 font-600">Chưa có hồ sơ nào</h3>
            <p className="mt-1 text-sm text-muted-foreground">Bắt đầu ứng tuyển để theo dõi tiến trình tại đây.</p>
            <Button asChild className="mt-5"><Link to="/viec-lam">Khám phá việc làm</Link></Button>
          </div>
        ) : visible.map((a) => <ApplicationTimeline key={a.id} app={a} />)}
      </div>
    </div>
  );
}