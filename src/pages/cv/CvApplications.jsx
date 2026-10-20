import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { BadgeCheck, FileText, ArrowRight, Send } from "lucide-react";

const statusLabel = {
  submitted: "Đã gửi",
  in_review: "Đang xem xét",
  closed: "Đã kết thúc",
};

const statusStyle = {
  submitted: "bg-primary/10 text-primary",
  in_review: "bg-amber-100 text-amber-700",
  closed: "bg-muted text-muted-foreground",
};

export default function CvApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.CvApplication.filter({}, { sort: "-created_date", limit: 50 })
      .then((res) => setApps(res.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-800 tracking-tight">Đơn ứng tuyển của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi hồ sơ đã gửi và trạng thái đồng bộ sang NexCareer Hub.</p>
        </div>
        <Button asChild variant="outline" className="gap-2 rounded-full">
          <Link to="/cv/viec-lam"><Send className="h-4 w-4" /> Tìm việc</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : apps.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border py-20 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Send className="h-6 w-6" /></div>
          <h2 className="mt-4 font-heading text-lg font-700">Chưa có đơn ứng tuyển</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nộp CV vào một vị trí đang tuyển để bắt đầu.</p>
          <Button asChild className="mt-5 gap-2 rounded-full"><Link to="/cv/viec-lam">Xem việc làm</Link></Button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-heading text-[15px] font-700">{a.job_title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.company} · CV: {a.cv_title} · {new Date(a.created_date).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-600 ${statusStyle[a.status] || statusStyle.submitted}`}>
                  {statusLabel[a.status] || a.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {a.synced ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-600 text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> Đã đồng bộ sang NexCareer Hub
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Hồ sơ gửi tới {a.company}</span>
                )}
                {a.job_id && (
                  <Link to={`/cv/viec-lam/${a.job_id}`} className="ml-auto inline-flex items-center gap-1 text-xs font-600 text-primary hover:underline">
                    Xem tin <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {a.synced && (
                <p className="mt-3 rounded-xl bg-primary/5 p-3 text-[11px] leading-relaxed text-primary">
                  HR Nexora Technology đang xử lý hồ sơ ở vòng sàng lọc. Bạn có thể theo dõi thêm trong Candidate Room của NexCareer Hub.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <FileText className="h-4 w-4" />
        Mẹo: đặt một CV làm mặc định để ứng tuyển nhanh hơn.
        <Link to="/cv/quan-ly-cv" className="ml-auto font-600 text-primary hover:underline">Quản lý CV</Link>
      </div>
    </div>
  );
}