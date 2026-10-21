import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CalendarClock, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import SlotPicker from "@/components/interview/SlotPicker";
import BookingCard from "@/components/interview/BookingCard";
import { formatSlot } from "@/lib/interviewUtils";

export default function InterviewSchedule() {
  const { applicationId } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ booking: null, slots: [], can_reschedule: false });
  const [selected, setSelected] = useState(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const a = await base44.entities.Application.get(applicationId);
      setApp(a);
      const res = await base44.functions.invoke("bookInterviewSlot", { application_id: applicationId, action: "list" });
      const payload = res.data || res;
      if (payload.error) throw new Error(payload.error);
      setData({ booking: payload.booking || null, slots: payload.slots || [], can_reschedule: !!payload.can_reschedule });
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không tải được lịch phỏng vấn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [applicationId]);

  const confirm = async (action) => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const res = await base44.functions.invoke("bookInterviewSlot", {
        application_id: applicationId,
        action,
        slot_id: selected.id,
      });
      const payload = res.data || res;
      if (payload.error) throw new Error(payload.error);
      setData((prev) => ({ ...prev, booking: payload.booking, can_reschedule: false }));
      setSelected(null);
      setPicking(false);
      setDone(true);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không đặt được lịch.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /></div>;
  }

  const eligible = app && ["test_passed", "interview_invited", "scheduled"].includes(app.status);
  if (!eligible) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-xl font-700">Chưa thể chọn lịch phỏng vấn</h1>
        <p className="mt-2 text-sm text-muted-foreground">Trang này chỉ dành cho ứng viên đã đậu vòng 2.</p>
        <Button asChild className="mt-5"><Link to="/candidate-room">Về Candidate Room</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-2"><Link to="/candidate-room"><ArrowLeft className="h-4 w-4" /> Candidate Room</Link></Button>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary">
          <CalendarClock className="h-3.5 w-3.5" /> Đặt lịch phỏng vấn
        </div>
        <h1 className="mt-3 font-heading text-2xl font-700">{app?.job_title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{app?.company} · Chúc mừng bạn đã đậu vòng 2</p>

        {done && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Đã xác nhận lịch. Email xác nhận đã được gửi cho bạn và người phỏng vấn.
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {data.booking && !picking ? (
          <div className="mt-5">
            <BookingCard booking={data.booking} canReschedule={data.can_reschedule} onReschedule={() => { setPicking(true); setSelected(null); }} />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {picking && (
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <span>Chọn khung giờ mới cho buổi phỏng vấn (chỉ 1 lần).</span>
                <Button size="sm" variant="ghost" onClick={() => { setPicking(false); setSelected(null); }}>Hủy</Button>
              </div>
            )}

            <SlotPicker slots={data.slots} selectedId={selected?.id} onSelect={setSelected} />

            {selected && (
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
                <div className="text-sm font-700">Xem lại lựa chọn</div>
                <div className="mt-1.5 text-sm text-foreground/80">
                  {formatSlot(selected.date, selected.start_time, selected.duration_min)} · {selected.mode === "onsite" ? "Tại văn phòng" : "Online"}
                  {selected.interviewer_name ? ` · ${selected.interviewer_name}` : ""}
                </div>
                <Button className="mt-3 w-full gap-2" onClick={() => confirm(picking ? "reschedule" : "book")} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Xác nhận
                </Button>
                <p className="mt-2 text-[11px] text-muted-foreground">Khung giờ sẽ được khóa ngay khi bạn xác nhận.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}