import { Image } from "@/components/ui/image";
import { BRAND_PREVIEW } from "@/lib/emailPreviewBrand";

const LOGO = "https://media.base44.com/images/public/6acd03fc9e292b4e6a9a3492/0ca8c156e_logo.png";

function bodyHtmlForPreview(html) {
  return String(html || "").replace(/class="ql-align-(center|right|justify)"/g, (_m, align) => `style="text-align:${align}"`);
}

export default function EmailPreviewFrame({ subject, bodyHtml, banner, inlineImages = [], signature, cta, signatureLines = [], device = "desktop" }) {
  const width = device === "mobile" ? "w-[360px]" : "w-full";
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
        <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">Tiêu đề</p>
        <p className="text-sm font-600 leading-snug">{subject || "(chưa có tiêu đề)"}</p>
      </div>
      <div className={`mx-auto ${width} overflow-hidden rounded-xl border border-border bg-[#fbf7fd] p-3`}>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 bg-primary px-4 py-3">
            <img src={LOGO} alt="NexCareer Hub" className="h-8 w-8 rounded-full bg-white object-contain" />
            <span className="text-sm font-700 text-primary-foreground">NexCareer Hub</span>
          </div>
          {banner?.url && <Image src={banner.url} alt={banner.alt || ""} className="w-full" fittingType="fill" />}
          <div
            className="prose-sm px-4 py-4 text-[13px] leading-relaxed text-foreground [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-[14px] [&_h3]:font-700 [&_li]:mb-1 [&_p]:mb-2.5 [&_ul]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: bodyHtmlForPreview(bodyHtml) }}
          />
          {inlineImages.filter((img) => img?.url).map((img, i) => (
            <div key={`${img.url}-${i}`} className="px-4 pb-3" style={{ textAlign: img.align || "center" }}>
              <Image src={img.url} alt={img.alt || ""} className="inline-block" style={{ width: `${img.width || 100}%` }} fittingType="fit" />
            </div>
          ))}
          {cta?.label && cta?.url && (
            <div className="px-4 pb-4">
              <span className="inline-block rounded-xl bg-primary px-5 py-2.5 text-[13px] font-700 text-primary-foreground">{cta.label}</span>
              <p className="mt-2 break-all text-[10px] text-muted">{cta.url}</p>
            </div>
          )}
          <div className="border-t border-border px-4 py-3">
            {signature?.url && <Image src={signature.url} alt={signature.alt || "Chữ ký"} className="mb-2 h-auto w-24" fittingType="fit" />}
            {signatureLines.filter(Boolean).map((line, i) => (
              <p key={line} className={i === 0 ? "text-[13px] font-700" : "text-[11px] leading-relaxed text-muted-foreground"}>{line}</p>
            ))}
          </div>
          <div className="bg-[#f5f2ff] px-4 py-3 text-center">
            <p className="text-[10px] leading-relaxed text-muted-foreground">{BRAND_PREVIEW.company} · {BRAND_PREVIEW.address}</p>
            <p className="text-[10px] text-primary">{BRAND_PREVIEW.website.replace(/^https?:\/\//, "")}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Email được gửi từ NexCareer Hub.</p>
          </div>
        </div>
      </div>
    </div>
  );
}