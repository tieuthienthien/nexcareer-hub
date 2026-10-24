import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Clock, FileSearch, ClipboardCheck, CalendarClock, ArrowRight } from "lucide-react";
import { ROUNDS, getStageInfo, isFinalStatus, applicationStatusLabel } from "@/lib/jobUtils";
import BookingCard from "@/components/interview/BookingCard";

const roundIcon = [FileSearch, ClipboardCheck, CalendarClock];

export default function ApplicationTimeline({ app }) {
  const info = getStageInfo(app.status);
  const final = isFinalStatus(app.status);
  const [booking, setBooking] = useState(null);
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.SimulationInvite.filter({ application_id: app.id }, { sort: "-created_date", limit: 1 });
        setInvite((res.items || [])[0] || null);
      } catch (e) {
        setInvite(null);
      }
    })();
  }, [app.id, app.status]);

  useEffect(() => {
    if (!app.interview_booking_id) { setBooking(null); return; }
    (async () => {
      try {
        const b = await base44.entities.InterviewBooking.get(app.interview_booking_id);
        setBooking(b?.status === "booked" ? b : null);
      } catch (e) {}
    })();
  }, [app.interview_booking_id]);

  const stateOf = (round) => {
    if (info.round > round) return "done";
    if (info.round === round) return info.state;
    return "pending";
  };

  const allRejected = ["cv_rejected", "test_rejected", "rejected"].includes(app.status);
  const canTakeExam = ["cv_passed", "test_invited"].includes(app.status);
  const canPickSlot = ["test_passed", "interview_invited"].includes(app.status);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/viec-lam/${app.job_id}`} className="font-600 hover:text-primary">{app.job_title}</Link>
          <div className="text-xs text-muted-foreground">{app.company} · {new Date(app.created_date).toLocaleDateString("vi-VN")}</div>
          <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-600 text-primary">{applicationStatusLabel[app.status]}</span>
        </div>
        {app.cv_match_score != null && (
          <div className="text-right">
            <div className="text-lg font-700 text-primary">{app.cv_match_score}/100</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Điểm CV theo barem</div>
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
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-700 text-muted-foreground">VÒNG {r.id}</span>
                  {st === "active" && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-600 text-primary"><Clock className="h-3 w-3" /> Đang diễn ra</span>}
                  {st === "rejected" && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-600 text-rose-700">Không đạt</span>}
                  {st === "passed" && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-600 text-emerald-700">Đã đạt</span>}
                </div>
                <h4 className="mt-0.5 text-sm font-600">{r.title}</h4>
                <p className="text-xs text-muted-foreground">{r.desc}</p>

                {r.id === 1 && app.cv_ai_analysis && (
                  <p className="mt-2 rounded-lg bg-muted/40 p-2.5 text-xs text-foreground/80">{app.cv_ai_analysis}</p>
                )}
                {r.id === 1 && (app.cv_required_missing || []).length > 0 && (
                  <p className="mt-1.5 rounded-lg bg-amber-50/70 p-2.5 text-[11px] text-amber-800">
                    Nhãn bắt buộc chưa thấy trong CV: {app.cv_required_missing.join(", ")}
                  </p>
                )}

                {r.id === 2 && canTakeExam && invite && (
                  <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <p className="text-xs font-600 text-primary">Job Simulation — bài mô phỏng công việc thực tế</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {invite.simulation_name || "Bài mô phỏng vị trí ứng tuyển"}
                      {invite.expires_at ? ` · Hạn nộp ${new Date(invite.expires_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}` : ""}
                    </p>
                    <Link to={`/job-simulation/${invite.token}`} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-600 text-primary-foreground hover:bg-primary/90">
                      Vào làm Job Simulation <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
                {r.id === 2 && canTakeExam && !invite && (
                  <p className="mt-2 text-xs text-muted-foreground">HR đã duyệt CV. Lời mời làm Job Simulation sẽ xuất hiện ở đây ngay khi được gửi (kèm email).</p>
                )}
                {r.id === 2 && app.status === "test_submitted" && (
                  <p className="mt-2 text-xs text-sky-700">Đã nộp bài — HR đang chấm và sẽ gửi email kết quả.</p>
                )}
                {r.id === 2 && app.test_score != null && app.status !== "test_submitted" && (
                  <p className="mt-2 text-xs text-muted-foreground">Điểm AI Job Simulation (tham khảo): {app.test_score}/100</p>
                )}

                {r.id === 3 && canPickSlot && (
                  <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <p className="text-xs font-600 text-primary">Chúc mừng! Bạn đã đậu vòng 2.</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Chọn khung giờ phỏng vấn còn trống (được đổi 1 lần, trước 24 giờ).</p>
                    <Link to={`/lich-phong-van/${app.id}`} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-600 text-primary-foreground hover:bg-primary/90">
                      Chọn lịch phỏng vấn <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
                {r.id === 3 && app.status === "scheduled" && (
                  <div className="mt-2">
                    {booking ? (
                      <BookingCard booking={booking} />
                    ) : (
                      <Link to={`/lich-phong-van/${app.id}`} className="mt-1 inline-flex items-center gap-1.5 text-xs font-600 text-primary hover:underline">
                        Xem lịch phỏng vấn đã đặt <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                )}
                {r.id === 3 && app.status === "interview_submitted" && (
                  <p className="mt-2 text-xs text-indigo-700">Đã phỏng vấn — hội đồng đang xem xét kết quả cuối.</p>
                )}
                {r.id === 3 && app.status === "final_review" && (
                  <p className="mt-2 text-xs text-amber-700">Hồ sơ đang được xem xét thêm. Chúng tôi sẽ sớm thông báo kết quả cuối.</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {final && (
        <div className={`mt-4 rounded-xl p-3 text-sm ${app.status === "hired" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {app.status === "hired" ? "🎉 Chúc mừng — bạn đã được nhận vào làm!" : allRejected ? "Lần này hồ sơ chưa phù hợp. Mong được đồng hành cùng bạn trong cơ hội khác." : "Hồ sơ chưa phù hợp ở vòng này."}
        </div>
      )}
    </div>
  );
}