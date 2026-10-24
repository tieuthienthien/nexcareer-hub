import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Clock, Send, Lock, AlertTriangle, Check, MessageSquare, Ticket } from "lucide-react";
import CodeWorkspace from "@/components/sim/CodeWorkspace";
import SimulationResult from "@/components/sim/SimulationResult";
import { runTests, summarize } from "@/lib/simulationRunner";

function mmss(sec) {
  const s = Math.max(0, Number(sec) || 0);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function SimulationRunner() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(null);
  const [activeId, setActiveId] = useState("");
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [flags, setFlags] = useState({ tab_switches: 0, pastes: 0, test_runs: 0 });
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [savedAt, setSavedAt] = useState("");
  const submittedRef = useRef(false);

  const call = async (action, payload = {}) => {
    const res = await base44.functions.invoke("simulationAccess", { token, action, ...payload });
    return res.data || {};
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await call("load");
        if (d.error) throw new Error(d.error);
        if (d.locked) {
          setLocked(d);
          setRemaining(0);
          return;
        }
        setData(d);
        const stored = d.attempt?.answers || {};
        const initial = {};
        (d.simulation?.tasks || []).forEach((t) => {
          if (t.type === "code") initial[t.id] = { code: stored[t.id]?.code || t.starter_code || "", results: stored[t.id]?.results || null };
          else initial[t.id] = stored[t.id] || (t.type === "mcq" ? {} : "");
        });
        setAnswers(initial);
        setFlags(d.attempt?.flags || { tab_switches: 0, pastes: 0, test_runs: 0 });
        setRemaining(d.remaining_sec || 0);
        setActiveId(d.simulation?.tasks?.[0]?.id || "");
      } catch (e) {
        setError(e.response?.data?.error || e.message || "Không mở được bài làm.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async (auto = false) => {
    if (submittedRef.current || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const finalAnswers = { ...answers };
      for (const task of data?.simulation?.tasks || []) {
        if (task.type === "code") {
          const current = finalAnswers[task.id] || {};
          if (!current.results) {
            const run = await runTests(task.id, current.code || "");
            finalAnswers[task.id] = { code: current.code || "", results: summarize(run.results) };
          } else {
            finalAnswers[task.id] = { code: current.code || "", results: current.results };
          }
        }
      }
      const res = await call("submit", { answers: finalAnswers, flags });
      if (res.error) throw new Error(res.error);
      submittedRef.current = true;
      setResult(res.result || null);
      if (auto) setError("Hết giờ — bài làm đã được nộp tự động.");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không nộp được bài làm.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!data || result || locked) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [data, result, locked]);

  useEffect(() => {
    if (!data || result || locked) return;
    const id = setInterval(() => {
      call("save", { answers, flags })
        .then(() => setSavedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })))
        .catch(() => null);
    }, 30000);
    return () => clearInterval(id);
  }, [data, result, locked, answers, flags]);

  useEffect(() => {
    if (!data || result || locked) return;
    const onVisibility = () => {
      if (document.hidden) setFlags((f) => ({ ...f, tab_switches: (f.tab_switches || 0) + 1 }));
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [data, result, locked]);

  const activeTask = useMemo(() => (data?.simulation?.tasks || []).find((t) => t.id === activeId), [data, activeId]);

  const patchAnswer = (taskId, patch) => {
    setAnswers((prev) => ({ ...prev, [taskId]: { ...(typeof prev[taskId] === "object" ? prev[taskId] : {}), ...patch } }));
  };

  const runCode = async (task) => {
    const current = answers[task.id] || {};
    setRunning(true);
    try {
      const run = await runTests(task.id, current.code || "");
      setResults((r) => ({ ...r, [task.id]: run }));
      const summary = summarize(run.results);
      patchAnswer(task.id, { results: summary });
      setFlags((f) => ({ ...f, test_runs: (f.test_runs || 0) + 1 }));
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-muted/30"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang mở bài mô phỏng...</div></div>;
  }

  if (locked) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground"><Lock className="h-6 w-6" /></div>
          <h1 className="mt-3 font-heading text-xl font-700">
            {locked.reason === "submitted" ? "Bài làm đã được nộp" : "Link làm bài đã hết hạn"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {locked.reason === "submitted"
              ? "Mỗi lời mời chỉ được làm bài một lần. Dưới đây là kết quả bạn đã nộp."
              : "Vui lòng liên hệ HR để được gửi lời mời mới."}
          </p>
        </div>
        {locked.attempt && (
          <SimulationResult
            simulation={locked.simulation}
            result={{
              score: locked.attempt.score,
              passed: locked.attempt.passed,
              pass_score: locked.simulation?.pass_score,
              task_scores: locked.attempt.task_scores || [],
              ai_report: locked.attempt.ai_report || {},
              time_spent_sec: 0,
              certificate: !!locked.attempt.passed,
            }}
          />
        )}
      </div>
    );
  }

  if (error && !data) {
    return <div className="mx-auto max-w-lg p-6"><div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{error}</div></div>;
  }

  if (result) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        <SimulationResult result={result} simulation={data.simulation} />
      </div>
    );
  }

  const tasks = data?.simulation?.tasks || [];
  const answered = (t) => {
    const a = answers[t.id];
    if (t.type === "code") return !!(a?.results && a.results.passed > 0);
    if (t.type === "mcq") return Object.keys(a || {}).length === data.mcq.length;
    return String(a || "").trim().length > 40;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-sm font-700 sm:text-base">{data.simulation.name}</h1>
          <p className="text-[11px] text-muted-foreground">Vòng 2 · Job Simulation · {data.simulation.duration_min} phút · Đạt từ {data.simulation.pass_score} điểm</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-700 tabular-nums ${remaining < 300 ? "bg-rose-100 text-rose-700" : "bg-primary/10 text-primary"}`}>
            <Clock className="h-4 w-4" /> {mmss(remaining)}
          </span>
          <Button size="sm" onClick={() => submit(false)} disabled={submitting} className="gap-1.5">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Nộp bài
          </Button>
        </div>
      </header>

      {data.simulation.description && (
        <div className="mx-auto mt-3 max-w-[1400px] px-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-[11px] font-700 uppercase tracking-wide text-primary">Bối cảnh công việc</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{data.simulation.description}</p>
          </div>
        </div>
      )}

      <div className="grid gap-3 p-3 lg:grid-cols-[250px_1fr_1.1fr] lg:items-start">
        <aside className="space-y-2 rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs font-700 uppercase tracking-wide text-muted-foreground"><MessageSquare className="h-3.5 w-3.5" /> Tin nhắn & ticket</div>
          <div className="rounded-xl bg-primary/10 p-2.5">
            <p className="text-[11px] font-700 text-primary">Trưởng nhóm · Đội Thanh toán</p>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">
              Chào bạn, mừng bạn gia nhập đội. Hôm nay có 1 ticket sản xuất và 1 yêu cầu từ PM. Bạn xử lý lần lượt theo thứ tự nhiệm vụ bên dưới nhé.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 p-2.5">
            <p className="inline-flex items-center gap-1 text-[11px] font-700"><Ticket className="h-3 w-3" /> Ticket #4821</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Khách bị tính sai giảm giá đơn hàng — 2 voucher nhưng chỉ trừ 1.</p>
          </div>
          <div className="rounded-xl border border-border/70 p-2.5">
            <p className="text-[11px] font-700">PM · Yêu cầu tính năng</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Đối tác gọi API thanh toán quá nhiều — cần rate limiter.</p>
          </div>
          <div className="rounded-xl border border-border/70 p-2.5">
            <p className="text-[11px] font-700">On-call · 02:00</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Tỉ lệ lỗi thanh toán tăng 32% sau deploy. Cần xử lý theo quy trình sự cố.</p>
          </div>
          <p className="pt-1 text-[11px] text-muted-foreground">{savedAt ? `Đã tự lưu lúc ${savedAt}` : "Bài làm tự lưu mỗi 30 giây"}</p>
        </aside>

        <main className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {tasks.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-600 transition-colors ${
                  activeId === t.id ? "border-primary bg-primary/10 text-primary" : answered(t) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {answered(t) ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>} {t.title}
              </button>
            ))}
          </div>

          {activeTask && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-700">{activeTask.title}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-700 text-muted-foreground">{activeTask.points} điểm</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{activeTask.prompt}</p>

              {activeTask.type === "mcq" && (
                <div className="mt-4 space-y-4">
                  {data.mcq.map((q, qi) => (
                    <div key={q.id}>
                      <p className="text-sm font-600">Câu {qi + 1}. {q.prompt}</p>
                      <div className="mt-1.5 space-y-1.5">
                        {q.options.map((opt, oi) => {
                          const chosen = (answers[activeTask.id] || {})[q.id] === oi;
                          return (
                            <button
                              key={opt}
                              onClick={() => patchAnswer(activeTask.id, { [q.id]: oi })}
                              className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${chosen ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/60"}`}
                            >
                              <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[10px] font-700 ${chosen ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"}`}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <section className="space-y-3 lg:sticky lg:top-[76px]">
          {activeTask?.type === "code" && (
            <>
              <p className="text-[11px] text-muted-foreground">Chạy kiểm thử để xem kết quả. Có test ẩn — cố gắng xử lý cả ca biên.</p>
              <CodeWorkspace
                value={answers[activeTask.id]?.code || ""}
                onChange={(v) => patchAnswer(activeTask.id, { code: v })}
                onPaste={() => setFlags((f) => ({ ...f, pastes: (f.pastes || 0) + 1 }))}
                onRun={() => runCode(activeTask)}
                running={running}
                results={results[activeTask.id]?.results}
                error={results[activeTask.id]?.error}
              />
            </>
          )}

          {activeTask?.type === "mcq" && (
            <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
              Chọn phương án cho từng tình huống ở cột giữa. Đáp án tốt nhất và giải thích sẽ hiển thị sau khi bạn nộp bài.
            </div>
          )}

          {activeTask?.type === "writing" && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-600">Tin nhắn gửi trưởng nhóm & PM</p>
              <Textarea
                rows={12}
                className="mt-2 text-sm"
                value={answers[activeTask.id] || ""}
                onPaste={() => setFlags((f) => ({ ...f, pastes: (f.pastes || 0) + 1 }))}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [activeTask.id]: e.target.value }))}
                placeholder="Chào anh/chị, em xin báo cáo về sự cố..."
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{String(answers[activeTask.id] || "").length} ký tự · AI chấm theo rubric</p>
            </div>
          )}

          <Button onClick={() => submit(false)} disabled={submitting} className="w-full gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Nộp bài
          </Button>
          {error && <p className="flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5" />{error}</p>}
        </section>
      </div>
    </div>
  );
}