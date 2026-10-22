import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { RMS_OPTIONS, YEAR_BANDS } from "@/lib/rms";

export default function CandidateFilters({ filters, onChange, positions = [], educations = [], onClear }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.keyword}
            onChange={(e) => set("keyword", e.target.value)}
            placeholder="Tìm theo tên, kỹ năng, từ khóa trong CV (VD: Python, Content Strategy, IELTS 7.5)"
            className="h-10 border-0 bg-muted/40 pl-9 shadow-none"
          />
        </div>
        <Select value={filters.position} onValueChange={(v) => set("position", v)}>
          <SelectTrigger className="h-10 lg:w-52"><SelectValue placeholder="Vị trí" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vị trí</SelectItem>
            {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger className="h-10 lg:w-48"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>{RMS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Select value={filters.years} onValueChange={(v) => set("years", v)}>
          <SelectTrigger className="h-10 lg:w-48"><SelectValue placeholder="Kinh nghiệm" /></SelectTrigger>
          <SelectContent>{YEAR_BANDS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.education} onValueChange={(v) => set("education", v)}>
          <SelectTrigger className="h-10 lg:w-48"><SelectValue placeholder="Bằng cấp" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi bằng cấp</SelectItem>
            {educations.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onClear} className="h-10 gap-2">
          <X className="h-4 w-4" /> Xóa bộ lọc
        </Button>
      </div>
    </div>
  );
}