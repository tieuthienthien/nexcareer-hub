import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, Loader2, Search, ShieldAlert } from "lucide-react";

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const check = async (value) => {
    const input = String(value || "").trim();
    if (!input) {
      setError("Hãy nhập mã chứng chỉ.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("verifyCertificate", { code: input });
      const data = res.data || res;
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không kiểm tra được chứng chỉ.");
    }
    setBusy(false);
  };

  useEffect(() => {
    const preset = searchParams.get("code");
    if (preset) check(preset);
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary">
          <BadgeCheck className="h-3.5 w-3.5" /> Xác thực công khai
        </span>
        <h1 className="mt-3 font-heading text-3xl font-800 tracking-tight">Xác thực chứng chỉ</h1>
        <p className="mt-2 text-muted-foreground">Nhập mã chứng chỉ để kiểm tra chứng chỉ có được NexCareer Hub cấp hay không.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          check(code);
        }}
        className="mt-7 flex flex-col gap-2 rounded-3xl border border-border bg-card p-4 sm:flex-row"
      >
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ví dụ: NX-1A2B3C4D5E6F"
          className="h-11 flex-1 font-mono tracking-wide"
        />
        <Button type="submit" disabled={busy} className="h-11 shrink-0 gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Kiểm tra
        </Button>
      </form>

      {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {result && !result.valid && (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
          <ShieldAlert className="mx-auto h-9 w-9 text-amber-600" />
          <h2 className="mt-2 font-heading text-lg font-700 text-amber-900">Không tìm thấy chứng chỉ</h2>
          <p className="mt-1 text-sm text-amber-800">Mã chứng chỉ không đúng hoặc chưa được cấp bởi NexCareer Hub.</p>
        </div>
      )}

      {result?.valid && (
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-6 w-6 text-emerald-600" />
            <h2 className="font-heading text-lg font-700 text-emerald-900">Chứng chỉ hợp lệ</h2>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-emerald-200/70 pb-2">
              <dt className="text-emerald-800/80">Học viên</dt>
              <dd className="text-right font-600 text-foreground">{result.certificate.user_name}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-emerald-200/70 pb-2">
              <dt className="text-emerald-800/80">Khóa học</dt>
              <dd className="text-right font-600 text-foreground">{result.certificate.course_title}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-emerald-200/70 pb-2">
              <dt className="text-emerald-800/80">Điểm cuối khóa</dt>
              <dd className="text-right font-600 text-foreground">{result.certificate.score}/100</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-emerald-200/70 pb-2">
              <dt className="text-emerald-800/80">Ngày cấp</dt>
              <dd className="text-right font-600 text-foreground">
                {result.certificate.issued_at ? new Date(result.certificate.issued_at).toLocaleDateString("vi-VN") : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-emerald-800/80">Mã chứng chỉ</dt>
              <dd className="text-right font-mono font-600 text-foreground">{result.certificate.code}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs font-600 uppercase tracking-wide text-emerald-800">Được công nhận bởi Nexora Technology</p>
        </div>
      )}
    </div>
  );
}