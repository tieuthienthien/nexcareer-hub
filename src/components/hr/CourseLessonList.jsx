import { Button } from "@/components/ui/button";
import { BookOpen, ListChecks, Pencil, Trash2, Video } from "lucide-react";

const typeMeta = {
  reading: { label: "Bài giảng", icon: BookOpen, cls: "bg-sky-50 text-sky-700" },
  video: { label: "Video", icon: Video, cls: "bg-violet-50 text-violet-700" },
  quiz: { label: "Câu hỏi", icon: ListChecks, cls: "bg-emerald-50 text-emerald-700" },
};

export default function CourseLessonList({ lessons, onEdit, onDelete }) {
  if (lessons.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Chưa có bài học. Bấm “Thêm bài học” để tạo nội dung đầu tiên.</p>;
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {lessons.map((lesson) => {
        const meta = typeMeta[lesson.type] || typeMeta.reading;
        const Icon = meta.icon;
        return (
          <div key={lesson.id} className="flex flex-wrap items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted/40">
            <span className="w-7 shrink-0 text-xs text-muted-foreground">{lesson.order_index ?? "—"}</span>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-600 ${meta.cls}`}>
              <Icon className="h-3 w-3" /> {meta.label}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-500">{lesson.title}</div>
              <div className="truncate text-[11px] text-muted-foreground">
                Chương {lesson.chapter_index ?? 1}. {lesson.chapter_title || "—"} · {lesson.duration_min || 0} phút
                {lesson.type === "video" && lesson.video_url ? " · đã có video" : ""}
                {lesson.type === "quiz" ? ` · ${(lesson.questions || []).length} câu hỏi` : ""}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onEdit(lesson)}>
              <Pencil className="h-3.5 w-3.5" /> Sửa
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-rose-600 hover:text-rose-700" onClick={() => onDelete(lesson)}>
              <Trash2 className="h-3.5 w-3.5" /> Xóa
            </Button>
          </div>
        );
      })}
    </div>
  );
}