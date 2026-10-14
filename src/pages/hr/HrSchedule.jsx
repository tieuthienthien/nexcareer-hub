import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Video, Clock, ArrowRight, CalendarClock } from "lucide-react";
import { applicationStatusLabel, applicationStatusColor } from "@/lib/jobUtils";

export default function HrSchedule() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Application.filter(
          { status: { $in: ["interview_invited", "interview_submitted"] } },
          { sort: "-created_date", limit: 100 }
        );
        setItems(res.items || []);
      } catch { setItems([]); }
      setLoading(false);
    })();
  }, []);

  const invited = items.filter((a) => a.status === "interview_invited");
  const submitted = items.filter((a) => a.status === "interview_submitted");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-700 flex items-center gap-2"><CalendarClock className="h-6 w-6 text-primary" /> Lịch phỏng vấn</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ứng viên đang ở vòng phỏng vấn AI (Vòng 3).</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-2xl font-800 text-violet-600">{invited.length}</div>
          <div className="text-xs text-muted-foreground">Chờ làm phỏng vấn</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-2xl font-800 text-indigo-600">{submitted.length}</div>
          <div className="text-xs text-muted-foreground">Đã phỏng vấn — chờ đánh giá</div>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Video className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-600">Chưa có ứng viên ở vòng phỏng vấn</h3>
          <p className="mt-1 text-sm text-muted-foreground">Khi ứng viên qua Vòng 2, họ sẽ xuất hiện tại đây.</p>
          <Link to="/hr-studio/applications" className="mt-4 text-sm font-600 text-primary hover:underline">Quản lý ứng viên</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((a) => (
            <Link key={a.id} to="/hr-studio/applications" className="flex items-center gap-4 border-b border-border/60 px-5 py-4 last:border-0 transition-colors hover:bg-muted/40">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-600">
                {a.status === "interview_submitted" ? <Clock className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-600">{a.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">{a.job_title} · {a.company}</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-600 ${applicationStatusColor[a.status]}`}>{applicationStatusLabel[a.status]}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}