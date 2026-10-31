import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Clock, Wallet, Users, CalendarDays, Building2, CheckCircle2, ArrowLeft, Share2, TrendingUp, Eye } from "lucide-react";
import ApplyDialog from "@/components/job/ApplyDialog";
import { formatSalary, workTypeLabel, employmentTypeLabel, experienceLabel } from "@/lib/jobUtils";
import JobAvatar from "@/components/job/JobAvatar";

function RichText({ content }) {
  if (!content) return null;
  return <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-foreground/80" dangerouslySetInnerHTML={{ __html: content }} />;
}

// Ghi nhận 1 lượt xem cho mỗi phiên trình duyệt (F5 không cộng thêm). Trả về số lượt mới hoặc null.
async function trackView(jobId) {
  try {
    const key = `viewed_job_${jobId}`;
    if (sessionStorage.getItem(key)) return null;
    sessionStorage.setItem(key, "1");
    const res = await base44.functions.invoke("trackJobView", { job_id: jobId });
    const data = res?.data || res;
    return typeof data?.views === "number" ? data.views : null;
  } catch (e) {
    return null;
  }
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const j = await base44.entities.Job.get(id);
        setJob(j);
        trackView(id).then((v) => { if (v != null) setJob((cur) => (cur ? { ...cur, views: v } : cur)); });
        try {
          const res = await base44.entities.Job.filter(
            { status: "published", category: j.category, id: { $ne: id } },
            { sort: "-created_date", limit: 5 }
          );
          setRelated(res.items || []);
        } catch (e) {}
      } catch (e) {
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(`/viec-lam/${id}`)}`);
      return;
    }
    setApplyOpen(true);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-700">Không tìm thấy việc làm</h1>
        <p className="mt-2 text-muted-foreground">Vị trí này có thể đã đóng hoặc không tồn tại.</p>
        <Button asChild className="mt-6"><Link to="/viec-lam">Xem việc làm khác</Link></Button>
      </div>
    );
  }

  const info = [
    { icon: MapPin, label: "Địa điểm", value: job.location },
    { icon: Briefcase, label: "Loại hình", value: employmentTypeLabel[job.employment_type] },
    { icon: Clock, label: "Hình thức", value: workTypeLabel[job.work_type] },
    { icon: Wallet, label: "Mức lương", value: formatSalary(job) },
    { icon: Users, label: "Số lượng", value: `${job.vacancy || 1} người` },
    { icon: Building2, label: "Cấp bậc", value: experienceLabel[job.experience_level] },
    { icon: CalendarDays, label: "Hạn nộp", value: job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "—" },
    { icon: Eye, label: "Lượt xem", value: job.views || 0 },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
        <Link to="/viec-lam"><ArrowLeft className="h-4 w-4" /> Quay lại việc làm</Link>
      </Button>

      {/* Header card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <JobAvatar job={job} className="h-28 w-28 rounded-3xl shadow-lg sm:h-36 sm:w-36" textClassName="text-3xl" />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-800 leading-tight sm:text-3xl">{job.title}</h1>
            <p className="mt-1.5 text-muted-foreground">{job.company}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary">{formatSalary(job)}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-500">{job.location}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-500">{employmentTypeLabel[job.employment_type]}</span>
              {job.work_type !== "onsite" && <span className="rounded-full bg-muted px-3 py-1 text-xs font-500">{workTypeLabel[job.work_type]}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:w-44">
            {applied ? (
              <Button disabled className="gap-2 bg-emerald-600 hover:bg-emerald-600"><CheckCircle2 className="h-4 w-4" /> Đã ứng tuyển</Button>
            ) : (
              <Button size="lg" onClick={handleApply} className="gap-2">{isAuthenticated ? "Ứng tuyển ngay" : "Đăng nhập để ứng tuyển"}</Button>
            )}
            <Button variant="outline" size="sm" className="gap-2"><Share2 className="h-4 w-4" /> Chia sẻ</Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
          {info.map((it) => (
            <div key={it.label} className="flex items-start gap-2.5">
              <it.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{it.label}</div>
                <div className="text-sm font-600">{it.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {job.description && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-700">Mô tả công việc</h2>
              <div className="mt-3"><RichText content={job.description} /></div>
            </section>
          )}
          {job.requirements && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-700">Yêu cầu công việc</h2>
              <div className="mt-3"><RichText content={job.requirements} /></div>
            </section>
          )}
          {job.benefits && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-700">Quyền lợi</h2>
              <div className="mt-3"><RichText content={job.benefits} /></div>
            </section>
          )}
          {job.skills?.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-700">Kỹ năng yêu cầu</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((s) => <span key={s} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-500 text-primary">{s}</span>)}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-600">Thông tin tổng quan</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Công ty</dt><dd className="font-600">{job.company}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Lĩnh vực</dt><dd className="font-600">{job.category || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Cấp bậc</dt><dd className="font-600">{experienceLabel[job.experience_level]}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Hạn nộp</dt><dd className="font-600">{job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "—"}</dd></div>
            </dl>
            {applied ? (
              <Button disabled className="mt-5 w-full gap-2 bg-emerald-600 hover:bg-emerald-600"><CheckCircle2 className="h-4 w-4" /> Đã ứng tuyển</Button>
            ) : (
              <Button className="mt-5 w-full gap-2" onClick={handleApply}>{isAuthenticated ? "Ứng tuyển ngay" : "Đăng nhập để ứng tuyển"}</Button>
            )}
            <p className="mt-3 text-center text-[11px] text-muted-foreground">Ứng tuyển miễn phí & nhanh chóng</p>
          </div>
        </aside>
      </div>

      {/* Suggested jobs - bxh style */}
      {related.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-heading text-xl font-700">Vị trí gợi ý</h2>
              <p className="mt-1 text-sm text-muted-foreground">Có thể bạn cũng quan tâm</p>
            </div>
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
            {related.map((r, i) => (
              <Link key={r.id} to={`/viec-lam/${r.id}`} className="flex items-center gap-4 border-b border-border/60 px-5 py-4 last:border-0 transition-colors hover:bg-muted/40">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-700 ${i < 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                <JobAvatar job={r} className="h-10 w-10 rounded-xl" textClassName="text-xs" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-600">{r.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.company} · {r.location}</div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-700 text-primary">{formatSalary(r)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ApplyDialog job={job} open={applyOpen} onOpenChange={setApplyOpen} onApplied={() => setApplied(true)} />
    </div>
  );
}