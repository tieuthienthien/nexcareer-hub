import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { loadLearningState } from "@/lib/courseAccess";
import CategoryCard from "@/components/course/CategoryCard";
import ReferralPanel from "@/components/course/ReferralPanel";
import { Button } from "@/components/ui/button";
import { Award, ShieldCheck, Unlock, Users } from "lucide-react";

const IMG = "https://media.base44.com/images/public/6acd03fc9e292b4e6a9a3492";

const categories = [
  {
    title: "Lập trình viên",
    description: "HTML/CSS, JavaScript, Git và tư duy giải quyết vấn đề qua 5 chương thực chiến, có video case và bài kiểm tra chấm bằng AI.",
    image: `${IMG}/0dd391a29_generated_image.png`,
    href: "/khoa-hoc/lap-trinh-vien",
  },
  {
    title: "Thiết kế UX/UI",
    description: "Nghiên cứu người dùng, wireframe và hệ thống thiết kế cho sản phẩm số.",
    image: `${IMG}/7af300e39_generated_image.png`,
    comingSoon: true,
  },
  {
    title: "Nhân sự",
    description: "Tuyển dụng, đánh giá năng lực và xây dựng trải nghiệm nhân viên.",
    image: `${IMG}/6b4ad6926_generated_image.png`,
    comingSoon: true,
  },
  {
    title: "Kỹ sư IoT",
    description: "Vi điều khiển, cảm biến và kết nối thiết bị lên nền tảng đám mây.",
    image: `${IMG}/ddee5ebb8_generated_image.png`,
    comingSoon: true,
  },
  {
    title: "Marketing",
    description: "Chiến lược nội dung, quảng cáo số và đo lường hiệu quả chiến dịch.",
    image: `${IMG}/a19dd41a2_generated_image.png`,
    comingSoon: true,
  },
];

export default function Courses() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setState(null);
      return;
    }
    loadLearningState(user.id).then(setState).catch(() => setState(null));
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary">
            <Award className="h-3.5 w-3.5" /> Học nghề cùng Nexora Technology
          </span>
          <h1 className="mt-3 font-heading text-3xl font-800 tracking-tight sm:text-4xl">Khóa học</h1>
          <p className="mt-2 text-muted-foreground">
            Lộ trình học theo ngành nghề, có bài giảng, video case thực tế và bài kiểm tra chấm bằng AI. Hoàn thành từ 80/100 để nhận chứng chỉ.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/xac-thuc-chung-chi">
              <ShieldCheck className="h-4 w-4" /> Xác thực chứng chỉ
            </Link>
          </Button>
          {isAuthenticated && (
            <Button asChild className="gap-2">
              <Link to="/chung-chi">
                <Award className="h-4 w-4" /> Chứng chỉ của tôi
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isAuthenticated && state && (
        <div className="mt-6 grid gap-3 sm:max-w-xl sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-600 uppercase tracking-wide text-muted-foreground">
              <Unlock className="h-3.5 w-3.5" /> Số khóa còn được mở
            </div>
            <div className="mt-1 font-heading text-2xl font-800 text-primary">{state.remaining}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-600 uppercase tracking-wide text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Bạn bè đã mời thành công
            </div>
            <div className="mt-1 font-heading text-2xl font-800">{state.invited}</div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.title} {...category} />
        ))}
      </div>

      <div className="mt-10">
        {isAuthenticated && user?.id ? (
          <ReferralPanel userId={user.id} remaining={state?.remaining ?? 0} invited={state?.invited ?? 0} />
        ) : (
          <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground sm:p-6">
            Mỗi tài khoản được học miễn phí 1 khóa.{" "}
            <Link to="/login" className="font-600 text-primary hover:underline">
              Đăng nhập
            </Link>{" "}
            để bắt đầu học, sau đó mời bạn bè để mở thêm khóa.
          </div>
        )}
      </div>
    </div>
  );
}