import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Loader2 } from "lucide-react";

export default function GoogleCredentialForm({ clientId, redirectUri, configured, onSaved, onCancel, onConnect }) {
  const [id, setId] = useState(clientId || "");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const save = async (connectAfter) => {
    setBusy(true);
    setError("");
    try {
      const data = (await base44.functions.invoke("gcalAuth", {
        action: "save",
        client_id: id.trim(),
        client_secret: secret.trim(),
        redirect_uri: redirectUri,
      }))?.data || {};
      setSecret("");
      setBusy(false);
      onSaved?.(data);
      if (connectAfter) await onConnect?.();
    } catch (e) {
      setError(e.message || "Không lưu được Client ID/Secret.");
      setBusy(false);
    }
  };

  const copyRedirect = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Trình duyệt không cho phép sao chép — hãy copy thủ công.");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        Bật Google Calendar API, tạo OAuth Client (Web application) trong Google Cloud Console rồi dán vào đây.
        Client Secret được lưu phía server và không hiển thị lại.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Client ID</Label>
          <Input
            className="mt-1 h-9 font-mono text-xs"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="1234567890-abc.apps.googleusercontent.com"
          />
        </div>
        <div>
          <Label className="text-xs">Client Secret</Label>
          <Input
            className="mt-1 h-9 font-mono text-xs"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={configured ? "Đã lưu — nhập lại nếu muốn đổi" : "GOCSPX-..."}
          />
        </div>
      </div>

      <div className="mt-3">
        <Label className="text-xs">Redirect URI (dán đúng vào Google Cloud Console)</Label>
        <div className="mt-1 flex items-center gap-2">
          <Input readOnly value={redirectUri} className="h-9 font-mono text-xs" onFocus={(e) => e.target.select()} />
          <Button type="button" size="sm" variant="outline" className="h-9 shrink-0 gap-1.5" onClick={copyRedirect}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Đã copy" : "Copy"}
          </Button>
        </div>
      </div>

      {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={() => save(!configured)} disabled={busy}>
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          {configured ? "Lưu thay đổi" : "Lưu & kết nối Google"}
        </Button>
        {configured && onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>Hủy</Button>
        )}
      </div>
    </div>
  );
}