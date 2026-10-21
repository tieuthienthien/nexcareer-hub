import { forwardRef } from "react";

const CertificateDocument = forwardRef(function CertificateDocument({ certificate }, ref) {
  const issued = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  return (
    <div ref={ref} className="relative w-full overflow-hidden rounded-2xl border border-primary/30 bg-white px-6 py-8 text-center sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-pastel-pink/20" />
      <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-primary/25" />
      <div className="relative">
        <p className="text-[10px] font-700 uppercase tracking-[0.35em] text-primary">NexCareer Hub</p>
        <h2 className="mt-3 font-heading text-lg font-800 uppercase tracking-wide text-slate-900 sm:text-2xl">
          Chứng chỉ hoàn thành khóa học
        </h2>
        <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-slate-500">Chứng nhận học viên</p>
        <p className="mt-1 font-heading text-xl font-800 text-slate-900 sm:text-3xl">{certificate.user_name}</p>
        <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-slate-500">đã hoàn thành khóa học</p>
        <p className="mt-1 font-heading text-sm font-700 text-primary sm:text-lg">{certificate.course_title}</p>
        <p className="mt-2 text-[11px] text-slate-600">Điểm cuối khóa: {certificate.score}/100</p>
        <div className="mt-6 flex flex-col items-center gap-1 border-t border-slate-200 pt-4 text-[10px] text-slate-500 sm:flex-row sm:justify-between sm:text-[11px]">
          <span>Ngày cấp: {issued}</span>
          <span className="font-600 text-slate-700">Mã chứng chỉ: {certificate.code}</span>
        </div>
        <p className="mt-3 text-[10px] font-600 uppercase tracking-[0.18em] text-primary/90 sm:text-[11px]">
          Được công nhận bởi Nexora Technology
        </p>
      </div>
    </div>
  );
});

export default CertificateDocument;