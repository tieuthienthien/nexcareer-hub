import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Save } from "lucide-react";

/**
 * Ô chấm điểm của một vòng: hiển thị điểm AI (tham khảo) và cho HR nhập điểm chính thức.
 * onChange trả về bản ghi RoundScore để component cha biết vòng này đã có điểm hay chưa.
 */
export default function HrScoreBox({ applicationId, round, aiScore, onChange }) {
  const [record, setRecord] = useState(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.entities.RoundScore.filter({ application_id: applicationId, round }, { limit: 1 });
        const found = (res.items || [])[0] || null;
        if (!alive) return;
        setRecord(found);
        setValue(found?.hr_score != null ? String(found.hr_score) : "");
        onChange?.(found);
      } catch (e) {
        if (alive) onChange?.(null);
      }
    })();
    return () => { alive = false; };
  }, [applicationId, round]);

  const save = async () => {
    if (value === "") { setError("Nhập điểm HR cho vòng này (có thể là 0)."); return; }
    const num = Number(value);
    if (Number.isNaN(num) || num < 0 || num > 100) { setError("Điểm HR phải trong khoảng 0–100."); return; }
    setBusy(true);
    setError("");
    try {
      const me = await base44.auth.me();
      const payload = {
        application_id: applicationId,
        round,
        ai_score: aiScore == null ? null : Math.round(Number(aiScore)),
        hr_score: num,
        scored_by_email: me?.email || "",
      };
      const savedRecord = record?.id
        ? await base44.entities.RoundScore.update(record.id, payload)
        : await base44.entities.RoundScore.create(payload);
      setRecord(savedRecord);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      onChange?.(savedRecord);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không lưu được điểm HR.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-3">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
        <div>
          <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">Điểm AI (tham khảo)</p>
          <p className="font-heading text-lg font-700 text-primary">{aiScore == null ? "—" : `${Math.round(Number(aiScore))}/100`}</p>
        </div>
        <div>
          <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">Điểm HR (chính thức)</p>
          <p className="font-heading text-lg font-700">{record?.hr_score != null ? `${record.hr_score}/100` : "Chưa chấm"}</p>
        </div>
        <div className="flex items-end gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0–100"
            className="h-9 w-24 text-sm"
          />
          <Button size="sm" onClick={save} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />} Lưu điểm
          </Button>
        </div>
      </div>
      <p className={`mt-1.5 text-[11px] ${error ? "text-rose-700" : "text-muted-foreground"}`}>
        {error || (record?.hr_score != null ? "Điểm HR là điểm chính thức dùng để xét đạt/không đạt và chuyển vòng." : "Bắt buộc chấm điểm HR trước khi chuyển vòng hoặc chốt kết quả.")}
      </p>
    </div>
  );
}