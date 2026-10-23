import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được tạo ảnh cho email' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const description = String(body?.description || '').trim().slice(0, 500);
    if (!description) return Response.json({ error: 'Hãy mô tả ảnh bạn muốn tạo' }, { status: 400 });

    const kind = String(body?.kind || 'banner');
    const sizeHint =
      kind === 'signature'
        ? 'Bố cục vuông, chủ thể đặt giữa, phù hợp làm logo/chữ ký nhỏ.'
        : 'Bố cục ngang tỉ lệ 3:1, chủ thể đặt lệch trái, chừa khoảng trống bên phải cho chữ.';

    const prompt = `Hình ảnh dùng cho email tuyển dụng của Nexora Technology (thương hiệu NexCareer Hub).
Nội dung: ${description}
Phong cách: chuyên nghiệp, hiện đại, sạch sẽ, ánh sáng mềm, tông màu tím #564be7, trắng #ffffff và kem #fbf7fd.
${sizeHint}
Không có chữ viết trong ảnh, không có logo, không có watermark, không có giao diện thiết bị.`;

    const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
    const url = result?.url;
    if (!url) return Response.json({ error: 'Chưa tạo được ảnh, vui lòng thử lại' }, { status: 502 });

    const saved = await base44.asServiceRole.entities.EmailImage.create({
      name: description.slice(0, 80),
      url,
      alt: description.slice(0, 120),
      source: 'ai',
      created_by_email: user.email || '',
    });

    return Response.json({ ok: true, url, alt: description.slice(0, 120), image_id: saved?.id });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Lỗi không xác định' }, { status: 500 });
  }
}