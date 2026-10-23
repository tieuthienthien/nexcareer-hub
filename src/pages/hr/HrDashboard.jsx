import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, FileText, TrendingUp, ArrowRight, ClipboardList, UserCheck, CalendarCheck, Award } from "lucide-react";
import { applicationStatusLabel, applicationStatusColor } from "@/lib/jobUtils";
import FunnelChart from "@/components/hr/FunnelChart";
import ApplicationsTrend from "@/components/hr/ApplicationsTrend";
import RmsKpis from "@/components/hr/rms/RmsKpis";
import { RMS_STATUS, legacyStage } from "@/lib/rms";

const pipeline = [
  { icon: ClipboardList, title: "Nhận hồ sơ", desc: "Ứng viên nộp CV qua hệ thống, hồ sơ tự lưu vào kho ứng viên." },
  { icon: FileText, title: "AI sàng lọc & HR duyệt", desc: "AI chấm CV theo barem JD, HR duyệt và gửi lời mời Vòng 2." },
  { icon: UserCheck, title: "Job Simulation", desc: "Ứng viên làm bài mô phỏng công việc thật, AI chấm điểm và gửi báo cáo." },
  { icon: CalendarCheck, title: "Line Manager duyệt & phỏng vấn", desc: "Line Manager xem hồ sơ, chấp thuận lịch và đánh giá ứng viên." },
  { icon: Award, title: "Kết quả Pass / Fail", desc: "HR chốt kết quả cuối và gửi thông báo cho ứng viên." },
];

export default function HrDashboard() {
  const [stats, setStats] = useState({ jobs: 0, apps: 0, byStatus: {} });
  const [recent, setRecent] = useState([]);
  const rmsCounts = useMemo(() => {
    const out = {};
    Object.entries(stats.byStatus || {}).forEach(([status, count]) => {
      const key = legacyStage({ status });
      out[key] = (out[key] || 0) + count;
    });
    return out;
  }, [stats.byStatus]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [jobsCount, appsCount, agg, rec] = await Promise.all([
          base44.entities.Job.count({ status: "published" }),
          base44.entities.Application.count({}),
          base44.entities.Application.aggregate({ query: {}, groupBy: "status" }),
          base44.entities.Application.filter({}, { sort: "-created_date", limit: 6 }),
        ]);
        const byStatus = {};
        (agg.rows || []).forEach((r) => { byStatus[r.status] = r.count; });
        setStats({ jobs: jobsCount || 0, apps: appsCount || 0, byStatus });
        setRecent(rec.items || []);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <RmsKpis />

      {/* Analytics: funnel + trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FunnelChart byStatus={stats.byStatus} total={stats.apps} />
        <ApplicationsTrend />
      </div>

      {/* Recruitment process */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-700">Quy trình tuyển dụng</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Các chặng từ tiếp nhận hồ sơ đến nhận việc</p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {pipeline.map((p, i) => (
            <div key={p.title} className="relative rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><p.icon className="h-5 w-5" /></div>
                <span className="text-xs font-700 text-muted-foreground">{i + 1}</span>
              </div>
              <h3 className="mt-3 text-sm font-600">{p.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent applications + status breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-700">Ứng viên gần đây</h2>
            <Button asChild variant="ghost" size="sm" className="gap-2"><Link to="/hr-studio/applications">Xem tất cả <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          {recent.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">Chưa có ứng viên nào.</div>
          ) : (
            <div className="mt-5 space-y-2">
              {recent.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-700 text-primary">{(a.full_name || "?")[0].toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-600">{a.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.job_title}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-600 ${applicationStatusColor[a.status]}`}>{applicationStatusLabel[a.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-700">Theo trạng thái</h2>
          <div className="mt-5 space-y-3">
            {Object.entries(RMS_STATUS).map(([key, meta]) => {
              const count = rmsCounts[key] || 0;
              const total = stats.apps || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-500">{meta.label}</span>
                    <span className="font-600">{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${key === "fail" ? "bg-rose-400" : key === "pass" ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}