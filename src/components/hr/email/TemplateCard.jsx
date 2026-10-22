import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Send, Trash2 } from "lucide-react";
import { categoryLabel } from "@/lib/emailTemplates";

export default function TemplateCard({ template, onEdit, onSend, onDuplicate, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <div className="truncate font-heading text-sm font-700">{template.name}</div>
      <div className="mt-1">
        <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-600 text-primary">
          {categoryLabel(template.category)}
        </span>
      </div>
      <div className="mt-3 truncate text-xs font-600 text-foreground/85">{template.subject}</div>
      <p className="mt-1 max-h-20 overflow-hidden whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
        {template.body}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-border pt-3">
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onEdit(template)}>
          <Pencil className="h-3.5 w-3.5" /> Sửa
        </Button>
        <Button size="sm" className="gap-1.5" onClick={() => onSend(template)}>
          <Send className="h-3.5 w-3.5" /> Gửi
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onDuplicate(template)}>
          <Copy className="h-3.5 w-3.5" /> Nhân bản
        </Button>
        {confirming ? (
          <span className="ml-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                onDelete(template);
                setConfirming(false);
              }}
            >
              Xác nhận
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Hủy
            </Button>
          </span>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground"
            onClick={() => setConfirming(true)}
            aria-label="Xóa mẫu"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}