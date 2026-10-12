import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck, Clock, AlertTriangle, Lock, CheckCircle2, ArrowLeft } from "lucide-react";

export default function AssessmentTest() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [job, setJob] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | intro | running | submitted | error
  const [error, setError] = useState("");
  const [config, setConfig] = useState(null);
  const [answer, setAnswer] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [fullscreenOn, setFullscreenOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [auto, setAuto] = useState(false);
  const [score, setScore] = useState(null);
  const endAtRef = useRef(0);
  const submittedRef = useRef(false);
  const answerRef = useRef("");

  useEffect(() => {
    (async () => {
      try {
        const a = await base44.entities.Application.get(applicationId);
        setApp(a);
        if (a.status !== "test_invited") { setPhase("error"); setError("Bạn chưa được mời làm bài thi hoặc đã nộp."); return; }
        const j = await base44.entities.Job.get(a.job_id);
        setJob(j);
        if (j?.test_starter_code) { setAnswer(j.test_starter_code); answerRef.current = j.test_starter_code; }
        setPhase("intro");
      } catch (e) {
        setPhase("error"); setError(e.message || "Không tải được bài thi.");
      }
    })();
  }, [applicationId]);

  // Kiosk guards while running
  useEffect(() => {
    if (phase !== "running") return;
    const block = (e) => { e.preventDefault(); setWarnings((w) => w + 1); };
    const onVis = () => { if (document.hidden) setWarnings((w) => w + 1); };
    const onFs = () => setFullscreenOn(!!document.fullscreenElement);
    document.addEventListener("copy", block);
    document.addEventListener("paste", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      const rem = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0 && !submittedRef.current) {
        submittedRef.current = true;
        setAuto(true);
        doSubmit(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) { try { await el.requestFullscreen(); } catch (e) {} }
      const res = await base44.functions.invoke("startTest", { application_id: applicationId });
      const data = res.data || res;
      setConfig(data);
      endAtRef.current = new Date(data.test_started_at).getTime() + (data.duration_min || 15) * 60 * 1000;
      setPhase("running");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không bắt đầu được bài thi.");
      setPhase("error");
    }
  };

  const doSubmit = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitTest", { application_id: applicationId, answer: answerRef.current });
      const data = res.data || res;
      setAuto(!!data.auto_submitted || isAuto);
      setScore(data.score);
      setPhase("submitted");
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Nộp bài thất bại.");
      setSubmitting(false);
      if (!isAuto) submittedRef.current = false;
    }
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const charLimit = config?.test_char_limit || job?.test_char_limit || 2000;
  const isTechnical = (config?.test_type || job?.test_type) === "technical";
  const prompt = config?.test_prompt || job?.test_prompt;

  if (phase === "loading") return <Center><Loader2 className="h-8 w-8 animate-spin text-primary" /></Center>;

  if (phase === "error") return (
    <Center>
      <AlertTriangle className="h-10 w-10 text-rose-500" />
      <h2 className="mt-4 text-lg font-700">{error}</h2>
      <Button asChild className="mt-5"><Link to="/candidate-room">Về Dashboard</Link></Button>
    </Center>
  );

  if (phase === "submitted") return (
    <Center>
      <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-9 w-9" /></div>
      <h2 className="mt-5 text-xl font-700">Đã nộp bài thành công!</h2>
      <p className="mt-2 text-sm text-muted-foreground">{auto ? "Hết giờ — hệ thống tự động nộp bài." : "Bài làm đã được ghi nhận."}</p>
      {score != null && <p className="mt-1 text-sm">Điểm AI tham khảo: <b>{score}/100</b></p>}
      <Button asChild className="mt-6"><Link to="/candidate-room">Về Dashboard cá nhân</Link></Button>
    </Center>
  );

  if (phase === "intro") return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-2"><Link to="/candidate-room"><ArrowLeft className="h-4 w-4" /> Quay lại</Link></Button>
      <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary"><Lock className="h-3.5 w-3.5" /> Phòng thi vòng 2</div>
        <h1 className="mt-4 font-heading text-2xl font-700">{job?.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{app?.company}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Info label="Loại bài" value={job?.test_type === "technical" ? "Kỹ thuật (code)" : "Tình huống"} />
          <Info label="Thời gian" value={`${job?.test_duration_min || 15} phút`} />
          <Info label="Hình thức" value="Trực tuyến" />
          <Info label="Lượt nộp" value="1 lần duy nhất" />
        </div>

        <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-600"><ShieldCheck className="h-4 w-4" /> Quy tắc phòng thi</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Bài thi chạy ở chế độ toàn màn hình. Hệ thống ghi nhận nếu bạn thoát toàn màn hình, chuyển tab hoặc copy/paste.</li>
            <li>Đồng hồ được tính theo máy chủ; hết giờ hệ thống tự nộp bài.</li>
            <li>Sau khi nộp, bạn không thể chỉnh sửa. Trình duyệt không thể ngăn tuyệt đối việc dùng thiết bị khác — vui lòng tự giác.</li>
          </ul>
        </div>

        <Button size="lg" className="mt-6 w-full" onClick={start}>Tôi đã hiểu — Bắt đầu làm bài</Button>
      </div>
    </div>
  );

  // running
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="truncate text-sm font-600">{job?.title} · {app?.company}</div>
          <div className="text-[11px] text-muted-foreground">{isTechnical ? "Bài kỹ thuật" : "Bài tình huống"}</div>
        </div>
        <div className="flex items-center gap-3">
          {!fullscreenOn && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-600 text-amber-700"><AlertTriangle className="h-3 w-3" /> Đã thoát toàn màn hình</span>}
          {warnings > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-600 text-rose-700"><AlertTriangle className="h-3 w-3" /> {warnings} cảnh báo</span>}
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-700 ${remaining < 60 ? "bg-rose-100 text-rose-700" : "bg-primary/10 text-primary"}`}><Clock className="h-4 w-4" /> {mm}:{ss}</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-base font-700">Đề bài</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{prompt || "Đề bài đang cập nhật."}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-700">{isTechnical ? "Trình soạn code" : "Câu trả lời"}</h2>
              {!isTechnical && <span className="text-xs text-muted-foreground">{answer.length}/{charLimit} ký tự</span>}
            </div>
            <Textarea
              rows={isTechnical ? 18 : 10}
              value={answer}
              onChange={(e) => {
                if (!isTechnical && e.target.value.length > charLimit) return;
                setAnswer(e.target.value);
                answerRef.current = e.target.value;
              }}
              placeholder={isTechnical ? "Viết code của bạn vào đây..." : "Nhập câu trả lời..."}
              className={`mt-3 ${isTechnical ? "font-mono text-sm" : ""}`}
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <p className="text-xs text-muted-foreground">Sau khi nộp bạn không thể sửa lại.</p>
          <Button onClick={() => doSubmit(false)} disabled={submitting} className="gap-2">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang nộp...</> : "Nộp bài"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function Center({ children }) {
  return <div className="grid min-h-[70vh] place-items-center px-4 text-center">{children}</div>;
}
function Info({ label, value }) {
  return <div className="rounded-lg bg-muted/40 px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="text-sm font-600">{value}</div></div>;
}