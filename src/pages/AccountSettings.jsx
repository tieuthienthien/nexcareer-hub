import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ShieldCheck, Mail, User as UserIcon } from "lucide-react";

export default function AccountSettings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [emailPref, setEmailPref] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name || "");
    if (user?.preferences) setEmailPref(user.preferences.email_notifications !== false);
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: fullName, preferences: { email_notifications: emailPref } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert(e.message || "Không thể lưu."); }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-800 tracking-tight">Cài đặt tài khoản</h1>
      <p className="mt-2 text-muted-foreground">Quản lý thông tin cá nhân và tùy chọn thông báo.</p>

      <div className="mt-8 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><UserIcon className="h-6 w-6" /></div>
            <div>
              <h2 className="font-heading text-lg font-700">Hồ sơ cá nhân</h2>
              <p className="text-sm text-muted-foreground">Tên hiển thị trên NexCareer Hub.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Họ và tên</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Email đăng nhập</Label>
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" /> <span>{user?.email}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Email lấy từ tài khoản Google, không thể thay đổi tại đây.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <h2 className="font-heading text-lg font-700">Tùy chọn thông báo</h2>
              <p className="text-sm text-muted-foreground">Kênh bạn muốn nhận cập nhật hồ sơ ứng tuyển.</p>
            </div>
          </div>
          <label className="mt-5 flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <div className="text-sm font-600">Email cập nhật vòng tuyển</div>
              <div className="text-xs text-muted-foreground">Nhận email khi hồ sơ chuyển vòng hoặc có quyết định.</div>
            </div>
            <input type="checkbox" checked={emailPref} onChange={(e) => setEmailPref(e.target.checked)} className="h-5 w-5 rounded" />
          </label>
        </section>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu thay đổi
          </Button>
          {saved && <span className="text-sm font-500 text-emerald-600">Đã lưu ✓</span>}
        </div>
      </div>
    </div>
  );
}