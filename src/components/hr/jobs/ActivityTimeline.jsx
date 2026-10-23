import { formatDateTime } from "@/lib/rms";

export default function ActivityTimeline({ app, invite, attempt, booking }) {
  const events = [
    { at: app?.created_date, title: "Ứng viên nộp hồ sơ", actor: app?.full_name || "Ứng viên" },
    app?.cv_match_score != null && {
      at: app?.round1_decided_at || app?.created_date,
      title: `AI chấm CV: ${app.cv_match_score}/100`,
      actor: "Hệ thống AI",
    },
    app?.round1_decided_at && {
      at: app.round1_decided_at,
      title: app?.status === "cv_rejected" ? "HR loại hồ sơ ở Vòng 1" : "HR duyệt CV (Vòng 1)",
      actor: "HR Studio",
      detail: app.hr_decision_reason,
    },
    invite?.sent_at && {
      at: invite.sent_at,
      title: `Gửi Job Simulation: ${invite.simulation_name || ""}`,
      actor: "HR Studio",
      detail: `Hạn nộp ${formatDateTime(invite.expires_at)}`,
    },
    attempt?.started_at && { at: attempt.started_at, title: "Ứng viên bắt đầu làm Job Simulation", actor: app?.full_name || "Ứng viên" },
    attempt?.submitted_at && {
      at: attempt.submitted_at,
      title: `Ứng viên nộp Job Simulation: ${attempt.score}/100 (${attempt.passed ? "Đạt" : "Chưa đạt"})`,
      actor: app?.full_name || "Ứng viên",
    },
    app?.round2_decided_at && {
      at: app.round2_decided_at,
      title: app?.status === "test_rejected" ? "HR loại ở Vòng 2" : "HR cho qua Vòng 3",
      actor: "HR Studio",
    },
    booking?.created_date && {
      at: booking.created_date,
      title: `Đặt lịch phỏng vấn Vòng 3 với ${booking.interviewer_name || booking.interviewer_email}`,
      actor: "HR Studio",
      detail: `${booking.date} ${booking.start_time}`,
    },
    app?.interview_submitted_at && { at: app.interview_submitted_at, title: "Hoàn tất phỏng vấn Vòng 3", actor: "Line Manager" },
    app?.decision_at && {
      at: app.decision_at,
      title: app?.status === "hired" ? "Kết quả: Đạt / Offer" : "Kết quả: Từ chối",
      actor: "HR Studio",
      detail: app.final_result_note,
    },
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h4 className="text-sm font-700">Nhật ký hoạt động</h4>
      {events.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Chưa có hoạt động nào.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {events.map((ev, i) => (
            <li key={`${ev.title}-${i}`} className="relative flex gap-3 pl-1">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="text-xs font-600">{ev.title}</p>
                <p className="text-[11px] text-muted-foreground">{formatDateTime(ev.at)} · {ev.actor}</p>
                {ev.detail && <p className="text-[11px] leading-relaxed text-foreground/70">{ev.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}