import { CalendarPlus, Download } from "lucide-react";
import { googleCalendarUrl, downloadIcs } from "@/lib/interviewUtils";

export default function CalendarLinks({ event, className = "" }) {
  const url = googleCalendarUrl(event);
  if (!url) return null;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-600 text-primary transition hover:bg-primary/5"
        title="Mở Google Calendar với thông tin buổi phỏng vấn"
      >
        <CalendarPlus className="h-3.5 w-3.5" /> Thêm vào Calendar
      </a>
      <button
        type="button"
        onClick={() => downloadIcs(event)}
        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-600 text-muted-foreground transition hover:bg-muted"
        title="Tải file .ics để thêm vào Outlook / Apple Calendar"
      >
        <Download className="h-3.5 w-3.5" /> .ics
      </button>
    </span>
  );
}