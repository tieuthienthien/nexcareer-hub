import { Textarea } from "@/components/ui/textarea";

export default function ExamAnswerArea({ question, value, onChange }) {
  if (!question) return null;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-700">Bài làm</h3>

      {question.type === "mcq" ? (
        <div className="mt-3 space-y-2 overflow-y-auto">
          {(question.options || []).map((opt, i) => {
            const active = value === opt;
            return (
              <button
                key={`${opt}-${i}`}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                  active ? "border-primary bg-primary/5 text-foreground" : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-700 ${active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 text-muted-foreground"}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="leading-relaxed">{opt}</span>
              </button>
            );
          })}
          {(question.options || []).length === 0 && <p className="text-sm text-muted-foreground">Câu hỏi này chưa có phương án.</p>}
        </div>
      ) : (
        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          {question.type === "code" && (
            <div className="mb-2 rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-[11px] text-slate-300">Trình soạn code — trình bày rõ ràng, có thể giải thích ngắn</div>
          )}
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.type === "code" ? "Viết code / giải thích cách làm của bạn..." : "Nhập câu trả lời..."}
            className={`min-h-[280px] flex-1 resize-none ${question.type === "code" ? "font-mono text-sm" : "text-sm"}`}
          />
          <div className="mt-2 text-right text-[11px] text-muted-foreground">{String(value || "").length} ký tự</div>
        </div>
      )}
    </div>
  );
}