import { Image } from "@/components/ui/image";
import { companyInitials, companyGradient } from "@/lib/jobUtils";

/**
 * Avatar của công ty trong tin tuyển dụng.
 * Có logo → hiển thị logo; chưa có → chữ viết tắt trên nền gradient ổn định theo tên công ty.
 */
export default function JobAvatar({ job, className = "h-12 w-12 rounded-xl", textClassName = "text-sm" }) {
  const company = job?.company || "";
  const logo = job?.company_logo;

  if (logo) {
    return (
      <div className={`${className} shrink-0 overflow-hidden border border-border bg-card`}>
        <Image
          src={logo}
          alt={company || "Logo công ty"}
          fittingType="fill"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} grid shrink-0 place-items-center bg-gradient-to-br ${companyGradient(company)} font-700 text-white`}
    >
      <span className={textClassName}>{companyInitials(company) || "?"}</span>
    </div>
  );
}