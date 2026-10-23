import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/rms";

const ADVICE = {
  pass: { label: "AI gợi ý: nên duyệt", cls: "bg-emerald-100 text-emerald-700" },
  borderline: { label: "AI gợi ý: cân nhắc", cls: "bg-amber-100 text-amber-800" },
  reject: { label: "AI gợi ý: nên loại", cls: "bg-rose-100 text-rose-700" },
};

export default function Round1Step({ app, onDone }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const pending = !app?.round1_decided_at && (app?.status === "cv_screening" || !app?.status);
  const rejected = app?.status === "cv_rejected";
  const rubric = Array.isArray(app?.cv_rubric) ? app.cv_rubric : [];
  const advice = ADVICE[app?.cv_advice];

  const decide = async (action) => {
    setBusy(action);
    setError("");
    try {
      const res = await base44.functions.invoke("advanceStage", { application_id: app.id, action, note, hr_decision_reason: note });
      if (res.data?.error) throw new Error(res.data.error);
      setNote("");
      await onDone?.();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không cập nhật được quyết định.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-700">Vòng 1 — Duyệt CV</h4>
          <p className="text-xs text-muted-foreground">AI chấm theo nhãn JD · HR là người quyết định cuối cùng</p>
        </div>
        {rejected ? (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-600 text-rose-700">Đã loại ở vòng CV</span>
        ) : !pending ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-600 text-emerald-700">Đã duyệt CV</span>
        ) : null}
      </div>

      {app?.cv_match_score == null ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Hồ sơ chưa được AI chấm CV. Dùng nút “Chấm AI cho hồ sơ mới” ở danh sách ứng viên.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-primary/10 px-3 py-2 text-center">
              <div className="font-heading text-xl font-700 text-primary">{app.cv_match_score}<span className="text-xs font-500">/100</span></div>
              <div className="text-[10px] font-600 uppercase tracking-wide text-primary/80">Điểm khớp JD</div>
            </div>
            {advice && <span className={`rounded-full px-2 py-1 text-[11px] font-600 ${advice.cls}`}>{advice.label}</span>}
            {app.cv_quality_signals && <span className="text-[11px] text-muted-foreground">Tín hiệu chất lượng: {app.cv_quality_signals}</span>}
          </div>

          {app.cv_ai_analysis && <p className="rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-foreground/80">{app.cv_ai_analysis}</p>}

          <div className="grid gap-2 sm:grid-cols-2">
            {app.cv_strengths && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="text-[11px] font-700 uppercase tracking-wide text-emerald-700">Điểm mạnh</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/80">{app.cv_strengths}</p>
              </div>
            )}
            {(app.cv_gaps || (app.cv_required_missing || []).length > 0) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <p className="text-[11px] font-700 uppercase tracking-wide text-amber-800">Thiếu / chưa xác minh</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/80">{app.cv_gaps || "—"}</p>
                {(app.cv_required_missing || []).length > 0 && (
                  <p className="mt-1 text-xs text-amber-900">Nhãn bắt buộc chưa đạt: {app.cv_required_missing.join(", ")}</p>
                )}
              </div>
            )}
          </div>

          {rubric.length > 0 && (
            <div className="rounded-xl border border-border/70">
              <div className="border-b border-border/60 px-3 py-2 text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Đối chiếu nhãn JD</div>
              <div className="max-h-52 divide-y divide-border/40 overflow-y-auto">
                {rubric.map((row, i) => (
                  <div key={`${row.label}-${i}`} className="flex items-start gap-2 px-3 py-1.5 text-xs">
                    <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${row.matched ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                      {row.matched ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-600">{row.label} {row.band ? <span className="font-400 text-muted-foreground">({row.band})</span> : null}</p>
                      <p className="text-[11px] text-muted-foreground">{row.evidence || row.requirement || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5" />{error}</div>}

      {pending ? (
        <div className="mt-3 space-y-2">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú quyết định (không bắt buộc) — sẽ lưu vào hồ sơ và email gửi ứng viên" className="text-sm" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decide("approve_round1")} disabled={!!busy} className="gap-1.5">
              {busy === "approve_round1" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Duyệt CV
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide("reject_round1")} disabled={!!busy} className="gap-1.5 text-rose-600">
              {busy === "reject_round1" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Loại hồ sơ
            </Button>
          </div>
        </div>
      ) : (
        app?.round1_decided_at && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Quyết định lúc {formatDateTime(app.round1_decided_at)}
            {app.hr_decision_reason ? ` · Lý do: ${app.hr_decision_reason}` : ""}
          </p>
        )
      )}
    </div>
  );
}