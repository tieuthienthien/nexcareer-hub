import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, ArrowLeft, Briefcase, MapPin, Loader2 } from "lucide-react";
import { companyInitials, companyGradient } from "@/lib/jobUtils";
import JobCard from "@/components/job/JobCard";

export default function Companies() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Job.aggregate({ query: { status: "published" }, groupBy: "company", count: true, sort: "-count" });
        setRows((res.rows || []).filter((r) => r.company));
      } catch { setRows([]); }
      setLoading(false);
    })();
  }, []);

  const openCompany = async (name) => {
    setSelected(name);
    setLoadingJobs(true);
    try {
      const res = await base44.entities.Job.filter({ status: "published", company: name }, { sort: "-created_date", limit: 50 });
      setJobs(res.items || []);
    } catch { setJobs([]); }
    setLoadingJobs(false);
    window.scrollTo({ top: 0 });
  };

  const filtered = rows.filter((r) => r.company?.toLowerCase().includes(q.toLowerCase()));

  if (selected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="mb-5 gap-2">
          <ArrowLeft className="h-4 w-4" /> Tất cả công ty
        </Button>
        <div className="flex items-center gap-4">
          <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${companyGradient(selected)} text-xl font-700 text-white shadow-lg`}>
            {companyInitials(selected)}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-800 sm:text-3xl">{selected}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{jobs.length} việc làm đang tuyển</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {loadingJobs ? (
            <div className="col-span-full grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : jobs.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              Công ty này hiện chưa có vị trí tuyển dụng.
            </div>
          ) : jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-800 tracking-tight sm:text-4xl">Công ty tuyển dụng</h1>
        <p className="mt-2 text-muted-foreground">Khám phá các nhà tuyển dụng đang có mặt trên NexCareer Hub</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên công ty..." className="h-11 pl-10" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 font-600">Chưa có công ty nào</h3>
            <p className="mt-1 text-sm text-muted-foreground">Danh sách công ty sẽ xuất hiện khi có việc làm được đăng.</p>
          </div>
        ) : filtered.map((r) => (
          <button key={r.company} onClick={() => openCompany(r.company)} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${companyGradient(r.company)} text-base font-700 text-white shadow-md`}>
              {companyInitials(r.company)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-heading text-base font-600">{r.company}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> {r.count} việc làm
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}