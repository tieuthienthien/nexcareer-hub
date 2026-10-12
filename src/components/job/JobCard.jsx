import { Link } from "react-router-dom";
import { MapPin, Briefcase, Clock, ArrowUpRight } from "lucide-react";
import { formatSalary, workTypeLabel, employmentTypeLabel, companyInitials, companyGradient } from "@/lib/jobUtils";

export default function JobCard({ job }) {
  return (
    <Link
      to={`/viec-lam/${job.id}`}
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="flex items-start gap-3.5">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${companyGradient(job.company)} text-sm font-700 text-white shadow-md`}>
          {companyInitials(job.company)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[15px] font-600 leading-snug group-hover:text-primary">
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.company}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" /> {employmentTypeLabel[job.employment_type]}
        </span>
        {job.work_type && job.work_type !== "onsite" && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {workTypeLabel[job.work_type]}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3.5">
        <span className="text-[15px] font-700 text-primary">{formatSalary(job)}</span>
        {job.deadline && (
          <span className="text-xs text-muted-foreground">Hạn: {new Date(job.deadline).toLocaleDateString("vi-VN")}</span>
        )}
      </div>
    </Link>
  );
}