import { Check, X } from "lucide-react";

function stepState(app, invite, attempt, index) {
  const status = app?.status || "cv_screening";
  const later = [
    "test_submitted",
    "test_passed",
    "test_rejected",
    "interview_invited",
    "scheduled",
    "interview_submitted",
    "final_review",
    "hired",
    "rejected",
  ];
  const afterCv = ["cv_passed", ...later];

  if (index === 0) return { state: "done" };
  if (index === 1) {
    if (status === "cv_rejected") return { state: "failed" };
    if (afterCv.includes(status) || app?.round1_decided_at) return { state: "done" };
    return { state: "current" };
  }
  if (index === 2) {
    if (status === "test_rejected") return { state: "failed" };
    if (later.includes(status) || attempt?.status === "submitted") return { state: "done" };
    if (status === "test_invited" || invite) return { state: "current" };
    return { state: "todo" };
  }
  if (index === 3) {
    if (["interview_submitted", "final_review", "hired"].includes(status)) return { state: "done" };
    if (status === "scheduled" || status === "interview_invited") return { state: "current" };
    if (status === "rejected" && app?.interview_at) return { state: "failed" };
    return { state: "todo" };
  }
  if (status === "rejected") return { state: "failed" };
  if (status === "hired") return { state: "done" };
  if (["final_review", "interview_submitted"].includes(status)) return { state: "current" };
  return { state: "todo" };
}

const STEPS = [
  { label: "Đã nộp hồ sơ", hint: "Hệ thống nhận CV" },
  { label: "Vòng 1: Duyệt CV", hint: "AI chấm + HR duyệt" },
  { label: "Vòng 2: Job Simulation", hint: "Bài mô phỏng công việc" },
  { label: "Vòng 3: Phỏng vấn", hint: "Line Manager phỏng vấn" },
  { label: "Kết quả", hint: "Đạt/Offer hoặc Từ chối" },
];

export default function CandidateStepper({ app, invite, attempt, booking }) {
  const states = STEPS.map((_, i) => stepState(app, invite, attempt, i).state);
  // Đoạn nối xanh khi bước trước đã hoàn thành
  const lineColor = (prevState) => (prevState === "done" ? "bg-emerald-400" : "bg-border");

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h4 className="text-sm font-700">Tiến trình tuyển dụng</h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-5 sm:gap-0">
        {STEPS.map((step, i) => {
          const state = states[i];
          const done = state === "done";
          const failed = state === "failed";
          const current = state === "current";
          return (
            <div key={step.label} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
              {/* Màn hình nhỏ: đường dọc từ dưới số này xuống số kế tiếp */}
              {i < STEPS.length - 1 && (
                <span className={`absolute left-[15px] top-8 -bottom-3 w-0.5 sm:hidden ${lineColor(state)}`} aria-hidden />
              )}
              {/* Màn hình rộng: đường ngang nối tâm số trước tới tâm số này (bước đầu không có, bước cuối không thừa) */}
              {i > 0 && (
                <span className={`absolute right-1/2 top-[15px] hidden h-0.5 w-full sm:block ${lineColor(states[i - 1])}`} aria-hidden />
              )}
              <span
                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-700 transition-colors ${
                  failed
                    ? "border-rose-500 bg-rose-500 text-white"
                    : done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : current
                        ? "border-primary bg-card text-primary ring-4 ring-card shadow-[0_0_14px_hsl(var(--primary)/0.45)]"
                        : "border-border bg-card text-muted-foreground"
                }`}
              >
                {failed ? <X className="h-4 w-4" /> : done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className="min-w-0 pt-0.5 sm:pt-0">
                <p className={`text-xs font-700 ${failed ? "text-rose-600" : done ? "text-emerald-700" : current ? "text-primary" : "text-muted-foreground"}`}>{step.label}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">{step.hint}</p>
              </div>
            </div>
          );
        })}
      </div>
      {booking?.interview_at || app?.interview_at ? null : null}
    </div>
  );
}
