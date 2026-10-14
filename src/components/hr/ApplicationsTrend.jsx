import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loader2 } from "lucide-react";

function fmt(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getFullYear()}`;
}

export default function ApplicationsTrend() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Application.aggregate({
          dateBucket: { field: "created_date", unit: "month" },
        });
        const rows = (res.rows || [])
          .map((r) => ({ name: fmt(r.date_bucket || r._id), count: r.count || 0 }))
          .sort((a, b) => 0);
        setData(rows);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-heading text-lg font-700">Xu hướng ứng viên</h2>
      <p className="mt-1 text-sm text-muted-foreground">Số hồ sơ nộp theo tháng</p>
      <div className="mt-5 h-64">
        {loading ? (
          <div className="grid h-full place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Chưa có dữ liệu.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(244 76% 60%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(244 76% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 13% 91%)", fontSize: 13 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(244 76% 60%)" strokeWidth={2} fill="url(#appGrad)" name="Hồ sơ" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}