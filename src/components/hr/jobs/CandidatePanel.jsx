import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Mail, Phone } from "lucide-react";
import CandidateStepper from "@/components/hr/jobs/CandidateStepper";
import Round1Step from "@/components/hr/jobs/steps/Round1Step";
import Round2Step from "@/components/hr/jobs/steps/Round2Step";
import Round3Step from "@/components/hr/jobs/steps/Round3Step";
import ResultStep from "@/components/hr/jobs/steps/ResultStep";
import ActivityTimeline from "@/components/hr/jobs/ActivityTimeline";
import { candidateCode, formatDate, rmsMeta } from "@/lib/rms";

export default function CandidatePanel({ applicationId, open, onOpenChange, onChanged }) {
  const [app, setApp] = useState(null);
  const [invite, setInvite] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!applicationId) return;
    setLoading(true);
    setError("");
    try {
      const data = await base44.entities.Application.get(applicationId);
      setApp(data);
      const [invites, bookings] = await Promise.all([
        base44.entities.SimulationInvite.filter({ application_id: applicationId }, { sort: "-created_date", limit: 1 }),
        base44.entities.InterviewBooking.filter({ application_id: applicationId }, { sort: "-created_date", limit: 1 }),
      ]);
      const inv = (invites.items || [])[0] || null;
      setInvite(inv);
      setBooking((bookings.items || [])[0] || null);
      if (inv) {
        const at = await base44.entities.SimulationAttempt.filter({ invite_id: inv.id }, { sort: "-created_date", limit: 1 });
        setAttempt((at.items || [])[0] || null);
      } else {
        setAttempt(null);
      }
    } catch (e) {
      setError(e.message || "Không tải được hồ sơ ứng viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open, applicationId]);

  const refresh = async () => {
    await load();
    onChanged?.();
  };

  const openCv = async () => {
    try {
      if (app?.cv_file_uri) {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: app.cv_file_uri, expires_in: 600 });
        window.open(signed_url, "_blank", "noopener");
      } else if (app?.cv_source_url) {
        window.open(app.cv_source_url, "_blank", "noopener");
      }
    } catch (e) {
      setError("Không mở được CV của ứng viên.");
    }
  };

  const meta = app ? rmsMeta(app) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Hồ sơ ứng viên</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải hồ sơ...</div>
        ) : error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : app ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading text-lg font-700">{app.full_name || "Chưa có tên"}</h3>
                  <Badge className={`rounded-full border-0 ${meta?.color}`}>{meta?.label}</Badge>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-700 text-muted-foreground">{candidateCode(app)}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/70">{app.job_title} · Nộp ngày {formatDate(app.created_date)}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{app.email}</span>
                  {app.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{app.phone}</span>}
                  {app.github_url && <a href={app.github_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">GitHub</a>}
                  {app.portfolio_url && <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Portfolio</a>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={openCv} className="gap-1.5"><FileText className="h-4 w-4" /> Xem CV</Button>
            </div>

            <CandidateStepper app={app} invite={invite} attempt={attempt} booking={booking} />

            <Round1Step app={app} invite={invite} booking={booking} onDone={refresh} />
            <Round2Step app={app} invite={invite} attempt={attempt} booking={booking} onDone={refresh} />
            <Round3Step app={app} booking={booking} invite={invite} onDone={refresh} />
            <ResultStep app={app} attempt={attempt} booking={booking} invite={invite} onDone={refresh} />

            <ActivityTimeline app={app} invite={invite} attempt={attempt} booking={booking} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}