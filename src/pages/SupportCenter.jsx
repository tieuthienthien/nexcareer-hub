import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  LifeBuoy, BookOpen, HelpCircle, MessageSquarePlus, Search, Sparkles, Send,
  UserPlus, FileText, Briefcase, ClipboardList, Layers, Building2, ArrowRight, Loader2, CheckCircle2, Star,
} from "lucide-react";
import StarRating from "@/components/support/StarRating";

const GUIDES = [
  {
    icon: UserPlus, title: "Bắt đầu & tài khoản", desc: "Đăng ký, đăng nhập bằng Google và thiết lập tài khoản ứng viên/HR.", link: "/login", cta: "Đăng nhập / Đăng ký",
  },
  {
    icon: FileText, title: "Hồ sơ & CV", desc: "Cập nhật thông tin cá nhân, tải CV (PDF/Word) và portfolio trong Candidate Room.", link: "/candidate-room", cta: "Mở Candidate Room",
  },
  {
    icon: Briefcase, title: "Tìm việc & ứng tuyển", desc: "Tìm việc theo từ khóa, lọc theo loại hình/lĩnh vực và nộp hồ sơ nhanh.", link: "/viec-lam", cta: "Xem việc làm",
  },
  {
    icon: ClipboardList, title: "Theo dõi hồ sơ ứng tuyển", desc: "Xem tiến trình 3 vòng và quyết định cuối ngay trong Candidate Room.", link: "/candidate-room", cta: "Theo dõi ứng tuyển",
  },
  {
    icon: Layers, title: "3 vòng tuyển dụng", desc: "Sàng lọc CV bằng AI → Bài thi kỹ thuật/tình huống → Phỏng vấn video AI. HR quyết định cuối.", link: "/ho-tro", cta: "Xem hướng nghiệp",
  },
  {
    icon: Building2, title: "HR Studio (nhà tuyển dụng)", desc: "Đăng tin tuyển dụng, quản lý ứng viên qua 3 vòng và duyệt kết quả.", link: "/hr-studio", cta: "Mở HR Studio",
  },
];

const ROUNDS = [
  { n: 1, title: "Sàng lọc CV bằng AI", desc: "AI phân tích ngữ nghĩa CV so với yêu cầu vị trí, cho điểm phù hợp và nhận xét. HR xem và quyết định." },
  { n: 2, title: "Bài thi kỹ thuật / tình huống", desc: "Làm bài trong phòng thi giới hạn thời gian. Bài nộp được AI + HR chấm." },
  { n: 3, title: "Phỏng vấn video AI", desc: "Trả lời từng câu hỏi bằng video. AI phân tích nội dung trả lời, hội đồng đưa ra quyết định cuối." },
];

const FEEDBACK_CATEGORIES = [
  { value: "suggestion", label: "Góp ý cải tiến" },
  { value: "bug", label: "Báo lỗi" },
  { value: "usability", label: "Vấn đề sử dụng" },
  { value: "other", label: "Khác" },
];

const askStarbuddy = (q) => {
  window.dispatchEvent(new CustomEvent("starbuddy:open", { detail: { q } }));
};

export default function SupportCenter() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-600 text-primary">
          <LifeBuoy className="h-3.5 w-3.5" /> Trung tâm hỗ trợ
        </div>
        <h1 className="mt-4 font-heading text-3xl font-800 tracking-tight sm:text-4xl">Chúng tôi luôn sẵn sàng đồng hành</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Hướng dẫn sử dụng, câu hỏi thường gặp và gửi đánh giá/góp ý về NexCareer Hub.</p>
      </div>

      <Tabs defaultValue="guides" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guides" className="gap-2"><BookOpen className="h-4 w-4" /> Hướng dẫn</TabsTrigger>
          <TabsTrigger value="faq" className="gap-2"><HelpCircle className="h-4 w-4" /> Câu hỏi thường gặp</TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2"><MessageSquarePlus className="h-4 w-4" /> Đánh giá & Góp ý</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="mt-6"><GuidesSection /></TabsContent>
        <TabsContent value="faq" className="mt-6"><FaqSection /></TabsContent>
        <TabsContent value="feedback" className="mt-6"><FeedbackSection /></TabsContent>
      </Tabs>
    </div>
  );
}

