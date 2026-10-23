import { MERGE_TAGS } from "@/lib/emailMergeTags";

export default function MergeTagChips({ onInsert, context }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="self-center text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Biến tự điền</span>
      {MERGE_TAGS.map((tag) => {
        const filled = Boolean(String(context?.[tag.key] ?? "").trim());
        return (
          <button
            key={tag.key}
            type="button"
            onClick={() => onInsert(tag.key)}
            title={filled ? `Giá trị: ${context[tag.key]}` : "Chưa có dữ liệu cho biến này"}
            className={`rounded-full border px-2 py-0.5 text-[11px] font-600 transition ${
              filled
                ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}