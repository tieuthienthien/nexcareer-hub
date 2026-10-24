import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Upload, FileText, CheckCircle2, Link2, AlertCircle, Github, Award, Paperclip } from "lucide-react";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  english_certificate: "",
  github_url: "",
  portfolio_url: "",
  cover_letter: "",
};

export default function ApplyDialog({ job, open, onOpenChange, onApplied }) {
  const [form, setForm] = useState(emptyForm);
  const [cvFile, setCvFile] = useState(null);
  const [certFiles, setCertFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [mailError, setMailError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDone(false);
    setError("");
    setAiResult(null);
    setMailError("");
    setCvFile(null);
    setCertFiles([]);
    (async () => {
      try {
        const me = await base44.auth.me();
        const res = await base44.entities.CandidateProfile.filter({}, { limit: 1 });
        const profile = res.items?.[0];
        setForm({
          ...emptyForm,
          full_name: profile?.full_name || me?.full_name || "",
          email: profile?.email || me?.email || "",
          phone: profile?.phone || "",
          portfolio_url: profile?.portfolio_url || "",
        });
      } catch (e) {}
    })();
  }, [open]);

  const handleCv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File CV không được vượt quá 10MB.");
      return;
    }
    setCvFile(file);
    setError("");
  };

  const handleCerts = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setCertFiles((prev) => [...prev, ...picked].slice(0, 5));
    e.target.value = "";
  };

  const submit = async () => {
    setError("");
    if (!form.full_name.trim() || !form.email.trim()) {
      setError("Vui lòng nhập họ tên và email.");
      return;
    }
    if (!cvFile) {
      setError("Vui lòng tải lên CV (PDF/DOC/DOCX) trước khi gửi hồ sơ.");
      return;
    }
    setSubmitting(true);
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file: cvFile });
      const certUris = [];
      for (const file of certFiles) {
        if (file.size > 10 * 1024 * 1024) continue;
        const r = await base44.integrations.Core.UploadPrivateFile({ file });
        certUris.push(r.file_uri);
      }
      const created = await base44.entities.Application.create({
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        english_certificate: form.english_certificate,
        cv_file_uri: up.file_uri,
        certificate_uris: certUris,
        github_url: form.github_url,
        portfolio_url: form.portfolio_url,
        cover_letter: form.cover_letter,
        cv_source: "nexcareer",
        status: "cv_screening",
        rms_status: "new",
        candidate_code: `NC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        step1_done: true,
        step1_at: new Date().toISOString(),
      });
      setDone(true);
      onApplied?.();
      try {
        const res = await base44.functions.invoke("screenCv", { application_id: created.id });
        const data = res.data || res;
        setAiResult({ score: data.match_score, analysis: data.analysis });
        if (data.email_error) setMailError(data.email_error);
      } catch (e) {
        setMailError(e.response?.data?.error || e.message || "Không gọi được bước chấm CV.");
      }
    } catch (e) {
      setError(e.message || "Không thể nộp hồ sơ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
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
                {mailError ? (
                  <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                    Chưa gửi được email xác nhận: {mailError}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Chúng tôi đã gửi email xác nhận — vui lòng kiểm tra hộp thư.</p>
                )}
              </div>
            )}
            <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700" onClick={() => onOpenChange(false)}>Hoàn tất</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-700">Ứng tuyển: {job.title}</DialogTitle>
              <DialogDescription>
                Gửi hồ sơ đầy đủ tới {job.company}: CV, chứng chỉ, dự án đã làm và chứng chỉ tiếng Anh.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="fn" label="Họ và tên" required>
                  <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nguyễn Văn A" />
                </Field>
                <Field id="em" label="Email" required>
                  <Input id="em" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ban@email.com" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="ph" label="Số điện thoại">
                  <Input id="ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xx xxx xxx" />
                </Field>
                <Field id="en" label="Chứng chỉ tiếng Anh (không bắt buộc)">
                  <Input id="en" value={form.english_certificate} onChange={(e) => setForm({ ...form, english_certificate: e.target.value })} placeholder="VD: IELTS 7.0 (2025), TOEIC 850" />
                </Field>
              </div>

              <div className="space-y-2">
                <Label>CV của bạn (bắt buộc, PDF/DOC/DOCX)</Label>
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <label className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-600 text-white transition-colors hover:bg-emerald-700">
                    Chọn tệp
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleCv} />
                  </label>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {cvFile ? `${cvFile.name} · ${(cvFile.size / 1024 / 1024).toFixed(2)} MB` : "Không có tệp nào được chọn"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chứng chỉ kèm theo (tiếng Anh, chuyên môn — không bắt buộc)</Label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-emerald-600/60 px-3 py-1.5 text-xs font-600 text-emerald-700 transition-colors hover:bg-emerald-50">
                  <Upload className="h-4 w-4" /> Thêm tệp chứng chỉ
                  <input type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleCerts} />
                </label>
                {certFiles.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {certFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        <button type="button" className="text-destructive hover:underline" onClick={() => setCertFiles((prev) => prev.filter((_, idx) => idx !== i))}>Xóa</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="gh" label="GitHub / dự án đã làm">
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="gh" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/ten-ban" className="pl-9" />
                  </div>
                </Field>
                <Field id="pf" label="Portfolio / website (không bắt buộc)">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="pf" value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://portfolio-cua-ban.com" className="pl-9" />
                  </div>
                </Field>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cl">Thư giới thiệu (không bắt buộc)</Label>
                <Textarea id="cl" rows={4} value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} placeholder="Giới thiệu ngắn về kinh nghiệm, dự án tiêu biểu và điểm mạnh của bạn" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={submit} disabled={submitting} className="h-11 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</> : "Gửi hồ sơ ứng tuyển"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={submitting} className="text-muted-foreground">Hủy</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, required, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && " *"}</Label>
      {children}
    </div>
  );
}