import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Save, Sparkles } from "lucide-react";
import { formatDateTime } from "@/lib/rms";

/**
 * Ô chấm điểm của một vòng: hiển thị điểm AI (tham khảo) và cho HR nhập điểm chính thức.
 * onChange trả về bản ghi RoundScore để component cha biết vòng này đã có điểm hay chưa.
 * "Chấm lại bằng AI" chỉ cập nhật điểm AI, không bao giờ ghi đè Điểm HR.
 */
export default function HrScoreBox({ applicationId, round, aiScore, canRegrade = false, onRegraded, onChange }) {
  const [record, setRecord] = useState(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [ai, setAi] = useState(aiScore ?? null);
  const [regrading, setRegrading] = useState(false);
  const [regradeMsg, setRegradeMsg] = useState("");
  const [regradeError, setRegradeError] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setAi(aiScore ?? null);
  }, [aiScore]);

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

  const loadLogs = async () => {
    try {
      const res = await base44.entities.RegradeLog.filter({ application_id: applicationId, round }, { sort: "-created_date", limit: 5 });
      setLogs(res.items || []);
    } catch (e) {
      setLogs([]);
    }
  };

  useEffect(() => {
    loadLogs();
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
        ai_score: ai == null ? null : Math.round(Number(ai)),
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

  const regrade = async () => {
    setRegrading(true);
    setRegradeError("");
    setRegradeMsg("");
    try {
      const res = await base44.functions.invoke("regradeRound", { application_id: applicationId, round });
      const d = res.data || {};
      if (d.error) throw new Error(d.error);
      setAi(d.new_score ?? null);
      setRegradeMsg(`AI đã chấm lại: ${d.old_score == null ? "—" : d.old_score} → ${d.new_score == null ? "—" : d.new_score}/100. Điểm HR giữ nguyên.`);
      await loadLogs();
      onRegraded?.();
    } catch (e) {
      setRegradeError(e.response?.data?.error || e.message || "Không chấm lại được bằng AI.");
    } finally {
      setRegrading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-3">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
        <div>
          <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">Điểm AI (tham khảo)</p>
          <div className="flex items-center gap-2">
            <p className="font-heading text-lg font-700 text-primary">{ai == null ? "—" : `${Math.round(Number(ai))}/100`}</p>
            {canRegrade && (
              <Button
                size="sm"
                variant="ghost"
                onClick={regrade}
                disabled={regrading}
                className="h-7 gap-1 px-2 text-[11px] text-primary hover:bg-primary/10"
              >
                {regrading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {regrading ? "Đang chấm..." : "Chấm lại bằng AI"}
              </Button>
            )}
          </div>
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

      {regradeError && <p className="mt-1.5 text-[11px] text-rose-700">{regradeError}</p>}
      {regradeMsg && <p className="mt-1.5 text-[11px] text-emerald-700">{regradeMsg}</p>}

      {logs.length > 0 && (
        <div className="mt-2 border-t border-border/60 pt-2">
          <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">Lịch sử chấm lại</p>
          <ul className="mt-1 space-y-0.5">
            {logs.map((l) => (
              <li key={l.id} className="text-[11px] text-muted-foreground">
                {formatDateTime(l.at || l.created_date)} · {l.old_score == null ? "—" : l.old_score} → {l.new_score == null ? "—" : l.new_score}
                {l.regraded_by_email ? ` · ${l.regraded_by_email}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}