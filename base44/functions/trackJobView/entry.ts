import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Cộng 1 lượt xem cho tin tuyển dụng. Chạy bằng quyền service vì ứng viên/khách không có quyền sửa Job.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const jobId = String(body?.job_id || "").trim();
    if (!jobId) return Response.json({ error: "Thiếu job_id." }, { status: 400 });

    const job = await base44.asServiceRole.entities.Job.get(jobId);
    if (!job || job.status !== "published") {
      return Response.json({ error: "Không tìm thấy tin tuyển dụng." }, { status: 404 });
    }

    const views = (Number(job.views) || 0) + 1;
    await base44.asServiceRole.entities.Job.update(jobId, { views });
    return Response.json({ views });
  } catch (e) {
    return Response.json({ error: e?.message || "Không ghi nhận được lượt xem." }, { status: 500 });
  }
}
