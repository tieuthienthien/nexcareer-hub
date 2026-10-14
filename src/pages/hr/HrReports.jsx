import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BarChart3, TrendingUp, Users } from "lucide-react";
import FunnelChart from "@/components/hr/FunnelChart";
import ApplicationsTrend from "@/components/hr/ApplicationsTrend";
import { applicationStatusLabel } from "@/lib/jobUtils";

export default function HrReports() {
  const [byStatus, setByStatus] = useState({});
  const [total, setTotal] = useState(0);
  const [byJob, setByJob] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statusRes, jobRes] = await Promise.all([
          base44.entities.Application.aggregate({ groupBy: "status", count: true }),
          base44.entities.Application.aggregate({ groupBy: "job_title", count: true, sort: "-count", limit: 8 }),
        ]);
        const map = {};
        let t = 0;
        (statusRes.rows || []).forEach((r) => { map[r.status] = r.count || 0; t += r.count || 0; });
        setByStatus(map); setTotal(t);
        setByJob((jobRes.rows || []).filter((r) => r.job_title));
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-700 flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Báo cáo tuyển dụng</h1>
        <p className="mt-1 text-sm text-muted-foreground">Phễu, xu hướng và phân bổ hồ sơ theo trạng thái.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelChart byStatus={byStatus} total={total} />
        <ApplicationsTrend />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-700 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Phân bổ theo trạng thái</h2>
          <div className="mt-4 space-y-2.5">
            {Object.entries(byStatus).length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([st, c]) => (
              <div key={st} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{applicationStatusLabel[st] || st}</span>
                <span className="font-700">{c}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-700 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Top vị trí theo lượt ứng tuyển</h2>
          <div className="mt-4 space-y-2.5">
            {byJob.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : byJob.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-700">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.job_title}</span>
                <span className="font-700">{r.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}