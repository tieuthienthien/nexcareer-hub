import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeEmail } from '../../shared/candidateAccount.ts';

function iso(date: string, time: string) {
  return `${String(date).slice(0, 10)}T${String(time || '09:00').slice(0, 5)}:00+07:00`;
}

function origin(req: Request) {
  return (req.headers.get('origin') || 'https://nexcareerhubbyxme.base44.app').replace(/\/$/, '');
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được tạo lịch phỏng vấn' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const applicationId = String(body?.application_id || '').trim();
    const date = String(body?.date || '').slice(0, 10);
    const time = String(body?.start_time || '').slice(0, 5);
    if (!applicationId || !date || !time) return Response.json({ error: 'Thiếu hồ sơ hoặc thời gian phỏng vấn' }, { status: 400 });

    const app = await base44.asServiceRole.entities.Application.get(applicationId).catch(() => null);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    const managerEmail = normalizeEmail(body?.manager_email);
    if (!managerEmail) return Response.json({ error: 'Vui lòng chọn Line Manager phỏng vấn' }, { status: 400 });

    const mode = body?.mode === 'onsite' ? 'onsite' : 'online';
    const duration = Number(body?.duration_min) || 45;
    const interviewAt = iso(date, time);
    const stamp = new Date().toISOString();

    const booking = await base44.asServiceRole.entities.InterviewBooking.create({
      application_id: applicationId,
      slot_id: '',
      job_id: app.job_id || '',
      job_title: app.job_title || '',
      candidate_id: app.created_by_id || '',
      candidate_name: app.full_name || '',
      candidate_email: normalizeEmail(app.email),
      interviewer_name: body?.manager_name || managerEmail,
      interviewer_email: managerEmail,
      mode,
      location: mode === 'onsite' ? String(body?.location || '') : '',
      meeting_link: mode === 'online' ? String(body?.meeting_link || '') : '',
      date,
      start_time: time,
      duration_min: duration,
      status: 'booked',
      rescheduled_count: 0,
      reminder_24_sent: false,
      reminder_1_sent: false
    });

    await base44.asServiceRole.entities.Application.update(applicationId, {
      status: 'scheduled',
      interview_booking_id: booking.id,
      interview_at: interviewAt,
      assigned_manager_email: managerEmail,
      interview_slot: new Date(interviewAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      interview_confirmed: true,
      step3_done: true,
      step3_at: stamp,
      step4_done: true,
      step4_at: stamp
    });

    await base44.asServiceRole.entities.Notification.create({
      message: `HR đã đặt lịch phỏng vấn vòng 3 cho ${app.full_name || 'ứng viên'} — ${app.job_title || ''}`,
      type: 'system',
      application_id: applicationId,
      candidate_name: app.full_name || '',
      job_title: app.job_title || '',
      manager_name: body?.manager_name || managerEmail,
      created_at: stamp
    }).catch(() => null);

    const when = new Date(interviewAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    const place = mode === 'onsite' ? String(body?.location || 'Văn phòng Nexora') : String(body?.meeting_link || 'Link họp sẽ được gửi trước buổi phỏng vấn');
    const note = String(body?.note || '');

    const html = (forManager: boolean) => `<div style="font-family:Arial,Helvetica,sans-serif;background:#fbf7fd;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#564be7;color:#fff;padding:20px 28px;font-weight:700">NexCareer Hub · Phỏng vấn Vòng 3</div>
    <div style="padding:28px;color:#26163c;font-size:15px;line-height:1.6">
      <p>${forManager ? `Chào ${body?.manager_name || 'Anh/Chị'},` : `Chào ${app.full_name || 'bạn'},`}</p>
      <p>${forManager
        ? `Bạn được phân công phỏng vấn ứng viên <strong>${app.full_name}</strong> cho vị trí <strong>${app.job_title}</strong>.`
        : `Buổi phỏng vấn Vòng 3 (Line Manager) của bạn cho vị trí <strong>${app.job_title}</strong> đã được xếp lịch.`}</p>
      <p><strong>Thời gian:</strong> ${when} (${duration} phút)<br>
      <strong>Hình thức:</strong> ${mode === 'onsite' ? 'Tại văn phòng' : 'Online'}<br>
      <strong>Địa điểm/Link:</strong> ${place}</p>
      ${note ? `<p><strong>Ghi chú:</strong> ${note}</p>` : ''}
      <p style="font-size:13px;color:#8b51d6">Xem chi tiết trong HR Studio → Lịch phỏng vấn: <a href="${origin(req)}/hr-studio/schedule">${origin(req)}/hr-studio/schedule</a></p>
    </div>
  </div>
</div>`;

    const failures: string[] = [];
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: normalizeEmail(app.email),
        subject: `Lịch phỏng vấn vòng 3 — ${app.job_title}`,
        html: html(false)
      });
    } catch (e: any) {
      failures.push('ứng viên');
    }
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: managerEmail,
        subject: `Lịch phỏng vấn: ${app.full_name} — ${app.job_title}`,
        html: html(true)
      });
    } catch (e: any) {
      failures.push('Line Manager');
    }

    return Response.json({ ok: true, booking, interview_at: interviewAt, email_failures: failures });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}