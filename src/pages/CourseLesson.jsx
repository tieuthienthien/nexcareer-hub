import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import QuizRunner from "@/components/course/QuizRunner";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Loader2, Lock, LogIn, ListChecks, Video } from "lucide-react";

export default function CourseLesson() {
  const { slug, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async (userId) => {
    const courseRes = await base44.entities.Course.filter({ slug }, { limit: 1 });
    const found = courseRes.items?.[0] || null;
    setCourse(found);
    if (!found) return;
    const lessonRes = await base44.entities.Lesson.filter({ course_id: found.id }, { sort: "order_index", limit: 200 });
    setLessons(lessonRes.items || []);
    if (userId) {
      const enrollmentRes = await base44.entities.Enrollment.filter({ user_id: userId, course_id: found.id }, { limit: 1 });
      setEnrollment(enrollmentRes.items?.[0] || null);
    }
  };

  useEffect(() => {
    setLoading(true);
    load(user?.id)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, lessonId, user?.id]);

  const lesson = lessons.find((item) => item.id === lessonId);
  const position = lessons.findIndex((item) => item.id === lessonId);
  const prev = position > 0 ? lessons[position - 1] : null;
  const next = position >= 0 && position < lessons.length - 1 ? lessons[position + 1] : null;
  const completedIds = new Set(enrollment?.completed_lesson_ids || []);
  const isDone = lesson ? completedIds.has(lesson.id) : false;
  const progress = lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : 0;
  const goTo = (item) => navigate(`/khoa-hoc/${slug}/bai-hoc/${item.id}`);

  const markDone = async () => {
    if (!enrollment || !lesson) return;
    setBusy(true);
    try {
      const ids = [...new Set([...(enrollment.completed_lesson_ids || []), lesson.id])];
      await base44.entities.Enrollment.update(enrollment.id, {
        completed_lesson_ids: ids,
        last_activity_at: new Date().toISOString(),
      });
      setEnrollment({ ...enrollment, completed_lesson_ids: ids });
      if (next) goTo(next);
      else navigate(`/khoa-hoc/${slug}`);
    } catch (e) {
      // giữ nguyên trạng thái nếu cập nhật thất bại
    }
    setBusy(false);
  };

  const onGraded = async () => {
    try {
      const fresh = await base44.entities.Enrollment.get(enrollment.id);
      setEnrollment(fresh);
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!course || !lesson) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-700">Không tìm thấy bài học</h1>
        <Button asChild className="mt-5">
          <Link to="/khoa-hoc">Về danh sách khóa học</Link>
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-700">Đăng nhập để học</h1>
        <p className="mt-2 text-sm text-muted-foreground">Nội dung bài học chỉ dành cho học viên đã đăng nhập.</p>
        <Button onClick={() => navigate("/login")} className="mt-5 gap-2">
          <LogIn className="h-4 w-4" /> Đăng nhập
        </Button>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-700">Bạn chưa tham gia khóa học này</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mở khóa khóa học để bắt đầu học toàn bộ nội dung.</p>
        <Button asChild className="mt-5">
          <Link to={`/khoa-hoc/${slug}`}>Xem khóa học</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/khoa-hoc/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {course.title}
        </Link>
        <span className="text-xs text-muted-foreground">
          Chương {lesson.chapter_index}. {lesson.chapter_title} · {position + 1}/{lessons.length}
        </span>
      </div>

      <Progress value={progress} className="mt-3 h-1.5" />

      <article className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-xs font-600 text-primary">
          {lesson.type === "video" ? <Video className="h-3.5 w-3.5" /> : lesson.type === "quiz" ? <ListChecks className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
          {lesson.type === "video" ? "Video case" : lesson.type === "quiz" ? "Câu hỏi cuối chương" : "Bài giảng"}
          {isDone && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Đã học
            </span>
          )}
        </div>
        <h1 className="mt-2 font-heading text-2xl font-800 tracking-tight">{lesson.title}</h1>

        {lesson.type === "reading" && (
          <div className="mt-5">
            <div className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{lesson.body}</div>
            {lesson.code_example && (
              <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                <code>{lesson.code_example}</code>
              </pre>
            )}
            <Button onClick={markDone} disabled={busy} className="mt-6 gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Đã học xong
            </Button>
          </div>
        )}

        {lesson.type === "video" && (
          <div className="mt-5">
            <div className="overflow-hidden rounded-2xl border border-border bg-black">
              <video src={lesson.video_url} controls playsInline className="aspect-video w-full" />
            </div>
            {lesson.video_caption && <p className="mt-3 text-sm text-muted-foreground">{lesson.video_caption}</p>}
            <Button onClick={markDone} disabled={busy} className="mt-6 gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Đã học xong
            </Button>
          </div>
        )}

        {lesson.type === "quiz" && (
          <div className="mt-5">
            <QuizRunner lesson={lesson} onGraded={onGraded} />
            <Button variant="outline" onClick={() => (next ? goTo(next) : navigate(`/khoa-hoc/${slug}`))} className="mt-5 gap-2">
              {next ? "Sang nội dung tiếp theo" : "Về trang khóa học"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </article>

      <div className="mt-5 flex items-center justify-between gap-3">
        {prev ? (
          <Button variant="outline" onClick={() => goTo(prev)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> <span className="max-w-[180px] truncate">{prev.title}</span>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button variant="outline" onClick={() => goTo(next)} className="gap-2">
            <span className="max-w-[180px] truncate">{next.title}</span> <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}