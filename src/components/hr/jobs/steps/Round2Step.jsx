import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Check, X, ExternalLink, AlertTriangle, Copy, Mail } from "lucide-react";
import { formatDateTime, rmsStatus } from "@/lib/rms";
import HrScoreBox from "@/components/hr/jobs/HrScoreBox";
import EmailComposeDialog from "@/components/hr/email/compose/EmailComposeDialog";

const INVITE_LABEL = {
  sent: { label: "Đã gửi lời mời", cls: "bg-blue-100 text-blue-700" },
  started: { label: "Đang làm", cls: "bg-amber-100 text-amber-800" },
  submitted: { label: "Đã nộp", cls: "bg-emerald-100 text-emerald-700" },
  expired: { label: "Quá hạn", cls: "bg-rose-100 text-rose-700" },
};

export default function Round2Step({ app, invite, attempt, booking, onDone }) {
  const [sims, setSims] = useState([]);
  const [compose, setCompose] = useState(null);
  const [simId, setSimId] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [hrScore, setHrScore] = useState(null);
  const [notice, setNotice] = useState("");

  const stage = rmsStatus(app);
  const canInvite = ["cv_approved", "pending_manager", "interviewed", "pass"].includes(stage) || ["cv_passed", "test_invited", "test_submitted", "test_rejected"].includes(app?.status);
  const submitted = invite?.status === "submitted" || attempt?.status === "submitted";
  const decided = ["test_passed", "test_rejected"].includes(app?.status) || ["pending_manager", "interviewed", "pass"].includes(stage);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.JobSimulation.filter({ status: "active" }, { sort: "-created_date", limit: 50 });
        const items = res.items || [];
        setSims(items);
        const preferred = items.find((s) => s.job_id === app?.job_id) || items[0];
        setSimId(invite?.simulation_id || preferred?.id || "");
      } catch (e) {
        setSims([]);
      }
    })();
  }, [app?.job_id, invite?.simulation_id]);

  const send = async () => {
    setBusy("send");
    setError("");
    try {
      const res = await base44.functions.invoke("sendJobSimulation", {
        application_id: app.id,
        simulation_id: simId || undefined,
        expires_days: 3,
      });
      const d = res.data || {};
      if (d.error) throw new Error(d.error);
      setLink(d.link || "");
      if (d.email_error) setError(`Đã tạo lời mời nhưng chưa gửi được email: ${d.email_error}`);
      await onDone?.();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không gửi được Job Simulation.");
    } finally {
      setBusy("");
    }
  };

  // Cho qua / Loại ở Vòng 2 → bắt buộc Điểm HR, hệ thống tự gửi email kết quả.
  const decide = async (action) => {
    if (hrScore == null) {
      setError("Vui lòng lưu Điểm HR của Job Simulation trước khi chuyển vòng hoặc loại.");
      return;
    }
    setBusy(action);
    setError("");
    setNotice("");
    try {
      const res = await base44.functions.invoke("advanceStage", {
        application_id: app.id,
        action,
        note,
      });
      const d = res.data || {};
      if (d.error) throw new Error(d.error);
      setNote("");
      setNotice(d.email_sent ? "Đã cập nhật hồ sơ và gửi email cho ứng viên." : "");
      if (!d.email_sent && d.email_error) setError(`Chưa gửi được email cho ứng viên: ${d.email_error}`);
      await onDone?.();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không cập nhật được quyết định.");
    } finally {
      setBusy("");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link || `${window.location.origin}/job-simulation/${invite?.token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {}
  };

  const meta = invite ? INVITE_LABEL[invite.status] : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-700">Vòng 2 — Job Simulation</h4>
          <p className="text-xs text-muted-foreground">Chỉ gửi sau khi HR duyệt CV · ứng viên làm 4 nhiệm vụ, hệ thống chấm tự động + AI</p>
        </div>
        {meta && <span className={`rounded-full px-2 py-0.5 text-[11px] font-600 ${meta.cls}`}>{meta.label}</span>}
      </div>

      {!canInvite ? (
        <p className="mt-3 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">Cần duyệt CV ở Vòng 1 trước khi gửi Job Simulation.</p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={simId} onValueChange={setSimId}>
              <SelectTrigger className="h-9 sm:flex-1">
                <SelectValue placeholder="Chọn Job Simulation" />
              </SelectTrigger>
              <SelectContent>
                {sims.length === 0 && <SelectItem value="none" disabled>Chưa có simulation đang dùng</SelectItem>}
                {sims.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={send} disabled={!!busy || !simId} className="gap-1.5">
              {busy === "send" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {invite ? "Gửi lại lời mời" : "Gửi Job Simulation"}
            </Button>
          </div>

          {invite && (
            <div className="rounded-xl border border-border/70 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-600">{invite.simulation_name}</span>
                <span className="text-muted-foreground">Hạn nộp: {formatDateTime(invite.expires_at)}</span>
                <button onClick={copyLink} className="inline-flex items-center gap-1 text-primary hover:underline">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Đã copy link" : "Copy link làm bài"}
                </button>
                <a href={`/job-simulation/${invite.token}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Mở link
                </a>
              </div>
            </div>
          )}

          {attempt && attempt.status === "submitted" && (
            <div className="rounded-xl border border-border/70">
              <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-3 py-2">
                <span className="font-heading text-lg font-700">{attempt.score}<span className="text-xs font-500 text-muted-foreground">/100</span></span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-600 ${attempt.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {attempt.passed ? "Đạt" : "Chưa đạt"}
                </span>
                <span className="text-[11px] text-muted-foreground">Nộp lúc {formatDateTime(attempt.submitted_at)} · {Math.round((attempt.time_spent_sec || 0) / 60)} phút</span>
              </div>
              <div className="divide-y divide-border/40">
                {(attempt.task_scores || []).map((t) => (
                  <div key={t.task_id} className="px-3 py-2">
                    <div className="flex items-center justify-between text-xs font-600">
                      <span>{t.title}</span>
                      <span>{t.score}/{t.max}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{t.comment}</p>
                  </div>
                ))}
              </div>
              {(attempt.ai_report?.strengths || attempt.ai_report?.improvements) && (
                <div className="grid gap-2 border-t border-border/60 p-3 sm:grid-cols-2">
                  {attempt.ai_report?.strengths && <p className="text-[11px] leading-relaxed"><b className="text-emerald-700">Điểm mạnh: </b>{attempt.ai_report.strengths}</p>}
                  {attempt.ai_report?.improvements && <p className="text-[11px] leading-relaxed"><b className="text-amber-800">Cần cải thiện: </b>{attempt.ai_report.improvements}</p>}
                </div>
              )}
              <div className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
                Cờ tham khảo: rời tab {attempt.flags?.tab_switches || 0} lần · dán code {attempt.flags?.pastes || 0} lần · chạy test {attempt.flags?.test_runs || 0} lần
              </div>
              {attempt.answers?.task2?.code && (
                <details className="border-t border-border/60 px-3 py-2 text-[11px]">
                  <summary className="cursor-pointer font-600 text-foreground/80">Xem code nộp (task 2)</summary>
                  <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-muted/50 p-2 font-mono text-[11px] leading-relaxed">{attempt.answers.task2.code}</pre>
                </details>
              )}
              {attempt.answers?.task4 && (
                <details className="border-t border-border/60 px-3 py-2 text-[11px]">
                  <summary className="cursor-pointer font-600 text-foreground/80">Xem tin nhắn báo cáo (task 4)</summary>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/50 p-2 leading-relaxed">{attempt.answers.task4}</p>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {canInvite && (
        <HrScoreBox
          applicationId={app.id}
          round="simulation"
          aiScore={attempt?.score ?? app?.test_score}
          onChange={(r) => setHrScore(r?.hr_score ?? null)}
        />
      )}

      {error && <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5" />{error}</div>}
      {notice && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{notice}</div>}

      {submitted && !decided && (
        <div className="mt-3 space-y-2">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú khi chuyển vòng 3 / loại (không bắt buộc)" className="text-sm" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decide("approve_round2")} disabled={!!busy || hrScore == null} className="gap-1.5">
              {busy === "approve_round2" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Cho qua vòng 3
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide("reject_round2")} disabled={!!busy || hrScore == null} className="gap-1.5 text-rose-600">
              {busy === "reject_round2" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Loại
            </Button>
          </div>
          {hrScore == null && <p className="text-[11px] text-amber-800">Cần lưu Điểm HR của Vòng 2 để mở khoá quyết định.</p>}
        </div>
      )}

      {decided && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-600 text-muted-foreground">
            {app?.status === "test_passed" || stage === "pending_manager" ? "HR đã cho qua Vòng 3." : "HR đã loại ở Vòng 2."}
          </p>
          <Button size="sm" variant="outline" onClick={() => setCompose({ templateKey: app?.status === "test_rejected" ? "round2_fail" : "round2_pass" })} className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Soạn email riêng
          </Button>
        </div>
      )}

      <EmailComposeDialog
        open={!!compose}
        onOpenChange={(value) => { if (!value) setCompose(null); }}
        app={app}
        invite={invite}
        attempt={attempt}
        booking={booking}
        templateKey={compose?.templateKey || "round2_pass"}
        step="Vòng 2"
        onSent={() => { setCompose(null); onDone?.(); }}
      />
    </div>
  );
}