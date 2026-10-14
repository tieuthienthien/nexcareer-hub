import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2, Briefcase, Loader2, MapPin } from "lucide-react";
import { companyInitials, companyGradient, formatSalary, employmentTypeLabel } from "@/lib/jobUtils";

export default function SavedJobs() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.SavedJob.filter({}, { sort: "-created_date", limit: 100 });
      setSaved(res.items || []);
    } catch { setSaved([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    try { await base44.entities.SavedJob.delete(id); setSaved((s) => s.filter((x) => x.id !== id)); } catch {}
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-800 tracking-tight">Việc đã lưu</h1>
      <p className="mt-2 text-muted-foreground">Những vị trí bạn đã bookmark để xem lại sau.</p>

      <div className="mt-8 space-y-3">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 font-600">Chưa lưu việc làm nào</h3>
            <p className="mt-1 text-sm text-muted-foreground">Nhấn "Lưu việc" trên trang chi tiết việc làm để lưu lại.</p>
            <Button asChild className="mt-5"><Link to="/viec-lam">Khám phá việc làm</Link></Button>
          </div>
        ) : saved.map((s) => (
          <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
            <Link to={`/viec-lam/${s.job_id}`} className="flex min-w-0 flex-1 items-center gap-4">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${companyGradient(s.company)} text-sm font-700 text-white`}>
                {companyInitials(s.company)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-600 group-hover:text-primary">{s.job_title}</h3>
                <p className="truncate text-sm text-muted-foreground">{s.company}</p>
              </div>
            </Link>
            <button onClick={() => remove(s.id)} className="rounded-lg p-2.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600" aria-label="Bỏ lưu">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}