import { Check, X } from "lucide-react";
import { formatDateTime, stepItems } from "@/lib/rms";

export default function PipelineTracker({ app, onStepClick }) {
  const steps = stepItems(app);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-heading text-base font-700">Sơ đồ tiến trình tự động</h3>
          <p className="text-xs text-muted-foreground">5 bước · tự động cập nhật khi hồ sơ thay đổi</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Hoàn thành</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Chưa tới</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Từ chối</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-0">
        {steps.map((step, i) => {
          const active = step.done;
          const failed = step.failed;
          const next = steps[i + 1];
          return (
            <div key={step.key} className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-start">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2 lg:items-center lg:text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (!step.done && i === 1) onStepClick?.("step2");
                    if (i === 4 && !step.done) onStepClick?.("step5");
                  }}
                  className={`group relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 transition-all duration-500 ${
                    failed
                      ? "border-rose-500 bg-rose-500 text-white shadow-[0_0_0_6px_rgba(244,63,94,0.12)]"
                      : active
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_0_6px_rgba(16,185,129,0.12)]"
                        : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {failed ? <X className="h-5 w-5" /> : active ? <Check className="h-5 w-5" /> : <span className="text-sm font-700">{i + 1}</span>}
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-600 text-background shadow-lg group-hover:block">
                    {active || failed ? `Hoàn thành: ${formatDateTime(step.at)}` : "Chưa hoàn thành"}
                  </span>
                </button>
                <div className="min-w-0">
                  <div className={`text-xs font-700 ${failed ? "text-rose-600" : active ? "text-emerald-700" : "text-foreground/70"}`}>{step.title}</div>
                  <div className="mt-0.5 max-w-[150px] text-[11px] leading-snug text-muted-foreground">{step.desc}</div>
                </div>
              </div>

              {next && (
                <div className="flex-1 px-1 pt-6 lg:pt-0">
                  <div
                    className={`h-1 w-full rounded-full transition-colors duration-700 lg:mt-6 ${
                      next.done ? "bg-emerald-400" : "bg-border"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}