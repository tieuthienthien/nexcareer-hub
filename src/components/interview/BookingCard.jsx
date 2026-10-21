import { CalendarPlus, Download, MapPin, Video, User, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countdownTo, downloadIcs, formatSlot, googleCalendarUrl } from "@/lib/interviewUtils";

export default function BookingCard({ booking, canReschedule, onReschedule }) {
  if (!booking) return null;
  const countdown = countdownTo(`${booking.date}T${String(booking.start_time).slice(0, 5)}:00+07:00`);
  const place = booking.mode === "onsite" ? booking.location : booking.meeting_link;
  const title = `Phỏng vấn ${booking.job_title || ""}`.trim();
  const details = `Người phỏng vấn: ${booking.interviewer_name || "—"}\nHình thức: ${booking.mode === "onsite" ? "Tại văn phòng" : "Online"}\n${place || ""}`;
  const gcal = googleCalendarUrl({ title, details, place, date: booking.date, time: booking.start_time, duration: booking.duration_min || 45 });

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-700 text-primary-foreground">
          <Clock className="h-3.5 w-3.5" /> Đã đặt lịch phỏng vấn
        </div>
        {countdown && (
          <div className="text-xs font-600 text-primary">
            {countdown.past ? "Buổi phỏng vấn đã diễn ra" : `Còn ${countdown.days} ngày ${countdown.hours} giờ ${countdown.minutes} phút`}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1.5 text-sm">
        <div className="font-700">{formatSlot(booking.date, booking.start_time, booking.duration_min || 45)}</div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {booking.mode === "onsite" ? <MapPin className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          {booking.mode === "onsite" ? booking.location || "Tại văn phòng" : booking.meeting_link || "Link họp sẽ được HR gửi"}
        </div>
        {booking.interviewer_name && <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> {booking.interviewer_name}</div>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {gcal && (
          <Button asChild size="sm" variant="outline" className="gap-2">
            <a href={gcal} target="_blank" rel="noreferrer"><CalendarPlus className="h-4 w-4" /> Google Calendar</a>
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadIcs({ title, details, place, date: booking.date, time: booking.start_time, duration: booking.duration_min || 45 })}>
          <Download className="h-4 w-4" /> Tải file .ics
        </Button>
        {onReschedule && (
          <Button size="sm" variant="ghost" className="gap-2" onClick={onReschedule} disabled={!canReschedule}>
            <RefreshCw className="h-4 w-4" /> {canReschedule ? "Đổi lịch (còn 1 lượt)" : "Không thể đổi lịch"}
          </Button>
        )}
      </div>
      {!canReschedule && onReschedule && (
        <p className="mt-2 text-[11px] text-muted-foreground">Chỉ được đổi lịch 1 lần và trước giờ phỏng vấn ít nhất 24 giờ. Sau đó vui lòng liên hệ HR.</p>
      )}
    </div>
  );
}