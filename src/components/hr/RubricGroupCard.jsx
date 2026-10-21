import { useMemo, useState } from "react";
import { Plus, X, GripVertical, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RubricGroupCard({ group, items, onAdd, onRemove, onUpdate }) {
  const [dragOver, setDragOver] = useState(false);
  const usedLabels = useMemo(() => new Set((items || []).map((i) => i.label)), [items]);
  const library = (group.tags || []).filter((t) => !usedLabels.has(t.label));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData("text/rubric-label");
    if (!raw) return;
    try {
      const { label, band } = JSON.parse(raw);
      if (label && !usedLabels.has(label)) onAdd({ label, band: band || "" });
    } catch (err) {}
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`rounded-2xl border bg-card p-4 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-700">{group.label}</h3>
          <p className="text-xs text-muted-foreground">{group.hint}</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-600 text-muted-foreground">{(items || []).length} nhãn</span>
      </div>

      {(items || []).length > 0 && (
        <div className="mt-3 space-y-2">
          {(items || []).map((item, index) => {
            const bands = (group.tags || []).find((t) => t.label === item.label)?.bands || [];
            return (
              <div key={`${item.label}-${index}`} className="rounded-xl border border-border bg-muted/20 p-2.5">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-600">{item.label}</span>
                  <button type="button" onClick={() => onRemove(index)} className="text-muted-foreground hover:text-destructive" aria-label="Bỏ nhãn">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-5">
                  <Select value={item.requirement} onValueChange={(v) => onUpdate(index, { requirement: v })}>
                    <SelectTrigger className="h-8 w-[132px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">Bắt buộc</SelectItem>
                      <SelectItem value="preferred">Ưu tiên</SelectItem>
                    </SelectContent>
                  </Select>
                  {bands.length > 0 && (
                    <Select value={item.band || "none"} onValueChange={(v) => onUpdate(index, { band: v === "none" ? "" : v })}>
                      <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Band" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không band</SelectItem>
                        {bands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex items-center gap-1 rounded-md border border-input px-2 py-1">
                    <span className="text-[11px] text-muted-foreground">Trọng số</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={item.weight}
                      onChange={(e) => onUpdate(index, { weight: Math.max(0, Math.min(20, Number(e.target.value) || 0)) })}
                      className="w-12 bg-transparent text-center text-xs font-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-600 uppercase tracking-wide text-muted-foreground">
          <Tag className="h-3 w-3" /> Thư viện nhãn
        </div>
        <div className="flex flex-wrap gap-1.5">
          {library.length === 0 && <span className="text-xs text-muted-foreground">Đã dùng hết nhãn gợi ý — kéo nhãn từ nhóm khác hoặc bỏ bớt.</span>}
          {library.map((t) => (
            <button
              key={t.label}
              type="button"
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/rubric-label", JSON.stringify({ label: t.label, band: t.bands?.[0] || "" }))}
              onClick={() => onAdd({ label: t.label, band: t.bands?.[0] || "" })}
              className="inline-flex cursor-grab items-center gap-1 rounded-full border border-dashed border-border bg-background px-2.5 py-1 text-xs text-foreground/80 hover:border-primary hover:text-primary active:cursor-grabbing"
            >
              <Plus className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}