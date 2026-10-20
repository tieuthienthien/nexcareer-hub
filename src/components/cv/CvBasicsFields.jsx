import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function CommaInput({ label, value = [], onChange, placeholder }) {
  const [text, setText] = useState(value.join(", "));
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }}
        className="mt-1.5"
      />
    </div>
  );
}

export default function CvBasicsFields({ cv, setCv }) {
  const set = (key) => (e) => setCv({ ...cv, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Họ và tên</Label>
          <Input value={cv.full_name || ""} onChange={set("full_name")} placeholder="Nguyễn Minh Anh" className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Chức danh</Label>
          <Input value={cv.headline || ""} onChange={set("headline")} placeholder="Frontend Developer" className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input value={cv.email || ""} onChange={set("email")} placeholder="ban@email.com" className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Số điện thoại</Label>
          <Input value={cv.phone || ""} onChange={set("phone")} placeholder="09xx xxx xxx" className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Địa chỉ</Label>
          <Input value={cv.address || ""} onChange={set("address")} placeholder="TP. Hồ Chí Minh" className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Ngày sinh</Label>
          <Input value={cv.birth_date || ""} onChange={set("birth_date")} placeholder="01/01/1998" className="mt-1.5" />
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Giới thiệu bản thân</Label>
        <Textarea
          rows={4}
          value={cv.summary || ""}
          onChange={set("summary")}
          placeholder="Tóm tắt 3–4 dòng về kinh nghiệm, thế mạnh và mục tiêu nghề nghiệp."
          className="mt-1.5"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <CommaInput label="Kỹ năng (cách nhau bởi dấu phẩy)" value={cv.skills} onChange={(v) => setCv({ ...cv, skills: v })} placeholder="ReactJS, TypeScript" />
        <CommaInput label="Chứng chỉ" value={cv.certificates} onChange={(v) => setCv({ ...cv, certificates: v })} placeholder="AWS, IELTS 7.0" />
        <CommaInput label="Ngoại ngữ" value={cv.languages} onChange={(v) => setCv({ ...cv, languages: v })} placeholder="Tiếng Anh, Tiếng Nhật" />
      </div>
    </div>
  );
}