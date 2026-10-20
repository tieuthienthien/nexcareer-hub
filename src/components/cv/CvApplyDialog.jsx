import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Send, FileText, ArrowRight } from "lucide-react";
import { buildCvSnapshot } from "@/lib/cvUtils";

export default function CvApplyDialog({ job, open, onOpenChange }) {
  const { isAuthenticated } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cvId, setCvId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cover, setCover] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    setDone(null);
    setError("");
    setLoading(true);
    base44.entities.CvDocument.filter({}, { sort: "-updated_date", limit: 20 })
      .then((res) => {
        const items = res.items || [];
        setCvs(items);
        const preferred = items.find((c) => c.is_default) || items[0];
        if (preferred) setCvId(preferred.id);
      })
      .finally(() => setLoading(false));
  }, [open, isAuthenticated]);

  const selected = cvs.find((c) => c.id === cvId);

  useEffect(() => {
    if (!selected) return;
    setFullName(selected.full_name || "");
    setEmail(selected.email || "");
    setPhone(selected.phone || "");
  }, [cvId]);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const base = {
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        is_nexora: !!job.is_nexora,
        cv_document_id: selected.id,
        cv_title: selected.title,
        full_name: fullName || selected.full_name || "",
        email: email || selected.email || "",
        phone: phone || selected.phone || "",
        cover_letter: cover,
        cv_snapshot: buildCvSnapshot(selected),
      };
      const cvApp = await base44.entities.CvApplication.create(base);

      if (job.is_nexora) {
        const hub = await base44.entities.Application.create({
          job_id: job.id,
          job_title: job.title,
          company: job.company,
          full_name: base.full_name,
          email: base.email,
          phone: base.phone,
          cover_letter: cover,
          status: "cv_screening",
          cv_source: "cv_platform",
          cv_document_id: selected.id,
          cv_snapshot: base.cv_snapshot,
        });
        await base44.entities.CvApplication.update(cvApp.id, { synced: true, hub_application_id: hub.id });
      }
      setDone({ synced: !!job.is_nexora });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Không gửi được hồ sơ.");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{done ? "Hồ sơ đã gửi" : "Ứng tuyển vị trí"}</DialogTitle>
          <DialogDescription>
            {job.title} · {job.company}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Bạn cần đăng nhập để dùng CV đã lưu và theo dõi trạng thái hồ sơ.</p>
            <Button asChild className="w-full gap-2">
              <Link to={`/login?returnTo=/cv/viec-lam/${job.id}`}>
                Đăng nhập để ứng tuyển <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : done ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div className="text-sm">
                <p className="font-600 text-emerald-900">Hồ sơ đã được gửi tới {job.company}.</p>
                {done.synced && (
                  <p className="mt-1 text-emerald-800">
                    CV đã được đồng bộ sang NexCareer Hub và đang ở vòng sàng lọc hồ sơ của HR Nexora Technology.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1 gap-2">
                <Link to="/cv/ung-tuyen">Xem đơn ứng tuyển</Link>
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Đóng</Button>
            </div>
          </div>
        ) : loading ? (
          <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : cvs.length === 0 ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Bạn chưa có CV nào. Tạo một CV trước khi ứng tuyển.</p>
            <Button asChild className="w-full gap-2">
              <Link to="/cv/cv/new"><FileText className="h-4 w-4" /> Tạo CV ngay</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Chọn phiên bản CV</Label>
              <Select value={cvId} onValueChange={setCvId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn CV" /></SelectTrigger>
                <SelectContent>
                  {cvs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}{c.is_default ? " · Mặc định" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Họ tên</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Số điện thoại</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Thư ứng tuyển (không bắt buộc)</Label>
              <Textarea rows={3} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Vì sao bạn phù hợp với vị trí này?" className="mt-1.5" />
            </div>
            {job.is_nexora && (
              <p className="rounded-xl bg-primary/5 p-3 text-xs text-primary">
                Hồ sơ nộp vào Nexora Technology sẽ được đồng bộ sang NexCareer Hub để HR tiếp tục quy trình 3 vòng.
              </p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={submit} disabled={submitting || !selected} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi hồ sơ
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}