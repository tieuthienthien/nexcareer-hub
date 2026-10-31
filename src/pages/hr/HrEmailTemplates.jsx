import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Plus, Search, Sparkles } from "lucide-react";
import TemplateCard from "@/components/hr/email/TemplateCard";
import TemplateEditorDialog from "@/components/hr/email/TemplateEditorDialog";
import SendTemplateDialog from "@/components/hr/email/SendTemplateDialog";
import { EMAIL_TEMPLATES } from "@/lib/emailTemplatesLibrary";

// Trình soạn mẫu dùng ô văn bản thường, nên đổi HTML của thư viện sang chữ thuần.
function htmlToText(html) {
  return String(html || "")
    .replace(/<li>/g, "• ")
    .replace(/<\/(p|li|h3|ul|ol)>/g, "\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function HrEmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editor, setEditor] = useState(null);
  const [sender, setSender] = useState(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const query = q.trim() ? { name: { $regex: q.trim(), $options: "i" } } : {};
      const res = await base44.entities.EmailTemplate.filter(query, { sort: "-updated_date", limit: 60 });
      setTemplates(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [q]);

  const duplicate = async (template) => {
    await base44.entities.EmailTemplate.create({
      name: `${template.name} (bản sao)`,
      category: template.category,
      subject: template.subject,
      body: template.body,
    });
    load();
  };

  const remove = async (template) => {
    await base44.entities.EmailTemplate.delete(template.id);
    load();
  };

  // Mở mẫu có sẵn trong thư viện để chỉnh rồi lưu thành mẫu riêng.
  const openSuggestion = (tpl) => {
    setEditor({ prefill: { name: tpl.name, category: "other", subject: tpl.subject, body: htmlToText(tpl.body) } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-800 tracking-tight">
            <Mail className="h-6 w-6 text-primary" /> Mẫu email ứng viên
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Soạn sẵn các mẫu thư, rồi gửi cho ứng viên ngay khi cần.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setEditor({})}>
          <Plus className="h-4 w-4" /> Tạo mẫu mới
        </Button>
      </div>

      {notice && (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground/80">{notice}</div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mẫu theo tên..." className="pl-9" />
      </div>

      {templates.length > 0 || loading ? (
        <div className="space-y-3">
          <h2 className="font-heading text-sm font-700">Mẫu của bạn</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
                ))
              : templates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onEdit={(tpl) => setEditor({ template: tpl })}
                    onSend={(tpl) => setSender(tpl)}
                    onDuplicate={duplicate}
                    onDelete={remove}
                  />
                ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          {q.trim() ? "Không tìm thấy mẫu riêng phù hợp." : "Bạn chưa lưu mẫu riêng nào. Chọn một mẫu có sẵn bên dưới để chỉnh và lưu."}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 font-heading text-sm font-700">
          <Sparkles className="h-4 w-4 text-primary" /> Mẫu có sẵn ({EMAIL_TEMPLATES.length})
        </h2>
        <p className="text-xs text-muted-foreground">Đây là các mẫu dùng trong khi soạn email cho ứng viên. Bấm “Dùng mẫu này” để chỉnh và lưu thành mẫu riêng.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {EMAIL_TEMPLATES.filter((t) => !q.trim() || t.name.toLowerCase().includes(q.trim().toLowerCase())).map((t) => (
            <div key={t.key} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4">
              <div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-600 text-primary">{t.category}</span>
                <h3 className="mt-2 text-sm font-700 leading-snug">{t.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.subject}</p>
              </div>
              <Button size="sm" variant="outline" className="mt-3 gap-1.5 self-start" onClick={() => openSuggestion(t)}>
                <Plus className="h-3.5 w-3.5" /> Dùng mẫu này
              </Button>
            </div>
          ))}
        </div>
      </div>

      <TemplateEditorDialog
        open={!!editor}
        onOpenChange={(v) => !v && setEditor(null)}
        template={editor?.template}
        prefill={editor?.prefill}
        onSaved={() => {
          setNotice("Đã lưu mẫu email.");
          load();
        }}
      />

      <SendTemplateDialog
        open={!!sender}
        onOpenChange={(v) => !v && setSender(null)}
        template={sender}
        onSent={({ warnings, count }) => {
          if (warnings?.length) setNotice(`Đã xử lý ${count} email. Lưu ý: ${warnings.join(" · ")}`);
          else setNotice(`Đã gửi email cho ${count} ứng viên.`);
        }}
      />
    </div>
  );
}