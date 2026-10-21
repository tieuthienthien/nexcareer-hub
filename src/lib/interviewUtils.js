const TZ = "+07:00";

export function slotStart(date, time) {
  return new Date(`${date}T${String(time || "09:00").slice(0, 5)}:00${TZ}`);
}

export function formatSlot(date, time, duration = 45) {
  if (!date || !time) return "";
  const d = slotStart(date, time);
  const label = d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${label} lúc ${String(time).slice(0, 5)} (${duration} phút)`;
}

function compact(d) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl({ title, details, place, date, time, duration = 45 }) {
  const start = slotStart(date, time);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + duration * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "Phỏng vấn",
    dates: `${compact(start)}/${compact(end)}`,
    details: details || "",
    location: place || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs({ title, details, place, date, time, duration = 45 }) {
  const start = slotStart(date, time);
  if (Number.isNaN(start.getTime())) return;
  const end = new Date(start.getTime() + duration * 60000);
  const uid = `nexcareer-${date}-${String(time).replace(":", "")}@nexcareerhub`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NexCareer Hub//Interview//VI",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${compact(new Date())}`,
    `DTSTART:${compact(start)}`,
    `DTEND:${compact(end)}`,
    `SUMMARY:${(title || "Phỏng vấn").replace(/\n/g, " ")}`,
    `DESCRIPTION:${(details || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${(place || "").replace(/\n/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lich-phong-van.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function countdownTo(iso) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  const past = diff <= 0;
  const abs = Math.abs(diff);
  return {
    past,
    days: Math.floor(abs / 86400000),
    hours: Math.floor((abs % 86400000) / 3600000),
    minutes: Math.floor((abs % 3600000) / 60000),
  };
}