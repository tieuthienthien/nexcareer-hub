import ColorField from "./ColorField";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FONT_OPTIONS } from "@/lib/siteDesign";

export default function ThemeTab({ theme, onChange }) {
  const set = (patch) => onChange({ ...theme, ...patch });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-base font-700">Bộ màu</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Màu được áp dụng cho mọi trang: nút, thẻ, biểu mẫu, liên kết.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <ColorField label="Màu nền" value={theme.background} onChange={(v) => set({ background: v })} />
          <ColorField label="Màu chữ" value={theme.foreground} onChange={(v) => set({ foreground: v })} />
          <ColorField label="Màu chính" value={theme.primary} onChange={(v) => set({ primary: v })} />
          <ColorField label="Màu nhấn" value={theme.accent} onChange={(v) => set({ accent: v })} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-600">Bo góc</Label>
          <span className="text-xs text-muted-foreground">{Math.round(Number(theme.radius) * 16)}px</span>
        </div>
        <Slider
          className="mt-3"
          min={0}
          max={24}
          step={1}
          value={[Math.round(Number(theme.radius) * 16)]}
          onValueChange={([v]) => set({ radius: v / 16 })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-sm font-600">Font tiêu đề</Label>
          <Select value={theme.font_heading} onValueChange={(v) => set({ font_heading: v })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-600">Font nội dung</Label>
          <Select value={theme.font_body} onValueChange={(v) => set({ font_body: v })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}