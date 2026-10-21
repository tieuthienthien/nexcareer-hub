import { Progress } from "@/components/ui/progress";
import { BookOpen, Video, ListChecks, CheckCircle2, Lock } from "lucide-react";

const iconOf = (type) => (type === "video" ? Video : type === "quiz" ? ListChecks : BookOpen);
const labelOf = (type) => (type === "video" ? "Video case" : type === "quiz" ? "Câu hỏi cuối chương" : "Bài giảng");

export default function ChapterProgress({ chapters, completedIds, scores }) {
  const scoreOf = (lessonId) => (scores || []).find((item) => item.lesson_id === lessonId);

  return (
    <div className="space-y-3">
      {chapters.map((chapter) => {
        const done = chapter.lessons.filter((lesson) => completedIds.has(lesson.id)).length;
        const percent = chapter.lessons.length ? Math.round((done / chapter.lessons.length) * 100) : 0;
        return (
          <div key={chapter.index} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-600">
                Chương {chapter.index}. {chapter.title}
              </h4>
              <span className="text-xs font-600 text-muted-foreground">{percent}%</span>
            </div>
            <Progress value={percent} className="mt-2 h-1.5" />
            <ul className="mt-3 space-y-1.5">
              {chapter.lessons.map((lesson) => {
                const Icon = iconOf(lesson.type);
                const isDone = completedIds.has(lesson.id);
                const score = scoreOf(lesson.id);
                return (
                  <li key={lesson.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className={`min-w-0 flex-1 truncate ${isDone ? "text-foreground/70" : ""}`}>{lesson.title}</span>
                    {score && <span className="shrink-0 font-600 text-primary">{score.percent}%</span>}
                    {lesson.type === "quiz" && !score && <Lock className="h-3 w-3 shrink-0" />}
                    <span className="hidden shrink-0 text-[11px] sm:inline">{labelOf(lesson.type)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}