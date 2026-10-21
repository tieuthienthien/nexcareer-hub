import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CourseLessonList from "@/components/hr/CourseLessonList";
import LessonEditorDialog from "@/components/hr/LessonEditorDialog";
import { Image } from "@/components/ui/image";
import { Loader2, Plus, Save, Trash2, Upload } from "lucide-react";

export default function CourseEditorPanel({ course, onSaved, onDeleted }) {
  const [form, setForm] = useState(course);
  const [outcomesText, setOutcomesText] = useState((course.outcomes || []).join("\n"));
  const [lessons, setLessons] = useState([]);
  const [lessonDialog, setLessonDialog] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const loadLessons = async () => {
    const res = await base44.entities.Lesson.filter({ course_id: course.id }, { sort: "order_index", limit: 200 });
    setLessons(res.items || []);
  };

  useEffect(() => {
    setForm(course);
    setOutcomesText((course.outcomes || []).join("\n"));
    loadLessons().catch(() => {});
  }, [course.id]);

  const uploadThumbnail = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy("thumb");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set("thumbnail_url", file_url);
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    setBusy("save");
    setMsg("");
    try {
      await base44.entities.Course.update(course.id, {
        title: form.title,
        slug: form.slug,
        category: form.category,
        summary: form.summary,
        description: form.description,
        thumbnail_url: form.thumbnail_url,
        level: form.level,
        duration_min: Number(form.duration_min) || 0,
        published: !!form.published,
        order: Number(form.order) || 0,
        outcomes: outcomesText.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      setMsg("Đã lưu thay đổi");
      onSaved?.();
    } catch (e) {
      setMsg(e.message || "Không lưu được thay đổi");
    } finally {
      setBusy("");
    }
  };

  const removeCourse = async () => {
    if (!window.confirm(`Xóa khóa học “${course.title}” và toàn bộ bài học bên trong?`)) return;
    setBusy("delete");
    try {
      await base44.entities.Lesson.deleteMany({ course_id: course.id });
      await base44.entities.Course.delete(course.id);
      onDeleted?.();
    } catch (e) {
      setMsg(e.message || "Không xóa được khóa học");
    } finally {
      setBusy("");
    }
  };

  const removeLesson = async (lesson) => {
    if (!window.confirm(`Xóa bài “${lesson.title}”?`)) return;
    await base44.entities.Lesson.delete(lesson.id);
    loadLessons();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-700">Thông tin khóa học</h2>
          <div className="flex items-center gap-2">
            {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
            <Button variant="ghost" size="sm" className="gap-2 text-rose-600" onClick={removeCourse} disabled={!!busy}>
              <Trash2 className="h-4 w-4" /> Xóa khóa
            </Button>
            <Button size="sm" className="gap-2" onClick={save} disabled={!!busy}>
              {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Tên khóa học</Label>
            <Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Đường dẫn (slug)</Label>
            <Input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Ngành nghề</Label>
            <Input value={form.category || ""} onChange={(e) => set("category", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Cấp độ</Label>
            <Select value={form.level || "co-ban"} onValueChange={(v) => set("level", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="co-ban">Cơ bản</SelectItem>
                <SelectItem value="trung-cap">Trung cấp</SelectItem>
                <SelectItem value="nang-cao">Nâng cao</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Thời lượng (phút)</Label>
            <Input type="number" value={form.duration_min ?? 0} onChange={(e) => set("duration_min", e.target.value)} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label>Mô tả ngắn</Label>
            <Input value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label>Mô tả chi tiết</Label>
            <Textarea rows={3} value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label>Bạn sẽ làm được gì (mỗi dòng một ý)</Label>
            <Textarea rows={3} value={outcomesText} onChange={(e) => setOutcomesText(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Ảnh bìa</Label>
            <div className="mt-1.5 flex items-center gap-2">
              {form.thumbnail_url && <Image src={form.thumbnail_url} alt="Ảnh bìa" className="h-10 w-16 rounded-lg border border-border" />}
              <Input value={form.thumbnail_url || ""} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="Dán URL ảnh" />
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-input px-2.5 py-2 text-xs font-500 hover:bg-muted">
                {busy === "thumb" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Tải ảnh
                <input type="file" accept="image/*" className="hidden" onChange={uploadThumbnail} />
              </label>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={!!form.published} onCheckedChange={(v) => set("published", v)} />
              <span className="text-sm">{form.published ? "Đang hiển thị công khai" : "Bản nháp"}</span>
            </div>
            <div className="w-20">
              <Label>Thứ tự</Label>
              <Input type="number" value={form.order ?? 0} onChange={(e) => set("order", e.target.value)} className="mt-1.5" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-700">Chương & bài học ({lessons.length})</h2>
          <Button size="sm" className="gap-2" onClick={() => setLessonDialog({})}>
            <Plus className="h-4 w-4" /> Thêm bài học
          </Button>
        </div>
        <div className="mt-4">
          <CourseLessonList
            lessons={lessons}
            onEdit={(lesson) => setLessonDialog(lesson)}
            onDelete={removeLesson}
          />
        </div>
      </section>

      {lessonDialog && (
        <LessonEditorDialog
          courseId={course.id}
          lesson={lessonDialog.id ? lessonDialog : null}
          defaultOrder={lessons.length + 1}
          open={!!lessonDialog}
          onOpenChange={(open) => !open && setLessonDialog(null)}
          onSaved={() => {
            setLessonDialog(null);
            loadLessons();
          }}
        />
      )}
    </div>
  );
}