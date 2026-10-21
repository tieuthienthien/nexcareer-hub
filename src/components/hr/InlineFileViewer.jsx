import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { ExternalLink, Loader2, X } from "lucide-react";

const extOf = (name) => (String(name || "").split(".").pop() || "").toLowerCase();
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp"];
const VIDEO_EXT = ["mp4", "webm", "mov", "m4v"];

export default function InlineFileViewer({ fileUri, label, onClose }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setUrl("");
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri })
      .then((r) => { if (alive) setUrl(r.signed_url); })
      .catch(() => {
        if (alive) setError(`Không mở được "${label}": tệp đang lưu riêng trong hệ thống nguồn nên chưa xem trực tiếp tại đây được.`);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [fileUri, label]);

  const ext = extOf(label);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="truncate text-xs font-600">{label}</span>
        <div className="flex shrink-0 items-center gap-1">
          {url && (
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
              <a href={url} target="_blank" rel="noreferrer">Mở tab mới <ExternalLink className="h-3 w-3" /></a>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Đóng">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="bg-muted/20">
        {loading ? (
          <div className="grid h-64 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-sm text-amber-800">{error}</div>
        ) : IMAGE_EXT.includes(ext) ? (
          <Image src={url} alt={label} fittingType="fit" className="max-h-[65vh] w-full" />
        ) : VIDEO_EXT.includes(ext) ? (
          <video src={url} controls className="max-h-[65vh] w-full bg-black" />
        ) : (
          <iframe src={url} title={label} className="h-[65vh] w-full bg-white" />
        )}
      </div>
    </div>
  );
}