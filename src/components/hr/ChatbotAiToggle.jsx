import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";

export default function ChatbotAiToggle() {
  const [enabled, setEnabled] = useState(true);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.ChatbotSetting.list({ limit: 1 });
        const row = items?.[0];
        if (row) {
          setRecordId(row.id);
          setEnabled(row.ai_enabled !== false);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async (next) => {
    setSaving(true);
    setEnabled(next);
    try {
      if (recordId) {
        await base44.entities.ChatbotSetting.update(recordId, { ai_enabled: next });
      } else {
        const row = await base44.entities.ChatbotSetting.create({ ai_enabled: next });
        setRecordId(row.id);
      }
    } catch {
      setEnabled(!next);
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3">
      <Sparkles className={`h-5 w-5 shrink-0 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
      <div className="min-w-0">
        <p className="text-sm font-600">AI trả lời</p>
        <p className="text-xs text-muted-foreground">
          {enabled
            ? "Đang bật — câu hỏi ngoài kho kiến thức sẽ do AI trả lời."
            : "Đang tắt — Starbuddy chỉ trả lời từ kho kiến thức."}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
        disabled={loading || saving}
        className="ml-auto shrink-0"
        aria-label="Bật/tắt AI trả lời"
      />
    </div>
  );
}