import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Building2, User, ArrowRight, Sparkles, TrendingUp, Users, Briefcase, Award, CheckCircle2, BarChart3, Target, Heart } from "lucide-react";
import JobCard from "@/components/job/JobCard";
import { companyInitials, companyGradient } from "@/lib/jobUtils";

const categories = [
  { name: "Công nghệ thông tin", icon: BarChart3, count: "1.2K+" },
  { name: "Marketing & Truyền thông", icon: Target, count: "560+" },
  { name: "Tài chính - Ngân hàng", icon: Award, count: "480+" },
  { name: "Kinh doanh - Bán hàng", icon: TrendingUp, count: "890+" },
  { name: "Nhân sự", icon: Users, count: "210+" },
  { name: "Thiết kế & Sáng tạo", icon: Heart, count: "340+" },
];

const stats = [
  { value: "12.000+", label: "Việc làm đang tuyển" },
  { value: "850+", label: "Nhà tuyển dụng" },
  { value: "320K+", label: "Ứng viên" },
  { value: "98%", label: "Tỷ lệ hài lòng" },
];

export default function Home() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [featured, setFeatured] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [topEmployers, setTopEmployers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [feat, count, top] = await Promise.all([
          base44.entities.Job.filter({ status: "published" }, { sort: "-created_date", limit: 6 }),
          base44.entities.Job.count({ status: "published" }),
          base44.entities.Job.aggregate({ query: { status: "published" }, groupBy: "company", sort: "-count", limit: 6 }),
        ]);
        setFeatured(feat.items || []);
        setTotalJobs(count || 0);
        setTopEmployers(top.rows || []);
      } catch (e) {
        // ignore — sections degrade gracefully
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (location) params.set("location", location);
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
            <div className="inline-flex items-center gap-2 rounded-full border border-pastel-lavender/40 bg-pastel-lavender/10 px-4 py-1.5 text-xs font-600 text-pastel-lavender">
              <Sparkles className="h-3.5 w-3.5" /> Nền tảng tuyển dụng thế hệ mới
            </div>
            <h1 className="mt-6 font-heading text-4xl font-800 leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Khởi đầu sự nghiệp <span className="text-galaxy">đẳng cấp mới</span> cùng NexCareer
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Hàng ngàn cơ hội việc làm từ các nhà tuyển dụng hàng đầu. Tìm việc nhanh, ứng tuyển dễ, theo dõi hồ sơ minh bạch — tất cả trong một nền tảng.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-4xl">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xl shadow-primary/5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Vị trí, từ khóa, công ty..."
                  className="h-14 border-0 bg-transparent pl-12 text-base shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="relative flex-1 sm:border-l sm:border-border">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Địa điểm..."
                  className="h-14 border-0 bg-transparent pl-12 text-base shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="btn-galaxy h-14 px-8 text-base font-700 sm:w-auto">
                <Search className="mr-2 h-5 w-5" /> Tìm việc
              </Button>
            </div>
          </form>

          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-heading text-2xl font-800 text-primary sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs font-500 text-muted-foreground sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two portals CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pastel-lavender via-primary to-pastel-pink p-8 text-white shadow-xl shadow-pastel-lavender/40 lg:col-span-2">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-600">
                <User className="h-3.5 w-3.5" /> Dành cho ứng viên
              </div>
              <h2 className="mt-5 font-heading text-3xl font-800">Candidate Room</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
                Quản lý hồ sơ cá nhân, tải lên CV & portfolio, theo dõi tình trạng ứng tuyển mọi lúc, mọi nơi.
              </p>
              <Button asChild size="lg" className="btn-galaxy mt-6">
                <Link to="/candidate-room">Khám phá ngay <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-accent/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-600 text-accent">
                <Building2 className="h-3.5 w-3.5" /> Dành cho HR
              </div>
              <h2 className="mt-5 font-heading text-3xl font-800">HR Studio</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Quản lý quy trình tuyển dụng, đăng việc làm, theo dõi ứng viên — tất cả trong một studio.
              </p>
              <Button asChild size="lg" variant="outline" className="btn-galaxy-ghost mt-6 gap-2">
                <Link to="/hr-studio">Khám phá ngay <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-700 sm:text-3xl">Việc làm nổi bật</h2>
            <p className="mt-2 text-sm text-muted-foreground">Những cơ hội tốt nhất đang chờ bạn</p>
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
          <h2 className="text-center font-heading text-2xl font-700 sm:text-3xl">Khám phá theo lĩnh vực</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Tìm việc theo ngành nghề bạn yêu thích</p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.name}
                to={`/viec-lam?category=${encodeURIComponent(c.name)}`}
                className="group flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <c.icon className="h-6 w-6" />
                </div>
                <div className="mt-3 text-xs font-600 leading-tight">{c.name}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{c.count} việc làm</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About / bối cảnh chung */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-600 text-accent">
              Về NexCareer Hub
            </div>
            <h2 className="mt-5 font-heading text-3xl font-800 leading-tight">
              Bối cảnh & tầm nhìn của chúng tôi
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              NexCareer Hub ra đời trong bối cảnh thị trường lao động Việt Nam đang chuyển dịch mạnh mẽ: ứng viên
              ngày càng đề cao trải nghiệm ứng tuyển minh bạch, trong khi nhà tuyển dụng cần công cụ quản lý hồ sơ
              hiệu quả và dữ liệu hóa toàn bộ quy trình.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Chúng tôi xây dựng một nền tảng hai chiều — <span className="font-600 text-foreground">Candidate Room</span> cho
              ứng viên và <span className="font-600 text-foreground">HR Studio</span> cho nhà tuyển dụng — kết nối đúng
              người, đúng việc, đúng thời điểm, với trải nghiệm hiện đại, nhanh chóng và công bằng.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Ứng tuyển minh bạch, theo dõi trạng thái theo thời gian thực",
                "Quản lý tuyển dụng tập trung, dữ liệu hóa toàn bộ quy trình",
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
              { icon: User, title: "Cho ứng viên", desc: "Hồ sơ, CV, portfolio và tình trạng ứng tuyển trong một nơi." },
              { icon: Building2, title: "Cho HR", desc: "Đăng việc, sàng lọc, phỏng vấn và nhận việc liền mạch." },
              { icon: Target, title: "Kết nối đúng người", desc: "Gợi ý việc làm thông minh dựa trên hồ sơ." },
              { icon: Award, title: "Tiêu chuẩn cao", desc: "Nhà tuyển dụng được xác minh, cơ hội chất lượng." },
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

      {/* Top employers ranking */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-heading text-2xl font-700 sm:text-3xl">Top nhà tuyển dụng</h2>
              <p className="mt-2 text-sm text-muted-foreground">Xếp hạng theo số lượng việc làm đang tuyển</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-muted" />)
            ) : topEmployers.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Chưa có dữ liệu nhà tuyển dụng.</div>
            ) : (
              topEmployers.map((row, i) => (
                <div
                  key={row.company}
                  className="flex items-center gap-4 border-b border-border/60 px-5 py-4 last:border-0 transition-colors hover:bg-muted/40"
                >
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-700 ${i < 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${companyGradient(row.company)} text-sm font-700 text-white`}>
                    {companyInitials(row.company)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-600">{row.company}</div>
                    <div className="text-xs text-muted-foreground">Nhà tuyển dụng hàng đầu</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-700 text-primary">{row.count}</div>
                    <div className="text-[11px] text-muted-foreground">việc làm</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground to-primary p-10 text-center text-white sm:p-16">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-heading text-3xl font-800 sm:text-4xl">Sẵn sàng bước tiếp theo?</h2>
            <p className="mt-4 text-white/80">Tham gia NexCareer Hub hôm nay — miễn phí, minh bạch, hiệu quả.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="btn-galaxy">
                <Link to="/register">Tạo hồ sơ ứng viên <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="btn-galaxy-ghost">
                <Link to="/hr-studio">Dành cho nhà tuyển dụng</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}