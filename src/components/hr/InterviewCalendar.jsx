import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, User, Clock } from "lucide-react";

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Thứ 2 = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const iso = (d) => {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
};

export default function InterviewCalendar({ anchor, view, slots, bookings, onPrev, onNext, onViewChange }) {
  const days = useMemo(() => {
    if (view === "month") {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const start = startOfWeek(first);
      return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [anchor, view]);

  const byDate = useMemo(() => {
    const map = new Map();
    const push = (date, item) => {
      if (!map.has(date)) map.set(date, []);
      map.get(date).push(item);
    };
    for (const s of slots || []) {
      push(s.date, { kind: "slot", ...s });
    }
    for (const b of bookings || []) {
      if (b.status !== "booked") continue;
      push(b.date, { kind: "booking", ...b });
    }
    return map;
  }, [slots, bookings]);

  const title = view === "month"
    ? anchor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
    : `Tuần ${startOfWeek(anchor).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} — ${new Date(startOfWeek(anchor).getTime() + 6 * 86400000).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;

  const todayIso = iso(new Date());

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-1 text-sm font-700 capitalize">{title}</span>
          <Button size="icon" variant="ghost" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          {[["week", "Tuần"], ["month", "Tháng"]].map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={`rounded-md px-3 py-1 text-xs font-600 ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-600 uppercase tracking-wide text-muted-foreground">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = iso(d);
          const items = (byDate.get(key) || []).sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
          const filled = items.filter((i) => i.kind === "booking");
          const inMonth = view === "week" || d.getMonth() === anchor.getMonth();
          return (
            <div
              key={key}
              className={`min-h-[96px] rounded-lg border p-1.5 text-left ${key === todayIso ? "border-primary/60 bg-primary/5" : "border-border"} ${inMonth ? "" : "opacity-40"}`}
            >
              <div className="flex items-center justify-between text-[11px] font-700">
                <span>{d.getDate()}</span>
                {filled.length > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">{filled.length}</span>}
              </div>
              <div className="mt-1 space-y-1">
                {items.slice(0, view === "week" ? 6 : 2).map((it, i) => (
                  <div
                    key={`${it.id}-${i}`}
                    className={`truncate rounded px-1 py-0.5 text-[10px] ${it.kind === "booking" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}
                    title={it.kind === "booking" ? `${it.start_time} · ${it.candidate_name}` : `${it.start_time} · còn trống ${(it.max_candidates || 1) - (it.booked_count || 0)} chỗ`}
                  >
                    <Clock className="mr-0.5 inline h-2.5 w-2.5" />
                    {String(it.start_time).slice(0, 5)}
                    {it.kind === "booking" ? ` · ${it.candidate_name}` : " · trống"}
                  </div>
                ))}
                {items.length > (view === "week" ? 6 : 2) && <div className="text-[10px] text-muted-foreground">+{items.length - (view === "week" ? 6 : 2)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-200" /> Ứng viên đã đặt</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-muted-foreground/30" /> Khung còn trống</span>
        <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> Xem danh sách bên dưới để biết chi tiết</span>
      </div>
    </div>
  );
}