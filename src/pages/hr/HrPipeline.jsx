import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Search, UserCheck, UserX } from "lucide-react";
import PipelineTracker from "@/components/hr/rms/PipelineTracker";
import EmailComposeDialog from "@/components/hr/rms/EmailComposeDialog";
import CvButtons from "@/components/hr/rms/CvButtons";
import { candidateCode, formatDateTime, interviewSlotLabel, rmsMeta } from "@/lib/rms";

export default function HrPipeline() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("candidate");

  const load = async () => {
    try {
      const res = await base44.entities.Application.list({ sort: "-created_date", limit: 150 });
      setApps(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Application.subscribe(() => load());
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return apps;
    return apps.filter((a) =>
      [a.full_name, a.job_title, a.email, candidateCode(a)].filter(Boolean).join(" ").toLowerCase().includes(key)
    );
  }, [apps, q]);

  const selected = apps.find((a) => a.id === selectedId) || filtered[0] || null;

  const pick = (app) => {
    const next = new URLSearchParams(params);
    next.set("candidate", app.id);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-700">Sơ đồ tiến trình tự động</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chọn ứng viên để xem 5 bước: nhận CV → duyệt & mời phỏng vấn → chuyển Line Manager → chốt lịch → kết quả.</p>
      </div>

      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm ứng viên, mã, vị trí..." className="h-9 border-0 bg-muted/40 pl-9 shadow-none" />
          </div>
          <div className="mt-2 max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
            {loading ? (
              <div className="grid h-32 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">Chưa có hồ sơ.</div>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => pick(a)}
                  className={`w-full rounded-xl border p-2.5 text-left transition-colors ${
                    selected?.id === a.id ? "border-primary/40 bg-primary/5" : "border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-600">{a.full_name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-700 ${rmsMeta(a).color}`}>{rmsMeta(a).label}</span>
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{a.job_title}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{candidateCode(a)}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          {!selected ? (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              Chọn một ứng viên để xem tiến trình.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-lg font-700">{selected.full_name}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-600 ${rmsMeta(selected).color}`}>{rmsMeta(selected).label}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{candidateCode(selected)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{selected.job_title} · {selected.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Line Manager: {selected.assigned_manager_email || "chưa gán"} · Khung giờ: {interviewSlotLabel(selected) || "chưa chọn"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CvButtons app={selected} />
                    <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setComposeOpen(true)}>
                      <Mail className="h-4 w-4" /> {selected.step2_done ? "Gửi lại mail mời PV" : "Duyệt CV & gửi mail mời PV"}
                    </Button>
                  </div>
                </div>
              </div>

              <PipelineTracker
                app={selected}
                onStepClick={(step) => {
                  if (step === "step2") setComposeOpen(true);
                }}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Mail mời phỏng vấn</div>
                  <div className="mt-1 text-sm font-600">{selected.step2_done ? formatDateTime(selected.step2_at) : "Chưa gửi"}</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Manager mở hồ sơ</div>
                  <div className="mt-1 text-sm font-600">{selected.manager_opened_at ? formatDateTime(selected.manager_opened_at) : "Chưa mở"}</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Quyết định</div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-600">
                    {selected.manager_decision === "pass" ? <><UserCheck className="h-4 w-4 text-emerald-600" /> Pass</> : selected.manager_decision === "fail" ? <><UserX className="h-4 w-4 text-rose-600" /> Fail</> : "Chưa có"}
                  </div>
                </div>
              </div>

              {!selected.assigned_manager_email && selected.step2_done && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Vị trí này chưa có Line Manager. Vào tab <b>Line Manager</b> → mục “Vị trí & Line Manager” để gán email người phụ trách.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <EmailComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        apps={selected ? [selected] : []}
        mode="interview"
        onSent={({ warnings }) => {
          setNotice(warnings?.length ? `Đã duyệt CV. Lưu ý: ${warnings.join(" ")}` : "Đã duyệt CV và gửi mail mời phỏng vấn.");
          load();
        }}
      />
    </div>
  );
}