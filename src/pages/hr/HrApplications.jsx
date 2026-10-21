import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, ExternalLink, Download, Mail, Phone, Link2, Loader2, Filter, Sparkles, FileCode, Video, CheckCircle2, XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { applicationStatusLabel, applicationStatusColor, getStageInfo } from "@/lib/jobUtils";

const roundFilters = [
  { value: "all", label: "Tất cả" },
  { value: "1", label: "Vòng 1 — CV" },
  { value: "2", label: "Vòng 2 — Thi" },
  { value: "3", label: "Vòng 3 — Phỏng vấn" },
  { value: "done", label: "Đã kết thúc" },
];

const roundOf = (s) => {
  const i = getStageInfo(s);
  if (["hired", "rejected", "cv_rejected", "test_rejected"].includes(s)) return "done";
  return String(i.round);
};

export default function HrApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [round, setRound] = useState("all");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [finalNotes, setFinalNotes] = useState("");
  const [round1Reason, setRound1Reason] = useState("");
  const [job, setJob] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const query = {};
      if (q.trim()) query.full_name = { $regex: q.trim(), $options: "i" };
      const res = await base44.entities.Application.filter(query, { sort: "-created_date", limit: 100 });
      let items = res.items || [];
      if (round !== "all") items = items.filter((a) => roundOf(a.status) === round);
      setApps(items);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [round, q]);

  const syncTopcv = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await base44.functions.invoke("syncTopcvApplications", {});
      const data = res.data || res;
      if (data.error) {
        setSyncMsg(data.error);
      } else if (data.ready === false) {
        setSyncMsg(data.message || "Nguồn TopCV chưa cung cấp dữ liệu hồ sơ.");
      } else {
        setSyncMsg(`Đã nhận ${data.total} hồ sơ · tạo mới ${data.created} · cập nhật ${data.updated}${data.skipped ? ` · bỏ qua ${data.skipped}` : ""}`);
        await load();
      }
    } catch (e) {
      setSyncMsg(e.response?.data?.error || e.message || "Không đồng bộ được hồ sơ.");
    }
    setSyncing(false);
  };

  const open = async (a) => {
    setSelected(a);
    setFinalNotes(a.final_notes || "");
    setRound1Reason(a.hr_decision_reason || "");
    setAnswers([]);
    setJob(null);
    if (a.job_id) {
      try {
        const j = await base44.entities.Job.get(a.job_id);
        setJob(j);
      } catch (e) {}
    }
    if (a.status === "interview_submitted" || a.status === "hired" || a.status === "rejected") {
      try {
        const res = await base44.entities.InterviewAnswer.filter({ application_id: a.id }, { sort: "question_index", limit: 50 });
        setAnswers(res.items || []);
      } catch (e) {}
    }
  };

  const testTypeLabel = { situational: "Tình huống", technical: "Kỹ thuật", none: "—" };

  const advance = async (action) => {
    if (!selected) return;
    setBusy(true);
    try {
      const payload = { application_id: selected.id, action };
      if (action === "approve_round1" || action === "reject_round1") payload.hr_decision_reason = round1Reason || undefined;
      if (action === "hire" || action === "reject_round3") payload.final_notes = finalNotes || undefined;
      const res = await base44.functions.invoke("advanceStage", payload);
      const data = res.data || res;
      const updated = data.application || { ...selected, status: data.status };
      setApps((prev) => prev.map((x) => (x.id === selected.id ? updated : x)));
      setSelected(updated);
    } catch (e) {
      alert(e.response?.data?.error || e.message || "Không thể cập nhật.");
    }
    setBusy(false);
  };

  const viewFile = async (uri) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      window.open(signed_url, "_blank");
    } catch (e) { alert("Không xem được file."); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-700">Quản lý ứng viên</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sàng lọc, chấm thi và phỏng vấn qua 3 vòng</p>
        </div>
        <Button variant="outline" size="sm" onClick={syncTopcv} disabled={syncing} className="gap-2">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Đồng bộ hồ sơ từ TopCV
        </Button>
      </div>

      {syncMsg && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{syncMsg}</div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên ứng viên..." className="h-10 border-0 bg-muted/40 pl-9 shadow-none" />
        </div>
        <Select value={round} onValueChange={setRound}>
          <SelectTrigger className="h-10 sm:w-56 gap-2"><Filter className="h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>{roundFilters.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chưa có ứng viên nào.</div>
        ) : (
          apps.map((a) => (
            <button key={a.id} onClick={() => open(a)} className="flex w-full flex-col gap-3 border-b border-border/60 p-4 text-left last:border-0 hover:bg-muted/30 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-700 text-primary">{(a.full_name || "?")[0].toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-600">{a.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.job_title} · {a.company}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.cv_match_score != null && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-600 text-primary">{a.cv_match_score}%</span>}
                <span className="text-xs text-muted-foreground">{new Date(a.created_date).toLocaleDateString("vi-VN")}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-600 ${applicationStatusColor[a.status]}`}>{applicationStatusLabel[a.status]}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selected.full_name}</DialogTitle>
                <DialogDescription>Ứng tuyển: {selected.job_title} · {selected.company}</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {selected.email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {selected.phone || "—"}</div>
                  {selected.portfolio_url && <a href={selected.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Link2 className="h-4 w-4" /> Portfolio <ExternalLink className="h-3 w-3" /></a>}
                </div>

                {/* Vòng 1 */}
                <Section icon={Sparkles} title="Vòng 1 — Sàng lọc CV" accent="primary">
                  {selected.cv_file_uri && <Button variant="outline" size="sm" onClick={() => viewFile(selected.cv_file_uri)} className="gap-2"><Download className="h-4 w-4" /> Xem CV</Button>}
                  {!selected.cv_file_uri && selected.cv_source_url && (
                    <a href={selected.cv_source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><Download className="h-4 w-4" /> Xem CV nguồn <ExternalLink className="h-3 w-3" /></a>
                  )}
                  {selected.external_source && (
                    <div className="mt-2 text-xs text-muted-foreground">Đồng bộ từ {selected.external_source}{selected.last_synced_at ? ` · ${new Date(selected.last_synced_at).toLocaleString("vi-VN")}` : ""}</div>
                  )}
                  {selected.cv_match_score != null && <div className="mt-2 text-sm">Điểm khớp AI: <b className="text-primary">{selected.cv_match_score}/100</b> <span className="text-xs text-muted-foreground">(AI tham khảo — HR quyết định cuối)</span></div>}
                  {selected.cv_ai_analysis && <p className="mt-2 rounded-lg bg-muted/40 p-3 text-sm">{selected.cv_ai_analysis}</p>}
                  {selected.cv_strengths && (
                    <div className="mt-2">
                      <div className="text-xs font-600 uppercase tracking-wide text-emerald-700">Điểm mạnh (bằng chứng từ CV)</div>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-emerald-50/60 p-3 text-sm">{selected.cv_strengths}</p>
                    </div>
                  )}
                  {selected.cv_gaps && (
                    <div className="mt-2">
                      <div className="text-xs font-600 uppercase tracking-wide text-amber-700">Khoảng trống / cần xác minh</div>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-amber-50/60 p-3 text-sm">{selected.cv_gaps}</p>
                    </div>
                  )}
                  {selected.cv_quality_signals && (
                    <div className="mt-2">
                      <div className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Tín hiệu chất lượng CV (tham khảo, không phải bằng chứng lừa đảo)</div>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">{selected.cv_quality_signals}</p>
                    </div>
                  )}
                  {selected.cover_letter && <div className="mt-2"><div className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Thư ứng tuyển</div><p className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">{selected.cover_letter}</p></div>}
                  {selected.hr_decision_reason && <div className="mt-2 text-xs text-muted-foreground">Lý do HR: <span className="text-foreground/80">{selected.hr_decision_reason}</span></div>}
                  {selected.status === "cv_screening" && (
                    <>
                      <Textarea rows={2} value={round1Reason} onChange={(e) => setRound1Reason(e.target.value)} placeholder="Ghi lý do duyệt/từ chối (bắt buộc khi ghi đè AI)..." className="mt-3" />
                      <Actions busy={busy} onApprove={() => advance("approve_round1")} onReject={() => advance("reject_round1")} approveLabel="Duyệt — mời vòng 2" rejectLabel="Từ chối" />
                    </>
                  )}
                </Section>

                {/* Vòng 2 */}
                {["test_invited", "test_submitted", "test_passed", "test_rejected", "interview_invited", "interview_submitted", "hired", "rejected"].includes(selected.status) && (
                  <Section icon={FileCode} title="Vòng 2 — Bài thi" accent="sky">
                    {job && job.test_type && job.test_type !== "none" && (
                      <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50/60 p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-sky-600 px-2 py-0.5 font-600 text-white">Đề thi</span>
                          <span className="text-muted-foreground">Loại: <b className="text-sky-700">{testTypeLabel[job.test_type]}</b></span>
                          {job.test_language && <span className="text-muted-foreground">Ngôn ngữ: <b className="text-sky-700">{job.test_language}</b></span>}
                          <span className="text-muted-foreground">Thời gian: <b className="text-sky-700">{job.test_duration_min || 15} phút</b></span>
                          {job.test_char_limit && <span className="text-muted-foreground">Giới hạn: <b className="text-sky-700">{job.test_char_limit} ký tự</b></span>}
                        </div>
                        {job.test_prompt && <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground">{job.test_prompt}</pre>}
                        {job.test_starter_code && (
                          <div className="mt-2">
                            <div className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Code mẫu</div>
                            <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-slate-900 p-3 text-xs text-slate-100 whitespace-pre-wrap">{job.test_starter_code}</pre>
                          </div>
                        )}
                      </div>
                    )}
                    {selected.test_submitted_at ? (
                      <>
                        <div className="text-xs text-muted-foreground">Nộp lúc {new Date(selected.test_submitted_at).toLocaleString("vi-VN")}{selected.test_auto_submitted && " (tự nộp hết giờ)"}</div>
                        <pre className="mt-2 max-h-60 overflow-auto rounded-lg border border-border bg-slate-900 p-3 text-xs text-slate-100 whitespace-pre-wrap">{selected.test_answer || "(trống)"}</pre>
                        {selected.test_score != null && <div className="mt-2 text-sm">Điểm AI: <b className="text-sky-600">{selected.test_score}/100</b></div>}
                        {selected.test_ai_analysis && <p className="mt-1 rounded-lg bg-muted/40 p-3 text-sm">{selected.test_ai_analysis}</p>}
                        {selected.status === "test_submitted" && (
                          <Actions busy={busy} onApprove={() => advance("approve_round2")} onReject={() => advance("reject_round2")} approveLabel="Đạt — mời vòng 3" rejectLabel="Không đạt" />
                        )}
                      </>
                    ) : <p className="text-sm text-muted-foreground">Ứng viên chưa làm bài thi.</p>}
                  </Section>
                )}

                {/* Vòng 3 */}
                {["interview_invited", "interview_submitted", "hired", "rejected"].includes(selected.status) && (
                  <Section icon={Video} title="Vòng 3 — Phỏng vấn video" accent="violet">
                    {answers.length > 0 ? (
                      <div className="space-y-2">
                        {answers.map((an) => (
                          <div key={an.id} className="rounded-lg border border-border p-3">
                            <div className="text-xs font-600">Câu {an.question_index + 1}: {an.question_text}</div>
                            <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={() => viewFile(an.video_uri)}><Video className="h-4 w-4" /> Xem video</Button>
                            {an.transcript && <p className="mt-2 rounded bg-muted/40 p-2 text-xs">{an.transcript}</p>}
                          </div>
                        ))}
                        {selected.interview_score != null && <div className="mt-1 text-sm">Điểm AI: <b className="text-violet-600">{selected.interview_score}/100</b></div>}
                        {selected.interview_ai_analysis && <p className="mt-1 rounded-lg bg-muted/40 p-3 text-sm">{selected.interview_ai_analysis}</p>}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">{selected.status === "interview_invited" ? "Ứng viên chưa hoàn thành phỏng vấn." : "Không có bản ghi."}</p>}
                    {selected.status === "interview_submitted" && (
                      <>
                        <Textarea rows={2} value={finalNotes} onChange={(e) => setFinalNotes(e.target.value)} placeholder="Ghi chú quyết định của hội đồng..." className="mt-3" />
                        <Actions busy={busy} onApprove={() => advance("hire")} onReject={() => advance("reject_round3")} approveLabel="Trúng tuyển" rejectLabel="Không đạt" />
                      </>
                    )}
                  </Section>
                )}

                {/* Ghi chú nội bộ */}
                <Section icon={null} title="Ghi chú nội bộ">
                  <Textarea rows={2} value={selected.notes || ""} readOnly placeholder="Chưa có" className="bg-muted/30" />
                </Section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
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

function Actions({ busy, onApprove, onReject, approveLabel, rejectLabel }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button size="sm" onClick={onApprove} disabled={busy} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {approveLabel}</Button>
      <Button size="sm" variant="outline" onClick={onReject} disabled={busy} className="gap-2 text-rose-600 hover:text-rose-700">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} {rejectLabel}</Button>
    </div>
  );
}