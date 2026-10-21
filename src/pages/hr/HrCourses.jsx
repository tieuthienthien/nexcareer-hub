import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import CourseEditorPanel from "@/components/hr/CourseEditorPanel";
import { GraduationCap, Loader2, Plus } from "lucide-react";

export default function HrCourses() {
  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async (nextId) => {
    const res = await base44.entities.Course.list({ sort: "order", limit: 100 });
    const items = res.items || [];
    setCourses(items);
    setSelectedId((prev) => {
      const want = nextId || prev;
      return items.some((c) => c.id === want) ? want : items[0]?.id || "";
    });
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const createCourse = async () => {
    setCreating(true);
    try {
      const created = await base44.entities.Course.create({
        title: "Khóa học mới",
        slug: `khoa-hoc-${Date.now()}`,
        category: "",
        summary: "",
        level: "co-ban",
        published: false,
        duration_min: 0,
        order: courses.length + 1,
        outcomes: [],
      });
      const res = await base44.entities.Course.list({ sort: "order", limit: 100 });
      setCourses(res.items || []);
      setSelectedId(created.id);
    } finally {
      setCreating(false);
    }
  };

  const selected = courses.find((c) => c.id === selectedId) || null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-700 tracking-tight">Quản lý khóa học</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sửa trực tiếp nội dung khóa học, chương, bài giảng, câu hỏi và thay video ngay trên web.
          </p>
        </div>
        <Button onClick={createCourse} disabled={creating} className="gap-2">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Khóa học mới
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Đang tải khóa học...
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Chưa có khóa học nào. Bấm “Khóa học mới” để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl border border-border bg-card p-2">
            <div className="px-3 py-2 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">
              {courses.length} khóa học
            </div>
            <div className="max-h-[65vh] space-y-1 overflow-y-auto">
              {courses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    c.id === selectedId ? "bg-primary/10 font-600 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <div className="line-clamp-2">{c.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {c.published ? "Đang hiển thị" : "Bản nháp"} · {c.level || "co-ban"}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {selected && (
            <CourseEditorPanel
              key={selected.id}
              course={selected}
              onSaved={() => load(selected.id)}
              onDeleted={() => load()}
            />
          )}
        </div>
      )}
    </div>
  );
}