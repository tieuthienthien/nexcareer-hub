import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, AlertTriangle, Lock, CheckCircle2, ArrowLeft, ChevronLeft, ChevronRight, Send } from "lucide-react";
import ExamNavigator from "@/components/exam/ExamNavigator";
import ExamQuestionPanel from "@/components/exam/ExamQuestionPanel";
import ExamAnswerArea from "@/components/exam/ExamAnswerArea";

export default function AssessmentTest() {
  const { applicationId } = useParams();
  const [app, setApp] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | intro | running | submitted | error
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [auto, setAuto] = useState(false);
  const [result, setResult] = useState(null);

  const endAtRef = useRef(0);
  const submittedRef = useRef(false);
  const answersRef = useRef({});

  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    (async () => {
      try {
        const a = await base44.entities.Application.get(applicationId);
        setApp(a);
        if (a.exam_attempt_id) {
          try {
            const attempt = await base44.entities.ExamAttempt.get(a.exam_attempt_id);
            if (attempt?.submitted_at) {
              setResult({ score: attempt.score, analysis: attempt.ai_analysis, auto: attempt.auto_submitted });
              setPhase("submitted");
              return;
            }
            if (attempt) {
              setQuestions(attempt.questions || []);
              setDuration(attempt.duration_min || 60);
              const map = {};
              for (const ans of attempt.answers || []) map[ans.question_id] = ans.answer || "";
              setAnswers(map);
              endAtRef.current = new Date(attempt.started_at).getTime() + (attempt.duration_min || 60) * 60000;
              setPhase("running");
              return;
            }
          } catch (e) {}
        }
        if (!["cv_passed", "test_invited"].includes(a.status)) {
          setError("Bạn chưa được mời làm bài thi vòng 2 hoặc đã hoàn thành bài thi.");
          setPhase("error");
          return;
        }
        setPhase("intro");
      } catch (e) {
        setError(e.response?.data?.error || e.message || "Không tải được bài thi.");
        setPhase("error");
      }
    })();
  }, [applicationId]);

  const submitExam = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({ question_id: q.question_id, answer: answersRef.current[q.question_id] || "" }));
      const res = await base44.functions.invoke("submitExam", { application_id: applicationId, answers: payload });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setResult({ score: data.score, analysis: data.analysis, auto: data.auto_submitted || isAuto });
      setAuto(!!(data.auto_submitted || isAuto));
      setPhase("submitted");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Nộp bài thất bại.");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const doAutoSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    submitExam(true);
  };

  // Đồng hồ đếm ngược + tự nộp khi hết giờ
  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      const rem = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) doAutoSubmit();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, questions.length]);

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("startExam", { application_id: applicationId });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setQuestions(data.questions || []);
      setDuration(data.duration_min || 60);
      endAtRef.current = new Date(data.started_at).getTime() + (data.duration_min || 60) * 60000;
      const map = {};
      for (const ans of data.answers || []) map[ans.question_id] = ans.answer || "";
      setAnswers(map);
      setCurrent(0);
      submittedRef.current = false;
      setPhase("running");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không bắt đầu được bài thi.");
    } finally {
      setStarting(false);
    }
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const answeredCount = questions.filter((q) => String(answers[q.question_id] || "").trim()).length;

  if (phase === "loading") {
    return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (phase === "error") {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4 text-center">
        <div>
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
          <h2 className="mt-4 max-w-md text-lg font-700">{error}</h2>
          <Button asChild className="mt-5"><Link to="/candidate-room">Về Candidate Room</Link></Button>
        </div>
      </div>
    );
  }

  if (phase === "submitted") {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-9 w-9" /></div>
          <h2 className="mt-5 text-xl font-700">Đã nộp bài thành công!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {result?.auto || auto ? "Hết giờ — hệ thống tự động nộp bài." : "Bài làm đã được ghi nhận."} HR sẽ xem và thông báo kết quả vòng 2 qua email.
          </p>
          <Button asChild className="mt-6"><Link to="/candidate-room">Về Candidate Room</Link></Button>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4 gap-2"><Link to="/candidate-room"><ArrowLeft className="h-4 w-4" /> Quay lại</Link></Button>
        <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary"><Lock className="h-3.5 w-3.5" /> Phòng thi vòng 2</div>
          <h1 className="mt-4 font-heading text-2xl font-700">{app?.job_title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{app?.company}</p>

          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-center gap-2 font-600"><Clock className="h-4 w-4" /> Quy định phòng thi</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Bài thi tối đa 60 phút, có đồng hồ đếm ngược và <b>tự động nộp khi hết giờ</b>.</li>
              <li>Đề gồm trắc nghiệm, câu hỏi ngắn và bài viết code; độ khó tăng dần.</li>
              <li>Bạn có thể chuyển qua lại giữa các câu bằng thanh điều hướng phía trên.</li>
              <li>Chỉ được làm 1 lần. Hãy kiểm tra kỹ trước khi bấm nộp.</li>
            </ul>
          </div>

          {error && <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <Button size="lg" className="mt-6 w-full gap-2" onClick={start} disabled={starting}>
            {starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang mở đề...</> : "Bắt đầu làm bài"}
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[current];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="min-w-0">
            <div className="truncate text-sm font-700">{app?.job_title}</div>
            <div className="text-[11px] text-muted-foreground">Vòng 2 · Bài thi online · {answeredCount}/{questions.length} câu đã trả lời</div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-700 ${remaining < 300 ? "bg-rose-100 text-rose-700" : "bg-primary/10 text-primary"}`}>
              <Clock className="h-4 w-4" /> {mm}:{ss}
            </div>
            <Button size="sm" onClick={() => { submittedRef.current = true; submitExam(false); }} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Nộp bài
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 pb-2 sm:px-6">
          <ExamNavigator questions={questions} answers={answers} current={current} onSelect={setCurrent} />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-2">
        <div className="min-h-[420px]">
          <ExamQuestionPanel question={question} index={current} total={questions.length} />
        </div>
        <div className="min-h-[420px]">
          <ExamAnswerArea
            question={question}
            value={answers[question?.question_id] || ""}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [question.question_id]: v }))}
          />
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-card px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Câu trước
          </Button>
          <span className="text-xs text-muted-foreground">Câu {current + 1}/{questions.length}{question?.difficulty ? ` · ${question.difficulty === "hard" ? "Khó" : question.difficulty === "medium" ? "Trung bình" : "Cơ bản"}` : ""}</span>
          <Button size="sm" onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} disabled={current >= questions.length - 1} className="gap-1.5">
            Câu tiếp <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}