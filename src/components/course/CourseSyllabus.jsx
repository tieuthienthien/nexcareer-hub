import { Link } from "react-router-dom";
import { BookOpen, Video, ListChecks, CheckCircle2, Lock, Clock } from "lucide-react";

const iconOf = (type) => (type === "video" ? Video : type === "quiz" ? ListChecks : BookOpen);
const labelOf = (type) => (type === "video" ? "Video case" : type === "quiz" ? "Câu hỏi cuối chương" : "Bài giảng");

export default function CourseSyllabus({ chapters, completedIds, enrolled, slug, onLocked }) {
  return (
    <div className="space-y-4">
      {chapters.map((chapter) => (
        <div key={chapter.index} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border/70 bg-muted/30 px-4 py-3">
            <h3 className="text-sm font-700">
              Chương {chapter.index}. {chapter.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {chapter.lessons.length} nội dung · {chapter.lessons.filter((l) => completedIds.has(l.id)).length} đã hoàn thành
            </p>
          </div>
          <ul>
            {chapter.lessons.map((lesson) => {
              const Icon = iconOf(lesson.type);
              const done = completedIds.has(lesson.id);
              const inner = (
                <>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${done ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"}`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-500">{lesson.title}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {labelOf(lesson.type)} · {lesson.duration_min || 10} phút
                    </span>
                  </span>
                  {enrolled ? (
                    <span className="shrink-0 text-xs font-600 text-primary">{done ? "Học lại" : "Vào học"}</span>
                  ) : (
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </>
              );

              return (
                <li key={lesson.id} className="border-b border-border/50 last:border-0">
                  {enrolled ? (
                    <Link to={`/khoa-hoc/${slug}/bai-hoc/${lesson.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                      {inner}
                    </Link>
                  ) : (
                    <button type="button" onClick={onLocked} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> Học mọi lúc, tiến độ được lưu tự động theo tài khoản của bạn.
      </p>
    </div>
  );
}