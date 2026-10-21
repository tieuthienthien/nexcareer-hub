import { useMemo } from "react";
import { CalendarDays, Clock, Users } from "lucide-react";

export default function SlotPicker({ slots, selectedId, onSelect }) {
  const byDate = useMemo(() => {
    const map = new Map();
    for (const s of slots || []) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date).push(s);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [slots]);

  if (!byDate.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        Hiện chưa có khung giờ phỏng vấn nào được mở. Vui lòng quay lại sau hoặc liên hệ HR.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {byDate.map(([date, items]) => {
        const day = new Date(`${date}T00:00:00+07:00`);
        const label = day.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
        return (
          <div key={date} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-700">
              <CalendarDays className="h-4 w-4 text-primary" /> {label}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => {
                const full = s.available <= 0;
                const active = selectedId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={full}
                    onClick={() => onSelect(s)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      full
                        ? "cursor-not-allowed border-border bg-muted/40 opacity-50"
                        : active
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-sm font-700"><Clock className="h-3.5 w-3.5" /> {String(s.start_time).slice(0, 5)}</span>
                      <span className="text-[11px] text-muted-foreground">{s.duration_min} phút</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{s.mode === "onsite" ? `Tại văn phòng${s.location ? ` · ${s.location}` : ""}` : "Online"}</div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" /> {full ? "Đã đầy" : `Còn ${s.available} chỗ`}
                      {s.interviewer_name ? ` · ${s.interviewer_name}` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">Bạn chỉ có thể chọn trong các khung giờ HR đã mở — không tự nhập giờ.</p>
    </div>
  );
}