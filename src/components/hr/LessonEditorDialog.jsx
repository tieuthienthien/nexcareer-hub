import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuizQuestionEditor from "@/components/hr/QuizQuestionEditor";
import { Loader2, Save, Upload } from "lucide-react";

export default function LessonEditorDialog({ courseId, lesson, defaultOrder, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState(
    lesson || {
      type: "reading",
      title: "",
      chapter_index: 1,
      chapter_title: "Chương 1",
      order_index: defaultOrder || 1,
      duration_min: 10,
      body: "",
      code_example: "",
      video_url: "",
      video_caption: "",
      questions: [],
    }
  );
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const uploadVideo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy("video");
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set("video_url", file_url);
    } catch (e) {
      setError(e.message || "Không tải được video");
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!form.title?.trim()) {
      setError("Vui lòng nhập tên bài học");
      return;
    }
    setBusy("save");
    setError("");
    const payload = {
      course_id: courseId,
      type: form.type,
      title: form.title,
      chapter_index: Number(form.chapter_index) || 1,
      chapter_title: form.chapter_title || "",
      order_index: Number(form.order_index) || 0,
      duration_min: Number(form.duration_min) || 0,
      body: form.body || "",
      code_example: form.code_example || "",
      video_url: form.type === "video" ? form.video_url || "" : "",
      video_caption: form.type === "video" ? form.video_caption || "" : "",
      questions: form.type === "quiz" ? form.questions || [] : [],
    };
    try {
      if (lesson?.id) await base44.entities.Lesson.update(lesson.id, payload);
      else await base44.entities.Lesson.create(payload);
      onSaved?.();
    } catch (e) {
      setError(e.message || "Không lưu được bài học");
    } finally {
      setBusy("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lesson?.id ? "Sửa bài học" : "Thêm bài học"}</DialogTitle>
          <DialogDescription>Thay nội dung, video hoặc câu hỏi — học viên thấy thay đổi ngay.</DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Tên bài học</Label>
            <Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Loại nội dung</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Bài giảng</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="quiz">Câu hỏi cuối chương</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Thời lượng (phút)</Label>
            <Input type="number" value={form.duration_min ?? 0} onChange={(e) => set("duration_min", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Chương số</Label>
            <Input type="number" value={form.chapter_index ?? 1} onChange={(e) => set("chapter_index", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Tên chương</Label>
            <Input value={form.chapter_title || ""} onChange={(e) => set("chapter_title", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Thứ tự hiển thị</Label>
            <Input type="number" value={form.order_index ?? 0} onChange={(e) => set("order_index", e.target.value)} className="mt-1.5" />
          </div>

          {form.type === "reading" && (
            <>
              <div className="sm:col-span-2">
                <Label>Nội dung bài giảng</Label>
                <Textarea rows={7} value={form.body || ""} onChange={(e) => set("body", e.target.value)} className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label>Ví dụ code (không bắt buộc)</Label>
                <Textarea rows={4} className="mt-1.5 font-mono text-xs" value={form.code_example || ""} onChange={(e) => set("code_example", e.target.value)} />
              </div>
            </>
          )}

          {form.type === "video" && (
            <>
              <div className="sm:col-span-2">
                <Label>Video bài học</Label>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Input value={form.video_url || ""} onChange={(e) => set("video_url", e.target.value)} placeholder="Dán URL video (mp4, webm...)" className="min-w-[220px] flex-1" />
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-500 hover:bg-muted">
                    {busy === "video" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Tải video mới
                    <input type="file" accept="video/*" className="hidden" onChange={uploadVideo} />
                  </label>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Tải video mới sẽ thay thế video cũ của bài học này.</p>
              </div>
              {form.video_url && (
                <div className="sm:col-span-2 overflow-hidden rounded-xl border border-border bg-black">
                  <video src={form.video_url} controls playsInline className="aspect-video w-full" />
                </div>
              )}
              <div className="sm:col-span-2">
                <Label>Chú thích video</Label>
                <Input value={form.video_caption || ""} onChange={(e) => set("video_caption", e.target.value)} className="mt-1.5" />
              </div>
            </>
          )}

          {form.type === "quiz" && (
            <div className="sm:col-span-2">
              <Label>Câu hỏi</Label>
              <div className="mt-1.5">
                <QuizQuestionEditor questions={form.questions || []} onChange={(v) => set("questions", v)} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!busy}>Hủy</Button>
          <Button onClick={save} disabled={!!busy} className="gap-2">
            {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu bài học
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}