import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image } from "@/components/ui/image";
import { AlertTriangle, Loader2, Sparkles, Upload } from "lucide-react";

const POSITIONS = [
  { value: "banner", label: "Banner đầu thư (600px)" },
  { value: "inline", label: "Chèn giữa nội dung" },
  { value: "signature", label: "Logo chữ ký cuối thư" },
];

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            const name = file.name.replace(/\.\w+$/, "") + ".jpg";
            resolve(new File([blob], name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => resolve(file);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function ImageInsertDialog({ open, onOpenChange, onPick }) {
  const [tab, setTab] = useState("upload");
  const [position, setPosition] = useState("banner");
  const [align, setAlign] = useState("center");
  const [size, setSize] = useState("70");
  const [alt, setAlt] = useState("");
  const [selected, setSelected] = useState(null);
  const [library, setLibrary] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setError("");
    setBusy("");
    (async () => {
      try {
        const res = await base44.entities.EmailImage.filter({}, { sort: "-created_date", limit: 40 });
        setLibrary(res.items || []);
      } catch (e) {
        setLibrary([]);
      }
    })();
  }, [open]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png)$/i.test(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPG hoặc PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }
    setBusy("upload");
    setError("");
    try {
      const compressed = await compressImage(file);
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: compressed });
      const saved = await base44.entities.EmailImage.create({ name: file.name, url: file_url, alt: alt || file.name, source: "upload" });
      setLibrary((prev) => [saved, ...prev]);
      setSelected({ url: file_url, alt: alt || file.name });
    } catch (e) {
      setError(e.message || "Không tải được ảnh lên.");
    } finally {
      setBusy("");
    }
  };

  const generate = async () => {
    if (!prompt.trim()) {
      setError("Hãy mô tả ảnh bạn muốn tạo.");
      return;
    }
    setBusy("ai");
    setError("");
    try {
      const res = await base44.functions.invoke("generateEmailImage", {
        description: prompt.trim(),
        kind: position === "banner" ? "banner" : "signature",
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setSelected({ url: data.url, alt: data.alt || prompt.trim() });
      setAlt(data.alt || prompt.trim());
      if (data.image_id) {
        setLibrary((prev) => [{ id: data.image_id, url: data.url, alt: data.alt || "", name: prompt.trim() }, ...prev]);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Chưa tạo được ảnh.");
    } finally {
      setBusy("");
    }
  };

  const confirm = () => {
    if (!selected?.url) {
      setError("Hãy chọn hoặc tạo ảnh trước.");
      return;
    }
    onPick({
      url: selected.url,
      alt: alt || selected.alt || "",
      position,
      align,
      width: Number(size) || 100,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm ảnh vào email</DialogTitle>
          <DialogDescription>Tải ảnh từ máy, chọn từ thư viện hoặc tạo mới bằng AI. Ảnh dùng URL công khai để hiển thị trong hộp thư.</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5" /> {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px]">Vị trí ảnh</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Mô tả thay thế (alt text)</Label>
            <Input className="h-9 text-xs" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="VD: Banner chúc mừng ứng viên" />
          </div>
          {position === "inline" && (
            <>
              <div className="space-y-1">
                <Label className="text-[11px]">Căn lề</Label>
                <Select value={align} onValueChange={setAlign}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Trái</SelectItem>
                    <SelectItem value="center">Giữa</SelectItem>
                    <SelectItem value="right">Phải</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Kích thước</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">Nhỏ (25%)</SelectItem>
                    <SelectItem value="50">Vừa (50%)</SelectItem>
                    <SelectItem value="75">Lớn (75%)</SelectItem>
                    <SelectItem value="100">Toàn chiều rộng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Tải từ máy</TabsTrigger>
            <TabsTrigger value="library">Thư viện</TabsTrigger>
            <TabsTrigger value="ai">Tạo bằng AI</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-2 pt-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-xs text-muted-foreground hover:border-primary/40 hover:bg-primary/5">
              {busy === "upload" ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
              <span className="font-600 text-foreground">Chọn ảnh JPG/PNG (tối đa 5MB)</span>
              <span>Ảnh được tự nén và lưu công khai để hiển thị trong email</span>
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
          </TabsContent>

          <TabsContent value="library" className="pt-3">
            {library.length === 0 ? (
              <p className="rounded-xl bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground">Thư viện chưa có ảnh nào.</p>
            ) : (
              <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {library.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => { setSelected({ url: img.url, alt: img.alt || img.name || "" }); setAlt(img.alt || img.name || ""); }}
                    className={`overflow-hidden rounded-lg border-2 transition ${selected?.url === img.url ? "border-primary" : "border-transparent hover:border-primary/40"}`}
                  >
                    <Image src={img.url} alt={img.alt || img.name || ""} className="h-20 w-full" fittingType="fill" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-2 pt-3">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="VD: Banner chúc mừng ứng viên vượt qua vòng phỏng vấn, tông tím Nexora"
              className="text-sm"
            />
            <Button size="sm" onClick={generate} disabled={busy === "ai"} className="gap-1.5">
              {busy === "ai" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Tạo ảnh bằng AI
            </Button>
            <p className="text-[11px] text-muted-foreground">Ảnh do AI tạo sẽ được lưu vào thư viện để dùng lại.</p>
          </TabsContent>
        </Tabs>

        {selected?.url && (
          <div className="rounded-xl border border-border p-3">
            <p className="mb-2 text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Ảnh đã chọn</p>
            <Image src={selected.url} alt={alt || selected.alt || ""} className="h-32 w-full rounded-lg" fittingType="fit" />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={confirm} disabled={!selected?.url || !!busy} className="gap-1.5">Chèn vào email</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}