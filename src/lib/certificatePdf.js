import { jsPDF } from "jspdf";

const plain = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

export function downloadTextCertificate(certificate) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const issued = certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString("vi-VN") : "";

  doc.setDrawColor(86, 75, 231);
  doc.setLineWidth(2);
  doc.rect(24, 24, width - 48, height - 48);
  doc.setLineWidth(0.6);
  doc.rect(34, 34, width - 68, height - 68);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(86, 75, 231);
  doc.text("NEXCAREER HUB", width / 2, 92, { align: "center" });

  doc.setFontSize(24);
  doc.setTextColor(17, 24, 39);
  doc.text("CHUNG CHI HOAN THANH KHOA HOC", width / 2, 132, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text("Chung nhan hoc vien", width / 2, 168, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(17, 24, 39);
  doc.text(plain(certificate.user_name), width / 2, 204, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text("da hoan thanh khoa hoc", width / 2, 232, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(86, 75, 231);
  doc.text(plain(certificate.course_title), width / 2, 260, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  doc.text(`Diem cuoi khoa: ${certificate.score}/100`, width / 2, 284, { align: "center" });
  doc.text(`Ngay cap: ${issued}   |   Ma chung chi: ${certificate.code}`, width / 2, 330, { align: "center" });
  doc.text("Duoc cong nhan boi Nexora Technology", width / 2, 356, { align: "center" });

  doc.save(`chung-chi-${certificate.code}.pdf`);
}