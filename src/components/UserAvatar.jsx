import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
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

// Ảnh đại diện lưu riêng tư nên phải xin link tạm; nhớ link trong ~9 phút để không xin lại mỗi lần render.
const urlCache = new Map();
async function getAvatarUrl(fileUri) {
  const hit = urlCache.get(fileUri);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 600 });
  urlCache.set(fileUri, { url: signed_url, exp: Date.now() + 540000 });
  return signed_url;
}

/**
 * Avatar tối giản, ổn định: cùng một tên/email luôn ra cùng màu và cùng chữ cái đầu.
 * Chỉ gồm hình tròn + chữ cái đầu, tối đa 2 màu, không chi tiết phức tạp.
 * Nếu có `fileUri` (ảnh riêng tư) thì hiện ảnh; chưa có hoặc lỗi thì quay về chữ cái đầu.
 */
export default function UserAvatar({ name, email, fileUri, size = 36, className = "" }) {
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    let alive = true;
    setPhotoUrl(null);
    if (!fileUri) return undefined;
    getAvatarUrl(fileUri).then((url) => { if (alive) setPhotoUrl(url); }).catch(() => {});
    return () => { alive = false; };
  }, [fileUri]);

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
      className={cn("inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-full font-700 leading-none", className)}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" onError={() => setPhotoUrl(null)} className="h-full w-full object-cover" />
      ) : (
        avatarInitials(name, email)
      )}
    </span>
  );
}