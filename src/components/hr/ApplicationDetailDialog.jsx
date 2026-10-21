import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mail, Phone, Link2, Github, ExternalLink, Loader2, Sparkles, FileCode, CalendarClock, CheckCircle2, XCircle, Download, Award, Video, MapPin, User, RefreshCw } from "lucide-react";
import { applicationStatusLabel, applicationStatusColor } from "@/lib/jobUtils";
import InlineFileViewer from "@/components/hr/InlineFileViewer";
import { formatSlot } from "@/lib/interviewUtils";

const fileNameOf = (uri) => {
  const last = String(uri || "").split("/").pop() || "";
  const i = last.indexOf("_");
  return (i > -1 ? last.slice(i + 1) : last) || "tệp đính kèm";
};

const adviceMeta = {
  pass: { label: "AI đề xuất: ĐẬU vòng 1", cls: "bg-emerald-100 text-emerald-700" },
  borderline: { label: "AI đề xuất: Cân nhắc", cls: "bg-amber-100 text-amber-800" },
  reject: { label: "AI đề xuất: RỚT vòng 1", cls: "bg-rose-100 text-rose-700" },
};

export default function ApplicationDetailDialog({ application, open, onOpenChange, onUpdated }) {
  const [app, setApp] = useState(application);
  const [attempt, setAttempt] = useState(null);
  const [booking, setBooking] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [busy, setBusy] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [mailWarning, setMailWarning] = useState("");

  useEffect(() => {
    setApp(application);
    if (!application) return;
    setReason(application.hr_decision_reason || "");
    setNote(application.final_notes || "");
    setViewer(null);
    setError("");
    (async () => {
      setAttempt(null);
      if (application.exam_attempt_id) {
        try {
          const a = await base44.entities.ExamAttempt.get(application.exam_attempt_id);
          setAttempt(a);
        } catch (e) {}
      }
      setBooking(null);
      if (application.interview_booking_id) {
        try {
          const b = await base44.entities.InterviewBooking.get(application.interview_booking_id);
          setBooking(b);
        } catch (e) {}
      }
    })();
  }, [application?.id, application?.status]);

  const advance = async (action, extra = {}) => {
    setBusy(action);
    setError("");
    setMailWarning("");
    try {
      const res = await base44.functions.invoke("advanceStage", {
        application_id: app.id,
        action,
        hr_decision_reason: extra.reason ? reason : undefined,
        note: extra.note ? note : undefined,
      });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setApp(data.application);
      onUpdated?.(data.application);
      if (data.email_error) setMailWarning(`Đã cập nhật hồ sơ nhưng chưa gửi được email: ${data.email_error}`);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không cập nhật được.");
    } finally {
      setBusy("");
    }
  };

  const sendCalendarInvite = async () => {
    setBusy("calendar");
    setError("");
    try {
      const res = await base44.functions.invoke("interviewCalendar", { action: "sync", booking_id: booking.id });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      if ((data.failures || []).length > 0) throw new Error(data.failures[0]);
      const fresh = await base44.entities.InterviewBooking.get(booking.id);
      setBooking(fresh);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không gửi được lời mời qua Google Calendar.");
    } finally {
      setBusy("");
    }
  };

  const rescore = async () => {
    setBusy("score");
    setError("");
    try {
      const res = await base44.functions.invoke("screenCv", { application_id: app.id });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      const fresh = await base44.entities.Application.get(app.id);
      setApp(fresh);
      onUpdated?.(fresh);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không chấm lại được.");
    } finally {
      setBusy("");
    }
  };

  if (!app) return null;
  const advice = adviceMeta[app.cv_advice] || null;
  const rubric = app.cv_rubric || [];
  const requiredMissing = app.cv_required_missing || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-xl">
            {app.full_name}
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-600 ${applicationStatusColor[app.status]}`}>{applicationStatusLabel[app.status]}</span>
            {app.needs_review && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-600 text-amber-700">Cần rà soát</span>}
          </DialogTitle>
          <DialogDescription>{app.job_title} · {app.company}{app.external_source ? ` · đồng bộ từ ${app.external_source}` : ""}</DialogDescription>
        </DialogHeader>

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {mailWarning && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{mailWarning}</div>}

        <div className="space-y-4 py-1">
          {viewer && <InlineFileViewer fileUri={viewer.uri} label={viewer.label} onClose={() => setViewer(null)} />}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {app.email}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {app.phone || "—"}</div>
            {app.github_url && <a href={app.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Github className="h-4 w-4" /> GitHub <ExternalLink className="h-3 w-3" /></a>}
            {app.portfolio_url && <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Link2 className="h-4 w-4" /> Portfolio <ExternalLink className="h-3 w-3" /></a>}
            {app.english_certificate && <div className="col-span-2 flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground" /> {app.english_certificate}</div>}
          </div>

          {/* VÒNG 1 */}
          <Section icon={Sparkles} title="Vòng 1 — Chấm CV tự động" accent="primary">
            <div className="flex flex-wrap items-center gap-2">
              {app.cv_file_uri && <Button variant="outline" size="sm" onClick={() => setViewer({ uri: app.cv_file_uri, label: fileNameOf(app.cv_file_uri) })} className="gap-2"><Download className="h-4 w-4" /> Xem CV</Button>}
              {!app.cv_file_uri && app.cv_source_url && (
                <a href={app.cv_source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><Download className="h-4 w-4" /> Xem CV nguồn <ExternalLink className="h-3 w-3" /></a>
              )}
              {(app.certificate_uris || []).map((uri, i) => String(uri).startsWith("http") ? (
                <a key={`${uri}-${i}`} href={uri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Chứng chỉ nguồn {i + 1}</a>
              ) : (
                <button key={`${uri}-${i}`} type="button" onClick={() => setViewer({ uri, label: fileNameOf(uri) })} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Chứng chỉ {i + 1}</button>
              ))}
              <Button variant="ghost" size="sm" onClick={rescore} disabled={busy === "score"} className="ml-auto gap-2">
                {busy === "score" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Chấm lại bằng AI
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-700 text-primary">
                {app.cv_match_score != null ? `${app.cv_match_score}/100` : "Chưa chấm"}
              </div>
              {advice && <span className={`rounded-full px-2.5 py-1 text-[11px] font-700 ${advice.cls}`}>{advice.label}</span>}
              <span className="text-[11px] text-muted-foreground">AI chỉ đề xuất — HR quyết định cuối</span>
            </div>

            {rubric.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-left text-muted-foreground">
                    <tr>
                      <th className="px-2.5 py-2 font-600">Nhóm</th>
                      <th className="px-2.5 py-2 font-600">Nhãn barem</th>
                      <th className="px-2.5 py-2 font-600">Mức</th>
                      <th className="px-2.5 py-2 font-600">Trọng số</th>
                      <th className="px-2.5 py-2 font-600">Kết quả</th>
                      <th className="px-2.5 py-2 font-600">Bằng chứng / lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rubric.map((r, i) => (
                      <tr key={`${r.label}-${i}`} className={`border-t border-border/70 ${!r.matched && r.requirement === "required" ? "bg-rose-50/70" : ""}`}>
                        <td className="px-2.5 py-2 text-muted-foreground">{r.group}</td>
                        <td className="px-2.5 py-2 font-600">{r.label}{r.band ? ` (${r.band})` : ""}</td>
                        <td className="px-2.5 py-2">{r.requirement === "required" ? "Bắt buộc" : "Ưu tiên"}</td>
                        <td className="px-2.5 py-2">{r.weight}</td>
                        <td className="px-2.5 py-2">
                          {r.matched
                            ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Khớp</span>
                            : <span className="inline-flex items-center gap-1 text-rose-700"><XCircle className="h-3.5 w-3.5" /> Thiếu</span>}
                        </td>
                        <td className="px-2.5 py-2 text-muted-foreground">{r.evidence || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {requiredMissing.length > 0 && (
              <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                <b>Nhãn bắt buộc chưa đáp ứng:</b> {requiredMissing.join(", ")}
              </div>
            )}
            {(app.cv_certificates || []).length > 0 && (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <b>Chứng chỉ hợp lệ (gồm chứng chỉ Nexora cấp):</b> {app.cv_certificates.join(" · ")}
              </div>
            )}
            {app.cv_ai_analysis && <p className="mt-2 rounded-lg bg-muted/40 p-3 text-sm">{app.cv_ai_analysis}</p>}
            {app.cv_gaps && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-amber-50/60 p-3 text-sm"><b>Khoảng trống / cần xác minh:</b> {app.cv_gaps}</p>}

            {["cv_screening", "cv_passed"].includes(app.status) && (
              <>
                <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do HR quyết định (nên ghi rõ khi ghi đè đề xuất của AI)..." className="mt-3" />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => advance("approve_round1", { reason: true })} disabled={!!busy} className="gap-2">
                    {busy === "approve_round1" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Đậu vòng 1 — mời thi
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => advance("reject_round1", { reason: true })} disabled={!!busy} className="gap-2 text-rose-600 hover:text-rose-700">
                    {busy === "reject_round1" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Rớt vòng 1
                  </Button>
                </div>
              </>
            )}
          </Section>

          {/* VÒNG 2 */}
          {["test_invited", "test_submitted", "test_passed", "test_rejected", "scheduled", "interview_submitted", "final_review", "hired", "rejected"].includes(app.status) && (
            <Section icon={FileCode} title="Vòng 2 — Bài thi online" accent="sky">
              {attempt ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-sky-600 px-2 py-0.5 font-600 text-white">Nhóm đề: {attempt.group || "—"}</span>
                    <span className="text-muted-foreground">Thời gian: <b className="text-sky-700">{attempt.duration_min} phút</b></span>
                    <span className="text-muted-foreground">Số câu: <b className="text-sky-700">{(attempt.questions || []).length}</b></span>
                    {attempt.submitted_at && <span className="text-muted-foreground">Nộp lúc {new Date(attempt.submitted_at).toLocaleString("vi-VN")}{attempt.auto_submitted ? " (tự nộp hết giờ)" : ""}</span>}
                  </div>
                  {attempt.score != null && <div className="mt-2 text-sm">Điểm AI tham khảo: <b className="text-sky-600">{attempt.score}/100</b></div>}
                  {attempt.ai_analysis && <p className="mt-1 rounded-lg bg-muted/40 p-3 text-sm">{attempt.ai_analysis}</p>}
                  {attempt.submitted_at && (attempt.graded || []).length > 0 && (
                    <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
                      {(attempt.graded || []).map((g, i) => (
                        <div key={`${g.question_id}-${i}`} className="rounded-lg border border-border p-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-600">Câu {i + 1}</span>
                            <span className={g.ok ? "text-emerald-700" : "text-rose-600"}>{g.points}/{g.max} điểm</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-muted-foreground">{g.prompt}</p>
                          <p className="mt-1 whitespace-pre-wrap font-mono text-[11px]">{g.answer || "(bỏ trống)"}</p>
                          {g.feedback && <p className="mt-1 text-[11px] text-sky-700">{g.feedback}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {app.status === "test_submitted" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => advance("approve_round2")} disabled={!!busy} className="gap-2">
                        {busy === "approve_round2" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Đậu vòng 2 — mời chọn lịch
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => advance("reject_round2")} disabled={!!busy} className="gap-2 text-rose-600 hover:text-rose-700">
                        {busy === "reject_round2" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Rớt vòng 2
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{app.status === "test_invited" ? "Ứng viên chưa bắt đầu bài thi." : "Chưa có bài thi."}</p>
              )}
            </Section>
          )}

          {/* VÒNG 3 — LỊCH PHỎNG VẤN */}
          {["test_passed", "scheduled", "interview_submitted", "final_review", "hired", "rejected"].includes(app.status) && (
            <Section icon={CalendarClock} title="Đặt lịch & phỏng vấn" accent="violet">
              {booking ? (
                <div className="rounded-lg border border-border p-3 text-sm">
                  <div className="font-600">{formatSlot(booking.date, booking.start_time, booking.duration_min)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">{booking.mode === "onsite" ? <MapPin className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />} {booking.mode === "onsite" ? booking.location || "Văn phòng" : booking.meeting_link || "Online"}</span>
                    {booking.interviewer_name && <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {booking.interviewer_name}</span>}
                    <span>Đổi lịch: {booking.rescheduled_count || 0} lần</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {booking.google_event_link ? (
                      <a href={booking.google_event_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-600 text-emerald-700 hover:underline">
                        <CalendarClock className="h-3.5 w-3.5" /> Lời mời trên Google Calendar <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-2" onClick={sendCalendarInvite} disabled={!!busy}>
                        {busy === "calendar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />} Gửi lời mời qua Google Calendar
                      </Button>
                    )}
                    <span className="text-[11px] text-muted-foreground">Ứng viên nhận email mời kèm tệp lịch từ Google.</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ứng viên chưa chọn lịch phỏng vấn.</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {app.status === "scheduled" && (
                  <Button size="sm" variant="outline" onClick={() => advance("mark_interviewed")} disabled={!!busy} className="gap-2">
                    {busy === "mark_interviewed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Đánh dấu đã phỏng vấn
                  </Button>
                )}
              </div>

              {["interview_submitted", "final_review", "hired", "rejected", "scheduled"].includes(app.status) && (
                <>
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú kết quả cuối / nhận xét hội đồng..." className="mt-3" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => advance("final_hired", { note: true })} disabled={!!busy} className="gap-2"><CheckCircle2 className="h-4 w-4" /> Nhận việc</Button>
                    <Button size="sm" variant="outline" onClick={() => advance("final_review", { note: true })} disabled={!!busy} className="gap-2">Cần xem xét thêm</Button>
                    <Button size="sm" variant="outline" onClick={() => advance("final_rejected", { note: true })} disabled={!!busy} className="gap-2 text-rose-600 hover:text-rose-700"><XCircle className="h-4 w-4" /> Không nhận</Button>
                  </div>
                </>
              )}
            </Section>
          )}

          <Section icon={null} title="Ghi chú nội bộ">
            <Textarea rows={2} value={app.notes || ""} readOnly placeholder="Chưa có" className="bg-muted/30" />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
};

function Section({ icon: Icon, title, accent, children }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2">
        {Icon && <div className={`grid h-8 w-8 place-items-center rounded-lg ${accentMap[accent] || "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></div>}
        <h3 className="text-sm font-700">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}