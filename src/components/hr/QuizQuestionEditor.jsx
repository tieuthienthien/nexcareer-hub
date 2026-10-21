import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const emptyQuestion = () => ({
  id: `q${Date.now()}`,
  type: "short",
  prompt: "",
  options: [],
  answer: "",
  keywords: [],
  points: 10,
  explanation: "",
});

export default function QuizQuestionEditor({ questions, onChange }) {
  const list = questions || [];
  const update = (index, patch) => onChange(list.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  return (
    <div className="space-y-3">
      {list.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Chưa có câu hỏi nào.</p>
      )}

      {list.map((q, index) => (
        <div key={q.id || index} className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-700">Câu {index + 1}</span>
            <div className="flex items-center gap-2">
              <Select value={q.type || "short"} onValueChange={(v) => update(index, { type: v })}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Tự luận (AI chấm)</SelectItem>
                  <SelectItem value="mcq">Trắc nghiệm</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => onChange(list.filter((_, i) => i !== index))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Textarea rows={2} className="mt-2" placeholder="Nội dung câu hỏi" value={q.prompt || ""} onChange={(e) => update(index, { prompt: e.target.value })} />

          {q.type === "mcq" ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[11px]">Phương án (mỗi dòng một đáp án)</Label>
                <Textarea
                  rows={3}
                  className="mt-1"
                  value={(q.options || []).join("\n")}
                  onChange={(e) => update(index, { options: e.target.value.split("\n") })}
                />
              </div>
              <div>
                <Label className="text-[11px]">Đáp án đúng</Label>
                <Input className="mt-1" value={q.answer || ""} onChange={(e) => update(index, { answer: e.target.value })} />
                <Label className="mt-2 block text-[11px]">Điểm</Label>
                <Input type="number" className="mt-1" value={q.points ?? 10} onChange={(e) => update(index, { points: Number(e.target.value) })} />
              </div>
            </div>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[11px]">Từ khóa chấp nhận (cách nhau bằng dấu phẩy)</Label>
                <Input
                  className="mt-1"
                  value={(q.keywords || []).join(", ")}
                  onChange={(e) => update(index, { keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })}
                />
              </div>
              <div>
                <Label className="text-[11px]">Điểm</Label>
                <Input type="number" className="mt-1" value={q.points ?? 10} onChange={(e) => update(index, { points: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-[11px]">Đáp án mẫu / gợi ý chấm</Label>
                <Textarea rows={2} className="mt-1" value={q.answer || ""} onChange={(e) => update(index, { answer: e.target.value })} />
              </div>
            </div>
          )}

          <div className="mt-2">
            <Label className="text-[11px]">Giải thích (không bắt buộc)</Label>
            <Input className="mt-1" value={q.explanation || ""} onChange={(e) => update(index, { explanation: e.target.value })} />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onChange([...list, emptyQuestion()])}>
        <Plus className="h-4 w-4" /> Thêm câu hỏi
      </Button>
    </div>
  );
}