import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CalendarCheck, CheckCircle2, Save, XCircle } from "lucide-react";
import InlineFileViewer from "@/components/hr/InlineFileViewer";
import JobRoleManager from "@/components/hr/rms/JobRoleManager";
import { candidateCode, formatDate, formatDateTime, interviewSlotLabel, rmsMeta, rmsStatus } from "@/lib/rms";

const FILTERS = [
  { value: "active", label: "Cần tôi xử lý" },
  { value: "all", label: "Tất cả hồ sơ" },
];

export default function ManagerWorkspace() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("active");
  const [note, setNote] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [reschedule, setReschedule] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [showCv, setShowCv] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const query = isAdmin ? {} : { assigned_manager_email: (user?.email || "").toLowerCase() };
      const res = await base44.entities.Application.filter(query, { sort: "-created_date", limit: 100 });
      const list = (res.items || []).filter((a) => isAdmin ? !!a.assigned_manager_email : true);
      setApps(list);
      if (!selectedId && list.length) setSelectedId(list[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const unsubscribe = base44.entities.Application.subscribe(() => load());
    return unsubscribe;
  }, [user?.email]);

  const selected = apps.find((a) => a.id === selectedId) || null;

  useEffect(() => {
    if (!selected) return;
    setNote(selected.manager_note || "");
    setEvaluation(selected.manager_evaluation || "");
    setShowCv(false);
    setReschedule("");
    setNotice("");
    const isMine = (selected.assigned_manager_email || "").toLowerCase() === (user?.email || "").toLowerCase();
    if (isMine && !selected.manager_opened_at) {
      base44.functions.invoke("managerReview", { action: "open", application_id: selected.id }).then(load).catch(() => {});
    }
  }, [selectedId]);

  const filtered = useMemo(() => {
    if (filter === "all") return apps;
    return apps.filter((a) => ["pending_manager", "interviewed"].includes(rmsStatus(a)) || !a.manager_opened_at);
  }, [apps, filter]);

  const act = async (action, extra = {}) => {
    if (!selected) return;
    setBusy(action);
    setNotice("");
    try {
      const res = await base44.functions.invoke("managerReview", { action, application_id: selected.id, ...extra });
      const data = res.data || res;
      if (data.error) setNotice(data.error);
      else {
        setNotice(
          action === "accept_schedule" ? "Đã chấp thuận lịch phỏng vấn của ứng viên."
            : action === "propose_reschedule" ? "Đã ghi nhận đề xuất đổi lịch và gửi thông báo cho HR."
            : action === "save_evaluation" ? "Đã lưu đánh giá."
            : action === "decide" ? (extra.decision === "pass" ? "Đã duyệt ứng viên — HR đã nhận thông báo." : "Đã từ chối ứng viên — HR đã nhận thông báo.")
            : "Đã cập nhật."
        );
        await load();
      }
    } catch (e) {
      setNotice(e.response?.data?.error || e.message || "Không thực hiện được thao tác.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-700">Workspace Line Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Bạn đang xem với quyền HR — toàn bộ hồ sơ đã chuyển cho Line Manager." : `Hồ sơ thuộc vị trí bạn phụ trách (${user?.email}).`}
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-card p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-600 transition-colors ${filter === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isAdmin && <JobRoleManager />}

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Hồ sơ của team</div>
          <div className="mt-2 max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
            {loading ? (
              <div className="grid h-24 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">Chưa có hồ sơ nào được chuyển cho bạn.</div>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={`w-full rounded-xl border p-2.5 text-left transition-colors ${selectedId === a.id ? "border-primary/40 bg-primary/5" : "border-border/60 hover:bg-muted/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-600">{a.full_name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-700 ${rmsMeta(a).color}`}>{rmsMeta(a).label}</span>
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{a.job_title}</div>
                  <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>{candidateCode(a)}</span>
                    <span>{interviewSlotLabel(a) || "chưa có lịch"}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {!selected ? (
          <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            Chọn một hồ sơ để xem chi tiết.
          </div>
        ) : (
          <div className="space-y-4">
            {notice && <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">{notice}</div>}

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-700">{selected.full_name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-600 ${rmsMeta(selected).color}`}>{rmsMeta(selected).label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{candidateCode(selected)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.job_title} · {selected.department || "—"} · nộp {formatDate(selected.created_date)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selected.email}{selected.phone ? ` · ${selected.phone}` : ""}{selected.years_experience != null ? ` · ${selected.years_experience} năm KN` : ""}{selected.education_level ? ` · ${selected.education_level}` : ""}
                  </p>
                  {selected.cv_match_score != null && (
                    <p className="mt-1 text-xs font-600 text-primary">Match CV: {Math.round(selected.cv_match_score)}%</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowCv((v) => !v)}>
                  {showCv ? "Ẩn CV" : "Xem trước CV"}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                {showCv && selected.cv_file_uri && (
                  <InlineFileViewer fileUri={selected.cv_file_uri} label={`CV-${selected.full_name}.pdf`} onClose={() => setShowCv(false)} />
                )}
                {showCv && !selected.cv_file_uri && (
                  <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                    {selected.cv_source_url ? (
                      <a href={selected.cv_source_url} target="_blank" rel="noreferrer" className="font-600 text-primary hover:underline">Mở CV trên hệ thống nguồn</a>
                    ) : "Hồ sơ chưa có file CV đính kèm."}
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-700"><CalendarCheck className="h-4 w-4 text-primary" /> Khung giờ ứng viên đã chọn</div>
                  <div className="mt-2 rounded-xl bg-muted/40 px-3 py-2.5 text-sm font-600">
                    {interviewSlotLabel(selected) || "Ứng viên chưa chọn khung giờ"}
                  </div>
                  {selected.interview_confirmed && <p className="mt-1.5 text-xs font-600 text-emerald-600">Bạn đã chấp thuận lịch này.</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={!!busy || !interviewSlotLabel(selected)} onClick={() => act("accept_schedule")}>
                      {busy === "accept_schedule" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />} Chấp nhận lịch này
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input value={reschedule} onChange={(e) => setReschedule(e.target.value)} placeholder="VD: 14:00 thứ 3, 25/11" className="h-9" />
                    <Button size="sm" variant="outline" disabled={!!busy || !reschedule.trim()} onClick={() => act("propose_reschedule", { note: reschedule })}>
                      {busy === "propose_reschedule" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đề xuất đổi lịch"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-sm font-700">Đánh giá & ghi chú</div>
                  <Textarea rows={4} value={evaluation} onChange={(e) => setEvaluation(e.target.value)} placeholder="Nhận xét sau phỏng vấn: chuyên môn, kỹ năng mềm, mức độ phù hợp..." className="mt-2" />
                  <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú nội bộ (lịch, trao đổi thêm...)" className="mt-2" />
                  <Button size="sm" className="mt-2 gap-2" disabled={busy === "save_evaluation"} onClick={() => act("save_evaluation", { manager_note: note, manager_evaluation: evaluation })}>
                    {busy === "save_evaluation" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu đánh giá
                  </Button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-sm font-700">Quyết định tuyển dụng</div>
                  <p className="mt-1 text-xs text-muted-foreground">Sau buổi phỏng vấn, chọn kết quả. HR sẽ nhận thông báo qua HR Chatbot.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      disabled={!!busy || selected.manager_decision === "pass"}
                      onClick={() => act("decide", { decision: "pass", manager_evaluation: evaluation })}
                    >
                      {busy === "decide" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Chọn ứng viên này (Pass)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-rose-300 text-rose-600 hover:bg-rose-50"
                      disabled={!!busy || selected.manager_decision === "fail"}
                      onClick={() => act("decide", { decision: "fail", manager_evaluation: evaluation })}
                    >
                      {busy === "decide" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Từ chối (Fail)
                    </Button>
                  </div>
                  {selected.decision_at && (
                    <p className="mt-2 text-xs text-muted-foreground">Quyết định ghi nhận lúc {formatDateTime(selected.decision_at)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}