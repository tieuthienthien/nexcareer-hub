import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Plus, Search, Sparkles } from "lucide-react";
import TemplateCard from "@/components/hr/email/TemplateCard";
import TemplateEditorDialog from "@/components/hr/email/TemplateEditorDialog";
import SendTemplateDialog from "@/components/hr/email/SendTemplateDialog";
import { TEMPLATE_SUGGESTIONS } from "@/lib/emailTemplates";

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

  const openSuggestion = (suggestion) => {
    const built = suggestion.build();
    setEditor({ prefill: { name: suggestion.name, category: suggestion.category, ...built } });
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

      {templates.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h2 className="mt-3 font-heading text-base font-700">
            {q.trim() ? "Không tìm thấy mẫu phù hợp" : "Chưa có mẫu email nào"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bắt đầu từ mẫu gợi ý, sau đó chỉnh lại theo giọng văn của Nexora.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TEMPLATE_SUGGESTIONS.map((s) => (
              <Button key={s.key} variant="outline" className="gap-2" onClick={() => openSuggestion(s)}>
                <Sparkles className="h-4 w-4" /> {s.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
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
      )}

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