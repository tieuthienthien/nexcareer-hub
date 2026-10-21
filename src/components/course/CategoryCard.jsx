import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { Lock, ArrowRight } from "lucide-react";

export default function CategoryCard({ image, title, description, href, comingSoon }) {
  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fittingType="fill"
          className={`h-full w-full object-cover transition-transform duration-500 ${comingSoon ? "" : "group-hover:scale-105"}`}
        />
        {comingSoon && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-600 text-muted-foreground shadow-sm">
            <Lock className="h-3 w-3" /> Coming soon
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-700">{title}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {!comingSoon && (
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-600 text-primary">
            Vào học <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <div aria-disabled="true" className="flex select-none flex-col overflow-hidden rounded-3xl border border-border bg-card opacity-60 grayscale-[0.55]">
        {body}
      </div>
    );
  }

  return (
    <Link to={href} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
      {body}
    </Link>
  );
}