import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTENT_PAGES } from "@/lib/siteDesign";

export default function ContentTab({ content, onChange }) {
  const [pageKey, setPageKey] = useState(CONTENT_PAGES[0].key);
  const page = CONTENT_PAGES.find((p) => p.key === pageKey) || CONTENT_PAGES[0];
  const values = content?.[page.key] || {};

  const update = (key, value) =>
    onChange({ ...(content || {}), [page.key]: { ...values, [key]: value } });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-base font-700">Nội dung trang</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Sửa câu chữ hiển thị. Để trống một ô nghĩa là ẩn dòng đó.
        </p>
        <Select value={page.key} onValueChange={setPageKey}>
          <SelectTrigger className="mt-3 sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_PAGES.map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {page.groups.map((group) => (
        <div key={group.title} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-700 uppercase tracking-wider text-muted-foreground">{group.title}</div>
          {group.fields.map((f) => (
            <div key={f.key}>
              <Label className="text-xs font-600 text-foreground/80">{f.label}</Label>
              {f.multiline ? (
                <Textarea
                  className="mt-1.5 min-h-[72px]"
                  value={values[f.key] ?? f.default}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              ) : (
                <Input
                  className="mt-1.5"
                  value={values[f.key] ?? f.default}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}