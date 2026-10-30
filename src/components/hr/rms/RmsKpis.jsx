import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { AlertTriangle, CalendarCheck, CheckCircle2, FileStack, Loader2 } from "lucide-react";

const PERIODS = [
  { value: "day", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
];

function periodStart(period) {
  const now = new Date();
  if (period === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") {
    const day = (now.getDay() + 6) % 7;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    return start;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function weekEnd() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 7);
}

// Cặp màu gradient giống các thanh của "Phễu tuyển dụng" (indigo → violet → fuchsia → pink → rose → emerald)
const BAR_GRADIENTS = [
  ["#6366f1", "#8b5cf6"],
  ["#8b5cf6", "#d946ef"],
  ["#d946ef", "#ec4899"],
  ["#ec4899", "#f43f5e"],
  ["#10b981", "#14b8a6"],
];

export default function RmsKpis() {
  const [period, setPeriod] = useState("month");
  const [position, setPosition] = useState("all");
  const [positions, setPositions] = useState([]);
  const [data, setData] = useState({ total: 0, pending: 0, scheduled: 0, hired: 0, headcount: 0 });
  const [byPosition, setByPosition] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Application.list({ distinct: "job_title" });
        setPositions((res.items || []).filter(Boolean));
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const start = periodStart(period).toISOString();
        const base = position === "all" ? {} : { job_title: position };
        const [total, newCount, legacyCount, scheduled, hired, rolesAgg, chartAgg] = await Promise.all([
          base44.entities.Application.count({ ...base, created_date: { $gte: start } }),
          base44.entities.Application.count({ rms_status: "new" }),
          base44.entities.Application.count({ rms_status: { $exists: false } }),
          base44.entities.Application.count({ interview_at: { $gte: new Date().toISOString(), $lt: weekEnd().toISOString() } }),
          base44.entities.Application.count({ rms_status: "pass" }),
          base44.entities.JobRole.aggregate({ query: { status: "open" }, groupBy: "status", sum: ["headcount"] }).catch(() => ({ rows: [] })),
          base44.entities.Application.aggregate({ query: base, groupBy: "job_title" }).catch(() => ({ rows: [] })),
        ]);
        if (!alive) return;
        const headcount = (rolesAgg.rows || [])[0]?.sum_headcount || 0;
        setData({ total, pending: newCount + legacyCount, scheduled, hired, headcount });
        const rows = (chartAgg.rows || [])
          .map((r) => ({ name: r.job_title || r._id || "Chưa gán vị trí", count: r.count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        setByPosition(rows);
      } catch (e) {
        if (alive) setData({ total: 0, pending: 0, scheduled: 0, hired: 0, headcount: 0 });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [period, position]);

  const fillRate = data.headcount > 0 ? Math.round((data.hired / data.headcount) * 100) : 0;

  const cards = [
    {
      label: "Tổng hồ sơ nhận được",
      value: data.total,
      icon: FileStack,
      tone: "from-indigo-500 to-violet-500",
      sub: PERIODS.find((p) => p.value === period)?.label,
    },
    {
      label: "Hồ sơ chưa xử lý",
      value: data.pending,
      icon: AlertTriangle,
      tone: "from-amber-500 to-orange-500",
      sub: data.pending > 0 ? "Cần HR xử lý ngay" : "Đã xử lý hết",
      alert: data.pending > 0,
    },
    {
      label: "Đã đặt lịch phỏng vấn",
      value: data.scheduled,
      icon: CalendarCheck,
      tone: "from-sky-500 to-blue-500",
      sub: "Trong tuần này",
    },
    {
      label: "Đã tuyển dụng",
      value: data.hired,
      icon: CheckCircle2,
      tone: "from-emerald-500 to-teal-500",
      sub: data.headcount > 0 ? `Lấp đầy ${fillRate}% chỉ tiêu` : "Chưa cấu hình chỉ tiêu vị trí",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-700">Tổng quan tuyển dụng</h2>
          <p className="text-xs text-muted-foreground">Số liệu lấy trực tiếp từ hồ sơ ứng viên</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-600 transition-colors ${period === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger className="h-9 w-52"><SelectValue placeholder="Vị trí" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vị trí</SelectItem>
              {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`relative overflow-hidden rounded-2xl border bg-card p-5 ${c.alert ? "border-amber-300 ring-1 ring-amber-200" : "border-border"}`}
          >
            <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.tone} opacity-15 blur-xl`} />
            <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${c.tone} text-white shadow-md`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className={`mt-4 font-heading text-3xl font-800 ${c.alert ? "text-amber-600" : ""}`}>{loading ? "—" : c.value}</div>
            <div className="mt-0.5 text-xs font-500 text-muted-foreground">{c.label}</div>
            {c.sub && <div className={`mt-1 text-[11px] font-600 ${c.alert ? "text-amber-700" : "text-emerald-600"}`}>{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-700">Số lượng CV theo vị trí</h3>
            <p className="text-xs text-muted-foreground">{position === "all" ? "Toàn bộ vị trí đang có hồ sơ" : position}</p>
          </div>
        </div>
        <div className="mt-4 h-64 w-full">
          {byPosition.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Chưa có dữ liệu hồ sơ.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPosition} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  {BAR_GRADIENTS.map(([from, to], i) => (
                    <linearGradient key={i} id={`cv-bar-${i}`} x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor={from} />
                      <stop offset="100%" stopColor={to} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={54} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  formatter={(v) => [`${v} CV`, "Số lượng"]}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {byPosition.map((_, i) => <Cell key={i} fill={`url(#cv-bar-${i % BAR_GRADIENTS.length})`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}