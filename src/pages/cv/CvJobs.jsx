import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import CvJobCard from "@/components/cv/CvJobCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { CV_CATEGORIES } from "@/lib/cvUtils";
import { employmentTypeLabel } from "@/lib/jobUtils";

const params = new URLSearchParams(window.location.search);

export default function CvJobs() {
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState(params.get("cat") || "all");
  const [type, setType] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildQuery = () => {
    const query = { status: "published" };
    if (q.trim()) query.title = { $regex: q.trim(), $options: "i" };
    if (cat !== "all") query.category = cat;
    if (type !== "all") query.employment_type = type;
    return query;
  };

  const load = async () => {
    setLoading(true);
    const query = buildQuery();
    const res = await base44.entities.CvJob.filter(query, { sort: "-created_date", limit: 9 });
    setJobs(res.items || []);
    setCursor(res.next_cursor || null);
    setHasMore(!!res.has_more);
    const count = await base44.entities.CvJob.count(query);
    setTotal(count);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [q, cat, type]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const res = await base44.entities.CvJob.filter(buildQuery(), { sort: "-created_date", limit: 9, cursor });
    setJobs((prev) => [...prev, ...(res.items || [])]);
    setCursor(res.next_cursor || null);
    setHasMore(!!res.has_more);
    setLoadingMore(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-heading text-2xl font-800 tracking-tight">Việc làm đang tuyển</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total != null ? `${total} vị trí phù hợp` : "Đang tải danh sách vị trí"}
        </p>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên vị trí..."
            className="h-10 border-0 bg-muted/40 pl-9 shadow-none"
          />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Ngành nghề" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ngành nghề</SelectItem>
            {CV_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Loại hình" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại hình</SelectItem>
            {Object.entries(employmentTypeLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Chưa có vị trí nào khớp với bộ lọc của bạn.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => <CvJobCard key={job.id} job={job} />)}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="gap-2 rounded-full">
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} Xem thêm vị trí
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}