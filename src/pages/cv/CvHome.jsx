import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CvJobCard from "@/components/cv/CvJobCard";
import { ArrowRight, FileText, Search, LayoutGrid, Send, CheckCircle2, Sparkles } from "lucide-react";
import { CV_CATEGORIES } from "@/lib/cvUtils";

export default function CvHome() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.CvJob.filter({ status: "published" }, { sort: "-created_date", limit: 6 })
      .then((res) => setJobs(res.items || []))
      .finally(() => setLoading(false));
    base44.entities.Company.list({ sort: "name", limit: 8 }).then((res) => setCompanies(res.items || res || []));
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(`/cv/viec-lam?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="cvsite">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/[0.06] via-background to-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-600 uppercase tracking-[0.14em] text-primary">
              <Sparkles className="h-3 w-3" /> Nền tảng CV & việc làm
            </span>
            <h1 className="mt-5 font-heading text-4xl font-800 leading-[1.08] tracking-tight sm:text-5xl">
              Tạo CV chuyên nghiệp,
              <br />
              <span className="text-primary">ứng tuyển trong vài phút.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              Quản lý nhiều phiên bản CV, theo dõi trạng thái hồ sơ và nộp trực tiếp vào Nexora Technology — hồ sơ
              được chuyển thẳng sang quy trình tuyển dụng 3 vòng của NexCareer Hub.
            </p>

            <form onSubmit={search} className="mt-7 flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm vị trí, kỹ năng hoặc công ty..."
                  className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" className="h-11 gap-2 rounded-xl px-6">
                Tìm việc <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild className="gap-2 rounded-full">
                <Link to="/cv/cv/new"><FileText className="h-4 w-4" /> Tạo CV ngay</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 rounded-full bg-card">
                <Link to="/cv/quan-ly-cv"><LayoutGrid className="h-4 w-4" /> CV của tôi</Link>
              </Button>
              <Button asChild variant="ghost" className="gap-2 rounded-full">
                <Link to="/cv/ung-tuyen"><Send className="h-4 w-4" /> Đơn ứng tuyển</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 hidden h-40 w-40 rounded-full bg-primary/10 blur-3xl sm:block" />
            <div className="relative rounded-3xl border border-border bg-card p-2 shadow-[0_30px_60px_-40px_hsl(var(--primary)/0.6)]">
              <div className="rounded-2xl bg-white p-6">
                <div className="flex items-start justify-between border-l-4 border-teal-600 pl-4">
                  <div>
                    <div className="text-lg font-800 tracking-tight text-slate-900">Nguyễn Minh Anh</div>
                    <div className="text-xs text-teal-700">Frontend Developer</div>
                    <div className="mt-1 text-[10px] text-slate-500">minhanh@email.com · 09xx xxx xxx · TP.HCM</div>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-600 text-teal-700">CV</span>
                </div>
                <div className="mt-5 space-y-4">
                  <MockBlock label="Kinh nghiệm" lines={["Frontend Developer — Nexora Technology", "• Tối ưu hiệu năng, giảm 38% thời gian tải"]} />
                  <MockBlock label="Học vấn" lines={["Đại học Bách Khoa TP.HCM — Khoa học máy tính"]} />
                  <div>
                    <div className="text-[9px] font-700 uppercase tracking-[0.18em] text-teal-700">Kỹ năng</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {["ReactJS", "TypeScript", "Tailwind"].map((s) => (
                        <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-700 tracking-tight">Vị trí đang tuyển</h2>
            <p className="mt-1 text-sm text-muted-foreground">Cơ hội từ Nexora Technology và các công ty đối tác.</p>
          </div>
          <Link to="/cv/viec-lam" className="inline-flex items-center gap-1 text-sm font-600 text-primary hover:underline">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {CV_CATEGORIES.map((c) => (
            <Link
              key={c}
              to={`/cv/viec-lam?cat=${encodeURIComponent(c)}`}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-500 text-foreground/75 transition-colors hover:border-primary/40 hover:text-primary"
            >
              {c}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />)
            : jobs.map((job) => <CvJobCard key={job.id} job={job} />)}
        </div>
      </section>

      {companies.length > 0 && (
        <section className="border-y border-border bg-card/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="font-heading text-xl font-700 tracking-tight">Công ty trên nền tảng</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {companies.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-[11px] font-700 text-primary">
                      {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-600">{c.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{c.industry || "Tuyển dụng"}</div>
                    </div>
                  </div>
                  {c.description && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{c.description}</p>}
                  {c.is_nexora && (
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-600 text-primary">
                      <CheckCircle2 className="h-3 w-3" /> Đồng bộ NexCareer Hub
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 rounded-3xl border border-border bg-gradient-to-br from-primary/[0.07] to-background p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="font-heading text-2xl font-800 tracking-tight">Hồ sơ nộp vào Nexora Technology đi đâu?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Khi bạn ứng tuyển một vị trí của Nexora Technology, CV của bạn được đồng bộ sang NexCareer Hub và xuất hiện
              ngay trong danh sách ứng viên của HR — tiếp tục ở vòng sàng lọc hồ sơ, bài thi và phỏng vấn.
            </p>
            <div className="mt-5 space-y-3">
              {[
                "Chọn vị trí của Nexora Technology và nộp bằng CV đã lưu.",
                "Hồ sơ xuất hiện tức thì trong NexCareer Hub của HR.",
                "Theo dõi toàn bộ quy trình 3 vòng ở mục Đơn ứng tuyển.",
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-700 text-primary-foreground">{i + 1}</span>
                  <span className="text-sm text-foreground/80">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Ví dụ luồng đồng bộ</div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
                <span>Nền tảng CV</span><span className="text-xs text-muted-foreground">Ứng tuyển</span>
              </div>
              <div className="grid place-items-center text-muted-foreground"><ArrowRight className="h-4 w-4 rotate-90" /></div>
              <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2.5 text-primary">
                <span className="font-600">NexCareer Hub</span><span className="text-xs">HR sàng lọc</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MockBlock({ label, lines }) {
  return (
    <div>
      <div className="text-[9px] font-700 uppercase tracking-[0.18em] text-teal-700">{label}</div>
      {lines.map((l) => (
        <p key={l} className="mt-1 text-[10px] leading-relaxed text-slate-600">{l}</p>
      ))}
    </div>
  );
}