import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from "lucide-react";
import { cheatLabel, cheatTotal } from "@/lib/cheatEvents";
import { formatDateTime } from "@/lib/rms";

const DEFAULT_THRESHOLD = 3;

/** Nhãn cảnh báo + danh sách sự kiện nghi vấn gian lận của ứng viên ở Vòng 2. */
export default function CheatWarningPanel({ applicationId, threshold = DEFAULT_THRESHOLD }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!applicationId) return undefined;
    let alive = true;
    base44.entities.CheatEvent.filter({ application_id: applicationId }, { sort: "-last_at", limit: 30 })
      .then((res) => { if (alive) setEvents(res.items || []); })
      .catch(() => { if (alive) setEvents([]); });
    return () => { alive = false; };
  }, [applicationId]);

  const total = cheatTotal(events);
  if (!events.length) return null;
  const flagged = total >= (Number(threshold) || DEFAULT_THRESHOLD);

  return (
    <div className={`rounded-2xl border p-4 ${flagged ? "border-amber-300 bg-amber-50/80" : "border-border bg-muted/40"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-700 ${flagged ? "bg-amber-200 text-amber-900" : "bg-muted text-muted-foreground"}`}>
          <AlertTriangle className="h-3.5 w-3.5" /> Nghi vấn gian lận
        </span>
        <span className="text-xs text-muted-foreground">Vòng 2 · {total} sự kiện được ghi nhận (ngưỡng cảnh báo {threshold || DEFAULT_THRESHOLD})</span>
      </div>

      <ul className="mt-2.5 space-y-1">
        {events.map((e) => (
          <li key={e.id} className="flex flex-wrap items-baseline gap-x-2 text-xs text-foreground/80">
            <span className="font-600">{cheatLabel(e.type)}</span>
            <span className="text-muted-foreground">· {Number(e.count) || 1} lần</span>
            <span className="text-muted-foreground">· {formatDateTime(e.last_at || e.updated_date || e.created_date)}</span>
            {e.detail && <span className="text-muted-foreground">· {e.detail}</span>}
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Hệ thống chỉ cảnh báo, không tự động loại ứng viên. HR xem chi tiết và quyết định cuối cùng.
      </p>
    </div>
  );
}