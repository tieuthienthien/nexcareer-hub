import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/rms";

function Score({ label, value, max = 100 }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
      <div className="font-heading text-lg font-700">{value == null ? "—" : `${value}${max === 100 ? "" : `/${max}`}`}</div>
      <div className="text-[10px] font-600 uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export default function ResultStep({ app, attempt, booking, onDone }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const decided = ["hired", "rejected"].includes(app?.status);
  const canDecide = ["interview_submitted", "final_review", "scheduled"].includes(app?.status) || app?.manager_decision;

  const decide = async (action) => {
    setBusy(action);
    setError("");
    try {
      const res = await base44.functions.invoke("advanceStage", { application_id: app.id, action, note, final_notes: note });
      if (res.data?.error) throw new Error(res.data.error);
      setNote("");
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
          <p className="text-xs text-muted-foreground">Tổng hợp điểm CV · Job Simulation · Phỏng vấn — HR quyết định cuối cùng</p>
        </div>
        {decided && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-600 ${app.status === "hired" ? "bg-emerald-600 text-white" : "bg-rose-100 text-rose-700"}`}>
            {app.status === "hired" ? "Đạt / Offer" : "Từ chối"}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Score label="Điểm CV" value={app?.cv_match_score} />
        <Score label="Job Simulation" value={attempt?.score ?? app?.test_score} />
        <Score label="Phỏng vấn" value={app?.interview_score} />
      </div>

      {(app?.manager_evaluation || app?.final_result_note) && (
        <div className="mt-2 rounded-xl bg-muted/40 p-3 text-xs">
          {app.manager_evaluation && <p><b>Line Manager: </b>{app.manager_evaluation}</p>}
          {app.final_result_note && <p className="mt-1"><b>Ghi chú kết quả: </b>{app.final_result_note}</p>}
        </div>
      )}

      {error && <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5" />{error}</div>}

      {!decided && canDecide && (
        <div className="mt-3 space-y-2">
          <Textarea rows={2} className="text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do / nội dung thông báo cho ứng viên (sẽ gửi kèm email kết quả)" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decide("hire")} disabled={!!busy} className="gap-1.5">
              {busy === "hire" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Đạt / Offer
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide("reject_round3")} disabled={!!busy} className="gap-1.5 text-rose-600">
              {busy === "reject_round3" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Từ chối
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Email kết quả được gửi tự động cho ứng viên ngay sau khi bạn xác nhận.</p>
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
    </div>
  );
}