import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import GalaxyButton from "@/components/ui/galaxy-button";
import { Input } from "@/components/ui/input";
import { Search, Building2, User, ArrowRight, Sparkles, Users, Briefcase, Award, CheckCircle2, Code2, Target, Heart } from "lucide-react";
import JobCard from "@/components/job/JobCard";
import { useSiteContent } from "@/components/design/SiteDesignProvider";

const categories = [
  { name: "Kỹ thuật phần mềm", icon: Code2 },
  { name: "Thiết kế UI/UX", icon: Heart },
  { name: "Marketing & Truyền thông", icon: Target },
  { name: "Nhân sự", icon: Users },
];

export default function Home() {
  const navigate = useNavigate();
  const c = useSiteContent("home");
  const [keyword, setKeyword] = useState("");
  const [featured, setFeatured] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const safe = async (fn, fallback) => { try { return await fn(); } catch { return fallback; } };
      const feat = await safe(() => base44.entities.Job.filter({ status: "published" }, { sort: "-created_date", limit: 6 }), { items: [] });
      const count = await safe(() => base44.entities.Job.count({ status: "published" }), 0);
      if (!alive) return;
      setFeatured(feat.items || []);
      setTotalJobs(count || 0);
      setLoading(false);
    };
    run();
    return () => { alive = false; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    navigate(`/viec-lam?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-pastel-lavender/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-72 w-[30rem] rounded-full bg-pastel-pink/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            {c.hero_badge && (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-600 text-primary">
                <Sparkles className="h-3.5 w-3.5" /> {c.hero_badge}
              </div>
            )}
            <h1 className="mt-6 font-heading text-4xl font-800 leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              <span className="text-galaxy">{c.hero_title}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {c.hero_subtitle}
            </p>
          </div>

          <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-4xl">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xl shadow-primary/5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={c.search_placeholder}
                  className="h-14 border-0 bg-transparent pl-12 text-base shadow-none focus-visible:ring-0"
                />
              </div>
              <GalaxyButton type="submit" size="lg" className="btn-galaxy h-14 px-8 text-base font-700 sm:w-auto">
                <Search className="mr-2 h-5 w-5" /> {c.search_cta}
              </GalaxyButton>
            </div>
          </form>

          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-4 gap-4">
            {[
              { value: String(totalJobs), label: "Vị trí đang tuyển" },
              { value: "3", label: "Vòng đánh giá" },
              { value: "98%", label: "Tỷ lệ hài lòng" },
              { value: "20.000+", label: "Số lượt tiếp cận" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-heading text-2xl font-800 text-primary sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs font-500 text-muted-foreground sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Chúng tôi làm việc với */}
      <section className="bg-muted/40 py-10">
        <style>{`
          @keyframes tech-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .tech-marquee-track { animation: tech-marquee 30s linear infinite; will-change: transform; }
          .tech-marquee:hover .tech-marquee-track { animation-play-state: paused; }
          .tech-marquee-mask {
            -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
            mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
          }
          @media (prefers-reduced-motion: reduce) {
            .tech-marquee-track { animation: none; }
          }
        `}</style>

        <p className="text-center text-xs font-600 uppercase tracking-[0.25em] text-muted-foreground">
          Chúng tôi làm việc với
        </p>

        <div className="tech-marquee tech-marquee-mask mt-8 overflow-hidden">
          <div className="tech-marquee-track flex w-max items-center">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
                {["Next.js", "Node.js", "Python", "Go", "Swift", "Kotlin", "Flutter", "AWS", "GCP", "Kubernetes"].map((t) => (
                  <span
                    key={`${dup}-${t}`}
                    className="flex items-center gap-10 pr-10 font-heading text-2xl font-700 sm:text-3xl"
                  >
                    <span className="text-galaxy">{t}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-pastel-lavender shadow-[0_0_10px_hsl(266_70%_82%)]" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Two portals CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-accent to-chart-4 p-8 text-white shadow-xl shadow-primary/30 lg:col-span-2">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/25 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-600">
                <User className="h-3.5 w-3.5" /> Dành cho ứng viên
              </div>
              <h2 className="mt-5 font-heading text-3xl font-800">{c.candidate_title}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
                {c.candidate_desc}
              </p>
              <GalaxyButton asChild size="lg" className="btn-galaxy mt-6">
                <Link to="/candidate-room">{c.candidate_cta} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </GalaxyButton>
            </div>
          </div>

          <div className="panel-galaxy group relative overflow-hidden rounded-3xl p-8 transition-all hover:-translate-y-0.5">
            {/* chấm bling galaxy */}
            <div className="pointer-events-none absolute inset-0 starfield opacity-70" />
            <span className="pointer-events-none absolute left-6 top-5 h-2 w-2 animate-twinkle rounded-full bg-pastel-pink shadow-[0_0_10px_hsl(340_70%_80%)]" />
            <span className="pointer-events-none absolute right-10 top-12 h-1.5 w-1.5 animate-twinkle rounded-full bg-pastel-sky shadow-[0_0_10px_hsl(210_70%_80%)]" style={{ animationDelay: "0.8s" }} />
            <span className="pointer-events-none absolute bottom-8 right-7 h-2 w-2 animate-twinkle rounded-full bg-pastel-mint shadow-[0_0_10px_hsl(165_55%_78%)]" style={{ animationDelay: "1.6s" }} />
            <span className="pointer-events-none absolute bottom-16 left-8 h-1.5 w-1.5 animate-twinkle rounded-full bg-pastel-lavender shadow-[0_0_10px_hsl(266_70%_82%)]" style={{ animationDelay: "2.2s" }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-600 text-accent">
                <Building2 className="h-3.5 w-3.5" /> Dành cho HR
              </div>
              <h2 className="mt-5 font-heading text-3xl font-800 text-galaxy">{c.hr_title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                {c.hr_desc}
              </p>
              <GalaxyButton asChild size="lg" variant="outline" className="btn-galaxy-ghost mt-6 gap-2">
                <Link to="/hr-studio">{c.hr_cta} <ArrowRight className="h-4 w-4" /></Link>
              </GalaxyButton>
            </div>
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-700 sm:text-3xl">{c.jobs_title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.jobs_subtitle}</p>
          </div>
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/viec-lam">Xem tất cả <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)
            : featured.map((job) => <JobCard key={job.id} job={job} />)}
          {!loading && featured.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
              <Briefcase className="mx-auto h-10 w-10 opacity-40" />
              <p className="mt-3 text-sm">Chưa có việc làm nào. HR có thể đăng việc trong HR Studio.</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-heading text-2xl font-700 sm:text-3xl">{c.categories_title}</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">{c.categories_subtitle}</p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/viec-lam?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <cat.icon className="h-6 w-6" />
                </div>
                <div className="mt-3 text-xs font-600 leading-tight">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Nexora */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            {c.about_badge && (
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-600 text-accent">
                {c.about_badge}
              </div>
            )}
            <h2 className="mt-5 font-heading text-3xl font-800 leading-tight">
              {c.about_title}
            </h2>
            <p className="mt-5 leading-relaxed text-foreground/80">{c.about_desc}</p>
            <p className="mt-4 leading-relaxed text-foreground/80">{c.about_desc2}</p>
            <ul className="mt-6 space-y-3">
              {[
                "Ứng tuyển minh bạch, theo dõi trạng thái theo thời gian thực",
                "Quy trình 3 vòng: sàng lọc CV, Job Simulation, phỏng vấn Line Manager",
                "Bảo mật thông tin hồ sơ ứng viên được đặt lên hàng đầu",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Award, title: "Chất lượng trên hết", desc: "Mỗi dòng code đều được review. Mỗi release đều được kiểm thử." },
              { icon: Target, title: "Minh bạch tuyệt đối", desc: "Bạn biết mọi thứ chúng tôi đang làm, mọi lúc." },
              { icon: Users, title: "Đối tác dài hạn", desc: "Sản phẩm sống rất lâu sau khi ra mắt. Chúng tôi ở đó cùng bạn." },
              { icon: User, title: "Cho ứng viên", desc: "Hồ sơ, CV, portfolio và tình trạng ứng tuyển trong một nơi." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-600">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground to-primary p-10 text-center text-white sm:p-16">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-heading text-3xl font-800 sm:text-4xl">{c.cta_title}</h2>
            <p className="mt-4 text-white/80">{c.cta_subtitle}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <GalaxyButton asChild size="lg" className="btn-galaxy">
                <Link to="/register">Tạo hồ sơ ứng viên <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </GalaxyButton>
              <GalaxyButton
                asChild
                size="lg"
                variant="outline"
                className="border-white/70 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white shadow-[0_0_22px_hsl(340_70%_80%/0.45)]"
              >
                <Link to="/hr-studio">Dành cho HR Nexora <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </GalaxyButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}