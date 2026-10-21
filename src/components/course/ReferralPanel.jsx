import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { buildReferralLink, derivedReferralCode } from "@/lib/courseAccess";
import { Copy, Gift, Check, Users, Unlock } from "lucide-react";

export default function ReferralPanel({ userId, remaining, invited }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const link = buildReferralLink(userId);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ title: "Đã copy link mời bạn bè" });
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      toast({ title: "Không copy được", description: "Hãy bôi đen và copy link trong ô bên dưới.", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-pastel-pink/20 to-pastel-sky/30 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <Gift className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="font-heading text-base font-700">Mời bạn bè — mở thêm khóa học</h3>
          <p className="text-xs text-muted-foreground">Mỗi tài khoản được học miễn phí 1 khóa. Mời 1 người bạn đăng ký thành công để mở thêm 1 khóa.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/80 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-600 uppercase tracking-wide text-muted-foreground">
            <Unlock className="h-3.5 w-3.5" /> Số khóa còn được mở
          </div>
          <div className="mt-1 font-heading text-2xl font-800 text-primary">{remaining}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/80 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-600 uppercase tracking-wide text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Bạn bè đã mời thành công
          </div>
          <div className="mt-1 font-heading text-2xl font-800 text-foreground">{invited}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={link} className="h-10 border-border bg-background/80 text-xs" onFocus={(e) => e.target.select()} />
          <Button onClick={copy} className="h-10 shrink-0 gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy link mời bạn bè
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Mã giới thiệu của bạn: <span className="font-600 text-foreground">{derivedReferralCode(userId)}</span> · Mỗi người bạn mời chỉ được tính 1 lần.
        </p>
      </div>
    </div>
  );
}