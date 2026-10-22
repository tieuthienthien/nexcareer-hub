import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, Loader2 } from "lucide-react";

export default function CvButtons({ app }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const hasPrivate = !!app?.cv_file_uri;
  const external = app?.cv_source_url;

  const sign = async () => {
    const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: app.cv_file_uri, expires_in: 600 });
    return res.signed_url;
  };

  const preview = async () => {
    if (!hasPrivate) {
      if (external) window.open(external, "_blank", "noreferrer");
      else setError("Hồ sơ này chưa có file CV.");
      setOpen(true);
      return;
    }
    setBusy("preview");
    setError("");
    setOpen(true);
    try {
      setUrl(await sign());
    } catch (e) {
      setError("Không mở được CV: tệp đang lưu riêng nên chưa xem trực tiếp được.");
    } finally {
      setBusy("");
    }
  };

  const download = async () => {
    if (!hasPrivate) {
      if (external) window.open(external, "_blank", "noreferrer");
      return;
    }
    setBusy("download");
    try {
      const signedUrl = await sign();
      const a = document.createElement("a");
      a.href = signedUrl;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.download = `CV-${app.full_name || "ung-vien"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError("Không tải được CV.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={preview} disabled={busy === "preview"}>
        {busy === "preview" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />} Xem
      </Button>
      <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={download} disabled={busy === "download" || !hasPrivate}>
        {busy === "download" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Tải
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base">CV — {app?.full_name}</DialogTitle>
          </DialogHeader>
          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-800">{error}</div>
          ) : busy ? (
            <div className="grid h-64 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : url ? (
            <iframe src={url} title={`CV ${app?.full_name}`} className="h-[70vh] w-full rounded-xl border border-border bg-white" />
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Chưa có bản xem trước.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}