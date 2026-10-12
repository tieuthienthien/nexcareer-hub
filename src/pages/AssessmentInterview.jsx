import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Video, Mic, ShieldCheck, AlertTriangle, CheckCircle2, ArrowLeft, Camera, ArrowRight } from "lucide-react";

const PREP_SEC = 30;
const ANSWER_SEC = 90;

export default function AssessmentInterview() {
  const { applicationId } = useParams();
  const [app, setApp] = useState(null);
  const [job, setJob] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | consent | setup | question | uploading | done | error
  const [error, setError] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [mode, setMode] = useState("prep"); // prep | recording | done
  const [count, setCount] = useState(PREP_SEC);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const [camReady, setCamReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const a = await base44.entities.Application.get(applicationId);
        setApp(a);
        if (a.status !== "interview_invited") { setPhase("error"); setError("Bạn chưa được mời phỏng vấn hoặc đã hoàn thành."); return; }
        const j = await base44.entities.Job.get(a.job_id);
        setJob(j);
        if (!j?.interview_questions?.length) { setPhase("error"); setError("Vị trí này chưa có câu hỏi phỏng vấn."); return; }
        setPhase("consent");
      } catch (e) { setPhase("error"); setError(e.message || "Không tải được phỏng vấn."); }
    })();
    return () => stopStream();
  }, [applicationId]);

  const stopStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") { try { recorderRef.current.stop(); } catch (e) {} }
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamReady(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamReady(true);
    } catch (e) {
      setError("Không truy cập được camera/micro. Vui lòng cấp quyền trong trình duyệt.");
      setPhase("error");
    }
  };

  const beginSetup = async () => {
    setPhase("setup");
    await startCamera();
  };

  const beginQuestions = () => setPhase("question");

  // prep / record timer per question
  useEffect(() => {
    if (phase !== "question") return;
    setMode("prep");
    setCount(PREP_SEC);
    timerRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(timerRef.current); startRecording(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, qIndex]);

  const startRecording = () => {
    setMode("recording");
    setCount(ANSWER_SEC);
    chunksRef.current = [];
    const stream = streamRef.current;
    if (!stream) return;
    try {
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => uploadAnswer();
      rec.start();
    } catch (e) {
      setError("Trình duyệt không hỗ trợ ghi hình.");
      setPhase("error");
      return;
    }
    timerRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(timerRef.current); stopRecording(); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  };

  const uploadAnswer = async () => {
    setMode("uploading");
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000) || ANSWER_SEC - count;
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file: new File([blob], `q${qIndex}.webm`, { type: "video/webm" }) });
      await base44.entities.InterviewAnswer.create({
        application_id: applicationId,
        question_index: qIndex,
        question_text: job.interview_questions[qIndex],
        video_uri: up.file_uri,
        duration_sec: duration,
      });
      nextQuestion();
    } catch (e) {
      setError(e.message || "Tải lên câu trả lời thất bại.");
      setPhase("error");
    }
  };

  const nextQuestion = () => {
    if (qIndex + 1 < job.interview_questions.length) {
      setQIndex((i) => i + 1);
    } else {
      finishInterview();
    }
  };

  const finishInterview = async () => {
    setPhase("uploading");
    stopStream();
    try {
      await base44.functions.invoke("submitInterview", { application_id: applicationId });
      setPhase("done");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Lỗi hoàn tất phỏng vấn.");
      setPhase("error");
    }
  };

  if (phase === "loading") return <Center><Loader2 className="h-8 w-8 animate-spin text-primary" /></Center>;
  if (phase === "error") return (
    <Center>
      <AlertTriangle className="h-10 w-10 text-rose-500" />
      <h2 className="mt-4 text-lg font-700">{error}</h2>
      <Button asChild className="mt-5"><Link to="/candidate-room">Về Dashboard</Link></Button>
    </Center>
  );
  if (phase === "done") return (
    <Center>
      <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-9 w-9" /></div>
      <h2 className="mt-5 text-xl font-700">Hoàn tất phỏng vấn!</h2>
      <p className="mt-2 text-sm text-muted-foreground">Hội đồng tuyển dụng sẽ đánh giá và ra quyết định cuối. Kết quả sẽ gửi qua email.</p>
      <Button asChild className="mt-6"><Link to="/candidate-room">Về Dashboard cá nhân</Link></Button>
    </Center>
  );

  if (phase === "consent") return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-2"><Link to="/candidate-room"><ArrowLeft className="h-4 w-4" /> Quay lại</Link></Button>
      <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary"><Video className="h-3.5 w-3.5" /> Phỏng vấn video vòng 3</div>
        <h1 className="mt-4 font-heading text-2xl font-700">{job?.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{app?.company} · {job?.interview_questions?.length} câu hỏi</p>
        <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-600"><ShieldCheck className="h-4 w-4" /> Quyền riêng tư & chống gian lận</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Hệ thống sẽ yêu cầu quyền camera và micro. Bản ghi chỉ lưu riêng tư và chỉ HR có quyền xem.</li>
            <li>Vui lòng điều chỉnh camera quay thấy rõ từ lưng, cánh tay đến bàn tay đang thao tác.</li>
            <li>Mỗi câu hỏi: 30 giây chuẩn bị, rồi tối đa 90 giây trả lời trước camera.</li>
            <li>Kết quả phân tích AI chỉ mang tính tham khảo; hội đồng con người ra quyết định cuối.</li>
          </ul>
        </div>
        <Button size="lg" className="mt-6 w-full" onClick={beginSetup}>Đồng ý & tiếp tục</Button>
      </div>
    </div>
  );

  if (phase === "setup") return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
        <h1 className="font-heading text-xl font-700">Kiểm tra khung hình</h1>
        <p className="mt-1 text-sm text-muted-foreground">Đảm bảo camera quay thấy rõ từ lưng, cánh tay đến bàn tay.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-black aspect-video">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          {camReady ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-600 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Camera & micro sẵn sàng</span>
            : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-600 text-amber-700"><Loader2 className="h-4 w-4 animate-spin" /> Đang cấp quyền...</span>}
        </div>
        <Button size="lg" className="mt-5 w-full" disabled={!camReady} onClick={beginQuestions}>Bắt đầu phỏng vấn</Button>
      </div>
    </div>
  );

  // question phase
  const total = job?.interview_questions?.length || 0;
  const currentQ = job?.interview_questions?.[qIndex];
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="text-sm font-600">Câu {qIndex + 1}/{total}</div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-700 ${mode === "recording" ? "bg-rose-100 text-rose-700" : "bg-primary/10 text-primary"}`}>
            {mode === "recording" ? <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> : <Mic className="h-4 w-4" />}
            {mode === "prep" ? "Chuẩn bị" : mode === "recording" ? "Đang ghi" : "Đang lưu"}
          </span>
          <span className="text-sm font-700 tabular-nums">{count}s</span>
        </div>
      </header>
      <main className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-black aspect-video lg:aspect-auto">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Câu hỏi chuyên môn</div>
            <p className="mt-2 text-lg font-600 leading-relaxed">{currentQ}</p>
          </div>
          <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
            {mode === "prep" && <>Bạn có <b>{count}s</b> để chuẩn bị. Ghi hình sẽ tự động bắt đầu.</>}
            {mode === "recording" && <>Hãy trả lời trước camera. Còn <b>{count}s</b>. Hết giờ hệ thống tự dừng.</>}
            {mode === "uploading" && <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu câu trả lời...</span>}
          </div>
          <div className="mt-auto flex gap-2 pt-4">
            {mode === "prep" && <Button variant="outline" onClick={() => { clearInterval(timerRef.current); startRecording(); }}>Bắt đầu trả lời ngay</Button>}
            {mode === "recording" && <Button variant="outline" onClick={stopRecording}>Dừng & nộp câu này</Button>}
          </div>
        </div>
      </main>
    </div>
  );
}

function Center({ children }) {
  return <div className="grid min-h-[70vh] place-items-center px-4 text-center">{children}</div>;
}