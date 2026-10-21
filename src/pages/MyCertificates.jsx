import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import CertificateDocument from "@/components/course/CertificateDocument";
import { downloadTextCertificate } from "@/lib/certificatePdf";
import { Award, Download, Loader2, ShieldCheck } from "lucide-react";

export default function MyCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");
  const refs = useRef({});

  useEffect(() => {
    if (!user?.id) return;
    base44.entities.Certificate.filter({ user_id: user.id }, { sort: "-issued_at", limit: 50 })
      .then((res) => setCertificates(res.items || []))
      .catch(() => setCertificates([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const download = async (certificate) => {
    const node = refs.current[certificate.id];
    if (!node) return;
    setDownloading(certificate.id);
    try {
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(image, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`chung-chi-${certificate.code}.pdf`);
    } catch (error) {
      downloadTextCertificate(certificate);
    } finally {
      setDownloading("");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-800 tracking-tight">Chứng chỉ của tôi</h1>
          <p className="mt-2 text-muted-foreground">Chứng chỉ được cấp khi điểm cuối khóa đạt từ 80/100 trở lên.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/xac-thuc-chung-chi">
              <ShieldCheck className="h-4 w-4" /> Xác thực
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/khoa-hoc">
              <Award className="h-4 w-4" /> Khóa học
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-card py-16 text-center">
          <Award className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-3 font-600">Bạn chưa có chứng chỉ nào</h3>
          <p className="mt-1 text-sm text-muted-foreground">Hoàn thành khóa học với điểm từ 80/100 để nhận chứng chỉ đầu tiên.</p>
          <Button asChild className="mt-5">
            <Link to="/khoa-hoc">Khám phá khóa học</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
              <CertificateDocument
                certificate={certificate}
                ref={(node) => {
                  refs.current[certificate.id] = node;
                }}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Cấp ngày {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString("vi-VN") : "—"} · Mã{" "}
                  <span className="font-600 text-foreground">{certificate.code}</span>
                </p>
                <Button onClick={() => download(certificate)} disabled={downloading === certificate.id} className="gap-2">
                  {downloading === certificate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Tải chứng chỉ PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}