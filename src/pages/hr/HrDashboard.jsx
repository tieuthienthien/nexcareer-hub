import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, FileText, TrendingUp, ArrowRight, ClipboardList, UserCheck, CalendarCheck, Award } from "lucide-react";
import { applicationStatusLabel, applicationStatusColor } from "@/lib/jobUtils";

const pipeline = [
  { icon: ClipboardList, title: "Tiếp nhận hồ sơ", desc: "Ứng viên nộp CV qua hệ thống, hồ sơ tự động lưu vào kho ứng viên." },
  { icon: FileText, title: "Sàng lọc & xét duyệt", desc: "HR đánh giá CV theo yêu cầu vị trí, phân loại phù hợp / cần xem thêm." },
  { icon: UserCheck, title: "Mời phỏng vấn", desc: "Gửi lời mời phỏng vấn, xếp lịch và chuẩn bị câu hỏi theo vị trí." },
  { icon: CalendarCheck, title: "Phỏng vấn & đánh giá", desc: "Phỏng vấn nhiều vòng, ghi nhận đánh giá và nhận xét cấu trúc." },
  { icon: Award, title: "Đề nghị & nhận việc", desc: "Gửi offer, thương lượng và hoàn tất thủ tục nhận việc." },
];

const statusOrder = ["cv_screening", "test_invited", "test_submitted", "interview_invited", "interview_submitted", "hired", "rejected"];

export default function HrDashboard() {
  const [stats, setStats] = useState({ jobs: 0, apps: 0, byStatus: {} });
  const [recent, setRecent] = useState([]);
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

  const cards = [
    { label: "Việc làm đang tuyển", value: stats.jobs, icon: Briefcase, color: "from-indigo-500 to-violet-500" },
    { label: "Tổng ứng viên", value: stats.apps, icon: Users, color: "from-sky-500 to-blue-500" },
    { label: "Đang phỏng vấn", value: (stats.byStatus.interview_invited || 0) + (stats.byStatus.interview_submitted || 0), icon: UserCheck, color: "from-amber-500 to-orange-500" },
    { label: "Đã nhận việc", value: stats.byStatus.hired || 0, icon: Award, color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
            <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.color} opacity-15 blur-xl`} />
            <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-md`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 font-heading text-3xl font-800">{loading ? "—" : c.value}</div>
            <div className="mt-0.5 text-xs font-500 text-muted-foreground">{c.label}</div>
          </div>
        ))}
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
            {statusOrder.map((s) => {
              const count = stats.byStatus[s] || 0;
              const total = stats.apps || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-500">{applicationStatusLabel[s]}</span>
                    <span className="font-600">{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${s === "rejected" ? "bg-rose-400" : s === "hired" ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
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