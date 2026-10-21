import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

export default function QuizRunner({ lesson, onGraded }) {
  const questions = lesson.questions || [];
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const setAnswer = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const submit = async () => {
    if (questions.some((q) => !String(answers[q.id] || "").trim())) {
      setError("Hãy trả lời đủ tất cả câu hỏi trước khi nộp bài.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("gradeQuiz", {
        lesson_id: lesson.id,
        answers: questions.map((q) => ({ question_id: q.id, answer: String(answers[q.id] || "").trim() })),
      });
      const data = res.data || res;
      if (data.error) setError(data.error);
      else {
        setResult(data);
        onGraded?.(data);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không chấm được bài làm.");
    }
    setBusy(false);
  };

  const reset = () => {
    setResult(null);
    setAnswers({});
    setError("");
  };

  if (result) {
    const passed = result.percent >= 80;
    return (
      <div className="space-y-4">
        <div className={cn("rounded-2xl border p-5", passed ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-heading text-base font-700">
              {passed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-amber-600" />}
              Điểm chương: {result.percent}%
            </div>
            <span className="text-xs text-muted-foreground">
              {result.score}/{result.max_score} điểm · Điểm cuối khóa tạm tính {result.final_score}/100
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {passed ? "Bạn đã hoàn thành tốt chương này. Tiếp tục chương tiếp theo nhé." : "Chương này chưa đạt 80%. Bạn có thể xem lại bài giảng và làm lại bất cứ lúc nào."}
          </p>
        </div>

        <div className="space-y-3">
          {result.results.map((item, index) => (
            <div key={item.question_id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-600">
                  Câu {index + 1}. {item.prompt}
                </p>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-600", item.points_awarded >= item.max_points ? "bg-emerald-100 text-emerald-700" : item.points_awarded > 0 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>
                  {item.points_awarded}/{item.max_points}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/50 p-2.5 text-xs text-foreground/80">
                {item.answer || "(Chưa trả lời)"}
              </p>
              {item.feedback && <p className="mt-2 text-xs text-muted-foreground">{item.feedback}</p>}
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Làm lại bài
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {questions.map((question, index) => (
        <div key={question.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-700 text-primary">{index + 1}</span>
            <p className="text-sm font-600">
              {question.prompt}
              <span className="ml-2 text-[11px] font-500 text-muted-foreground">
                ({question.type === "mcq" ? "Trắc nghiệm" : "Trả lời ngắn"} · {question.points} điểm)
              </span>
            </p>
          </div>

          {question.type === "mcq" ? (
            <div className="mt-3 space-y-2">
              {(question.options || []).map((option) => {
                const active = answers[question.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswer(question.id, option)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                      active ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full border", active ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea
              rows={3}
              value={answers[question.id] || ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder="Trả lời ngắn gọn, nêu ý chính..."
              className="mt-3"
            />
          )}
        </div>
      ))}

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "AI đang chấm bài..." : "Nộp bài & chấm điểm"}
        </Button>
        <p className="text-xs text-muted-foreground">Câu trả lời ngắn được AI chấm theo đáp án mẫu và từ khóa, cho điểm từng phần.</p>
      </div>
    </div>
  );
}