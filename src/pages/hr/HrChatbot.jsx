import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Plus, Pencil, Trash2, Search, Power, MessageCircle } from "lucide-react";

export default function HrChatbot() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ question: "", answer: "", keywords: "", category: "", active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { items: rows } = await base44.entities.ChatbotKnowledge.filter({}, { sort: "-created_date", limit: 200 });
      setItems(rows || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((k) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return k.question?.toLowerCase().includes(q) || k.answer?.toLowerCase().includes(q) || (k.keywords || []).some((w) => w.toLowerCase().includes(q)) || (k.category || "").toLowerCase().includes(q);
  });

  const startNew = () => {
    setEditing("new");
    setForm({ question: "", answer: "", keywords: "", category: "", active: true });
  };
  const startEdit = (k) => {
    setEditing(k.id);
    setForm({ question: k.question || "", answer: k.answer || "", keywords: (k.keywords || []).join(", "), category: k.category || "", active: k.active !== false });
  };
  const cancel = () => { setEditing(null); };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      keywords: form.keywords.split(",").map((w) => w.trim()).filter(Boolean),
      category: form.category.trim(),
      active: form.active,
    };
    try {
      if (editing === "new") {
        await base44.entities.ChatbotKnowledge.create(payload);
      } else {
        await base44.entities.ChatbotKnowledge.update(editing, payload);
      }
      setEditing(null);
      await load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Xoá mục kiến thức này?")) return;
    await base44.entities.ChatbotKnowledge.delete(id);
    await load();
  };

  const toggleActive = async (k) => {
    await base44.entities.ChatbotKnowledge.update(k.id, { active: !k.active });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-700 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" /> Huấn luyện Chatbot
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý kho kiến thức cho Starbuddy — trợ lý mascot trên các trang công khai.
          </p>
        </div>
        <Button onClick={startNew} className="gap-2"><Plus className="h-4 w-4" /> Thêm câu hỏi</Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm câu hỏi / từ khóa…" className="pl-9" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{filtered.length} mục kiến thức{items.filter((k) => k.active !== false).length > 0 && ` • ${items.filter((k) => k.active !== false).length} đang bật`}</p>
      </div>

      {editing && (
        <div className="rounded-2xl border-2 border-primary/40 bg-card p-5">
          <h2 className="font-heading text-lg font-700">{editing === "new" ? "Thêm câu hỏi mới" : "Chỉnh sửa"}</h2>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-1.5">
              <Label>Câu hỏi mẫu *</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="VD: Làm sao để ứng tuyển?" />
            </div>
            <div className="grid gap-1.5">
              <Label>Câu trả lời *</Label>
              <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Nội dung Starbuddy sẽ trả lời…" rows={4} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Từ khóa (phân cách bằng dấu phẩy)</Label>
                <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="ứng tuyển, nộp hồ sơ, cv" />
              </div>
              <div className="grid gap-1.5">
                <Label>Nhóm chủ đề</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Việc làm / Ứng tuyển / Liên hệ" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded" />
              Kích hoạt mục này
            </label>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving || !form.question.trim() || !form.answer.trim()}><Sparkles className="mr-2 h-4 w-4" /> {saving ? "Đang lưu…" : "Lưu"}</Button>
              <Button variant="outline" onClick={cancel}>Huỷ</Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            <MessageCircle className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-3">Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên để Starbuddy bắt đầu hỗ trợ.</p>
          </div>
        ) : (
          filtered.map((k) => (
            <div key={k.id} className={`rounded-2xl border bg-card p-4 transition-colors ${k.active === false ? "border-border opacity-60" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-600 text-sm">{k.question}</h3>
                    {k.category && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-600 text-primary">{k.category}</span>}
                    {k.active === false && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-600 text-muted-foreground">Đã tắt</span>}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">{k.answer}</p>
                  {k.keywords?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {k.keywords.map((w) => <span key={w} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{w}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => toggleActive(k)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Bật/tắt" title={k.active === false ? "Bật" : "Tắt"}>
                    <Power className="h-4 w-4" />
                  </button>
                  <button onClick={() => startEdit(k)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary" aria-label="Sửa"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(k.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600" aria-label="Xoá"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}