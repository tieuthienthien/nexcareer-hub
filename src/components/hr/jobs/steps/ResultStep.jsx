import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, AlertTriangle, Mail } from "lucide-react";
import { formatDateTime } from "@/lib/rms";
import EmailComposeDialog from "@/components/hr/email/compose/EmailComposeDialog";

const ROUNDS = [
  { key: "cv", label: "Vòng 1 · CV" },
  { key: "simulation", label: "Vòng 2 · Job Simulation" },
  { key: "interview", label: "Vòng 3 · Phỏng vấn" },
];

export default function ResultStep({ app, attempt, booking, invite, onDone }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [compose, setCompose] = useState(null);
  const [scores, setScores] = useState({});

  const decided = ["hired", "rejected"].includes(app?.status);
  const canDecide = ["interview_submitted", "final_review", "scheduled"].includes(app?.status) || app?.manager_decision;
  const interviewHr = scores?.interview?.hr_score;

  useEffect(() => {
    if (!app?.id) return;
    (async () => {
      try {
        const res = await base44.entities.RoundScore.filter({ application_id: app.id }, { limit: 10 });
        const map = {};
        (res.items || []).forEach((r) => { map[r.round] = r; });
        setScores(map);
      } catch (e) {
        setScores({});
      }
    })();
  }, [app?.id]);

  const aiOf = (key) => {
    if (key === "cv") return app?.cv_match_score;
    if (key === "simulation") return attempt?.score ?? app?.test_score;
    return app?.interview_score;
  };

  // Offer / Từ chối → bắt buộc có Điểm HR vòng phỏng vấn, sau đó hệ thống tự gửi email kết quả.
  const decide = async (action) => {
    if (interviewHr == null) {
      setError("Vui lòng lưu Điểm HR của Vòng 3 (phỏng vấn) trước khi chốt kết quả.");
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
        final_notes: note,
      });
      const d = res.data || {};
      if (d.error) throw new Error(d.error);
      setNote("");
      setNotice(d.email_sent ? "Đã lưu kết quả và gửi email kết quả cho ứng viên." : "");
      if (!d.email_sent && d.email_error) setError(`Chưa gửi được email cho ứng viên: ${d.email_error}`);
      await onDone?.();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không lưu được kết quả.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-700">Kết quả tuyển dụng</h4>
          <p className="text-xs text-muted-foreground">Điểm AI chỉ để tham khảo · Điểm HR là căn cứ xét đạt/không đạt</p>
        </div>
        {decided && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-600 ${app.status === "hired" ? "bg-emerald-600 text-white" : "bg-rose-100 text-rose-700"}`}>
            {app.status === "hired" ? "Đạt / Offer" : "Từ chối"}
          </span>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-border/70">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] gap-2 bg-muted/50 px-3 py-2 text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
          <span>Vòng</span><span>Điểm AI (tham khảo)</span><span>Điểm HR (chính thức)</span>
        </div>
        {ROUNDS.map((r) => (
          <div key={r.key} className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center gap-2 border-t border-border/50 px-3 py-2 text-xs">
            <span className="font-600 text-foreground/80">{r.label}</span>
            <span className="text-muted-foreground">{aiOf(r.key) == null ? "—" : `${Math.round(Number(aiOf(r.key)))}/100`}</span>
            <span className={`font-700 ${scores?.[r.key]?.hr_score == null ? "text-amber-700" : "text-foreground"}`}>
              {scores?.[r.key]?.hr_score == null ? "Chưa chấm" : `${scores[r.key].hr_score}/100`}
            </span>
          </div>
        ))}
      </div>

      {(app?.manager_evaluation || app?.final_result_note) && (
        <div className="mt-2 rounded-xl bg-muted/40 p-3 text-xs">
          {app.manager_evaluation && <p><b>Line Manager: </b>{app.manager_evaluation}</p>}
          {app.final_result_note && <p className="mt-1"><b>Ghi chú kết quả: </b>{app.final_result_note}</p>}
        </div>
      )}

      {error && <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5" />{error}</div>}
      {notice && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{notice}</div>}

      {!decided && canDecide && (
        <div className="mt-3 space-y-2">
          <Textarea rows={2} className="text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do / nội dung thông báo cho ứng viên (sẽ gửi kèm email kết quả)" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decide("hire")} disabled={!!busy || interviewHr == null} className="gap-1.5">
              {busy === "hire" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Đạt / Offer
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide("reject_round3")} disabled={!!busy || interviewHr == null} className="gap-1.5 text-rose-600">
              {busy === "reject_round3" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Từ chối
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {interviewHr == null
              ? "Cần lưu Điểm HR của Vòng 3 ở thẻ phỏng vấn phía trên để mở khoá quyết định."
              : "Email kết quả sẽ được gửi tự động cho ứng viên ngay sau khi bạn xác nhận."}
          </p>
        </div>
      )}

      {decided && app?.decision_at && (
        <p className="mt-3 text-[11px] text-muted-foreground">Quyết định lúc {formatDateTime(app.decision_at)}</p>
      )}
      {!decided && !canDecide && (
        <p className="mt-3 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Kết quả mở sau khi ứng viên hoàn tất phỏng vấn Vòng 3.{booking?.date ? ` Lịch hiện tại: ${booking.date} ${booking.start_time}` : ""}
        </p>
      )}

      {decided && (
        <Button size="sm" variant="outline" onClick={() => setCompose({ templateKey: app.status === "hired" ? "offer" : "round3_fail" })} className="mt-3 gap-1.5">
          <Mail className="h-3.5 w-3.5" /> Soạn email riêng
        </Button>
      )}

      <EmailComposeDialog
        open={!!compose}
        onOpenChange={(value) => { if (!value) setCompose(null); }}
        app={app}
        invite={invite}
        attempt={attempt}
        booking={booking}
        templateKey={compose?.templateKey || "offer"}
        step="Kết quả"
        onSent={() => { setCompose(null); onDone?.(); }}
      />
    </div>
  );
}