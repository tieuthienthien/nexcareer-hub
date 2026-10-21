import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, Lock, Unlock, CalendarDays, Video, MapPin, Users } from "lucide-react";
import SlotDialog from "@/components/hr/SlotDialog";
import InterviewCalendar from "@/components/hr/InterviewCalendar";
import GoogleCalendarCard from "@/components/hr/GoogleCalendarCard";
import { formatSlot } from "@/lib/interviewUtils";

export default function HrSchedule() {
  const [jobs, setJobs] = useState([]);
  const [jobFilter, setJobFilter] = useState("all");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(new Date());
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [jobsRes, slotsRes, bookingsRes] = await Promise.all([
        base44.entities.Job.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.InterviewSlot.filter({}, { sort: "date", limit: 300 }),
        base44.entities.InterviewBooking.filter({}, { sort: "-created_date", limit: 200 }),
      ]);
      setJobs(jobsRes.items || []);
      setSlots(slotsRes.items || []);
      setBookings(bookingsRes.items || []);
    } catch (e) {
      setError(e.message || "Không tải được lịch phỏng vấn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visibleSlots = useMemo(
    () => (jobFilter === "all" ? slots : slots.filter((s) => s.job_id === jobFilter)),
    [slots, jobFilter]
  );
  const visibleBookings = useMemo(
    () => (jobFilter === "all" ? bookings : bookings.filter((b) => b.job_id === jobFilter)),
    [bookings, jobFilter]
  );

  const slotsByDate = useMemo(() => {
    const map = new Map();
    for (const s of [...visibleSlots].sort((a, b) => (a.date + a.start_time < b.date + b.start_time ? -1 : 1))) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date).push(s);
    }
    return Array.from(map.entries());
  }, [visibleSlots]);

  const toggleStatus = async (slot) => {
    try {
      const next = slot.status === "open" ? "closed" : "open";
      const updated = await base44.entities.InterviewSlot.update(slot.id, { status: next });
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? updated : s)));
    } catch (e) {
      setError(e.message || "Không cập nhật được khung giờ.");
    }
  };

  const remove = async (slot) => {
    if ((slot.booked_count || 0) > 0) {
      setError("Khung giờ đã có ứng viên đặt — không thể xóa. Hãy đóng khung và dời lịch cho ứng viên trước.");
      return;
    }
    try {
      await base44.entities.InterviewSlot.delete(slot.id);
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    } catch (e) {
      setError(e.message || "Không xóa được khung giờ.");
    }
  };

  const shift = (direction) => {
    const next = new Date(anchor);
    if (view === "month") next.setMonth(anchor.getMonth() + direction);
    else next.setDate(anchor.getDate() + direction * 7);
    setAnchor(next);
  };

  if (loading) {
    return <div className="py-20 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-700">Lịch phỏng vấn</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mở khung giờ cho ứng viên đậu vòng 2 tự chọn, theo dõi lịch theo tuần/tháng</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="h-9 w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vị trí</SelectItem>
              {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-2" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Tạo khung giờ</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" onClick={() => setError("")}>{error}</div>}

      <GoogleCalendarCard onSynced={load} />

      <Tabs defaultValue="calendar">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="calendar" className="gap-2"><CalendarDays className="h-4 w-4" /> Lịch tổng hợp</TabsTrigger>
          <TabsTrigger value="slots" className="gap-2"><Users className="h-4 w-4" /> Khung giờ</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4 space-y-4">
          <InterviewCalendar
            anchor={anchor}
            view={view}
            slots={visibleSlots}
            bookings={visibleBookings}
            onPrev={() => shift(-1)}
            onNext={() => shift(1)}
            onViewChange={setView}
          />

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="text-sm font-700">Ứng viên đã đặt lịch</h3>
            {visibleBookings.filter((b) => b.status === "booked").length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Chưa có ứng viên nào đặt lịch.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {visibleBookings.filter((b) => b.status === "booked")
                  .sort((a, b) => (a.date + a.start_time < b.date + b.start_time ? -1 : 1))
                  .map((b) => (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-600">{b.candidate_name}</div>
                        <div className="text-xs text-muted-foreground">{formatSlot(b.date, b.start_time, b.duration_min)} · {b.job_title}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">{b.mode === "onsite" ? <MapPin className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />} {b.mode === "onsite" ? b.location || "Văn phòng" : b.meeting_link || "Online"}</span>
                        {b.interviewer_name && <span>· PV: {b.interviewer_name}</span>}
                        {b.rescheduled_count > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Đã đổi lịch</span>}
                        {b.google_event_link ? (
                          <a href={b.google_event_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-600 text-emerald-700">
                            <CalendarDays className="h-3.5 w-3.5" /> Trên Google Calendar
                          </a>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5">Chưa gửi lời mời</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="slots" className="mt-4 space-y-3">
          {slotsByDate.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">Chưa có khung giờ nào. Bấm "Tạo khung giờ" để mở lịch.</div>
          ) : (
            slotsByDate.map(([date, items]) => (
              <div key={date} className="rounded-2xl border border-border bg-card p-4">
                <div className="text-sm font-700 capitalize">
                  {new Date(`${date}T00:00:00+07:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                </div>
                <div className="mt-2 divide-y divide-border/60">
                  {items.map((s) => {
                    const booked = s.booked_count || 0;
                    const max = s.max_candidates || 1;
                    const locked = booked > 0;
                    return (
                      <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-700">{String(s.start_time).slice(0, 5)}</span>
                            <span className="text-xs text-muted-foreground">{s.duration_min} phút</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{s.mode === "onsite" ? "Văn phòng" : "Online"}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-600 ${s.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                              {s.status === "open" ? "Đang mở" : "Đã đóng"}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-600 ${booked >= max ? "bg-rose-100 text-rose-700" : "bg-primary/10 text-primary"}`}>{booked}/{max} chỗ</span>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {s.job_title}{s.interviewer_name ? ` · PV: ${s.interviewer_name}` : ""}{s.mode === "onsite" ? ` · ${s.location || ""}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" disabled={locked} onClick={() => { setEditing(s); setDialogOpen(true); }} className="gap-1.5" title={locked ? "Đã có người đặt — không sửa được" : "Sửa"}>
                            <Pencil className="h-3.5 w-3.5" /> Sửa
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleStatus(s)} className="gap-1.5">
                            {s.status === "open" ? <><Lock className="h-3.5 w-3.5" /> Đóng</> : <><Unlock className="h-3.5 w-3.5" /> Mở</>}
                          </Button>
                          <Button size="sm" variant="ghost" disabled={locked} onClick={() => remove(s)} className="gap-1.5 text-rose-600 hover:text-rose-700" title={locked ? "Đã có người đặt — không xóa được" : "Xóa"}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <SlotDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        jobs={jobs}
        slot={editing}
        onSaved={load}
      />
    </div>
  );
}