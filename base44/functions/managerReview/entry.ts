import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

function sameEmail(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function slotLabel(app: any): string {
  if (app?.interview_slot) return app.interview_slot;
  if (!app?.interview_at) return '';
  const d = new Date(app.interview_at);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');
    const applicationId = String(body?.application_id || '');
    if (!applicationId) return Response.json({ error: 'Thiếu application_id' }, { status: 400 });

    const app = await base44.asServiceRole.entities.Application.get(applicationId).catch(() => null);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    const isAssignedManager = sameEmail(app.assigned_manager_email, user.email);
    if (!isAdmin && !isAssignedManager) {
      return Response.json({ error: 'Bạn chỉ xem được hồ sơ thuộc vị trí mình phụ trách' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const managerName = user.full_name || user.email || 'Line Manager';

    if (action === 'open') {
      if (!isAssignedManager) return Response.json({ ok: true, skipped: true });
      if (app.manager_opened_at) return Response.json({ ok: true, application: app });
      const updated = await base44.asServiceRole.entities.Application.update(applicationId, {
        manager_opened_at: now,
        step3_done: true,
        step3_at: now
      });
      return Response.json({ ok: true, application: updated });
    }

    if (action === 'accept_schedule') {
      const updated = await base44.asServiceRole.entities.Application.update(applicationId, {
        interview_confirmed: true,
        interview_slot: slotLabel(app),
        step3_done: true,
        step3_at: app.step3_at || now,
        step4_done: true,
        step4_at: now,
        rms_status: 'interviewed'
      });
      return Response.json({ ok: true, application: updated });
    }

    if (action === 'propose_reschedule') {
      const note = String(body?.note || '').trim();
      if (!note) return Response.json({ error: 'Vui lòng nhập khung giờ mong muốn' }, { status: 400 });
      await base44.asServiceRole.entities.Application.update(applicationId, {
        manager_note: `${app.manager_note ? `${app.manager_note}\n` : ''}[${new Date(now).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}] ${note}`,
        step3_done: true,
        step3_at: app.step3_at || now
      });
      await base44.asServiceRole.entities.Notification.create({
        message: `🔁 ${managerName} đề xuất đổi lịch phỏng vấn ứng viên ${app.full_name || ''} (${app.job_title || ''}): ${note}`,
        type: 'reschedule_request',
        application_id: applicationId,
        candidate_name: app.full_name || '',
        job_title: app.job_title || '',
        manager_name: managerName,
        is_read: false,
        action_done: false,
        created_at: now
      });
      return Response.json({ ok: true });
    }

    if (action === 'save_evaluation') {
      const updated = await base44.asServiceRole.entities.Application.update(applicationId, {
        manager_note: String(body?.manager_note ?? app.manager_note ?? ''),
        manager_evaluation: String(body?.manager_evaluation ?? app.manager_evaluation ?? '')
      });
      return Response.json({ ok: true, application: updated });
    }

    if (action === 'decide') {
      const decision = body?.decision === 'pass' ? 'pass' : body?.decision === 'fail' ? 'fail' : '';
      if (!decision) return Response.json({ error: 'Quyết định không hợp lệ' }, { status: 400 });

      const updated = await base44.asServiceRole.entities.Application.update(applicationId, {
        manager_decision: decision,
        decision_at: now,
        manager_evaluation: String(body?.manager_evaluation ?? app.manager_evaluation ?? ''),
        step3_done: true,
        step3_at: app.step3_at || now,
        step5_done: true,
        step5_at: now,
        rms_status: decision === 'pass' ? 'pass' : 'fail',
        final_result: decision === 'pass' ? 'hired' : 'rejected'
      });

      const message = decision === 'pass'
        ? `🤖 HR Chatbot Alert: Line Manager ${managerName} vừa duyệt ứng viên ${app.full_name || ''} cho vị trí ${app.job_title || ''}. Bạn có muốn gửi Mail Trúng tuyển (Offer Letter) ngay bây giờ không?`
        : `🤖 HR Chatbot Alert: Line Manager ${managerName} đã từ chối ứng viên ${app.full_name || ''} cho vị trí ${app.job_title || ''}. Bạn có muốn gửi email cảm ơn/từ chối không?`;

      await base44.asServiceRole.entities.Notification.create({
        message,
        type: decision === 'pass' ? 'offer_ready' : 'rejection_ready',
        application_id: applicationId,
        candidate_name: app.full_name || '',
        job_title: app.job_title || '',
        manager_name: managerName,
        decision,
        is_read: false,
        action_done: false,
        created_at: now
      });

      return Response.json({ ok: true, application: updated });
    }

    return Response.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}