import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { groupChapters, loadLearningState, PASS_SCORE } from "@/lib/courseAccess";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Image } from "@/components/ui/image";
import CourseSyllabus from "@/components/course/CourseSyllabus";
import ChapterProgress from "@/components/course/ChapterProgress";
import ReferralPanel from "@/components/course/ReferralPanel";
import { ArrowLeft, Award, BookOpen, CheckCircle2, Clock, Loader2, Lock, LogIn, Sparkles } from "lucide-react";

const levelLabel = { "co-ban": "Cơ bản", "trung-cap": "Trung cấp", "nang-cao": "Nâng cao" };

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [issuedCode, setIssuedCode] = useState("");

  const load = async (userId) => {
    const courseRes = await base44.entities.Course.filter({ slug }, { limit: 1 });
    const found = courseRes.items?.[0] || null;
    setCourse(found);
    if (found) {
      const lessonRes = await base44.entities.Lesson.filter({ course_id: found.id }, { sort: "order_index", limit: 200 });
      setLessons(lessonRes.items || []);
    }
    if (userId) setState(await loadLearningState(userId));
  };

  useEffect(() => {
    setLoading(true);
    load(user?.id)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, user?.id]);

  const chapters = useMemo(() => groupChapters(lessons), [lessons]);
  const enrollment = state?.enrolled?.find((item) => item.course_id === course?.id);
  const completedIds = useMemo(() => new Set(enrollment?.completed_lesson_ids || []), [enrollment]);
  const progress = lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : 0;
  const quizLessons = useMemo(() => lessons.filter((lesson) => lesson.type === "quiz"), [lessons]);
  const doneQuizzes = quizLessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const finalScore = Number(enrollment?.final_score) || 0;
  const allQuizzesDone = quizLessons.length > 0 && doneQuizzes === quizLessons.length;
  const certificateCode = issuedCode || enrollment?.certificate_code || "";

  const start = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (enrollment) {
      const nextLesson = lessons.find((lesson) => !completedIds.has(lesson.id)) || lessons[0];
      if (nextLesson) navigate(`/khoa-hoc/${slug}/bai-hoc/${nextLesson.id}`);
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const res = await base44.functions.invoke("enrollCourse", { course_id: course.id });
      const data = res.data || res;
      if (data.error) setNotice(data.error);
      else {
        setState(await loadLearningState(user.id));
        setNotice("Đã mở khóa khóa học. Chúc bạn học tốt!");
      }
    } catch (e) {
      setNotice(e.response?.data?.error || e.message || "Không mở được khóa học.");
    }
    setBusy(false);
  };

  const claimCertificate = async () => {
    setBusy(true);
    setNotice("");
    try {
      const res = await base44.functions.invoke("issueCertificate", { course_id: course.id });
      const data = res.data || res;
      if (data.error) setNotice(data.error);
      else {
        setIssuedCode(data.certificate?.code || "");
        setState(await loadLearningState(user.id));
      }
    } catch (e) {
      setNotice(e.response?.data?.error || e.message || "Không cấp được chứng chỉ.");
    }
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-700">Không tìm thấy khóa học</h1>
        <p className="mt-2 text-sm text-muted-foreground">Khóa học có thể đã được ẩn hoặc đường dẫn không đúng.</p>
        <Button asChild className="mt-5">
          <Link to="/khoa-hoc">Về danh sách khóa học</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/khoa-hoc" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Tất cả khóa học
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="aspect-[16/8] overflow-hidden">
              <Image src={course.thumbnail_url} alt={course.title} fittingType="fill" className="h-full w-full object-cover" />
            </div>
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-600 text-primary">{course.category}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 font-500 text-muted-foreground">{levelLabel[course.level] || "Cơ bản"}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {course.duration_min || 90} phút
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" /> {chapters.length} chương · {lessons.length} nội dung
                </span>
              </div>
              <h1 className="mt-3 font-heading text-2xl font-800 tracking-tight sm:text-3xl">{course.title}</h1>
              <p className="mt-2 text-muted-foreground">{course.summary}</p>
              {course.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{course.description}</p>}
              {(course.outcomes || []).length > 0 && (
                <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-700">Sau khóa học bạn sẽ</h3>
                  <ul className="mt-2 space-y-1.5">
                    {course.outcomes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <h2 className="mt-8 font-heading text-xl font-700">Nội dung khóa học</h2>
          <div className="mt-4">
            <CourseSyllabus
              chapters={chapters}
              completedIds={completedIds}
              enrolled={!!enrollment}
              slug={slug}
              onLocked={start}
            />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            {!isAuthenticated ? (
              <>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-heading text-base font-700">Đăng nhập để học</h3>
                <p className="mt-1 text-sm text-muted-foreground">Bạn cần đăng nhập để mở khóa bài học và lưu tiến độ.</p>
                <Button onClick={start} className="mt-4 w-full gap-2">
                  <LogIn className="h-4 w-4" /> Đăng nhập để học
                </Button>
              </>
            ) : enrollment ? (
              <>
                <h3 className="font-heading text-base font-700">Tiến độ của bạn</h3>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Toàn khóa</span>
                    <span className="font-600 text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="mt-1.5 h-2" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {completedIds.size}/{lessons.length} nội dung · {doneQuizzes}/{quizLessons.length} bài kiểm tra
                  </p>
                </div>
                <div className="mt-4 rounded-2xl bg-muted/40 p-3">
                  <div className="text-[11px] font-600 uppercase tracking-wide text-muted-foreground">Điểm cuối khóa</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-heading text-2xl font-800 text-primary">{finalScore}</span>
                    <span className="text-xs text-muted-foreground">/100 · đạt {PASS_SCORE}</span>
                  </div>
                </div>

                {certificateCode ? (
                  <Button asChild className="mt-4 w-full gap-2">
                    <Link to="/chung-chi">
                      <Award className="h-4 w-4" /> Xem chứng chỉ của tôi
                    </Link>
                  </Button>
                ) : allQuizzesDone && finalScore >= PASS_SCORE ? (
                  <Button onClick={claimCertificate} disabled={busy} className="mt-4 w-full gap-2">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />} Nhận chứng chỉ
                  </Button>
                ) : (
                  <Button onClick={start} disabled={busy} className="mt-4 w-full gap-2">
                    <BookOpen className="h-4 w-4" /> Vào học tiếp
                  </Button>
                )}

                {allQuizzesDone && finalScore < PASS_SCORE && (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Điểm hiện tại {finalScore}/100 chưa đạt {PASS_SCORE}. Hãy làm lại bài kiểm tra để cải thiện điểm và nhận chứng chỉ.
                  </p>
                )}
              </>
            ) : state === null ? (
              <>
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="mt-3 h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
              </>
            ) : (
              <>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-heading text-base font-700">Bắt đầu học</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state?.remaining > 0
                    ? `Bạn còn ${state.remaining} khóa được mở. Tham gia ngay để học toàn bộ nội dung.`
                    : "Bạn đã dùng hết số khóa được mở. Hãy mời bạn bè để mở thêm khóa học."}
                </p>
                <Button onClick={start} disabled={busy || state?.remaining === 0} className="mt-4 w-full gap-2">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                  {state?.remaining > 0 ? "Học miễn phí" : "Cần mở thêm khóa"}
                </Button>
              </>
            )}

            {notice && <p className="mt-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{notice}</p>}
          </div>

          {isAuthenticated && enrollment && (
            <div className="rounded-3xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-700">Tiến độ từng chương</h3>
              <ChapterProgress chapters={chapters} completedIds={completedIds} scores={enrollment.chapter_scores} />
            </div>
          )}

          {isAuthenticated && user?.id && (
            <ReferralPanel userId={user.id} remaining={state?.remaining ?? 0} invited={state?.invited ?? 0} />
          )}
        </aside>
      </div>
    </div>
  );
}