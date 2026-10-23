import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Award, Check, TrendingUp, AlertCircle } from "lucide-react";

export default function SimulationResult({ result, simulation }) {
  if (!result) return null;
  const radar = [
    { skill: "Debug", value: result.ai_report?.radar?.debug || 0 },
    { skill: "Lập trình", value: result.ai_report?.radar?.coding || 0 },
    { skill: "Xử lý tình huống", value: result.ai_report?.radar?.judgment || 0 },
    { skill: "Giao tiếp", value: result.ai_report?.radar?.communication || 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground">{simulation?.name || "Job Simulation"}</p>
        <div className="mt-2 font-heading text-5xl font-700">{result.score}<span className="text-lg font-500 text-muted-foreground">/100</span></div>
        <p className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-700 ${result.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
          {result.passed ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {result.passed ? "Đạt" : "Chưa đạt"} · ngưỡng {result.pass_score || simulation?.pass_score || 80} điểm
        </p>
        {result.certificate && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary">
            <Award className="h-3.5 w-3.5" /> Bạn đã nhận Chứng nhận Nexora cho bài mô phỏng này
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Thời gian làm bài: {Math.round((result.time_spent_sec || 0) / 60)} phút</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-700">Điểm từng nhiệm vụ</h3>
          <div className="mt-2 space-y-2">
            {(result.task_scores || []).map((task) => (
              <div key={task.task_id}>
                <div className="flex items-center justify-between text-xs font-600">
                  <span>{task.title}</span>
                  <span>{task.score}/{task.max}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((task.score / task.max) * 100)}%` }} />
                </div>
                {task.comment && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{task.comment}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-700">Biểu đồ 4 kỹ năng</h3>
          <div className="mt-1 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <Radar dataKey="value" stroke="#564be7" fill="#564be7" fillOpacity={0.28} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {(result.ai_report?.strengths || result.ai_report?.improvements) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.ai_report?.strengths && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="inline-flex items-center gap-1.5 text-xs font-700 uppercase tracking-wide text-emerald-700"><TrendingUp className="h-3.5 w-3.5" /> Điểm mạnh</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{result.ai_report.strengths}</p>
            </div>
          )}
          {result.ai_report?.improvements && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="inline-flex items-center gap-1.5 text-xs font-700 uppercase tracking-wide text-amber-800"><AlertCircle className="h-3.5 w-3.5" /> Cần cải thiện</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{result.ai_report.improvements}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}