import { Loader2, Sparkles, Undo2 } from "lucide-react";

const MODES = [
  { key: "formal", label: "Trang trọng hơn" },
  { key: "friendly", label: "Thân thiện hơn" },
  { key: "shorter", label: "Ngắn gọn hơn" },
  { key: "longer", label: "Dài và chi tiết hơn" },
  { key: "personalize", label: "Cá nhân hoá theo hồ sơ" },
];

export default function AiRewriteBar({ onRewrite, onUndo, canUndo, busy }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 p-2">
      <span className="inline-flex items-center gap-1 px-1 text-[11px] font-700 uppercase tracking-wide text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Viết lại bằng AI
      </span>
      {MODES.map((mode) => (
        <button
          key={mode.key}
          type="button"
          onClick={() => onRewrite(mode.key)}
          disabled={!!busy}
          className="rounded-full border border-primary/25 bg-card px-2 py-0.5 text-[11px] font-600 text-primary transition hover:bg-primary/10 disabled:opacity-50"
        >
          {busy === mode.key ? <Loader2 className="inline h-3 w-3 animate-spin" /> : mode.label}
        </button>
      ))}
      {canUndo && (
        <button
          type="button"
          onClick={onUndo}
          disabled={!!busy}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-600 text-foreground/70 hover:bg-muted"
        >
          <Undo2 className="h-3 w-3" /> Hoàn tác
        </button>
      )}
    </div>
  );
}