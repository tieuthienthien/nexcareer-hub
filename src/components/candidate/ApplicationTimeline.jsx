import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, FileSearch, ClipboardCheck, Video, ArrowRight } from "lucide-react";
import { ROUNDS, getStageInfo, isFinalStatus } from "@/lib/jobUtils";

const roundIcon = [FileSearch, ClipboardCheck, Video];

export default function ApplicationTimeline({ app }) {
  const info = getStageInfo(app.status);
  const final = isFinalStatus(app.status);

  const stateOf = (round) => {
    if (info.round > round) return "done";
    if (info.round === round) return info.state; // active | passed | rejected
    return "pending";
  };

  const allRejected = ["cv_rejected", "test_rejected", "rejected"].includes(app.status);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/viec-lam/${app.job_id}`} className="font-600 hover:text-primary">{app.job_title}</Link>
          <div className="text-xs text-muted-foreground">{app.company} · {new Date(app.created_date).toLocaleDateString("vi-VN")}</div>
        </div>
        {app.cv_match_score != null && (
          <div className="text-right">
            <div className="text-lg font-700 text-primary">{app.cv_match_score}%</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Khớp CV (AI)</div>
          </div>
        )}
      </div>

      <ol className="mt-5 space-y-4">
        {ROUNDS.map((r, i) => {
          const st = stateOf(r.id);
          const Icon = roundIcon[i];
          return (
            <li key={r.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  st === "done" || st === "passed" ? "bg-emerald-100 text-emerald-600"
                  : st === "rejected" ? "bg-rose-100 text-rose-600"
                  : st === "active" ? "bg-primary/15 text-primary ring-2 ring-primary/30"
                  : "bg-muted text-muted-foreground"
                }`}>
                  {st === "done" || st === "passed" ? <CheckCircle2 className="h-5 w-5" />
                    : st === "rejected" ? <XCircle className="h-5 w-5" />
                    : <Icon className="h-5 w-5" />}
                </div>
                {i < ROUNDS.length - 1 && <div className={`my-1 w-0.5 flex-1 ${st === "done" ? "bg-emerald-300" : "bg-border"}`} style={{ minHeight: 22 }} />}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-700 text-muted-foreground">VÒNG {r.id}</span>
                  {st === "active" && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-600 text-primary"><Clock className="h-3 w-3" /> Đang diễn ra</span>}
                  {st === "rejected" && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-600 text-rose-700">Không đạt</span>}
                </div>
                <h4 className="mt-0.5 text-sm font-600">{r.title}</h4>
                <p className="text-xs text-muted-foreground">{r.desc}</p>

                {/* Chi tiết / hành động theo vòng */}
                {r.id === 1 && (st === "active" || st === "passed") && app.cv_ai_analysis && (
                  <p className="mt-2 rounded-lg bg-muted/40 p-2.5 text-xs text-foreground/80">{app.cv_ai_analysis}</p>
                )}
                {r.id === 1 && (st === "active" || st === "passed") && app.cv_strengths && (
                  <div className="mt-1.5">
                    <div className="text-[10px] font-700 uppercase tracking-wide text-emerald-700">Điểm mạnh</div>
                    <p className="mt-0.5 whitespace-pre-wrap rounded-lg bg-emerald-50/60 p-2 text-[11px] text-foreground/80">{app.cv_strengths}</p>
                  </div>
                )}
                {r.id === 1 && (st === "active" || st === "passed") && app.cv_gaps && (
                  <div className="mt-1.5">
                    <div className="text-[10px] font-700 uppercase tracking-wide text-amber-700">Cần bổ sung / xác minh</div>
                    <p className="mt-0.5 whitespace-pre-wrap rounded-lg bg-amber-50/60 p-2 text-[11px] text-foreground/80">{app.cv_gaps}</p>
                  </div>
                )}
                {r.id === 2 && st === "active" && app.status === "test_invited" && (
                  <Link to={`/phong-thi/${app.id}`} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-600 text-primary-foreground hover:bg-primary/90">
                    Vào phòng thi <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                {r.id === 2 && app.status === "test_submitted" && (
                  <p className="mt-2 text-xs text-sky-700">Đã nộp bài — HR đang chấm{app.test_score != null ? ` (AI tham khảo: ${app.test_score}/100)` : ""}.</p>
                )}
                {r.id === 3 && st === "active" && app.status === "interview_invited" && (
                  <Link to={`/phong-van/${app.id}`} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-600 text-primary-foreground hover:bg-primary/90">
                    Vào phòng phỏng vấn <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                {r.id === 3 && app.status === "interview_submitted" && (
                  <p className="mt-2 text-xs text-indigo-700">Đã hoàn thành — hội đồng đang đánh giá{app.interview_score != null ? ` (AI tham khảo: ${app.interview_score}/100)` : ""}.</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {final && (
        <div className={`mt-4 rounded-xl p-3 text-sm ${app.status === "hired" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {app.status === "hired" ? "🎉 Chúc mừng — bạn đã trúng tuyển!" : allRejected ? "Lần này hồ sơ chưa phù hợp. Mong được đồng hành cùng bạn trong cơ hội khác." : "Hồ sơ chưa phù hợp ở vòng này."}
        </div>
      )}
    </div>
  );
}