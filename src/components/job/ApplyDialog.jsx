import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Upload, FileText, CheckCircle2, Link2, AlertCircle } from "lucide-react";

export default function ApplyDialog({ job, open, onOpenChange, onApplied }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", portfolio_url: "", cover_letter: "" });
  const [cvFile, setCvFile] = useState(null);
  const [cvName, setCvName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDone(false);
    setError("");
    setAiResult(null);
    (async () => {
      try {
        const me = await base44.auth.me();
        const res = await base44.entities.CandidateProfile.filter({}, { limit: 1 });
        const profile = res.items?.[0];
        setForm((f) => ({
          ...f,
          full_name: profile?.full_name || me?.full_name || "",
          email: profile?.email || me?.email || "",
          phone: profile?.phone || "",
          portfolio_url: profile?.portfolio_url || "",
        }));
      } catch (e) {}
    })();
  }, [open]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File CV không được vượt quá 10MB.");
      return;
    }
    setCvFile(file);
    setCvName(file.name);
    setError("");
  };

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      let cv_uri = "";
      if (cvFile) {
        const up = await base44.integrations.Core.UploadPrivateFile({ file: cvFile });
        cv_uri = up.file_uri;
      }
      const created = await base44.entities.Application.create({
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        cv_file_uri: cv_uri,
        portfolio_url: form.portfolio_url,
        cover_letter: form.cover_letter,
        status: "cv_screening",
      });
      setDone(true);
      onApplied?.();
      // Sàng lọc AI + email xác nhận (backend function)
      try {
        const res = await base44.functions.invoke("screenCv", { application_id: created.id });
        const data = res.data || res;
        setAiResult({ score: data.match_score, analysis: data.analysis });
      } catch (e) {}
    } catch (e) {
      setError(e.message || "Không thể nộp hồ sơ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {done ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <DialogTitle className="mt-5 text-xl">Ứng tuyển thành công!</DialogTitle>
            <DialogDescription className="mt-2 max-w-sm">
              Hồ sơ của bạn đã được gửi cho <span className="font-600 text-foreground">{job.company}</span>. Bạn có thể theo dõi tình trạng trong Candidate Room.
            </DialogDescription>
            {aiResult && (
              <div className="mt-4 rounded-xl bg-primary/5 p-4 text-left text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-600 text-primary">Kết quả sàng lọc AI (tham khảo)</span>
                  {aiResult.score != null && <span className="text-lg font-800 text-primary">{aiResult.score}%</span>}
                </div>
                {aiResult.analysis && <p className="mt-2 text-foreground/80">{aiResult.analysis}</p>}
                <p className="mt-2 text-xs text-muted-foreground">Chúng tôi đã gửi email xác nhận — vui lòng kiểm tra hộp thư.</p>
              </div>
            )}
            <Button className="mt-6" onClick={() => onOpenChange(false)}>Hoàn tất</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Ứng tuyển: {job.title}</DialogTitle>
              <DialogDescription>{job.company}</DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fn">Họ và tên *</Label>
                  <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="em">Email *</Label>
                  <Input id="em" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ph">Số điện thoại</Label>
                  <Input id="ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf">Link portfolio</Label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="pf" value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://..." className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>CV (PDF, DOCX — stored privately)</Label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 transition-colors hover:border-primary hover:bg-primary/5">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    {cvFile ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-500">{cvName || "Nhấn để tải lên CV"}</div>
                    <div className="text-xs text-muted-foreground">{cvFile ? `${(cvFile.size / 1024 / 1024).toFixed(2)} MB` : "Tối đa 10MB"}</div>
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFile} />
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cl">Thư ứng tuyển</Label>
                <Textarea id="cl" rows={4} value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} placeholder="Giới thiệu ngắn gọn vì sao bạn phù hợp..." />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button onClick={submit} disabled={submitting || !form.full_name || !form.email} className="gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</> : "Gửi hồ sơ"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}