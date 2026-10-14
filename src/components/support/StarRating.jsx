import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, size = 22, readOnly = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= Math.round(value);
        const Base = readOnly ? "div" : "button";
        return (
          <Base
            key={n}
            type={readOnly ? undefined : "button"}
            onClick={readOnly ? undefined : () => onChange?.(n)}
            className={readOnly ? "" : "transition-transform hover:scale-110"}
            aria-label={`${n} sao`}
            disabled={readOnly}
          >
            <Star
              style={{ width: size, height: size }}
              className={active ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/40"}
            />
          </Base>
        );
      })}
    </div>
  );
}