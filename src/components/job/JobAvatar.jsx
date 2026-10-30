import { useState } from "react";
import { companyInitials, companyGradient, jobImage } from "@/lib/jobUtils";

// Hiển thị ảnh của việc làm; nếu không có ảnh hoặc ảnh lỗi thì quay về chữ cái đầu như cũ.
export default function JobAvatar({ job, className = "", textClassName = "text-sm" }) {
  const [failed, setFailed] = useState(false);
  const src = jobImage(job);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={job.title}
        onError={() => setFailed(true)}
        className={`shrink-0 bg-muted object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`grid shrink-0 place-items-center bg-gradient-to-br ${companyGradient(job.company)} font-700 text-white ${textClassName} ${className}`}>
      {companyInitials(job.company)}
    </div>
  );
}