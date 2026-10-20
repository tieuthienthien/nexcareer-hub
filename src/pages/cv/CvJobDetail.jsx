import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import CvApplyDialog from "@/components/cv/CvApplyDialog";
import { cvSalary, daysLeft } from "@/lib/cvUtils";
import { employmentTypeLabel, workTypeLabel, experienceLabel, companyInitials, companyGradient } from "@/lib/jobUtils";
import { ArrowLeft, Building2, CalendarClock, Layers, Send, BadgeCheck, Loader2 } from "lucide-react";

export default function CvJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    base44.entities.CvJob.get(id).then(setJob).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">Không tìm thấy tin tuyển dụng này.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/cv/viec-lam">Về danh sách việc làm</Link></Button>
      </div>
    );
  }

  const left = daysLeft(job.deadline);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/cv/viec-lam" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Danh sách việc làm
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${companyGradient(job.company)} text-sm font-700 text-white`}>
                {companyInitials(job.company)}
              </div>
              <div className="min-w-0">
                <h1 className="font-heading text-2xl font-800 leading-snug tracking-tight">{job.title}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {job.company}</span>
                  {job.is_nexora && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-600 text-primary">
                      <BadgeCheck className="h-3 w-3" /> Nexora Technology
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Mức lương" value={cvSalary(job)} highlight />
              <Stat label="Loại hình" value={employmentTypeLabel[job.employment_type] || "—"} />
              <Stat label="Hình thức" value={workTypeLabel[job.work_type] || "—"} />
              <Stat label="Cấp độ" value={experienceLabel[job.experience_level] || "—"} />
            </div>
          </div>

          <Block title="Mô tả công việc" content={job.description} />
          <Block title="Yêu cầu ứng viên" content={job.requirements} />
          <Block title="Quyền lợi" content={job.benefits} />

          {(job.skills || []).length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-heading text-base font-700">Kỹ năng cần có</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-full bg-muted px-3 py-1 text-xs font-500 text-muted-foreground">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Ứng tuyển</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Dùng CV đã lưu trên nền tảng để nộp hồ sơ, không cần tải file.
            </p>
            <Button onClick={() => setOpen(true)} className="mt-4 w-full gap-2 rounded-full">
              <Send className="h-4 w-4" /> Ứng tuyển ngay
            </Button>

            <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Hạn nộp</span>
                <span className="font-500">{job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "Không giới hạn"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground inline-flex items-center gap-1.5"><Layers className="h-4 w-4" /> Số lượng</span>
                <span className="font-500">{job.vacancies || 1} vị trí</span>
              </div>
              {left != null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Còn lại</span>
                  <span className={left >= 0 ? "font-500 text-primary" : "font-500 text-destructive"}>
                    {left >= 0 ? `${left} ngày` : "Đã hết hạn"}
                  </span>
                </div>
              )}
            </div>

            {job.is_nexora && (
              <p className="mt-4 rounded-xl bg-primary/5 p-3 text-[11px] leading-relaxed text-primary">
                Hồ sơ nộp vào vị trí này được đồng bộ tự động sang NexCareer Hub để HR Nexora Technology xử lý theo quy trình 3 vòng.
              </p>
            )}
          </div>
        </aside>
      </div>

      <CvApplyDialog job={job} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-700 ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function Block({ title, content }) {
  if (!content) return null;
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="font-heading text-base font-700">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{content}</p>
    </div>
  );
}