import { CheckCircle2, Circle } from "lucide-react";

export default function ExamNavigator({ questions, answers, current, onSelect }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {questions.map((q, i) => {
        const answered = String(answers[q.question_id] || "").trim().length > 0;
        const active = i === current;
        return (
          <button
            key={q.question_id || i}
            type="button"
            onClick={() => onSelect(i)}
            className={`inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-700 transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : answered
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
            title={`Câu ${i + 1}`}
          >
            {answered && !active ? <CheckCircle2 className="h-3 w-3" /> : active ? null : <Circle className="h-3 w-3" />}
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}