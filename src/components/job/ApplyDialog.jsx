import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, AlertCircle, FileText, Github, Link2, Award, Phone, Mail, User, Rocket } from "lucide-react";
import { getMissingItems, tabToFix, fileNameOf, splitLinks } from "@/lib/candidateProfile";

// Ứng tuyển bằng hồ sơ đã lưu trong Candidate Room: không nhập lại thông tin.
//  - Thiếu mục bắt buộc  -> báo chưa đủ thông tin + nút "Về Candidate Room"
//  - Đủ                  -> hỏi xác nhận rồi gửi hồ sơ
export default function ApplyDialog({ job, open, onOpenChange, onApplied }) {
  const [state, setState] = useState("loading"); // loading | missing | applied | ready | done
  const [profile, setProfile] = useState(null);
  const [missing, setMissing] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [mailError, setMailError] = useState("");

  useEffect(() => {
    if (!open) return;
    setState("loading");
    setError("");
    setAiResult(null);
    setMailError("");
    setSubmitting(false);
    let alive = true;
    (async () => {
      let me = null;
      let p = null;
      try {
        me = await base44.auth.me();
        let res = await base44.entities.CandidateProfile.filter({ email: me?.email }, { limit: 1 });
        if (!res.items?.length) res = await base44.entities.CandidateProfile.filter({ created_by_id: me?.id }, { limit: 1 });
        p = res.items?.[0] || null;
      } catch (e) {}
      if (!alive) return;
      // Tài khoản mới chưa có hồ sơ: lấy tạm tên/email từ tài khoản để kiểm tra
      const merged = { ...(p || {}), full_name: p?.full_name || me?.full_name || "", email: p?.email || me?.email || "" };
      setProfile(merged);
      const miss = getMissingItems(merged);
      setMissing(miss);
      if (miss.length) {
        setState("missing");
        return;
      }
      // Đã ứng tuyển vị trí này rồi?
      try {
        const res = await base44.entities.Application.filter(
          { job_id: job.id, $or: [{ created_by_id: me?.id }, { email: merged.email }] },
          { limit: 1 }
        );
        if (res.items?.length) {
          if (alive) setState("applied");
          return;
        }
      } catch (e) {}
      if (alive) setState("ready");
    })();
    return () => {
      alive = false;
    };
  }, [open, job?.id]);

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const links = splitLinks(profile.project_links);
      const created = await base44.entities.Application.create({
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || "",
        english_certificate: profile.english_certificate || "",
        cv_file_uri: profile.cv_file_uri,
        avatar_uri: profile.avatar_uri || undefined,
        certificate_uris: profile.certificate_uris || [],
        github_url: profile.github_url || "",
        portfolio_url: profile.portfolio_url || "",
        cover_letter: links.length ? `Dự án / liên kết khác:\n${links.join("\n")}` : "",
        cv_source: "nexcareer",
        status: "cv_screening",
        rms_status: "new",
        candidate_code: `NC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        step1_done: true,
        step1_at: new Date().toISOString(),
      });
      setState("done");
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

  const roomLink = `/candidate-room?tab=${tabToFix(missing)}`;
  const certCount = profile?.certificate_uris?.length || 0;
  const linkCount = splitLinks(profile?.project_links).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {state === "loading" && (
          <div className="flex flex-col items-center py-14 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <DialogTitle className="sr-only">Đang kiểm tra hồ sơ</DialogTitle>
            <DialogDescription className="mt-3">Đang kiểm tra hồ sơ của bạn...</DialogDescription>
          </div>
        )}

        {state === "missing" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-600">
              <AlertCircle className="h-9 w-9" />
            </div>
            <DialogTitle className="mt-5 text-xl">Hồ sơ chưa đủ thông tin cần thiết</DialogTitle>
            <DialogDescription className="mt-2 max-w-sm">
              Bạn cần bổ sung các mục bắt buộc trong Candidate Room trước khi ứng tuyển <span className="font-600 text-foreground">{job.title}</span>.
            </DialogDescription>
            <ul className="mt-4 w-full max-w-sm space-y-2 text-left text-sm">
              {missing.map((m) => (
                <li key={m.key} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Thiếu: {m.label}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
              <Button asChild className="btn-galaxy h-11 w-full rounded-full">
                <Link to={roomLink} onClick={() => onOpenChange(false)}>Về Candidate Room</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-muted-foreground">Để sau</Button>
            </div>
          </div>
        )}

        {state === "applied" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <DialogTitle className="mt-5 text-xl">Bạn đã ứng tuyển vị trí này</DialogTitle>
            <DialogDescription className="mt-2 max-w-sm">
              Hồ sơ của bạn cho <span className="font-600 text-foreground">{job.title}</span> đã được gửi trước đó. Theo dõi tiến trình trong Candidate Room.
            </DialogDescription>
            <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
              <Button asChild className="btn-galaxy h-11 w-full rounded-full">
                <Link to="/candidate-room?tab=apps" onClick={() => onOpenChange(false)}>Xem trong Candidate Room</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-muted-foreground">Đóng</Button>
            </div>
          </div>
        )}

        {state === "ready" && profile && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-700">Xác nhận ứng tuyển</DialogTitle>
              <DialogDescription>
                Bạn muốn ứng tuyển <span className="font-600 text-foreground">{job.title}</span> tại {job.company}? Hồ sơ trong Candidate Room của bạn sẽ được gửi đi.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
              <Row icon={User} text={profile.full_name} />
              <Row icon={Mail} text={profile.email} />
              {profile.phone && <Row icon={Phone} text={profile.phone} />}
              <Row icon={FileText} text={`CV: ${fileNameOf(profile.cv_file_uri)}`} />
              {certCount > 0 && <Row icon={Award} text={`${certCount} chứng chỉ đính kèm`} />}
              {profile.english_certificate && <Row icon={Award} text={`Tiếng Anh: ${profile.english_certificate}`} />}
              {profile.github_url && <Row icon={Github} text={profile.github_url} />}
              {profile.portfolio_url && <Row icon={Link2} text={profile.portfolio_url} />}
              {linkCount > 0 && <Row icon={Rocket} text={`${linkCount} link dự án / ứng dụng`} />}
            </div>
            <p className="text-xs text-muted-foreground">
              Muốn thay đổi thông tin? <Link to="/candidate-room" onClick={() => onOpenChange(false)} className="text-primary hover:underline">Chỉnh sửa trong Candidate Room</Link>.
            </p>

            <div className="flex flex-col gap-2">
              <Button onClick={submit} disabled={submitting} className="btn-galaxy h-11 w-full gap-2 rounded-full">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</> : "Đồng ý ứng tuyển"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={submitting} className="text-muted-foreground">Hủy</Button>
            </div>
          </>
        )}

        {state === "done" && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
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
            <Button className="mt-6" onClick={() => onOpenChange(false)}>Hoàn tất</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate">{text}</span>
    </div>
  );
}
