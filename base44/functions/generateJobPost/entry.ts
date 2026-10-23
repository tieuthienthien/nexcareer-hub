import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { AI_MODEL } from '../../shared/aiModel.ts';

const PLATFORM: Record<string, { label: string; rule: string }> = {
  linkedin: { label: 'LinkedIn', rule: '180–320 từ, giọng chuyên nghiệp, nêu rõ vai trò, phạm vi công việc và giá trị nghề nghiệp, 3–5 hashtag chuyên ngành' },
  facebook: { label: 'Facebook', rule: '120–200 từ, thân thiện, dễ đọc trên điện thoại, dùng emoji vừa phải, 3–5 hashtag' },
  topcv: { label: 'TopCV / ITviec / VietnamWorks', rule: '300–450 từ, bản dài đầy đủ: mô tả công việc, yêu cầu, quyền lợi, cách ứng tuyển, 3–5 hashtag' },
  x: { label: 'X / Twitter', rule: 'dưới 280 ký tự, súc tích, 1–2 hashtag, không xuống dòng quá 2 lần' }
};

const STYLE: Record<string, string> = {
  professional: 'Chuyên nghiệp, chỉn chu, câu văn rõ ràng',
  youthful: 'Trẻ trung, năng động, gần gũi với ứng viên công nghệ',
  concise: 'Ngắn gọn, đi thẳng vào trọng tâm'
};

function jobSummary(job: any) {
  const salary = job.salary_visible === false
    ? 'Thương lượng'
    : (job.salary_min || job.salary_max ? `${job.salary_min || '?'}–${job.salary_max || '?'} triệu VND` : 'Thương lượng');
  return [
    `Vị trí: ${job.title}`,
    `Công ty: ${job.company || 'Nexora Technology'}`,
    `Địa điểm: ${job.location || 'Không nêu'}`,
    `Hình thức: ${job.work_type || 'onsite'} · ${job.employment_type || 'full-time'}`,
    `Lương: ${salary}`,
    `Kỹ năng: ${(job.skills || []).join(', ') || 'Không nêu'}`,
    `Mô tả: ${String(job.description || '').slice(0, 700)}`,
    `Yêu cầu: ${String(job.requirements || '').slice(0, 700)}`,
    `Quyền lợi: ${String(job.benefits || '').slice(0, 400)}`
  ].join('\n');
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được tạo bài truyền thông' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const jobId = String(body?.job_id || '').trim();
    if (!jobId) return Response.json({ error: 'Thiếu việc làm' }, { status: 400 });

    const job = await base44.asServiceRole.entities.Job.get(jobId).catch(() => null);
    if (!job) return Response.json({ error: 'Không tìm thấy việc làm' }, { status: 404 });

    const platformKey = PLATFORM[body?.platform] ? body.platform : 'linkedin';
    const platform = PLATFORM[platformKey];
    const style = STYLE[body?.style] ? body.style : 'professional';
    const only = ['image', 'content'].includes(body?.only) ? body.only : 'both';
    const origin = req.headers.get('origin') || 'https://nexcareerhubbyxme.base44.app';
    const jobUrl = `${origin.replace(/\/$/, '')}/viec-lam/${job.id}`;

    let title = String(body?.existing_title || '');
    let content = String(body?.existing_content || '');
    let imageUrl = String(body?.existing_image || '');
    let imagePrompt = '';

    if (only !== 'image') {
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: AI_MODEL,
        prompt: `Bạn là chuyên viên truyền thông tuyển dụng của Nexora Technology. Viết bài đăng tuyển dụng cho nền tảng ${platform.label}.

Thông tin việc làm (chỉ dùng dữ liệu này, KHÔNG bịa thêm số liệu lương hay quyền lợi ngoài dữ liệu):
${jobSummary(job)}

Yêu cầu:
- Phong cách: ${style}.
- Độ dài & định dạng: ${platform.rule}.
- content phải có: tiêu đề hấp dẫn ở dòng đầu, 3–5 gạch đầu dòng nổi bật (lương, địa điểm, kỹ năng chính), lời kêu gọi ứng tuyển kèm link ${jobUrl}, hashtag phù hợp.
- image_prompt: mô tả MỘT bức ảnh minh họa bám sát đúng nghề của vị trí "${job.title}" (bối cảnh làm việc thật của nghề đó, thiết bị, không gian, ánh sáng), phong cách hiện đại, bố cục vuông 1:1, KHÔNG có chữ trong ảnh, không logo thương hiệu. Viết bằng tiếng Anh, 2–3 câu.
Chỉ trả JSON hợp lệ.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            image_prompt: { type: 'string' }
          }
        }
      });
      title = String(llm?.title || title || `Tuyển dụng: ${job.title}`).slice(0, 200);
      content = String(llm?.content || content).trim();
      imagePrompt = String(llm?.image_prompt || '').trim();
      if (!content) return Response.json({ error: 'AI chưa tạo được nội dung, vui lòng thử lại' }, { status: 502 });
    }

    if (only !== 'content') {
      const prompt = imagePrompt || `Modern editorial photograph illustrating the daily work of a ${job.title} at a technology company in Vietnam: real workspace, relevant tools and equipment, natural lighting, shallow depth of field, professional and welcoming mood, square 1:1 composition, no text, no logos.`;
      try {
        const img = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        if (img?.url) imageUrl = img.url;
      } catch (e: any) {
        if (only === 'image') throw e;
      }
    }

    return Response.json({ title, content, image_url: imageUrl, job_url: jobUrl, platform: platformKey });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}