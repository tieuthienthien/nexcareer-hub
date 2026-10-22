export default function ColorField({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
      <span className="text-sm font-500">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-8 w-10 cursor-pointer rounded-md border border-border bg-transparent p-0"
        />
        <span className="w-16 font-mono text-[11px] uppercase text-muted-foreground">{value}</span>
      </span>
    </label>
  );
}