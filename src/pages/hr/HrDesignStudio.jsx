import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, ExternalLink, Loader2, Palette, RotateCcw, Save } from "lucide-react";
import { useSiteDesign } from "@/components/design/SiteDesignProvider";
import { DEFAULT_DESIGN, PRESETS } from "@/lib/siteDesign";
import ThemeTab from "@/components/design/ThemeTab";
import BackgroundTab from "@/components/design/BackgroundTab";
import ContentTab from "@/components/design/ContentTab";
import ThemePreview from "@/components/design/ThemePreview";

export default function HrDesignStudio() {
  const { design, ready, save } = useSiteDesign();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ready && !draft) setDraft(design);
  }, [ready, design, draft]);

  if (!draft) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  const applyPreset = (preset) =>
    setDraft({ ...draft, preset: preset.key, theme: { ...preset.theme }, background: { ...preset.background } });

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-800 tracking-tight">
            <Palette className="h-6 w-6 text-primary" /> Design Studio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đổi màu, font, nền và nội dung cho toàn bộ website.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/" target="_blank">
              <ExternalLink className="h-4 w-4" /> Xem website
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setDraft({ ...DEFAULT_DESIGN })}>
            <RotateCcw className="h-4 w-4" /> Mặc định
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Đang lưu..." : saved ? "Đã lưu" : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <div>
        <div className="text-xs font-700 uppercase tracking-wider text-muted-foreground">Bộ giao diện mẫu</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => {
            const active = draft.preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p)}
                className={`overflow-hidden rounded-xl border p-3 text-left transition-colors ${
                  active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex gap-1">
                  {[p.theme.primary, p.theme.accent, p.theme.background, p.theme.foreground].map((c) => (
                    <span key={c} className="h-5 w-5 rounded-full border border-black/5" style={{ background: c }} />
                  ))}
                </div>
                <div className="mt-2 text-sm font-600">{p.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
          <Tabs defaultValue="theme">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="theme">Màu &amp; chữ</TabsTrigger>
              <TabsTrigger value="background">Nền trang</TabsTrigger>
              <TabsTrigger value="content">Nội dung</TabsTrigger>
            </TabsList>
            <TabsContent value="theme" className="mt-5">
              <ThemeTab theme={draft.theme} onChange={(theme) => setDraft({ ...draft, theme })} />
            </TabsContent>
            <TabsContent value="background" className="mt-5">
              <BackgroundTab background={draft.background} onChange={(background) => setDraft({ ...draft, background })} />
            </TabsContent>
            <TabsContent value="content" className="mt-5">
              <ContentTab content={draft.content} onChange={(content) => setDraft({ ...draft, content })} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-2 text-xs font-700 uppercase tracking-wider text-muted-foreground">Xem trước</div>
          <ThemePreview theme={draft.theme} background={draft.background} />
          <p className="mt-3 text-xs text-muted-foreground">
            Nhấn “Lưu thay đổi” để áp dụng cho toàn bộ website. Bấm “Xem website” để kiểm tra trang thật.
          </p>
        </div>
      </div>
    </div>
  );
}