function GuidesSection() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading text-xl font-700">Hướng dẫn sử dụng</h2>
        <p className="mt-1 text-sm text-muted-foreground">Mỗi hướng dẫn liên kết tới trang tương ứng trong NexCareer Hub.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <Link key={g.title} to={g.link} className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><g.icon className="h-6 w-6" /></div>
              <h3 className="mt-4 font-600">{g.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{g.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-600 text-primary group-hover:gap-2">{g.cta} <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-heading text-xl font-700">Quy trình 3 vòng tuyển dụng</h2>
        <ol className="mt-5 space-y-4">
          {ROUNDS.map((r) => (
            <li key={r.n} className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-700 text-white">{r.n}</div>
              <div>
                <h3 className="font-600">{r.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{r.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-muted-foreground">Ứng viên theo dõi toàn bộ tiến trình trong <Link to="/candidate-room" className="font-600 text-primary hover:underline">Candidate Room</Link>.</p>
      </section>
    </div>
  );
}

function FaqSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.ChatbotKnowledge.filter({ active: true }, { limit: 500, sort: "-created_date" });
        setItems(res.items || []);
      } catch { setItems([]); }
      setLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const filtered = items.filter((k) => {
      if (!q.trim()) return true;
      const t = q.toLowerCase();
      return (k.question || "").toLowerCase().includes(t)
        || (k.answer || "").toLowerCase().includes(t)
        || (k.keywords || []).some((w) => (w || "").toLowerCase().includes(t));
    });
    const map = {};
    filtered.forEach((k) => {
      const c = k.category || "Khác";
      (map[c] = map[c] || []).push(k);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm câu hỏi..." className="h-11 pl-10" />
        </div>
        <Button onClick={() => askStarbuddy()} className="gap-2"><Sparkles className="h-4 w-4" /> Hỏi Starbuddy</Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <HelpCircle className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-600">Không tìm thấy câu hỏi phù hợp</h3>
          <p className="mt-1 text-sm text-muted-foreground">Hãy hỏi Starbuddy để được hỗ trợ trực tiếp.</p>
          <Button onClick={() => askStarbuddy()} className="mt-5 gap-2"><Sparkles className="h-4 w-4" /> Mở Starbuddy</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([cat, list]) => (
            <section key={cat} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h3 className="font-heading text-lg font-700">{cat}</h3>
              <Accordion type="single" collapsible className="mt-4">
                {list.map((k, i) => (
                  <AccordionItem key={k.id || i} value={`${cat}-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-600 hover:no-underline">{k.question}</AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {k.answer}
                      <button onClick={() => askStarbuddy(k.question)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-600 text-primary hover:underline">
                        <Sparkles className="h-3.5 w-3.5" /> Hỏi Starbuddy thêm
                      </button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground">Câu hỏi được lấy từ kho kiến thức Starbuddy — không lưu trùng dữ liệu.</p>
    </div>
  );
}

function FeedbackSection() {
  const { user } = useAuth();
  const [overall, setOverall] = useState(0);
  const [ease, setEase] = useState(0);
  const [iface, setIface] = useState(0);
  const [perf, setPerf] = useState(0);
  const [supp, setSupp] = useState(0);
  const [category, setCategory] = useState("suggestion");
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    setDisplayName(user?.full_name || "");
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Feedback.filter({ is_featured: true }, { sort: "-created_date", limit: 12 });
        setReviews(res.items || []);
      } catch { setReviews([]); }
      setLoadingReviews(false);
    })();
  }, []);

  const submit = async () => {
    setError("");
    if (overall < 1 || overall > 5) { setError("Vui lòng chọn đánh giá tổng quan (1–5 sao)."); return; }
    if (comment.length > 1000) { setError("Nội dung góp ý quá dài (tối đa 1000 ký tự)."); return; }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitFeedback", {
        overall_rating: overall,
        ease_rating: ease || undefined,
        interface_rating: iface || undefined,
        performance_rating: perf || undefined,
        support_rating: supp || undefined,
        category,
        comment,
        anonymous,
        display_name: anonymous ? displayName : undefined,
        consent_public: consent,
      });
      if (res.data?.ok) { setDone(true); }
      else setError(res.data?.error || "Không thể gửi góp ý.");
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Không thể gửi góp ý.");
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="flex flex-col items-center rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 font-heading text-xl font-700 text-emerald-700">Cảm ơn bạn đã góp ý!</h3>
          <p className="mt-2 text-sm text-emerald-700/80">Phản hồi của bạn đã được ghi nhận. Đội ngũ NexCareer Hub sẽ xem xét.</p>
          <Button variant="outline" className="mt-6" onClick={() => { setDone(false); setOverall(0); setEase(0); setIface(0); setPerf(0); setSupp(0); setComment(""); setConsent(false); }}>Gửi góp ý khác</Button>
        </div>
        <FeaturedReviews reviews={reviews} loading={loadingReviews} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-heading text-xl font-700">Đánh giá trải nghiệm</h2>
        <p className="mt-1 text-sm text-muted-foreground">Đánh giá tổng quan (bắt buộc) và các khía cạnh khác (tùy chọn).</p>

        <div className="mt-6 space-y-5">
          <div>
            <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Đánh giá tổng quan *</Label>
            <div className="mt-2"><StarRating value={overall} onChange={setOverall} size={28} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <RatingField label="Dễ sử dụng" value={ease} onChange={setEase} />
            <RatingField label="Giao diện" value={iface} onChange={setIface} />
            <RatingField label="Hiệu năng" value={perf} onChange={setPerf} />
            <RatingField label="Hỗ trợ" value={supp} onChange={setSupp} />
          </div>
          <div>
            <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Loại góp ý *</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {FEEDBACK_CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)} className={`rounded-full px-3.5 py-1.5 text-sm font-500 transition-colors ${category === c.value ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Nội dung góp ý (tùy chọn)</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Mô tả chi tiết hơn..." className="mt-2" />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{comment.length}/1000</p>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border p-3.5">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 rounded" />
            <span className="text-sm">Gửi ẩn danh {user ? "(không kèm tên tài khoản)" : ""}</span>
          </label>
          {anonymous && (
            <div>
              <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Tên hiển thị (tùy chọn)</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="VD: Ứng viên A" className="mt-2" maxLength={80} />
            </div>
          )}
          <label className="flex items-center gap-3 rounded-xl border border-border p-3.5">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="h-4 w-4 rounded" />
            <span className="text-sm">Tôi đồng ý cho phép hiển thị đánh giá này công khai (nếu HR duyệt).</span>
          </label>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <Button onClick={submit} disabled={submitting || overall === 0} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi góp ý
          </Button>
        </div>
      </div>

      <div>
        <FeaturedReviews reviews={reviews} loading={loadingReviews} />
      </div>
    </div>
  );
}

function RatingField({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-2"><StarRating value={value} onChange={onChange} size={22} /></div>
    </div>
  );
}

function FeaturedReviews({ reviews, loading }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-600"><Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Đánh giá từ cộng đồng</h3>
      {loading ? (
        <div className="mt-4 grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Chưa có đánh giá nào được duyệt hiển thị công khai.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-muted/30 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-600">{r.display_name || "Người dùng"}</span>
                <StarRating value={r.overall_rating} readOnly size={14} />
              </div>
              {r.comment && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}