import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, MapPin, Briefcase, Users, Megaphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobCommsTab from "@/components/hr/jobs/JobCommsTab";
import JobCandidatesTab from "@/components/hr/jobs/JobCandidatesTab";
import { formatSalary, employmentTypeLabel } from "@/lib/jobUtils";

export default function HrJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicantCount, setApplicantCount] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await base44.entities.Job.get(id);
        setJob(data);
        const count = await base44.entities.Application.count({ job_id: id });
        setApplicantCount(Number(count) || 0);
      } catch (e) {
        setError(e.message || "Không tải được việc làm.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải việc làm...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{error || "Không tìm thấy việc làm."}</p>
        <Link to="/hr-studio/jobs" className="mt-3 inline-block text-sm font-600 text-primary">← Về danh sách việc làm</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/hr-studio/jobs" className="inline-flex items-center gap-2 text-sm font-500 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Danh sách việc làm
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-xl font-700 sm:text-2xl">{job.title}</h1>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-600 ${job.status === "published" ? "bg-emerald-100 text-emerald-700" : job.status === "draft" ? "bg-muted text-muted-foreground" : "bg-rose-100 text-rose-700"}`}>
                {job.status === "published" ? "Đang tuyển" : job.status === "draft" ? "Nháp" : "Đã đóng"}
              </span>
              {job.featured && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-600 text-accent">Nổi bật</span>}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.company}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
              <span>{formatSalary(job)}</span>
              <span>{employmentTypeLabel[job.employment_type] || job.employment_type}</span>
            </div>
          </div>
          <Link to={`/viec-lam/${job.id}`} className="text-xs font-600 text-primary hover:underline">Xem tin công khai →</Link>
        </div>
      </div>

      <Tabs defaultValue="comms" className="space-y-4">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-2xl border border-border bg-card p-1.5">
          <TabsTrigger value="comms" className="gap-2 rounded-xl px-4 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Megaphone className="h-4 w-4" /> Truyền thông tuyển dụng
          </TabsTrigger>
          <TabsTrigger value="candidates" className="gap-2 rounded-xl px-4 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Users className="h-4 w-4" /> Ứng viên
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-700 text-foreground/70">{applicantCount}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comms"><JobCommsTab job={job} /></TabsContent>
        <TabsContent value="candidates">
          <JobCandidatesTab job={job} onChanged={() => base44.entities.Application.count({ job_id: job.id }).then((n) => setApplicantCount(Number(n) || 0)).catch(() => null)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}