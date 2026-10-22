import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X, Briefcase, Loader2, Frown } from "lucide-react";
import JobCard from "@/components/job/JobCard";
import { workTypeLabel, employmentTypeLabel, experienceLabel } from "@/lib/jobUtils";
import { useSiteContent } from "@/components/design/SiteDesignProvider";

const sortOptions = [
  { value: "-created_date", label: "Mới nhất" },
  { value: "created_date", label: "Cũ nhất" },
  { value: "-salary_max", label: "Lương cao nhất" },
];

export default function Jobs() {
  const c = useSiteContent("jobs");
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [workType, setWorkType] = useState("all");
  const [employmentType, setEmploymentType] = useState("all");
  const [experience, setExperience] = useState("all");
  const [sort, setSort] = useState("-created_date");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Job.list({ distinct: "category" });
        setCategories((res.items || []).filter(Boolean));
      } catch (e) {}
    })();
  }, []);

  const buildQuery = useCallback(() => {
    const query = { status: "published" };
    if (q.trim()) query.title = { $regex: q.trim(), $options: "i" };
    if (category !== "all") query.category = category;
    if (workType !== "all") query.work_type = workType;
    if (employmentType !== "all") query.employment_type = employmentType;
    if (experience !== "all") query.experience_level = experience;
    return query;
  }, [q, category, workType, employmentType, experience]);

  const fetchJobs = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    try {
      const res = await base44.entities.Job.filter(buildQuery(), { sort, limit: 12 });
      setJobs(res.items || []);
      setHasMore(!!res.has_more);
    } catch (e) {
      setJobs([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildQuery, sort]);

  useEffect(() => { fetchJobs(true); }, [fetchJobs]);

  const loadMore = async () => {
    if (!hasMore) return;
    setLoadingMore(true);
    try {
      const last = jobs[jobs.length - 1];
      const res = await base44.entities.Job.filter(buildQuery(), { sort, limit: 12, cursor: last?.id });
      setJobs((prev) => [...prev, ...(res.items || [])]);
      setHasMore(!!res.has_more);
    } catch (e) {} finally {
      setLoadingMore(false);
    }
  };

  const resetFilters = () => {
    setQ(""); setCategory("all"); setWorkType("all"); setEmploymentType("all"); setExperience("all");
    setSearchParams({});
  };

  const activeFilters = [category !== "all", workType !== "all", employmentType !== "all", experience !== "all"].filter(Boolean).length;

  const FilterSection = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Lĩnh vực</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-2"><SelectValue placeholder="Tất cả lĩnh vực" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Hình thức làm việc</Label>
        <Select value={workType} onValueChange={setWorkType}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(workTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Loại hình</Label>
        <Select value={employmentType} onValueChange={setEmploymentType}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(employmentTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Cấp bậc</Label>
        <Select value={experience} onValueChange={setExperience}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(experienceLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {activeFilters > 0 && (
        <Button variant="outline" className="w-full gap-2" onClick={resetFilters}>
          <X className="h-4 w-4" /> Xóa bộ lọc ({activeFilters})
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-800 tracking-tight sm:text-4xl">{c.title}</h1>
        <p className="mt-2 text-muted-foreground">{c.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-600">Bộ lọc</h2>
            </div>
            <FilterSection />
          </div>
        </aside>

        <div>
          <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.search_placeholder} className="h-11 border-0 bg-muted/40 pl-10 shadow-none focus-visible:ring-1" />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-11 sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sortOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-11 gap-2 lg:hidden" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal className="h-4 w-4" /> Lọc {activeFilters > 0 && `(${activeFilters})`}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? "Đang tải..." : `${jobs.length} việc làm`}
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)
            ) : jobs.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
                <Frown className="h-12 w-12 text-muted-foreground/40" />
                <h3 className="mt-4 font-600">Không tìm thấy việc làm</h3>
                <p className="mt-1 text-sm text-muted-foreground">Thử thay đổi từ khóa hoặc bộ lọc.</p>
                <Button variant="outline" className="mt-4" onClick={resetFilters}>Xóa bộ lọc</Button>
              </div>
            ) : (
              jobs.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>

          {!loading && hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore} className="gap-2">
                {loadingMore ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang tải...</> : <><Briefcase className="h-4 w-4" /> Xem thêm việc làm</>}
              </Button>
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-80 max-w-[85vw] overflow-y-auto bg-background p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-600">Bộ lọc</h2>
              <Button size="icon" variant="ghost" onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></Button>
            </div>
            <FilterSection />
            <Button className="mt-6 w-full" onClick={() => setShowFilters(false)}>Xem kết quả</Button>
          </div>
        </div>
      )}
    </div>
  );
}