import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Clock3, Layers } from "lucide-react";
import { employmentTypeLabel, workTypeLabel, experienceLabel, companyInitials, companyGradient } from "@/lib/jobUtils";
import { cvSalary, daysLeft } from "@/lib/cvUtils";

export default function CvJobCard({ job }) {
  const left = daysLeft(job.deadline);
  return (
    <Link
      to={`/cv/viec-lam/${job.id}`}
      className="group relative flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.55)]"
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${companyGradient(job.company)} text-[13px] font-700 text-white`}>
          {companyInitials(job.company)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-heading text-[15px] font-700 leading-snug tracking-tight group-hover:text-primary">{job.title}</h3>
          <div className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> {job.company}
            {job.is_nexora && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-600 text-primary">Nexora</span>}
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.employment_type && <Tag>{employmentTypeLabel[job.employment_type]}</Tag>}
        {job.work_type && <Tag>{workTypeLabel[job.work_type]}</Tag>}
        {job.experience_level && <Tag>{experienceLabel[job.experience_level]}</Tag>}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/70 pt-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Mức lương</div>
          <div className="text-sm font-700 text-primary">{cvSalary(job)}</div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          {left != null && left >= 0 ? (
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> Còn {left} ngày</span>
          ) : (
            <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {job.vacancies || 1} vị trí</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Tag({ children }) {
  return <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-500 text-muted-foreground">{children}</span>;
}