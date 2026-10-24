
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const sections = [
  {
    title: "1. Giới thiệu",
    content: (
      <>
        <p>
          Chào mừng bạn đến với NexCareer Hub, nền tảng tuyển dụng được phát
          triển bởi <strong>CÔNG TY TNHH NEXORA TECHNOLOGY</strong> (sau đây
          gọi là “Nexora Technology”, “Nexora” hoặc “Chúng tôi”).
        </p>
        <p>
          NexCareer Hub hỗ trợ tìm kiếm việc làm, tiếp cận cơ hội nghề nghiệp
          và kết nối ứng viên với nhà tuyển dụng. Tùy theo các tính năng được
          triển khai, nền tảng có thể cung cấp Candidate Room, HR Studio và
          các công cụ hỗ trợ tuyển dụng.
        </p>
        <p>
          Bằng việc truy cập hoặc sử dụng nền tảng, bạn xác nhận đã đọc và
          hiểu các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng
          các tính năng liên quan.
        </p>
      </>
    ),
  },
  {
    title: "2. Phạm vi áp dụng",
    content: (
      <>
        <p>Điều khoản áp dụng cho các nhóm người dùng sau:</p>
        <ul>
          <li>
            <strong>Ứng viên:</strong> Người tìm việc, tạo hồ sơ hoặc ứng tuyển
            vào các vị trí tuyển dụng.
          </li>
          <li>
            <strong>Nhà tuyển dụng:</strong> Cá nhân hoặc tổ chức sử dụng nền
            tảng để đăng tin hoặc tiếp nhận hồ sơ.
          </li>
          <li>
            <strong>Khách truy cập:</strong> Người xem thông tin tuyển dụng
            và các nội dung công khai trên website.
          </li>
        </ul>
        <p>
          Một số tính năng có thể có điều kiện riêng. Người dùng cần tuân thủ
          các điều kiện đó cùng với Điều khoản sử dụng này.
        </p>
      </>
    ),
  },
  {
    title: "3. Tài khoản và thông tin người dùng",
    content: (
      <ul>
        <li>
          Cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký hoặc
          sử dụng tính năng yêu cầu tài khoản.
        </li>
        <li>
          Bảo vệ thông tin đăng nhập và thông báo cho Nexora khi phát hiện
          dấu hiệu truy cập trái phép.
        </li>
        <li>
          Không giả mạo danh tính, mạo danh tổ chức hoặc sử dụng thông tin
          của người khác trái phép.
        </li>
        <li>
          Nexora có thể yêu cầu xác minh thông tin khi cần thiết để bảo vệ
          người dùng, hệ thống hoặc thực hiện nghĩa vụ pháp lý.
        </li>
      </ul>
    ),
  },
  {
    title: "4. Quy định dành cho ứng viên",
    content: (
      <>
        <p>Khi sử dụng NexCareer Hub, ứng viên có trách nhiệm:</p>
        <ul>
          <li>Cung cấp thông tin hồ sơ và ứng tuyển trung thực.</li>
          <li>
            Chỉ cung cấp dữ liệu cá nhân của người khác khi có căn cứ hợp pháp.
          </li>
          <li>
            Chủ động xác minh thông tin tuyển dụng và nhà tuyển dụng trước
            khi cung cấp thêm dữ liệu hoặc tham gia phỏng vấn.
          </li>
          <li>
            Không sử dụng nền tảng để gian lận, quấy rối hoặc thực hiện hành
            vi trái pháp luật.
          </li>
          <li>Tôn trọng quyền sở hữu trí tuệ và quyền riêng tư của người khác.</li>
        </ul>
        <p>
          Việc tạo hồ sơ hoặc ứng tuyển không bảo đảm ứng viên sẽ được liên hệ,
          mời phỏng vấn hoặc tuyển dụng.
        </p>
      </>
    ),
  },
  {
    title: "5. Quy định dành cho nhà tuyển dụng",
    content: (
      <>
        <p>Nhà tuyển dụng có trách nhiệm:</p>
        <ul>
          <li>
            Cung cấp thông tin doanh nghiệp, vị trí tuyển dụng, mô tả công việc
            và điều kiện làm việc chính xác, rõ ràng.
          </li>
          <li>
            Bảo đảm quyền sử dụng hợp pháp đối với nội dung, logo và hình ảnh
            được đăng tải.
          </li>
          <li>
            Không đăng tin giả mạo, lừa đảo, phân biệt đối xử trái pháp luật
            hoặc đưa ra yêu cầu thanh toán không minh bạch.
          </li>
          <li>
            Chỉ xử lý hồ sơ ứng viên cho mục đích tuyển dụng phù hợp, có căn cứ
            hợp pháp và tuân thủ quy định về dữ liệu cá nhân.
          </li>
          <li>
            Không bán, phát tán hoặc sử dụng dữ liệu ứng viên cho mục đích
            không liên quan khi không có căn cứ pháp lý phù hợp.
          </li>
          <li>
            Chịu trách nhiệm về tin tuyển dụng, quy trình tuyển chọn và quyết
            định tuyển dụng của mình.
          </li>
        </ul>
        <p>
          Nexora có thể yêu cầu chỉnh sửa, tạm ẩn hoặc gỡ bỏ nội dung khi có
          căn cứ hợp lý cho rằng nội dung đó vi phạm điều khoản hoặc pháp luật.
        </p>
      </>
    ),
  },
  {
    title: "6. Quy tắc sử dụng nền tảng",
    content: (
      <>
        <p>Người dùng không được:</p>
        <ul>
          <li>Sử dụng nền tảng cho mục đích trái pháp luật.</li>
          <li>Đăng tải nội dung lừa đảo, giả mạo, đe dọa hoặc quấy rối.</li>
          <li>Phát tán virus, mã độc hoặc truy cập trái phép vào hệ thống.</li>
          <li>
            Can thiệp hoạt động kỹ thuật, phá vỡ biện pháp bảo mật hoặc làm
            gián đoạn dịch vụ.
          </li>
          <li>
            Thu thập dữ liệu tự động, sao chép hàng loạt hoặc khai thác dữ
            liệu trái phép.
          </li>
          <li>Gửi thư rác hoặc quảng cáo không được phép.</li>
        </ul>
      </>
    ),
  },
  {
    title: "7. Quyền sở hữu trí tuệ",
    content: (
      <>
        <p>
          Tên gọi NexCareer Hub, thương hiệu Nexora Technology, giao diện,
          thiết kế và các thành phần do Nexora phát triển thuộc quyền sở hữu
          của Nexora Technology hoặc bên cấp phép tương ứng.
        </p>
        <p>
          Người dùng không được sao chép, phân phối hoặc khai thác thương mại
          các thành phần này ngoài phạm vi được pháp luật cho phép hoặc được
          chủ thể quyền chấp thuận.
        </p>
        <p>
          Người dùng vẫn giữ các quyền hợp pháp đối với CV, hồ sơ và nội dung
          do mình tạo ra. Khi tải nội dung lên nền tảng, người dùng cho phép
          Nexora lưu trữ, hiển thị và xử lý nội dung trong phạm vi cần thiết
          để cung cấp tính năng được yêu cầu, phù hợp với Chính sách bảo mật
          và pháp luật.
        </p>
      </>
    ),
  },
  {
    title: "8. Dịch vụ bên thứ ba",
    content: (
      <p>
        NexCareer Hub có thể chứa liên kết hoặc tích hợp dịch vụ của bên thứ
        ba, chẳng hạn như dịch vụ lưu trữ, phân tích hoặc hỗ trợ tuyển dụng.
        Các dịch vụ này có thể có điều khoản và chính sách riêng. Việc tích
        hợp hoặc chia sẻ dữ liệu phải tuân thủ pháp luật áp dụng.
      </p>
    ),
  },
  {
    title: "9. Gián đoạn dịch vụ và giới hạn trách nhiệm",
    content: (
      <>
        <p>
          Nexora nỗ lực duy trì nền tảng an toàn và ổn định. Tuy nhiên, dịch
          vụ có thể gián đoạn do bảo trì, sự cố kỹ thuật, lỗi mạng hoặc các
          nguyên nhân ngoài khả năng kiểm soát hợp lý.
        </p>
        <p>
          Nexora không bảo đảm mọi tin tuyển dụng luôn chính xác, mọi nhà
          tuyển dụng đều đáng tin cậy hoặc ứng viên sẽ nhận được kết quả
          tuyển dụng như mong muốn. Người dùng cần chủ động xác minh thông tin.
        </p>
        <p>
          Trong phạm vi pháp luật cho phép, Nexora không chịu trách nhiệm
          đối với thiệt hại phát sinh hoàn toàn từ hành vi vi phạm của người
          dùng hoặc bên thứ ba mà Nexora không có nghĩa vụ pháp lý phải chịu
          trách nhiệm. Điều khoản này không loại trừ trách nhiệm mà pháp luật
          không cho phép loại trừ hoặc hạn chế.
        </p>
      </>
    ),
  },
  {
    title: "10. Tạm ngừng và chấm dứt quyền sử dụng",
    content: (
      <p>
        Nexora có thể cảnh báo, hạn chế, tạm ngừng hoặc chấm dứt quyền truy
        cập khi có căn cứ hợp lý cho rằng người dùng vi phạm điều khoản, gây
        rủi ro bảo mật hoặc thực hiện hành vi trái pháp luật. Trong phạm vi
        phù hợp, Nexora sẽ thông báo lý do và tạo điều kiện để người dùng
        phản hồi hoặc khắc phục. Người dùng có thể gửi yêu cầu đóng tài khoản
        qua kênh liên hệ. Việc đóng tài khoản không đồng nghĩa mọi dữ liệu
        phải được xóa ngay nếu còn căn cứ hợp pháp để lưu giữ.
      </p>
    ),
  },
  {
    title: "11. Bảo vệ dữ liệu cá nhân",
    content: (
      <p>
        Việc xử lý dữ liệu cá nhân được thực hiện theo Chính sách bảo mật
        NexCareer Hub và pháp luật Việt Nam. Người dùng nên đọc Chính sách
        bảo mật để hiểu các loại dữ liệu được xử lý, mục đích, phạm vi chia
        sẻ, thời hạn lưu trữ và quyền của mình. Điều khoản này không thay thế
        sự đồng ý riêng hoặc các thông báo cần thiết khi pháp luật yêu cầu.
      </p>
    ),
  },
  {
    title: "12. Thay đổi điều khoản",
    content: (
      <p>
        Nexora có thể cập nhật điều khoản để phản ánh thay đổi về tính năng,
        hoạt động kinh doanh hoặc quy định pháp luật. Phiên bản cập nhật sẽ
        được đăng tải trên website cùng ngày cập nhật. Với thay đổi ảnh hưởng
        đáng kể đến quyền và nghĩa vụ người dùng, Nexora sẽ thông báo theo
        cách phù hợp và thực hiện thủ tục cần thiết. Việc tiếp tục sử dụng
        nền tảng không thay thế yêu cầu lấy sự đồng ý khi pháp luật quy định.
      </p>
    ),
  },
  {
    title: "13. Luật áp dụng và giải quyết tranh chấp",
    content: (
      <p>
        Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Các bên ưu tiên
        giải quyết tranh chấp thông qua thương lượng thiện chí. Nếu không đạt
        được thỏa thuận, tranh chấp sẽ được giải quyết bởi cơ quan có thẩm
        quyền theo quy định pháp luật.
      </p>
    ),
  },
  {
    title: "14. Thông tin liên hệ",
    content: (
      <>
        <p>
          <strong>Đơn vị vận hành:</strong> CÔNG TY TNHH NEXORA TECHNOLOGY
        </p>
        <p><strong>Nền tảng:</strong> NexCareer Hub</p>
        <p><strong>Địa điểm hoạt động được công bố:</strong> TP. Hồ Chí Minh, Việt Nam</p>
        <p>
          <strong>Email:</strong>{" "}
          <a className="text-primary hover:underline" href="mailto:email@nexoratechno.com">
            email@nexoratechno.com
          </a>
        </p>
        <p>
          Nếu có câu hỏi hoặc yêu cầu liên quan đến Điều khoản sử dụng, vui
          lòng liên hệ qua email trên.
        </p>
      </>
    ),
  },
];

