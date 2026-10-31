import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const UPDATED = "31/10/2026";
const CONTACT = "email@nexoratechno.com · +84 969 536 234";

// Mỗi mục: { title, text?: string[], list?: string[] }
const DOCS = {
  terms: {
    title: "Điều khoản sử dụng",
    intro: "Khi truy cập hoặc sử dụng NexCareer Hub, bạn đồng ý với các điều khoản dưới đây. Vui lòng đọc kỹ trước khi tạo tài khoản hoặc ứng tuyển.",
    sections: [
      {
        title: "1. Về NexCareer Hub",
        text: [
          "NexCareer Hub là cổng tuyển dụng của Nexora Technology (TP. Hồ Chí Minh), cho phép ứng viên xem việc làm, nộp hồ sơ, làm bài đánh giá và theo dõi tiến trình ứng tuyển; đồng thời cung cấp HR Studio cho bộ phận Nhân sự quản lý quy trình tuyển dụng.",
        ],
      },
      {
        title: "2. Tài khoản",
        list: [
          "Bạn cần cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký hoặc nộp hồ sơ.",
          "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra trong tài khoản của mình.",
          "Mỗi người chỉ nên sử dụng một tài khoản. Vui lòng báo ngay cho chúng tôi nếu phát hiện tài khoản bị sử dụng trái phép.",
        ],
      },
      {
        title: "3. Quy trình ứng tuyển",
        list: [
          "Hồ sơ được đánh giá qua nhiều vòng, gồm sàng lọc CV, bài đánh giá (Job Simulation) và phỏng vấn với Line Manager.",
          "Việc nộp hồ sơ không đảm bảo bạn sẽ được mời làm bài, phỏng vấn hay nhận việc. Quyết định cuối cùng thuộc về Nexora Technology.",
          "Một số bước sử dụng công cụ hỗ trợ bằng trí tuệ nhân tạo (AI) để phân tích CV hoặc bài làm. Kết quả này chỉ mang tính tham khảo và luôn có con người xem xét trước khi ra quyết định.",
        ],
      },
      {
        title: "4. Quy tắc làm bài đánh giá",
        list: [
          "Bạn cần tự mình hoàn thành bài làm, không nhờ người khác làm hộ hay sử dụng công cụ hỗ trợ trái quy định của bài.",
          "Hệ thống có thể ghi nhận các sự kiện bất thường trong lúc làm bài (ví dụ rời khỏi màn hình bài thi) để phục vụ việc đánh giá tính công bằng.",
          "Hành vi gian lận có thể dẫn đến việc hồ sơ bị loại khỏi quy trình tuyển dụng.",
        ],
      },
      {
        title: "5. Hành vi không được phép",
        list: [
          "Cung cấp thông tin, bằng cấp hoặc chứng chỉ sai sự thật.",
          "Mạo danh cá nhân hoặc tổ chức khác.",
          "Tấn công, dò quét, làm gián đoạn hoặc cố truy cập trái phép vào hệ thống và dữ liệu của người khác.",
          "Sử dụng nền tảng để gửi thư rác, nội dung vi phạm pháp luật hoặc xâm phạm quyền của bên thứ ba.",
        ],
      },
      {
        title: "6. Nội dung do bạn cung cấp",
        text: [
          "Bạn giữ quyền đối với CV, thông tin và tài liệu bạn tải lên. Bằng việc nộp hồ sơ, bạn cho phép Nexora Technology sử dụng các nội dung đó cho mục đích tuyển dụng, bao gồm lưu trữ, xem xét, chia sẻ nội bộ với những người tham gia quy trình tuyển dụng và liên hệ với bạn.",
        ],
      },
      {
        title: "7. Sở hữu trí tuệ",
        text: [
          "Giao diện, mã nguồn, thương hiệu, hình ảnh và nội dung do NexCareer Hub và Nexora Technology cung cấp thuộc quyền sở hữu của chúng tôi hoặc bên cấp phép. Bạn không được sao chép, phân phối hoặc khai thác cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản.",
        ],
      },
      {
        title: "8. Giới hạn trách nhiệm",
        text: [
          "Chúng tôi nỗ lực duy trì nền tảng hoạt động ổn định và thông tin việc làm chính xác, nhưng không đảm bảo dịch vụ luôn liên tục hoặc không có lỗi. Nexora Technology không chịu trách nhiệm đối với các thiệt hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng nền tảng, trong phạm vi pháp luật cho phép.",
        ],
      },
      {
        title: "9. Tạm ngưng và chấm dứt",
        text: [
          "Chúng tôi có thể tạm ngưng hoặc chấm dứt quyền truy cập của tài khoản vi phạm điều khoản này. Bạn cũng có thể yêu cầu ngừng sử dụng và xóa tài khoản bất cứ lúc nào bằng cách liên hệ với chúng tôi.",
        ],
      },
      {
        title: "10. Thay đổi điều khoản và liên hệ",
        text: [
          "Điều khoản có thể được cập nhật theo thời gian; phiên bản mới có hiệu lực kể từ ngày đăng tải trên trang này. Việc tiếp tục sử dụng nền tảng nghĩa là bạn chấp nhận các thay đổi đó.",
          `Mọi thắc mắc xin liên hệ: ${CONTACT}.`,
        ],
      },
    ],
  },
  privacy: {
    title: "Chính sách bảo mật",
    intro: "Chúng tôi coi trọng quyền riêng tư của bạn. Chính sách này giải thích NexCareer Hub thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn như thế nào khi sử dụng nền tảng.",
    sections: [
      {
        title: "1. Dữ liệu chúng tôi thu thập",
        list: [
          "Thông tin tài khoản và hồ sơ: họ tên, email, số điện thoại, chức danh, giới thiệu bản thân, ảnh đại diện, địa điểm, học vấn, kỹ năng, số năm kinh nghiệm.",
          "Tài liệu ứng tuyển: CV, chứng chỉ, đường dẫn GitHub/portfolio, thư giới thiệu và các thông tin bạn điền khi nộp hồ sơ.",
          "Dữ liệu trong quy trình tuyển dụng: trạng thái hồ sơ, kết quả và nhận xét ở từng vòng, bài làm và điểm số, lịch phỏng vấn.",
          "Dữ liệu khi làm bài đánh giá: các sự kiện ghi nhận trong lúc làm bài (ví dụ rời khỏi màn hình bài thi) nhằm đảm bảo tính công bằng.",
          "Dữ liệu trò chuyện với trợ lý Starbuddy: nội dung câu hỏi và phản hồi hữu ích hay không, dùng để cải thiện chất lượng hỗ trợ.",
          "Dữ liệu kỹ thuật: thông tin phiên truy cập và dữ liệu lưu tạm trên trình duyệt (ví dụ ghi nhớ lượt xem việc làm trong một phiên).",
        ],
      },
      {
        title: "2. Mục đích sử dụng",
        list: [
          "Xử lý hồ sơ ứng tuyển, đánh giá và liên hệ với bạn về kết quả, lịch phỏng vấn.",
          "Gửi email xác nhận, nhắc lịch và thông báo liên quan đến quá trình tuyển dụng.",
          "Hỗ trợ phân tích CV và bài làm bằng công cụ AI; kết quả chỉ mang tính tham khảo cho người đánh giá.",
          "Phát hiện hành vi gian lận, bảo vệ an toàn hệ thống và cải thiện trải nghiệm sử dụng.",
          "Thực hiện nghĩa vụ theo quy định của pháp luật.",
        ],
      },
      {
        title: "3. Ai được xem dữ liệu của bạn",
        list: [
          "Bộ phận Nhân sự (HR) của Nexora Technology và Line Manager tham gia đánh giá vị trí bạn ứng tuyển.",
          "Nhà cung cấp dịch vụ hạ tầng và công cụ mà nền tảng sử dụng (ví dụ lưu trữ dữ liệu, gửi email, lịch Google khi HR đặt lịch phỏng vấn), chỉ trong phạm vi cần thiết để vận hành dịch vụ.",
          "Chúng tôi không bán dữ liệu cá nhân của bạn cho bên thứ ba.",
        ],
      },
      {
        title: "4. Thời gian lưu trữ",
        text: [
          "Dữ liệu được lưu trong thời gian cần thiết cho mục đích tuyển dụng và các nghĩa vụ pháp lý. Khi không còn cần thiết, hoặc khi bạn yêu cầu xóa hợp lệ, chúng tôi sẽ xóa hoặc ẩn danh hóa dữ liệu.",
        ],
      },
      {
        title: "5. Bảo mật dữ liệu",
        text: [
          "Chúng tôi áp dụng các biện pháp kỹ thuật và quản trị hợp lý để bảo vệ dữ liệu, trong đó quyền truy cập khu vực HR được giới hạn theo vai trò. Tuy nhiên, không có hệ thống nào an toàn tuyệt đối; bạn cũng nên giữ bí mật mật khẩu và đăng xuất khi dùng máy dùng chung.",
        ],
      },
      {
        title: "6. Quyền của bạn",
        list: [
          "Truy cập và chỉnh sửa thông tin cá nhân ngay trong Candidate Room.",
          "Yêu cầu cung cấp bản sao, chỉnh sửa hoặc xóa dữ liệu cá nhân của bạn.",
          "Rút lại sự đồng ý hoặc yêu cầu hạn chế xử lý dữ liệu (việc này có thể khiến hồ sơ không được tiếp tục xem xét).",
          "Khiếu nại nếu bạn cho rằng dữ liệu của mình bị xử lý sai quy định.",
        ],
        text: ["Việc xử lý dữ liệu cá nhân được thực hiện theo quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân."],
      },
      {
        title: "7. Dữ liệu của trẻ em",
        text: [
          "Nền tảng dành cho người từ đủ 16 tuổi trở lên. Nếu bạn phát hiện trẻ em dưới độ tuổi này cung cấp dữ liệu, vui lòng báo để chúng tôi xử lý.",
        ],
      },
      {
        title: "8. Thay đổi chính sách và liên hệ",
        text: [
          "Chính sách có thể được cập nhật; phiên bản mới có hiệu lực từ ngày đăng tải trên trang này.",
          `Để thực hiện quyền của bạn hoặc hỏi thêm về quyền riêng tư, xin liên hệ: ${CONTACT}.`,
        ],
      },
    ],
  },
};

// Hộp thoại hiện nội dung điều khoản / chính sách khi bấm vào liên kết ở chân trang.
export default function LegalDialog({ type, onClose }) {
  const doc = type ? DOCS[type] : null;
  return (
    <Dialog open={!!doc} onOpenChange={(open) => { if (!open) onClose(); }}>
      {doc && (
        <DialogContent className="flex max-h-[88vh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl bg-card p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5 pr-12 text-left">
            <DialogTitle className="text-galaxy font-heading text-xl font-800">{doc.title}</DialogTitle>
            <DialogDescription className="text-xs">Cập nhật lần cuối: {UPDATED}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-5 text-sm leading-relaxed text-foreground/80">
            <p>{doc.intro}</p>
            {doc.sections.map((s) => (
              <section key={s.title} className="mt-5">
                <h3 className="font-heading text-[15px] font-700 text-foreground">{s.title}</h3>
                {s.text?.map((t, i) => (
                  <p key={i} className="mt-1.5">{t}</p>
                ))}
                {s.list && (
                  <ul className="mt-1.5 list-disc space-y-1.5 pl-5 marker:text-primary">
                    {s.list.map((li, i) => (
                      <li key={i}>{li}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
