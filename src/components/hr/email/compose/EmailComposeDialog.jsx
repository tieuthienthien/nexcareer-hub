import { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image } from "@/components/ui/image";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, ImagePlus, Loader2, Monitor, Save, Send, Smartphone, Trash2 } from "lucide-react";
import RichTextEditor from "@/components/hr/email/compose/RichTextEditor";
import MergeTagChips from "@/components/hr/email/compose/MergeTagChips";
import AiRewriteBar from "@/components/hr/email/compose/AiRewriteBar";
import ImageInsertDialog from "@/components/hr/email/compose/ImageInsertDialog";
import EmailPreviewFrame from "@/components/hr/email/compose/EmailPreviewFrame";
import { EMAIL_TEMPLATES, getTemplate } from "@/lib/emailTemplatesLibrary";
import { buildMergeContext, fillTags, loadHrIdentity, missingTags, saveHrIdentity } from "@/lib/emailMergeTags";

const splitList = (value) =>
  String(value || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function EmailComposeDialog({
  open,
  onOpenChange,
  app,
  invite,
  attempt,
  booking,
  templateKey = "round1_pass",
  step = "",
  preset = {},
  onSent,
}) {
  const [tplKey, setTplKey] = useState(templateKey);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [banner, setBanner] = useState(null);
  const [signature, setSignature] = useState(null);
  const [inlineImages, setInlineImages] = useState([]);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [device, setDevice] = useState("desktop");
  const [showPreview, setShowPreview] = useState(true);
  const [imageDialog, setImageDialog] = useState(false);
  const [hr, setHr] = useState(null);
  const [job, setJob] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [identity, setIdentity] = useState({
    ten_hr: "",
    chuc_danh_hr: "Chuyên viên Tuyển dụng",
    email_hr: "",
    sdt_hr: "",
    muc_luong: "",
    ngay_bat_dau: "",
    han_phan_hoi_offer: "",
  });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [missingConfirmed, setMissingConfirmed] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const editorRef = useRef(null);

  const applyTemplate = (key) => {
    const tpl = getTemplate(key);
    setTplKey(key);
    setSubject(tpl.subject);
    setBody(tpl.body);
    setCtaLabel(tpl.ctaLabel || "");
    setCtaUrl(tpl.ctaUrl || "");
  };

  useEffect(() => {
    if (!open) return;
    applyTemplate(templateKey);
    setBanner(null);
    setSignature(null);
    setInlineImages([]);
    setTo(app?.email || "");
    setCc("");
    setBcc("");
    setError("");
    setInfo("");
    setMissingConfirmed(false);
    setUndoStack([]);
    setBusy("");
    (async () => {
      try {
        const me = await base44.auth.me();
        setHr(me);
        const saved = loadHrIdentity();
        setIdentity({
          ten_hr: saved.ten_hr || me?.full_name || "",
          chuc_danh_hr: saved.chuc_danh_hr || "Chuyên viên Tuyển dụng",
          email_hr: saved.email_hr || me?.email || "",
          sdt_hr: saved.sdt_hr || "",
          muc_luong: saved.muc_luong || "",
          ngay_bat_dau: saved.ngay_bat_dau || "",
          han_phan_hoi_offer: saved.han_phan_hoi_offer || "",
        });
      } catch (e) {}
      if (app?.job_id) {
        try {
          setJob(await base44.entities.Job.get(app.job_id));
        } catch (e) {}
      }
      if (invite?.simulation_id) {
        try {
          setSimulation(await base44.entities.JobSimulation.get(invite.simulation_id));
        } catch (e) {}
      }
    })();
  }, [open, templateKey, app?.id]);

  const context = useMemo(
    () => buildMergeContext({ app, invite, booking, job, simulation, hr, identity, preset }),
    [app, invite, booking, job, simulation, hr, identity, preset]
  );

  const signatureLines = [
    identity.ten_hr || hr?.full_name || "",
    identity.chuc_danh_hr,
    identity.email_hr,
    identity.sdt_hr ? `Điện thoại: ${identity.sdt_hr}` : "",
    context.ten_cong_ty,
  ].filter(Boolean);

  const missing = missingTags([subject, body, ctaLabel, ctaUrl].join(" "), context);

  const insertTag = (key) => {
    const token = `{{${key}}}`;
    const editor = editorRef.current;
    if (editor) {
      const range = editor.getSelection();
      const index = range ? range.index : editor.getLength();
      editor.insertText(index, token, "user");
      editor.setSelection(index + token.length, 0);
    } else {
      setBody((prev) => `${prev}<p>${token}</p>`);
    }
  };

  const handleImagePicked = ({ url, alt, position, align, width }) => {
    if (position === "banner") setBanner({ url, alt });
    else if (position === "signature") setSignature({ url, alt });
    else setInlineImages((prev) => [...prev, { url, alt, align, width }]);
  };

  const rewrite = async (mode) => {
    setBusy(`ai-${mode}`);
    setError("");
    try {
      const res = await base44.functions.invoke("rewriteEmailDraft", {
        mode,
        html: body,
        context: {
          ung_vien: app?.full_name,
          vi_tri: app?.job_title,
          diem_cv: app?.cv_match_score,
          diem_simulation: attempt?.score,
          diem_phong_van: app?.interview_score,
          diem_manh_cv: app?.cv_strengths,
          nhan_xet_simulation: attempt?.ai_report?.strengths,
        },
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setUndoStack((prev) => [body, ...prev].slice(0, 5));
      setBody(data.html);
      setInfo("AI đã viết lại nội dung. Bạn có thể bấm Hoàn tác để quay lại bản trước.");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "AI chưa xử lý được nội dung.");
    } finally {
      setBusy("");
    }
  };

  const undo = () => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      setBody(prev[0]);
      return prev.slice(1);
    });
  };

  const buildPayload = (testOnly) => ({
    application_id: app.id,
    test_only: testOnly,
    to,
    cc: splitList(cc),
    bcc: splitList(bcc),
    subject,
    body_html: body,
    variables: context,
    cta: { label: ctaLabel, url: ctaUrl },
    banner_url: banner?.url || "",
    banner_alt: banner?.alt || "",
    signature_url: signature?.url || "",
    signature_alt: signature?.alt || "",
    inline_images: inlineImages,
    step,
    template_key: tplKey,
  });

  const send = async (testOnly = false) => {
    if (!app?.id) return;
    if (!testOnly && !to.trim()) {
      setError("Chưa có người nhận.");
      return;
    }
    if (!testOnly && missing.length && !missingConfirmed) {
      setError(`Còn thiếu dữ liệu cho: ${missing.join(", ")}. Bấm "Gửi email" lần nữa để gửi và bỏ các biến này.`);
      setMissingConfirmed(true);
      return;
    }
    setBusy(testOnly ? "test" : "send");
    setError("");
    setInfo("");
    try {
      const res = await base44.functions.invoke("sendCandidateEmail", buildPayload(testOnly));
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      if (testOnly) {
        setInfo(data.status === "sent" ? `Đã gửi thử tới ${data.to}.` : data.email_error || "Chưa gửi được email thử.");
        return;
      }
      if (data.status !== "sent") {
        setError(data.email_error || "Không gửi được email cho ứng viên.");
        return;
      }
      saveHrIdentity(identity);
      onOpenChange(false);
      onSent?.({ warnings: data.warnings || [] });
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không gửi được email.");
    } finally {
      setBusy("");
    }
  };

  const saveDraft = async () => {
    setBusy("draft");
    setError("");
    try {
      await base44.entities.EmailLog.create({
        application_id: app.id,
        job_id: app.job_id || "",
        step,
        template_key: tplKey,
        to_email: to,
        cc: splitList(cc),
        bcc: splitList(bcc),
        subject,
        body_html: body,
        banner_url: banner?.url || "",
        banner_alt: banner?.alt || "",
        signature_url: signature?.url || "",
        signature_alt: signature?.alt || "",
        status: "draft",
        sent_by_email: hr?.email || "",
      });
      onOpenChange(false);
      onSent?.({ draft: true });
    } catch (e) {
      setError(e.message || "Không lưu được bản nháp.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Soạn email cho ứng viên</DialogTitle>
          <DialogDescription>
            {app?.full_name || "Ứng viên"} · {app?.job_title || ""} — email chỉ được gửi sau khi bạn bấm “Gửi email”.
          </DialogDescription>
        </DialogHeader>

        {(error || info) && (
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-700"}`}>
            {error ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" />}
            <span>{error || info}</span>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Người nhận</Label>
                <Input className="h-9 text-xs" value={to} onChange={(e) => setTo(e.target.value)} placeholder="email ứng viên" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Chọn mẫu</Label>
                <Select value={tplKey} onValueChange={applyTemplate}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMAIL_TEMPLATES.map((tpl) => (
                      <SelectItem key={tpl.key} value={tpl.key}>{tpl.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">CC</Label>
                <Input className="h-9 text-xs" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="CC Line Manager / HR" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">BCC</Label>
                <Input className="h-9 text-xs" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="BCC (không bắt buộc)" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Tiêu đề</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="text-sm" />
            </div>

            <MergeTagChips onInsert={insertTag} context={context} />

            <RichTextEditor value={body} onChange={setBody} editorRef={editorRef} />

            <AiRewriteBar onRewrite={rewrite} onUndo={undo} canUndo={undoStack.length > 0} busy={busy.startsWith("ai-") ? busy.slice(3) : ""} />

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setImageDialog(true)} className="gap-1.5">
                <ImagePlus className="h-3.5 w-3.5" /> Thêm ảnh
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowPreview((v) => !v)} className="gap-1.5">
                {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {showPreview ? "Ẩn xem trước" : "Xem trước"}
              </Button>
            </div>

            <div className="grid gap-2 rounded-xl border border-border p-2.5 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Nút CTA — nhãn</Label>
                <Input className="h-9 text-xs" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="VD: Bắt đầu Job Simulation" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Nút CTA — liên kết</Label>
                <Input className="h-9 text-xs" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://... hoặc {{link_job_simulation}}" />
              </div>
            </div>

            <details className="rounded-xl border border-border p-2.5">
              <summary className="cursor-pointer text-[11px] font-700 uppercase tracking-wide text-muted-foreground">
                Thông tin người gửi &amp; dữ liệu điền tự động
              </summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="space-y-1"><Label className="text-[11px]">Tên HR</Label><Input className="h-9 text-xs" value={identity.ten_hr} onChange={(e) => setIdentity({ ...identity, ten_hr: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-[11px]">Chức danh HR</Label><Input className="h-9 text-xs" value={identity.chuc_danh_hr} onChange={(e) => setIdentity({ ...identity, chuc_danh_hr: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-[11px]">Email HR</Label><Input className="h-9 text-xs" value={identity.email_hr} onChange={(e) => setIdentity({ ...identity, email_hr: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-[11px]">SĐT HR</Label><Input className="h-9 text-xs" value={identity.sdt_hr} onChange={(e) => setIdentity({ ...identity, sdt_hr: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-[11px]">Mức lương</Label><Input className="h-9 text-xs" value={identity.muc_luong} onChange={(e) => setIdentity({ ...identity, muc_luong: e.target.value })} placeholder="VD: 25 – 30 triệu VND/tháng" /></div>
                <div className="space-y-1"><Label className="text-[11px]">Ngày bắt đầu</Label><Input className="h-9 text-xs" value={identity.ngay_bat_dau} onChange={(e) => setIdentity({ ...identity, ngay_bat_dau: e.target.value })} placeholder="VD: 01/12/2026" /></div>
                <div className="space-y-1"><Label className="text-[11px]">Hạn phản hồi offer</Label><Input className="h-9 text-xs" value={identity.han_phan_hoi_offer} onChange={(e) => setIdentity({ ...identity, han_phan_hoi_offer: e.target.value })} placeholder="VD: 30/10/2026" /></div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Thông tin này được ghi nhớ cho lần soạn email sau.</p>
            </details>

            {(banner || signature || inlineImages.length > 0) && (
              <div className="space-y-2 rounded-xl border border-border p-2.5">
                <p className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Ảnh trong email</p>
                {banner && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                    <Image src={banner.url} alt={banner.alt || ""} className="h-10 w-24 rounded" fittingType="fill" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-600">Banner đầu thư</p>
                      <Input className="mt-1 h-7 text-[11px]" value={banner.alt || ""} onChange={(e) => setBanner({ ...banner, alt: e.target.value })} placeholder="alt text" />
                    </div>
                    <button onClick={() => setBanner(null)} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                {signature && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                    <Image src={signature.url} alt={signature.alt || ""} className="h-10 w-16 rounded" fittingType="fit" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-600">Logo chữ ký</p>
                      <Input className="mt-1 h-7 text-[11px]" value={signature.alt || ""} onChange={(e) => setSignature({ ...signature, alt: e.target.value })} placeholder="alt text" />
                    </div>
                    <button onClick={() => setSignature(null)} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                {inlineImages.map((img, index) => (
                  <div key={`${img.url}-${index}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2">
                    <Image src={img.url} alt={img.alt || ""} className="h-10 w-16 rounded" fittingType="fill" />
                    <span className="text-[11px] font-600">Ảnh giữa nội dung</span>
                    <Select value={img.align || "center"} onValueChange={(value) => setInlineImages((prev) => prev.map((it, i) => (i === index ? { ...it, align: value } : it)))}>
                      <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Trái</SelectItem>
                        <SelectItem value="center">Giữa</SelectItem>
                        <SelectItem value="right">Phải</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={String(img.width || 100)} onValueChange={(value) => setInlineImages((prev) => prev.map((it, i) => (i === index ? { ...it, width: Number(value) } : it)))}>
                      <SelectTrigger className="h-7 w-28 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">Nhỏ (25%)</SelectItem>
                        <SelectItem value="50">Vừa (50%)</SelectItem>
                        <SelectItem value="75">Lớn (75%)</SelectItem>
                        <SelectItem value="100">Toàn chiều rộng</SelectItem>
                      </SelectContent>
                    </Select>
                    <button onClick={() => setInlineImages((prev) => prev.filter((_it, i) => i !== index))} className="ml-auto text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showPreview && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-border p-1">
                <button
                  onClick={() => setDevice("desktop")}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-600 ${device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Monitor className="h-3.5 w-3.5" /> Xem trước desktop
                </button>
                <button
                  onClick={() => setDevice("mobile")}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-600 ${device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Smartphone className="h-3.5 w-3.5" /> Mobile
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                <EmailPreviewFrame
                  subject={fillTags(subject, context)}
                  bodyHtml={fillTags(body, context)}
                  banner={banner}
                  inlineImages={inlineImages}
                  signature={signature}
                  cta={{ label: fillTags(ctaLabel, context), url: fillTags(ctaUrl, context) }}
                  signatureLines={signatureLines}
                  device={device}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-[11px] text-muted-foreground">
            {missing.length ? `Thiếu dữ liệu: ${missing.join(", ")}` : "Đã đủ dữ liệu cho các biến trong email."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!busy}>Hủy</Button>
            <Button variant="outline" onClick={saveDraft} disabled={!!busy} className="gap-1.5">
              {busy === "draft" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Lưu nháp
            </Button>
            <Button variant="outline" onClick={() => send(true)} disabled={!!busy} className="gap-1.5">
              {busy === "test" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Gửi thử cho tôi
            </Button>
            <Button onClick={() => send(false)} disabled={!!busy} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              {busy === "send" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Gửi email
            </Button>
          </div>
        </div>
      </DialogContent>

      <ImageInsertDialog open={imageDialog} onOpenChange={setImageDialog} onPick={handleImagePicked} />
    </Dialog>
  );
}