export default function TermsOfUse() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <header className="mb-10 border-b border-border pb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
            Nexora Technology
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Điều khoản sử dụng
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
            Các điều khoản quy định việc truy cập và sử dụng nền tảng tuyển dụng
            NexCareer Hub.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Cập nhật lần cuối: 24/10/2026
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <aside className="h-fit rounded-xl border border-border bg-muted/20 p-5 lg:sticky lg:top-6">
            <h2 className="mb-3 text-sm font-semibold">Nội dung</h2>
            <nav aria-label="Mục lục điều khoản">
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {sections.map((section, index) => (
                  <li key={section.title}>
                    <a
                      href={`#terms-${index + 1}`}
                      className="transition-colors hover:text-primary"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="min-w-0 space-y-9 text-sm leading-7 text-foreground sm:text-base">
            {sections.map((section, index) => (
              <section
                key={section.title}
                id={`terms-${index + 1}`}
                className="scroll-mt-8 space-y-3"
              >
                <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  {section.title}
                </h2>
                <div className="space-y-3 text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
                  {section.content}
                </div>
              </section>
            ))}

            <div className="rounded-xl border border-border bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
              Đây là bản dự thảo chính sách dành cho NexCareer Hub. Nội dung
              cần được rà soát theo hoạt động thực tế của doanh nghiệp trước
              khi áp dụng chính thức.
            </div>

            <div className="flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
              <Link to="/chinh-sach-bao-mat" className="font-medium text-primary hover:underline">
                Xem Chính sách bảo mật →
              </Link>
              <Link to="/lien-he" className="text-muted-foreground hover:text-primary">
                Liên hệ Nexora Technology
              </Link>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}


