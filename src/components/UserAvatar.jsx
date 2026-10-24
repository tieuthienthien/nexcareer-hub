import { cn } from "@/lib/utils";

// Bảng màu tối giản: mỗi avatar chỉ dùng 1 màu nền + 1 màu chữ.
const PALETTES = [
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#dbeafe", fg: "#1d4ed8" },
  { bg: "#dcfce7", fg: "#15803d" },
  { bg: "#fef3c7", fg: "#b45309" },
  { bg: "#ffe4e6", fg: "#be123c" },
  { bg: "#cffafe", fg: "#0e7490" },
];

function hashString(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function avatarSeed(name, email) {
  return String(name || email || "NexCareer").trim().toLowerCase();
}

export function avatarInitials(name, email) {
  const source = String(name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar tối giản, ổn định: cùng một tên/email luôn ra cùng màu và cùng chữ cái đầu.
 * Chỉ gồm hình tròn + chữ cái đầu, tối đa 2 màu, không chi tiết phức tạp.
 */
export default function UserAvatar({ name, email, size = 36, className = "" }) {
  const palette = PALETTES[hashString(avatarSeed(name, email)) % PALETTES.length];
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: palette.bg,
        color: palette.fg,
        fontSize: Math.max(10, Math.round(size * 0.38)),
      }}
      className={cn("inline-grid shrink-0 select-none place-items-center rounded-full font-700 leading-none", className)}
    >
      {avatarInitials(name, email)}
    </span>
  );
}