import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { applicationStatusLabel, applicationStatusColor } from "@/lib/jobUtils";
import { Users, X, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX = 4;

function ScoreCell({ value }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const color = value >= 75 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-rose-600";
  return <span className={`font-700 ${color}`}>{value}</span>;
}

export default function HrCompare() {
  const [all, setAll] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [res, scoreRes] = await Promise.all([
          base44.entities.Application.filter({}, { sort: "-created_date", limit: 100 }),
          base44.entities.RoundScore.list({ limit: 300 }),
        ]);
        setAll(res.items || []);
        const map = {};
        (scoreRes.items || []).forEach((r) => {
          map[r.application_id] = { ...(map[r.application_id] || {}), [r.round]: r };
        });
        setScores(map);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const hrScore = (app, round) => scores?.[app.id]?.[round]?.hr_score;

  const toggle = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX) return prev;
      return [...prev, id];
    });
  };

  const selectedApps = selected.map((id) => all.find((a) => a.id === id)).filter(Boolean);

  const rows = [
    { label: "Vị trí", get: (a) => a.job_title || "—" },
    { label: "Công ty", get: (a) => a.company || "—" },
    { label: "Trạng thái", get: (a) => <span className={`rounded-full px-2 py-0.5 text-[11px] font-600 ${applicationStatusColor[a.status]}`}>{applicationStatusLabel[a.status]}</span> },
    { label: "Điểm AI vòng 1 (tham khảo)", get: (a) => <ScoreCell value={a.cv_match_score} /> },
    { label: "Điểm AI vòng 2 (tham khảo)", get: (a) => <ScoreCell value={a.test_score} /> },
    { label: "Điểm AI vòng 3 (tham khảo)", get: (a) => <ScoreCell value={a.interview_score} /> },
    { label: "Điểm HR vòng 1 (CV)", get: (a) => <ScoreCell value={hrScore(a, "cv")} /> },
    { label: "Điểm HR vòng 2 (Job Simulation)", get: (a) => <ScoreCell value={hrScore(a, "simulation")} /> },
    { label: "Điểm HR vòng 3 (Phỏng vấn)", get: (a) => <ScoreCell value={hrScore(a, "interview")} /> },
    {
      label: "Tổng điểm HR",
      get: (a) => {
        const list = ["cv", "simulation", "interview"].map((r) => hrScore(a, r));
        if (list.some((v) => v == null)) return <span className="text-xs text-amber-700">Chưa chấm đủ 3 vòng</span>;
        const total = list.reduce((s, v) => s + Number(v), 0);
        return <span className="font-700">{Math.round(total / 3)}/100</span>;
      },
    },
    { label: "Điểm mạnh", get: (a) => a.cv_strengths ? <p className="whitespace-pre-wrap text-xs">{a.cv_strengths}</p> : "—" },
    { label: "Khoảng trống", get: (a) => a.cv_gaps ? <p className="whitespace-pre-wrap text-xs">{a.cv_gaps}</p> : "—" },
    { label: "Ghi chú HR", get: (a) => a.notes || a.final_notes || "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-700">So sánh ứng viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chọn tối đa {MAX} hồ sơ để đối chiếu side-by-side theo 3 vòng đánh giá.</p>
      </div>

      {/* Selection list */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-600">{loading ? "Đang tải..." : `Chọn ứng viên (${selected.length}/${MAX})`}</h2>
          {selected.length > 0 && <Button variant="ghost" size="sm" onClick={() => setSelected([])} className="gap-1.5"><X className="h-3.5 w-3.5" /> Bỏ chọn tất cả</Button>}
        </div>
        <div className="mt-3 max-h-72 space-y-1.5 overflow-auto pr-1">
          {all.map((a) => {
            const on = selected.includes(a.id);
            const disabled = !on && selected.length >= MAX;
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                disabled={disabled}
                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                  on ? "border-primary bg-primary/10" : disabled ? "border-border/60 opacity-50" : "border-border/60 hover:bg-muted"
                }`}
              >
                <div className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? "border-primary bg-primary text-white" : "border-border"}`}>
                  {on && <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-700 text-primary">{(a.full_name || "?")[0].toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-600">{a.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.job_title}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-600 ${applicationStatusColor[a.status]}`}>{applicationStatusLabel[a.status]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison */}
      {selectedApps.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <GitCompare className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Chọn ứng viên để bắt đầu so sánh.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-left text-xs font-600 uppercase tracking-wide text-muted-foreground">Tiêu chí</th>
                {selectedApps.map((a) => (
                  <th key={a.id} className="min-w-[180px] px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-700 text-primary">{(a.full_name || "?")[0].toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="truncate font-600">{a.full_name}</div>
                        <button onClick={() => toggle(a.id)} className="text-[11px] font-500 text-muted-foreground hover:text-rose-600">Bỏ chọn</button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={i % 2 ? "bg-muted/10" : ""}>
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-xs font-600 text-muted-foreground">{r.label}</td>
                  {selectedApps.map((a) => (
                    <td key={a.id} className="align-top px-4 py-3 text-sm">{r.get(a)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}