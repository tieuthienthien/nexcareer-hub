import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Plus, Pencil, Trash2, Search, Power, MessageCircle, Inbox, CheckCircle2 } from "lucide-react";

const ROLES = ["all", "candidate", "recruiter", "hiring_manager", "public"];
const TYPES = ["static", "database", "rule_based", "ai_required"];

export default function HrChatbot() {
  const [tab, setTab] = useState("kb");
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-700 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" /> Starbuddy 2.0
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý kho kiến thức và xem câu chưa đáp ứng cho trợ lý tuyển dụng.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("kb")} className={`rounded-xl px-4 py-2 text-sm font-600 transition-colors ${tab === "kb" ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}>Kho kiến thức</button>
        <button onClick={() => setTab("log")} className={`rounded-xl px-4 py-2 text-sm font-600 transition-colors ${tab === "log" ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}>Câu chưa đáp ứng</button>
      </div>

      {tab === "kb" ? <KnowledgeBase /> : <UnansweredQueue />}
    </div>
  );
}

function KnowledgeBase() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const emptyForm = { intent_id: "", question: "", answer: "", answer_en: "", variants: "", keywords: "", category: "", subcategory: "", user_role: "all", answer_type: "static", page_link: "", active: true };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const { items: rows } = await base44.entities.ChatbotKnowledge.filter({}, { sort: "-created_date", limit: 500 });
      setItems(rows || []);
    } catch { setItems([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((k) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return k.question?.toLowerCase().includes(q) || k.answer?.toLowerCase().includes(q) ||
      (k.keywords || []).some((w) => w.toLowerCase().includes(q)) || (k.category || "").toLowerCase().includes(q) ||
      (k.intent_id || "").toLowerCase().includes(q);
  });

  const startNew = () => { setEditing("new"); setForm(emptyForm); };
  const startEdit = (k) => {
    setEditing(k.id);
    setForm({
      intent_id: k.intent_id || "", question: k.question || "", answer: k.answer || "", answer_en: k.answer_en || "",
      variants: (k.variants || []).join("\n"), keywords: (k.keywords || []).join(", "), category: k.category || "",
      subcategory: k.subcategory || "", user_role: k.user_role || "all", answer_type: k.answer_type || "static",
      page_link: k.page_link || "", active: k.active !== false,
    });
  };
  const cancel = () => { setEditing(null); };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    const payload = {
      intent_id: form.intent_id.trim() || undefined,
      question: form.question.trim(),
      answer: form.answer.trim(),
      answer_en: form.answer_en.trim() || undefined,
      variants: form.variants.split("\n").map((w) => w.trim()).filter(Boolean),
      keywords: form.keywords.split(",").map((w) => w.trim()).filter(Boolean),
      category: form.category.trim() || undefined,
      subcategory: form.subcategory.trim() || undefined,
      user_role: form.user_role,
      answer_type: form.answer_type,
      page_link: form.page_link.trim() || undefined,
      active: form.active,
    };
    try {
      if (editing === "new") await base44.entities.ChatbotKnowledge.create(payload);
      else await base44.entities.ChatbotKnowledge.update(editing, payload);
      setEditing(null);
      await load();
    } catch {}
    setSaving(false);
  };

  const remove = async (id) => { if (!confirm("Xoá mục kiến thức này?")) return; await base44.entities.ChatbotKnowledge.delete(id); await load(); };
  const toggleActive = async (k) => { await base44.entities.ChatbotKnowledge.update(k.id, { active: !k.active }); await load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button onClick={startNew} className="gap-2"><Plus className="h-4 w-4" /> Thêm câu hỏi</Button>
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm câu hỏi / từ khóa / intent…" className="pl-9" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} mục • {items.filter((k) => k.active !== false).length} đang bật</p>

      {editing && (
        <div className="rounded-2xl border-2 border-primary/40 bg-card p-5">
          <h2 className="font-heading text-lg font-700">{editing === "new" ? "Thêm câu hỏi mới" : "Chỉnh sửa"}</h2>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5"><Label>Intent ID</Label><Input value={form.intent_id} onChange={(e) => setForm({ ...form, intent_id: e.target.value })} placeholder="vd: r1.score.meaning" /></div>
              <div className="grid gap-1.5"><Label>Trang liên quan</Label><Input value={form.page_link} onChange={(e) => setForm({ ...form, page_link: e.target.value })} placeholder="/viec-lam" /></div>
            </div>
            <div className="grid gap-1.5"><Label>Câu hỏi mẫu *</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="VD: Làm sao để ứng tuyển?" /></div>
            <div className="grid gap-1.5"><Label>Câu trả lời tiếng Việt *</Label><Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} /></div>
            <div className="grid gap-1.5"><Label>Câu trả lời tiếng Anh</Label><Textarea value={form.answer_en} onChange={(e) => setForm({ ...form, answer_en: e.target.value })} rows={3} /></div>
            <div className="grid gap-1.5"><Label>Cách hỏi thay thế (mỗi dòng một câu)</Label><Textarea value={form.variants} onChange={(e) => setForm({ ...form, variants: e.target.value })} rows={3} placeholder="Tôi nộp CV thế nào?&#10;Cách ứng tuyển?" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5"><Label>Từ khóa (phẩy ngăn cách)</Label><Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Nhóm chủ đề</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5"><Label>Vai trò</Label>
                <select value={form.user_role} onChange={(e) => setForm({ ...form, user_role: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5"><Label>Loại trả lời</Label>
                <select value={form.answer_type} onChange={(e) => setForm({ ...form, answer_type: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
                  {TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5"><Label>Nhóm con</Label><Input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded" /> Kích hoạt mục này</label>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving || !form.question.trim() || !form.answer.trim()}><Sparkles className="mr-2 h-4 w-4" /> {saving ? "Đang lưu…" : "Lưu"}</Button>
              <Button variant="outline" onClick={cancel}>Huỷ</Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)
          : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto h-10 w-10 opacity-40" /><p className="mt-3">Chưa có câu hỏi nào.</p>
            </div>
          ) : filtered.map((k) => (
            <div key={k.id} className={`rounded-2xl border bg-card p-4 ${k.active === false ? "border-border opacity-60" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {k.intent_id && <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{k.intent_id}</span>}
                    <h3 className="font-600 text-sm">{k.question}</h3>
                    {k.category && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-600 text-primary">{k.category}</span>}
                    {k.answer_type && k.answer_type !== "static" && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-600 text-accent">{k.answer_type}</span>}
                    {k.active === false && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-600 text-muted-foreground">Đã tắt</span>}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">{k.answer}</p>
                  {k.variants?.length > 0 && <p className="mt-1 text-[11px] text-muted-foreground">Biến thể: {k.variants.slice(0, 3).join(" · ")}{k.variants.length > 3 ? "…" : ""}</p>}
                  {k.keywords?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{k.keywords.map((w) => <span key={w} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{w}</span>)}</div>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => toggleActive(k)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title={k.active === false ? "Bật" : "Tắt"}><Power className="h-4 w-4" /></button>
                  <button onClick={() => startEdit(k)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(k.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function UnansweredQueue() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unresolved");

  const load = async () => {
    setLoading(true);
    try {
      const q = filter === "negative" ? { helpful: false } : filter === "ai" ? { source: "ai" } : { resolved: false };
      const { items } = await base44.entities.ChatbotLog.filter(q, { sort: "-created_date", limit: 100 });
      setLogs(items || []);
    } catch { setLogs([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const resolve = async (id) => { await base44.entities.ChatbotLog.update(id, { resolved: true }); load(); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("unresolved")} className={`rounded-xl px-3 py-1.5 text-sm font-500 ${filter === "unresolved" ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>Chưa xử lý</button>
        <button onClick={() => setFilter("ai")} className={`rounded-xl px-3 py-1.5 text-sm font-500 ${filter === "ai" ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>Rơi vào AI</button>
        <button onClick={() => setFilter("negative")} className={`rounded-xl px-3 py-1.5 text-sm font-500 ${filter === "negative" ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"}`}>Phản hồi tiêu cực</button>
      </div>

      {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)
        : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            <Inbox className="mx-auto h-10 w-10 opacity-40" /><p className="mt-3">Không có mục nào trong danh sách này.</p>
          </div>
        ) : logs.map((l) => (
          <div key={l.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-600 ${l.source === "ai" ? "bg-amber-100 text-amber-700" : l.source === "escalation" ? "bg-rose-100 text-rose-700" : l.source === "feedback" ? "bg-sky-100 text-sky-700" : "bg-muted text-muted-foreground"}`}>{l.source}</span>
                {l.helpful === false && <span className="text-[10px] font-600 text-rose-600">👎 không ích</span>}
                {l.helpful === true && <span className="text-[10px] font-600 text-emerald-600">👍 có ích</span>}
                {l.resolved && <span className="text-[10px] font-600 text-emerald-600">đã xử lý</span>}
              </div>
              <p className="mt-1.5 text-sm">{l.message}</p>
            </div>
            {!l.resolved && <button onClick={() => resolve(l.id)} className="flex shrink-0 items-center gap-1 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-emerald-600" title="Đánh dấu đã xử lý"><CheckCircle2 className="h-4 w-4" /></button>}
          </div>
        ))}
      <p className="text-xs text-muted-foreground">Mẹo: chuyển các câu hỏi lặp lại thành câu hỏi mẫu trong Kho kiến thức để Starbuddy trả lời không tốn AI.</p>
    </div>
  );
}