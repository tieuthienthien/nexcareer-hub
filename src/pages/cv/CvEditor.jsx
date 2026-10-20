import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CvBasicsFields from "@/components/cv/CvBasicsFields";
import CvRepeatSection from "@/components/cv/CvRepeatSection";
import CvPreview from "@/components/cv/CvPreview";
import { CV_TEMPLATES, emptyCv } from "@/lib/cvUtils";
import { ArrowLeft, Check, Download, Loader2, Save } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function CvEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [cv, setCv] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCv(null);
    if (isNew) {
      base44.auth.me().then((user) => setCv(emptyCv(user)));
    } else {
      base44.entities.CvDocument.get(id).then(setCv);
    }
  }, [id]);

  const save = async () => {
    setSaving(true);
    setError("");
    const { id: _id, created_by_id, created_date, updated_date, ...data } = cv;
    try {
      if (isNew) {
        const created = await base44.entities.CvDocument.create({ ...data, is_default: true });
        navigate(`/cv/cv/${created.id}`, { replace: true });
      } else {
        const updated = await base44.entities.CvDocument.update(cv.id, data);
        setCv(updated);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Không lưu được CV.");
    }
    setSaving(false);
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const el = document.getElementById("cv-print");
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeightPx = (canvas.width * 842) / 595;
      let offset = 0;
      let page = 0;
      while (offset < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - offset);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;
        slice.getContext("2d").drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        if (page > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageWidth, (sliceHeight * pageWidth) / canvas.width);
        offset += sliceHeight;
        page += 1;
      }
      pdf.save(`${cv.full_name || "CV"}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (!cv) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/cv/quan-ly-cv" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> CV của tôi
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Tên phiên bản CV</Label>
          <Input
            value={cv.title || ""}
            onChange={(e) => setCv({ ...cv, title: e.target.value })}
            placeholder="CV Frontend 2026"
            className="mt-1 h-11 max-w-md border-0 border-b border-border bg-transparent px-0 font-heading text-xl font-700 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPdf} disabled={exporting} className="gap-2 rounded-full">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Tải PDF
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2 rounded-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Đã lưu" : "Lưu CV"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h3 className="font-heading text-sm font-700">Mẫu CV</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {CV_TEMPLATES.map((t) => {
                const active = (cv.template || "nexora") === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCv({ ...cv, template: t.id })}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                      <span className="text-sm font-600">{t.name}</span>
                      {active && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h3 className="mb-4 font-heading text-sm font-700">Thông tin cá nhân</h3>
            <CvBasicsFields cv={cv} setCv={setCv} />
          </div>

          <CvRepeatSection
            title="Kinh nghiệm làm việc"
            hint="Mỗi mục là một vị trí. Nêu kết quả cụ thể nếu có."
            items={cv.experience || []}
            onChange={(experience) => setCv({ ...cv, experience })}
            fields={[
              { key: "role", label: "Chức danh", placeholder: "Frontend Developer" },
              { key: "company", label: "Công ty", placeholder: "Nexora Technology" },
              { key: "start_date", label: "Từ", placeholder: "01/2023" },
              { key: "end_date", label: "Đến", placeholder: "Hiện tại" },
            ]}
          />

          <CvRepeatSection
            title="Học vấn"
            hint="Trường, chuyên ngành và thời gian học."
            items={cv.education || []}
            onChange={(education) => setCv({ ...cv, education })}
            fields={[
              { key: "school", label: "Trường", placeholder: "Đại học Bách Khoa TP.HCM" },
              { key: "major", label: "Chuyên ngành", placeholder: "Khoa học máy tính" },
              { key: "start_date", label: "Từ", placeholder: "2016" },
              { key: "end_date", label: "Đến", placeholder: "2020" },
            ]}
          />
        </div>

        <div className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
              <span>Xem trước</span>
              <span>{CV_TEMPLATES.find((t) => t.id === cv.template)?.name}</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border/70">
              <CvPreview cv={cv} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}