import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CvRepeatSection({ title, hint, items = [], fields, onChange }) {
  const update = (index, key, value) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next);
  };

  const add = () => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, ""]))]);
  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-700">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5 rounded-full">
          <Plus className="h-3.5 w-3.5" /> Thêm
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          Chưa có mục nào. Nhấn “Thêm” để bắt đầu.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                    <Label className="text-[11px] text-muted-foreground">{f.label}</Label>
                    <Input
                      value={item[f.key] || ""}
                      placeholder={f.placeholder}
                      onChange={(e) => update(index, f.key, e.target.value)}
                      className="mt-1 h-9 bg-background"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Label className="text-[11px] text-muted-foreground">Mô tả</Label>
                <Textarea
                  rows={3}
                  value={item.description || ""}
                  placeholder="Kết quả nổi bật, con số, công nghệ đã dùng..."
                  onChange={(e) => update(index, "description", e.target.value)}
                  className="mt-1 bg-background"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" /> Xoá mục
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}