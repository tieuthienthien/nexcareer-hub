import { Image } from "@/components/ui/image";
import { FileQuestion } from "lucide-react";

const difficultyMeta = {
  easy: { label: "Cơ bản", cls: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Trung bình", cls: "bg-amber-100 text-amber-700" },
  hard: { label: "Khó", cls: "bg-rose-100 text-rose-700" },
};

export default function ExamQuestionPanel({ question, index, total }) {
  if (!question) return null;
  const diff = difficultyMeta[question.difficulty] || difficultyMeta.easy;

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-700 text-primary">Câu {index + 1}/{total}</span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-600 ${diff.cls}`}>{diff.label}</span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-600 text-muted-foreground">{question.points} điểm</span>
        {question.type === "code" && <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-600 text-slate-100">Viết code</span>}
        {question.type === "mcq" && <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-600 text-sky-700">Trắc nghiệm</span>}
      </div>

      <h2 className="mt-3 font-heading text-base font-700">{question.title || `Câu hỏi ${index + 1}`}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{question.prompt}</p>

      {question.media_type === "image" && question.media_url && (
        <Image
          src={question.media_url}
          alt={`Hình mô phỏng câu ${index + 1}`}
          fittingType="fit"
          className="mt-4 max-h-72 w-full rounded-xl border border-border object-contain"
        />
      )}
      {question.media_type === "video" && question.media_url && (
        <video controls className="mt-4 w-full rounded-xl border border-border" src={question.media_url}>
          Trình duyệt không hỗ trợ video.
        </video>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4 text-[11px] text-muted-foreground">
        <FileQuestion className="h-3.5 w-3.5" /> Đọc kỹ đề trước khi trả lời. Bài làm được lưu khi bạn nộp.
      </div>
    </div>
  );
}