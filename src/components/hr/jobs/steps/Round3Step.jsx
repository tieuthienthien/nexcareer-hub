import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Loader2, Mail, Plus, Pencil, Trash2, UserCog, AlertTriangle, Check } from "lucide-react";
import { formatDateTime, rmsStatus } from "@/lib/rms";
import HrScoreBox from "@/components/hr/jobs/HrScoreBox";
import EmailComposeDialog from "@/components/hr/email/compose/EmailComposeDialog";

const emptyForm = { id: null, manager_name: "", line_manager_email: "", department: "" };

export default function Round3Step({ app, booking, invite, onDone }) {
  const [open, setOpen] = useState(false);
  const [compose, setCompose] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [form, setForm] = useState(null);
  const [managerEmail, setManagerEmail] = useState(app?.assigned_manager_email || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(45);
  const [mode, setMode] = useState("online");
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const stage = rmsStatus(app);
  const canSchedule = ["test_passed", "interview_invited", "scheduled", "interview_submitted", "final_review", "hired"].includes(app?.status) || ["pending_manager", "interviewed", "pass"].includes(stage);
  const scheduled = !!booking && booking.status === "booked";

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await base44.entities.JobRole.list({ sort: "-created_date", limit: 100 });
      setRoles(res.items || res || []);
    } catch (e) {
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (open) loadRoles();
  }, [open]);

  const saveManager = async () => {
    if (!form?.manager_name || !form?.line_manager_email) { setError("Nhập tên và email Line Manager."); return; }
    setBusy("manager");
    setError("");
    try {
      const payload = {
        title: app.job_title || "Vị trí tuyển dụng",
        department: form.department || "",
        line_manager_email: form.line_manager_email.trim(),
        manager_name: form.manager_name.trim(),
        job_id: app.job_id || "",
        status: "open",
      };
      if (form.id) await base44.entities.JobRole.update(form.id, payload);
      else await base44.entities.JobRole.create(payload);
      setManagerEmail(form.line_manager_email.trim());
      setForm(null);
      await loadRoles();
    } catch (e) {
      setError(e.message || "Không lưu được Line Manager.");
    } finally {
      setBusy("");
    }
  };

  const removeManager = async (role) => {
    if (!confirm(`Xóa Line Manager ${role.manager_name || role.line_manager_email}?`)) return;
    await base44.entities.JobRole.delete(role.id);
    await loadRoles();
  };

  const submit = async () => {
    if (!managerEmail) { setError("Chọn Line Manager phỏng vấn."); return; }
    if (!date || !time) { setError("Chọn ngày và giờ phỏng vấn."); return; }
    setBusy("schedule");
    setError("");
    try {
      const manager = roles.find((r) => r.line_manager_email === managerEmail);
      const res = await base44.functions.invoke("scheduleManagerInterview", {
        application_id: app.id,
        manager_email: managerEmail,
        manager_name: manager?.manager_name || "",
        date,
        start_time: time,
        duration_min: Number(duration) || 45,
        mode,
        meeting_link: mode === "online" ? link : "",
        location: mode === "onsite" ? location : "",
        note,
      });
      const d = res.data || {};
      if (d.error) throw new Error(d.error);
      setOpen(false);
      await onDone?.();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không tạo được lịch phỏng vấn.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-700">Vòng 3 — Phỏng vấn Line Manager</h4>
          <p className="text-xs text-muted-foreground">Đặt lịch với Line Manager · đồng bộ sang mục Lịch phỏng vấn · gửi thông báo cho cả hai bên</p>
        </div>
        {scheduled && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-600 text-emerald-700">Đã có lịch</span>}
      </div>

      {booking ? (
        <div className="mt-3 rounded-xl border border-border/70 p-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-600">{booking.interviewer_name || booking.interviewer_email}</span>
            <span className="text-muted-foreground">{formatDateTime(`${booking.date}T${booking.start_time}:00+07:00`)}</span>
            <span className="text-muted-foreground">{booking.mode === "onsite" ? `Tại văn phòng · ${booking.location || ""}` : "Online"}</span>
            {booking.meeting_link && <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="text-primary hover:underline">Link họp</a>}
          </div>
          {(app.manager_evaluation || app.manager_note) && (
            <div className="mt-2 rounded-lg bg-muted/40 p-2">
              <p className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Line Manager đánh giá</p>
              <p className="mt-1 leading-relaxed">{app.manager_evaluation || app.manager_note}</p>
              {app.manager_decision && <p className="mt-1 font-600">Đề xuất: {app.manager_decision === "pass" ? "Đạt" : "Không đạt"}</p>}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {canSchedule ? "Chưa có lịch phỏng vấn cho ứng viên này." : "Cần cho ứng viên qua Vòng 2 trước khi đặt lịch phỏng vấn."}
        </p>
      )}

      {canSchedule && (
        <HrScoreBox
          applicationId={app.id}
          round="interview"
          aiScore={app.interview_score}
          canRegrade={!!app.interview_submitted_at || app.interview_score != null}
          onRegraded={onDone}
          onChange={() => {}}
        />
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!open && canSchedule && (
          <Button size="sm" variant={scheduled ? "outline" : "default"} onClick={() => setOpen(true)} className="gap-1.5">
            {scheduled ? <CalendarClock className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {scheduled ? "Đổi lịch phỏng vấn" : "Thêm Line Manager phỏng vấn"}
          </Button>
        )}
        {canSchedule && (
          <Button size="sm" variant="outline" onClick={() => setCompose(true)} className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Gửi email cho ứng viên
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-border/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-700">Chọn Line Manager</p>
            <Button size="sm" variant="ghost" onClick={() => setForm({ ...emptyForm })} className="gap-1 text-primary">
              <UserCog className="h-3.5 w-3.5" /> + Thêm Line Manager mới
            </Button>
          </div>

          {loadingRoles ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải danh sách...</div>
          ) : roles.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có Line Manager nào. Bấm “+ Thêm Line Manager mới”.</p>
          ) : (
            <Select value={managerEmail} onValueChange={setManagerEmail}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Chọn Line Manager" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.line_manager_email}>
                    {r.manager_name || r.line_manager_email}{r.department ? ` · ${r.department}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {roles.length > 0 && (
            <div className="space-y-1.5">
              {roles.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-2 py-1.5 text-[11px]">
                  <span className="truncate">{r.manager_name || r.line_manager_email} <span className="text-muted-foreground">· {r.line_manager_email}</span></span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button onClick={() => setForm({ id: r.id, manager_name: r.manager_name || "", line_manager_email: r.line_manager_email || "", department: r.department || "" })} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeManager(r)} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {form && (
            <div className="space-y-2 rounded-lg border border-border/70 p-2.5">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input className="h-9 text-xs" placeholder="Tên Line Manager" value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} />
                <Input className="h-9 text-xs" placeholder="Email" value={form.line_manager_email} onChange={(e) => setForm({ ...form, line_manager_email: e.target.value })} />
                <Input className="h-9 text-xs" placeholder="Phòng ban" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveManager} disabled={busy === "manager"} className="gap-1.5">
                  {busy === "manager" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Lưu Line Manager
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setForm(null)}>Hủy</Button>
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1"><Label className="text-[11px]">Ngày</Label><Input type="date" className="h-9 text-xs" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-[11px]">Giờ</Label><Input type="time" className="h-9 text-xs" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-[11px]">Thời lượng (phút)</Label><Input type="number" className="h-9 text-xs" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
            <div className="space-y-1">
              <Label className="text-[11px]">Hình thức</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="onsite">Tại văn phòng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[11px]">{mode === "online" ? "Link họp" : "Địa điểm"}</Label>
              {mode === "online" ? (
                <Input className="h-9 text-xs" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/..." />
              ) : (
                <Input className="h-9 text-xs" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Tầng 5, Nexora Tower..." />
              )}
            </div>
          </div>
          <Textarea rows={2} className="text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú gửi kèm (không bắt buộc)" />

          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={busy === "schedule"} className="gap-1.5">
              {busy === "schedule" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />} Xác nhận lịch & gửi thông báo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Đóng</Button>
          </div>
        </div>
      )}

      {error && <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5" />{error}</div>}

      <EmailComposeDialog
        open={compose}
        onOpenChange={setCompose}
        app={app}
        invite={invite}
        booking={booking}
        templateKey="interview_confirm"
        step="Vòng 3"
        onSent={() => onDone?.()}
      />
    </div>
  );
}