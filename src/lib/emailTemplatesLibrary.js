// Thư viện 8 mẫu email tuyển dụng dùng trong trình soạn email của HR Studio.
// Nội dung giữ nguyên các biến {{ten_bien}}; hệ thống điền khi gửi.

export const EMAIL_TEMPLATES = [
  {
    key: "round1_pass",
    name: "Đậu vòng 1 (CV) & mời Job Simulation",
    category: "Vòng 1",
    step: "Vòng 1",
    ctaLabel: "Bắt đầu Job Simulation",
    ctaUrl: "{{link_job_simulation}}",
    subject: "[{{ten_cong_ty}}] Chúc mừng bạn đã vượt qua vòng đánh giá hồ sơ – Vị trí {{vi_tri}}",
    body: `<p>Kính gửi anh/chị <strong>{{ten_ung_vien}}</strong>,</p>
<p>Lời đầu tiên, {{ten_cong_ty}} xin chân thành cảm ơn anh/chị đã dành thời gian và tâm huyết ứng tuyển vị trí <strong>{{vi_tri}}</strong>. Sau khi cân nhắc kỹ lưỡng, chúng tôi rất vui mừng thông báo hồ sơ của anh/chị đã <strong>vượt qua Vòng 1 – Đánh giá hồ sơ</strong>. Kinh nghiệm và kỹ năng anh/chị trình bày đã gây ấn tượng tốt với đội ngũ tuyển dụng.</p>
<h3>Bước tiếp theo: Vòng 2 – Job Simulation</h3>
<p>Tại Nexora, chúng tôi tin rằng cách tốt nhất để hiểu năng lực là cùng anh/chị trải nghiệm công việc thật. Job Simulation là bài mô phỏng một ngày làm việc tại vị trí {{vi_tri}}, với các tình huống sát thực tế của doanh nghiệp.</p>
<ul>
<li><strong>Thời lượng:</strong> {{thoi_luong}} phút làm liên tục.</li>
<li><strong>Hạn hoàn thành:</strong> trước {{han_nop_simulation}}.</li>
<li><strong>Hình thức:</strong> làm trực tuyến qua đường dẫn riêng ở nút bên dưới, mỗi lời mời chỉ dùng được 1 lần.</li>
</ul>
<p><strong>Nội dung bài làm gồm:</strong></p>
<ul>
<li>Xử lý lỗi hoặc tình huống công việc thực tế của vị trí</li>
<li>Thực hành giải quyết vấn đề</li>
<li>Xử lý sự cố phát sinh</li>
<li>Giao tiếp với đồng nghiệp trong nhóm</li>
</ul>
<h3>Lưu ý để chuẩn bị tốt nhất</h3>
<ul>
<li>Dùng máy tính có kết nối internet ổn định, trình duyệt Chrome hoặc Edge phiên bản mới.</li>
<li>Chọn thời điểm yên tĩnh và đảm bảo đủ thời lượng làm bài.</li>
<li>Hệ thống tự lưu bài, anh/chị có thể tải lại trang nếu mất kết nối.</li>
<li>Không cần chuẩn bị kiến thức đặc biệt ngoài kinh nghiệm thực tế của mình.</li>
</ul>
<p>Nếu anh/chị cần hỗ trợ kỹ thuật hoặc muốn điều chỉnh thời gian, vui lòng phản hồi email này hoặc liên hệ {{ten_hr}} qua {{email_hr}} / {{sdt_hr}}.</p>
<p>Chúng tôi chúc anh/chị hoàn thành tốt bài làm và rất mong được đồng hành cùng anh/chị trong chặng tiếp theo.</p>
<p>Trân trọng,</p>`,
  },
  {
    key: "round2_pass",
    name: "Đậu vòng 2 (Job Simulation) & mời phỏng vấn",
    category: "Vòng 2",
    step: "Vòng 2",
    ctaLabel: "Xác nhận tham dự",
    ctaUrl: "mailto:{{email_hr}}",
    subject: "[{{ten_cong_ty}}] Chúc mừng bạn đã hoàn thành xuất sắc Job Simulation – Mời tham gia phỏng vấn",
    body: `<p>Kính gửi anh/chị <strong>{{ten_ung_vien}}</strong>,</p>
<p>{{ten_cong_ty}} xin chân thành cảm ơn anh/chị đã dành thời gian hoàn thành bài Job Simulation cho vị trí <strong>{{vi_tri}}</strong>. Chúng tôi ghi nhận rõ sự đầu tư và nỗ lực của anh/chị trong từng nhiệm vụ, và rất vui mừng thông báo anh/chị đã <strong>đạt kết quả Vòng 2</strong> để bước vào vòng phỏng vấn cùng quản lý trực tiếp.</p>
<h3>Thông tin buổi phỏng vấn</h3>
<ul>
<li><strong>Thời gian:</strong> {{ngay_gio_phong_van}}</li>
<li><strong>Hình thức:</strong> {{hinh_thuc_phong_van}}</li>
<li><strong>Địa điểm / liên kết tham dự:</strong> {{dia_diem_hoac_link}}</li>
<li><strong>Người phỏng vấn:</strong> {{ten_line_manager}} – {{chuc_danh_line_manager}}</li>
<li><strong>Thời lượng dự kiến:</strong> 45–60 phút</li>
</ul>
<h3>Bạn sẽ trao đổi về</h3>
<ul>
<li>Kinh nghiệm làm việc và các dự án tiêu biểu anh/chị đã thực hiện</li>
<li>Cách anh/chị tiếp cận và xử lý các nhiệm vụ trong bài Job Simulation</li>
<li>Định hướng nghề nghiệp của anh/chị trong 1–2 năm tới</li>
<li>Kỳ vọng của hai bên về vai trò và môi trường làm việc</li>
</ul>
<h3>Chuẩn bị trước buổi phỏng vấn</h3>
<ul>
<li>Giấy tờ tùy thân nếu anh/chị tham dự trực tiếp tại văn phòng</li>
<li>Portfolio hoặc GitHub (nếu có) để trao đổi nhanh hơn về sản phẩm anh/chị từng làm</li>
<li>Những câu hỏi anh/chị muốn hỏi lại công ty về đội nhóm, quy trình và sản phẩm</li>
<li>Nếu phỏng vấn online: kiểm tra camera, micro và đường truyền trước 15 phút</li>
</ul>
<p>Vui lòng xác nhận tham dự trong vòng 24–48 giờ bằng cách phản hồi email này. Nếu khung giờ trên chưa phù hợp, anh/chị hãy cho chúng tôi biết để cùng sắp xếp một thời điểm khác phù hợp hơn.</p>
<p>Chúng tôi rất mong được gặp và lắng nghe chia sẻ của anh/chị.</p>
<p>Trân trọng,</p>`,
  },
  {
    key: "offer",
    name: "Đậu vòng 3 – Thư mời nhận việc",
    category: "Kết quả",
    step: "Kết quả",
    ctaLabel: "Chấp nhận offer",
    ctaUrl: "mailto:{{email_hr}}",
    subject: "[{{ten_cong_ty}}] Thư mời nhận việc – Vị trí {{vi_tri}}",
    body: `<p>Kính gửi anh/chị <strong>{{ten_ung_vien}}</strong>,</p>
<p>Chúc mừng anh/chị! Sau khi hoàn tất cả ba vòng đánh giá – sàng lọc hồ sơ, Job Simulation và phỏng vấn cùng quản lý trực tiếp – {{ten_cong_ty}} trân trọng gửi tới anh/chị <strong>thư mời nhận việc</strong> cho vị trí <strong>{{vi_tri}}</strong>.</p>
<p>Chúng tôi tin rằng kinh nghiệm, cách tư duy và tinh thần hợp tác anh/chị thể hiện qua quá trình tuyển chọn sẽ là phần bổ sung giá trị cho đội ngũ của chúng tôi.</p>
<h3>Tóm tắt đề nghị</h3>
<ul>
<li><strong>Chức danh:</strong> {{vi_tri}}</li>
<li><strong>Người quản lý trực tiếp:</strong> {{ten_line_manager}} – {{chuc_danh_line_manager}}</li>
<li><strong>Mức lương:</strong> {{muc_luong}}</li>
<li><strong>Loại hợp đồng:</strong> Hợp đồng lao động toàn thời gian, thử việc 2 tháng theo quy định</li>
<li><strong>Ngày bắt đầu dự kiến:</strong> {{ngay_bat_dau}}</li>
<li><strong>Địa điểm làm việc:</strong> Văn phòng {{ten_cong_ty}}</li>
<li><strong>Quyền lợi chính:</strong> bảo hiểm theo luật và gói bảo hiểm sức khỏe bổ sung, thưởng hiệu quả công việc, 12 ngày phép năm, ngân sách đào tạo và các buổi chia sẻ kỹ thuật nội bộ</li>
</ul>
<h3>Các bước tiếp theo</h3>
<ul>
<li>Phản hồi email này để xác nhận trước <strong>{{han_phan_hoi_offer}}</strong>.</li>
<li>Chuẩn bị hồ sơ nhận việc: CMND/CCCD, bằng cấp và chứng chỉ liên quan, ảnh 3x4, xác nhận tài khoản ngân hàng và giấy khám sức khỏe.</li>
<li>Bộ phận Nhân sự sẽ gửi lịch onboarding cho ngày đầu tiên, gồm giới thiệu đội nhóm, thiết lập tài khoản và kế hoạch 30 ngày đầu.</li>
</ul>
<p>Nếu anh/chị cần trao đổi thêm về bất kỳ nội dung nào trong thư này, hãy liên hệ {{ten_hr}} qua {{email_hr}} / {{sdt_hr}} – chúng tôi luôn sẵn sàng lắng nghe.</p>
<p>Chúng tôi rất mong được chào đón anh/chị trở thành thành viên của {{ten_cong_ty}}.</p>
<p>Trân trọng,</p>
<p><em>Ghi chú: thư này là thông báo kết quả tuyển chọn. Các điều khoản chi tiết sẽ được nêu đầy đủ trong hợp đồng lao động chính thức.</em></p>`,
  },
  {
    key: "round1_fail",
    name: "Từ chối sau vòng 1 (CV)",
    category: "Vòng 1",
    step: "Vòng 1",
    ctaLabel: "",
    ctaUrl: "",
    subject: "[{{ten_cong_ty}}] Thông báo kết quả ứng tuyển – Vị trí {{vi_tri}}",
    body: `<p>Kính gửi anh/chị <strong>{{ten_ung_vien}}</strong>,</p>
<p>{{ten_cong_ty}} xin chân thành cảm ơn anh/chị đã dành thời gian tìm hiểu và ứng tuyển vị trí <strong>{{vi_tri}}</strong>.</p>
<p>Sau khi xem xét kỹ hồ sơ, chúng tôi xin thông báo hồ sơ của anh/chị <strong>chưa phù hợp ở Vòng 1 – Đánh giá hồ sơ</strong> cho vị trí này.</p>
<p>Quyết định của chúng tôi dựa trên mức độ phù hợp với yêu cầu cụ thể của vị trí đang tuyển ở thời điểm hiện tại, không phản ánh toàn bộ năng lực và tiềm năng của anh/chị. Với nhiều hồ sơ chất lượng cùng ứng tuyển, đây là một quyết định khó khăn đối với đội ngũ tuyển dụng.</p>
<p>Nếu anh/chị quan tâm, chúng tôi mong được lưu hồ sơ của anh/chị trong kho nhân tài của {{ten_cong_ty}} và sẽ chủ động liên hệ khi có vị trí phù hợp hơn trong thời gian tới.</p>
<p>Chúc anh/chị nhiều sức khỏe và thành công trên con đường nghề nghiệp.</p>
<p>Trân trọng,</p>`,
  },
  {
    key: "round2_fail",
    name: "Từ chối sau vòng 2 (Job Simulation)",
    category: "Vòng 2",
    step: "Vòng 2",
    ctaLabel: "",
    ctaUrl: "",
    subject: "[{{ten_cong_ty}}] Thông báo kết quả ứng tuyển – Vị trí {{vi_tri}}",
    body: `<p>Kính gửi anh/chị <strong>{{ten_ung_vien}}</strong>,</p>
<p>Cảm ơn anh/chị đã dành thời gian hoàn thành bài Job Simulation cho vị trí <strong>{{vi_tri}}</strong> tại {{ten_cong_ty}}. Chúng tôi ghi nhận sự nghiêm túc và nỗ lực của anh/chị trong suốt bài làm.</p>
<p>Sau khi đánh giá kết quả, chúng tôi xin thông báo anh/chị <strong>chưa tiếp tục ở Vòng 2 – Job Simulation</strong> cho vị trí này.</p>
<p>Quyết định được đưa ra dựa trên mức độ phù hợp với yêu cầu hiện tại của vị trí, không phản ánh toàn bộ năng lực của anh/chị. Bài làm của anh/chị đã cho thấy tinh thần trách nhiệm và cách tiếp cận có hệ thống với vấn đề – những phẩm chất chúng tôi luôn trân trọng.</p>
<p>Chúng tôi mong được lưu hồ sơ của anh/chị trong kho nhân tài và sẽ chủ động liên hệ khi có cơ hội phù hợp hơn.</p>
<p>Chúc anh/chị thành công trong những bước tiếp theo.</p>
<p>Trân trọng,</p>`,
  },
  {
    key: "round3_fail",
    name: "Từ chối sau vòng 3 (Phỏng vấn)",
    category: "Kết quả",
    step: "Kết quả",
    ctaLabel: "",
    ctaUrl: "",
    subject: "[{{ten_cong_ty}}] Thông báo kết quả ứng tuyển – Vị trí {{vi_tri}}",
    body: `<p>Kính gửi anh/chị <strong>{{ten_ung_vien}}</strong>,</p>
<p>Cảm ơn anh/chị đã đồng hành cùng {{ten_cong_ty}} qua cả ba vòng tuyển chọn cho vị trí <strong>{{vi_tri}}</strong>. Việc anh/chị đi đến vòng phỏng vấn cuối cùng cho thấy năng lực và sự chuẩn bị nghiêm túc của anh/chị, và chúng tôi thực sự trân trọng điều đó.</p>
<p>Sau buổi phỏng vấn cùng {{ten_line_manager}} và quá trình cân nhắc của hội đồng tuyển dụng, chúng tôi xin thông báo lần này anh/chị <strong>chưa phù hợp với vị trí</strong>.</p>
<p>Đây là quyết định dựa trên mức độ tương thích với yêu cầu cụ thể của vị trí ở thời điểm hiện tại, không phải đánh giá về năng lực hay tiềm năng phát triển của anh/chị. Chúng tôi đánh giá cao những gì anh/chị đã chia sẻ trong buổi trao đổi.</p>
<p>Rất mong được giữ liên lạc: chúng tôi sẽ lưu hồ sơ của anh/chị trong kho nhân tài và chủ động liên hệ khi có vị trí phù hợp hơn.</p>
<p>Chúc anh/chị nhiều thành công và hy vọng sẽ có cơ hội hợp tác trong tương lai.</p>
<p>Trân trọng,</p>`,
  },
  {
    key: "sim_reminder",
    name: "Nhắc nhở làm Job Simulation (còn 24 giờ)",
    category: "Nhắc nhở",
    step: "Vòng 2",
    ctaLabel: "Làm bài ngay",
    ctaUrl: "{{link_job_simulation}}",
    subject: "[{{ten_cong_ty}}] Nhắc nhở: bài Job Simulation của bạn còn 24 giờ",
    body: `<p>Kính gửi anh/chị <strong>{{ten_ung_vien}}</strong>,</p>
<p>Chúng tôi xin nhắc anh/chị về bài <strong>Job Simulation</strong> cho vị trí <strong>{{vi_tri}}</strong>. Bài làm hiện chưa được nộp và sẽ hết hạn vào <strong>{{han_nop_simulation}}</strong>.</p>
<ul>
<li><strong>Thời lượng:</strong> {{thoi_luong}} phút làm liên tục</li>
<li><strong>Hạn hoàn thành:</strong> {{han_nop_simulation}}</li>
<li><strong>Link làm bài:</strong> nút bên dưới (mỗi lời mời chỉ dùng được 1 lần)</li>
</ul>
<p>Nếu anh/chị cần thêm thời gian hoặc gặp sự cố kỹ thuật, hãy phản hồi email này trước thời hạn để {{ten_hr}} hỗ trợ kịp thời qua {{email_hr}} / {{sdt_hr}}.</p>
<p>Chúc anh/chị hoàn thành tốt bài làm.</p>
<p>Trân trọng,</p>`,
  },
  {
    key: "interview_confirm",
    name: "Xác nhận / đổi lịch phỏng vấn",
    category: "Nhắc nhở",
    step: "Vòng 3",
    ctaLabel: "Xác nhận tham dự",
    ctaUrl: "mailto:{{email_hr}}",
    subject: "[{{ten_cong_ty}}] Xác nhận lịch phỏng vấn – Vị trí {{vi_tri}}",
    body: `<p>Kính gửi anh/chị <strong>{{ten_ung_vien}}</strong>,</p>
<p>{{ten_cong_ty}} xin xác nhận lịch phỏng vấn cho vị trí <strong>{{vi_tri}}</strong> như sau:</p>
<ul>
<li><strong>Thời gian:</strong> {{ngay_gio_phong_van}}</li>
<li><strong>Hình thức:</strong> {{hinh_thuc_phong_van}}</li>
<li><strong>Địa điểm / liên kết tham dự:</strong> {{dia_diem_hoac_link}}</li>
<li><strong>Người phỏng vấn:</strong> {{ten_line_manager}} – {{chuc_danh_line_manager}}</li>
</ul>
<p>Anh/chị vui lòng phản hồi email này để xác nhận tham dự. Nếu cần đổi lịch, hãy cho chúng tôi biết khung giờ mong muốn trong vòng 24–48 giờ để {{ten_hr}} sắp xếp lại.</p>
<p>Nếu phỏng vấn trực tuyến, anh/chị vui lòng kiểm tra camera và micro trước 15 phút.</p>
<p>Rất mong được gặp anh/chị.</p>
<p>Trân trọng,</p>`,
  },
];

export const TEMPLATE_KEYS = Object.fromEntries(EMAIL_TEMPLATES.map((tpl) => [tpl.key, tpl]));

export function getTemplate(key) {
  return TEMPLATE_KEYS[key] || EMAIL_TEMPLATES[0];
}