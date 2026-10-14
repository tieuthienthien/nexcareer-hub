import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, Loader2, Filter, CheckCircle2, Clock, CircleDot, Eye, EyeOff } from "lucide-react";
import StarRating from "@/components/support/StarRating";

const STATUS = [
  { value: "new", label: "Mới", icon: CircleDot, color: "bg-sky-100 text-sky-700" },
  { value: "in_progress", label: "Đang xử lý", icon: Clock, color: "bg-amber-100 text-amber-700" },
  { value: "resolved", label: "Đã giải quyết", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
];
const CATEGORIES = {
  suggestion: "Góp ý cải tiến", bug: "Báo lỗi", usability: "Vấn đề sử dụng", other: "Khác",
};

export default function HrFeedback() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Feedback.filter({}, { sort: "-created_date", limit: 200 });
      setItems(res.items || []);
    } catch { setItems([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((f) =>
    (statusFilter === "all" || f.status === statusFilter) &&
    (catFilter === "all" || f.category === catFilter)
  );

  const stats = useMemo(() => {
    const total = items.length;
    const avg = total ? items.reduce((s, f) => s + (f.overall_rating || 0), 0) / total : 0;
    const byStatus = {};
    const byCat = {};
    items.forEach((f) => {
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
      byCat[f.category] = (byCat[f.category] || 0) + 1;
    });
    const featured = items.filter((f) => f.is_featured).length;
    return { total, avg, byStatus, byCat, featured };
  }, [items]);

  const setStatus = async (id, status) => {
    try { await base44.entities.Feedback.update(id, { status }); setItems((s) => s.map((f) => f.id === id ? { ...f, status } : f)); } catch {}
  };
  const toggleFeatured = async (f) => {
    try { await base44.entities.Feedback.update(f.id, { is_featured: !f.is_featured }); setItems((s) => s.map((x) => x.id === f.id ? { ...x, is_featured: !x.is_featured } : x)); } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-700 flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Đánh giá & Góp ý</h1>
        <p className="mt-1 text-sm text-muted-foreground">Xem xét, phân loại và duyệt hiển thị đánh giá công khai. Số liệu từ phản hồi thật.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Tổng phản hồi" value={stats.total} />
        <StatCard label="Điểm TB" value={stats.total ? `${stats.avg.toFixed(1)}★` : "—"} />
        <StatCard label="Mới" value={stats.byStatus.new || 0} />
        <StatCard label="Đã duyệt hiển thị" value={stats.featured} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-card px-2 text-sm">
          <option value="all">Tất cả trạng thái</option>
          {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-card px-2 text-sm">
          <option value="all">Tất cả loại</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} mục</span>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-600">Chưa có phản hồi nào</h3>
          <p className="mt-1 text-sm text-muted-foreground">Phản hồi từ người dùng sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const st = STATUS.find((s) => s.value === f.status) || STATUS[0];
            return (
              <div key={f.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-600 ${st.color}`}>{st.label}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-600 text-muted-foreground">{CATEGORIES[f.category] || f.category}</span>
                      {f.is_featured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-600 text-amber-700">Hiển thị công khai</span>}
                      {f.anonymous && <span className="text-[10px] text-muted-foreground">ẩn danh</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <StarRating value={f.overall_rating} readOnly size={16} />
                      <span className="text-sm font-600">{f.display_name || "Người dùng"}</span>
                      <span className="text-xs text-muted-foreground">{new Date(f.created_date).toLocaleString("vi-VN")}</span>
                    </div>
                    {f.comment && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{f.comment}</p>}
                    {(f.ease_rating || f.interface_rating || f.performance_rating || f.support_rating) ? (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {f.ease_rating ? <span>Dễ dùng: {f.ease_rating}★</span> : null}
                        {f.interface_rating ? <span>Giao diện: {f.interface_rating}★</span> : null}
                        {f.performance_rating ? <span>Hiệu năng: {f.performance_rating}★</span> : null}
                        {f.support_rating ? <span>Hỗ trợ: {f.support_rating}★</span> : null}
                      </div>
                    ) : null}
                    {f.consent_public && !f.is_featured && <p className="mt-1 text-[11px] text-emerald-600">Người dùng đã đồng ý hiển thị công khai.</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {STATUS.map((s) => (
                        <button key={s.value} onClick={() => setStatus(f.id, s.value)} title={s.label}
                          className={`rounded-lg p-2 transition-colors ${f.status === s.value ? st.color : "text-muted-foreground hover:bg-muted"}`}>
                          <s.icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toggleFeatured(f)} className="gap-1.5">
                      {f.is_featured ? <><EyeOff className="h-4 w-4" /> Bỏ hiển thị</> : <><Eye className="h-4 w-4" /> Duyệt hiển thị</>}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="font-heading text-2xl font-800 text-primary">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}