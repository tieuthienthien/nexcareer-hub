import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import ColorField from "./ColorField";

const MODES = [
  { key: "galaxy", label: "Galaxy chấm sao", desc: "Chấm pastel lấp lánh — giao diện gốc." },
  { key: "solid", label: "Màu trơn", desc: "Chỉ dùng màu nền đã chọn." },
  { key: "gradient", label: "Gradient", desc: "Chuyển sắc giữa hai màu." },
  { key: "image", label: "Ảnh nền", desc: "Ảnh riêng, có lớp phủ giúp chữ dễ đọc." },
];

export default function BackgroundTab({ background, onChange }) {
  const [uploading, setUploading] = useState(false);
  const set = (patch) => onChange({ ...background, ...patch });

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set({ image_url: file_url, mode: "image" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-base font-700">Kiểu nền</h3>
        <p className="mt-1 text-xs text-muted-foreground">Áp dụng cho toàn bộ các trang công khai và Candidate Room.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {MODES.map((m) => {
            const active = background.mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => set({ mode: m.key })}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className={`text-sm font-600 ${active ? "text-primary" : ""}`}>{m.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {background.mode === "gradient" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <ColorField label="Màu bắt đầu" value={background.color_from} onChange={(v) => set({ color_from: v })} />
          <ColorField label="Màu kết thúc" value={background.color_to} onChange={(v) => set({ color_to: v })} />
        </div>
      )}

      {background.mode === "image" && (
        <div className="space-y-3">
          <Label className="text-sm font-600">Ảnh nền</Label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-500 hover:border-primary/40">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Đang tải ảnh..." : "Tải ảnh lên"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0])}
                disabled={uploading}
              />
            </label>
            <span className="text-xs text-muted-foreground">Hoặc dán link ảnh bên dưới</span>
          </div>
          <Input
            value={background.image_url || ""}
            onChange={(e) => set({ image_url: e.target.value })}
            placeholder="https://..."
          />
          {background.image_url && (
            <div
              className="h-28 w-full rounded-xl border border-border bg-cover bg-center"
              style={{ backgroundImage: `url("${background.image_url}")` }}
            />
          )}
        </div>
      )}
    </div>
  );
}