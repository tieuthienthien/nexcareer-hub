import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function JdPreviewPanel({ jd, loading, onChange, onRegenerate, dirty }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-700">
            <Sparkles className="h-4 w-4 text-primary" /> JD chi tiết
          </h3>
          <p className="text-xs text-muted-foreground">
            {loading ? "AI đang cập nhật theo phần thô..." : dirty ? "Phần thô đã thay đổi — bấm Tạo lại để AI viết lại." : "AI tự sinh từ phần thô. Bạn có thể sửa tay."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onRegenerate} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Tạo lại
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Mô tả công việc" value={jd.description} rows={5} onChange={(v) => onChange({ description: v })} />
        <Field label="Yêu cầu công việc" value={jd.requirements} rows={9} onChange={(v) => onChange({ requirements: v })} />
        <Field label="Quyền lợi" value={jd.benefits} rows={6} onChange={(v) => onChange({ benefits: v })} />
      </div>
    </div>
  );
}

function Field({ label, value, rows, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-600 uppercase tracking-wide text-muted-foreground">{label}</div>
      {value === undefined ? (
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-muted" />)}
        </div>
      ) : (
        <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="text-sm leading-relaxed" />
      )}
    </div>
  );
}