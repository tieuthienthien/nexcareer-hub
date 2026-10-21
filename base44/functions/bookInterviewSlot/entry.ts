import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildEmail, appOrigin } from "../../shared/stageEmails.ts";
import { canAccessApplication } from "../../shared/applicationAccess.ts";

const TZ_OFFSET = '+07:00';

function slotIso(date: string, time: string): string {
  return `${date}T${String(time || '09:00').slice(0, 5)}:00${TZ_OFFSET}`;
}

function slotText(date: string, time: string, duration: number): string {
  try {
    const d = new Date(slotIso(date, time));
    const label = d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
    return `${label} lúc ${String(time).slice(0, 5)} (${duration} phút)`;
  } catch {
    return `${date} ${time}`;
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const applicationId = body?.application_id;
    const action = body?.action || 'list';
    if (!applicationId) return Response.json({ error: 'Thiếu application_id' }, { status: 400 });

    const app = await base44.asServiceRole.entities.Application.get(applicationId);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    if (!canAccessApplication(app, user, true)) return Response.json({ error: 'Không có quyền' }, { status: 403 });

    const canSchedule = ['test_passed', 'interview_invited', 'scheduled'].includes(app.status);
    if (!canSchedule) {
      return Response.json({ error: 'Chỉ ứng viên đã đậu vòng 2 mới được chọn lịch phỏng vấn' }, { status: 403 });
    }

    const bookings = await base44.asServiceRole.entities.InterviewBooking.filter(
      { application_id: applicationId },
      { sort: '-created_date', limit: 5 }
    ).catch(() => ({ items: [] }));
    const activeBooking = (bookings.items || []).find((b: any) => b.status === 'booked') || null;

    if (action === 'list') {
      const today = new Date().toISOString().slice(0, 10);
      const slotRes = await base44.asServiceRole.entities.InterviewSlot.filter(
        { job_id: app.job_id, status: 'open' },
        { sort: 'date', limit: 200 }
      );
      const slots = (slotRes.items || [])
        .filter((s: any) => String(s.date) >= today)
        .map((s: any) => ({
          id: s.id,
          date: s.date,
          start_time: s.start_time,
          duration_min: s.duration_min || 45,
          mode: s.mode || 'online',
          location: s.mode === 'onsite' ? s.location || '' : '',
          interviewer_name: s.interviewer_name || '',
          max_candidates: s.max_candidates || 1,
          booked_count: s.booked_count || 0,
          available: (s.max_candidates || 1) - (s.booked_count || 0)
        }));

      const rescheduleAllowed = activeBooking
        ? activeBooking.rescheduled_count < 1 && new Date(activeBooking.date + 'T' + activeBooking.start_time + ':00' + TZ_OFFSET).getTime() - Date.now() >= 24 * 3600 * 1000
        : false;

      return Response.json({
        ok: true,
        booking: activeBooking,
        slots,
        can_reschedule: rescheduleAllowed,
        rescheduled_count: activeBooking?.rescheduled_count || 0
      });
    }

    const slotId = body?.slot_id;
    if (!slotId) return Response.json({ error: 'Thiếu khung giờ' }, { status: 400 });
    const slot = await base44.asServiceRole.entities.InterviewSlot.get(slotId);
    if (!slot) return Response.json({ error: 'Không tìm thấy khung giờ' }, { status: 404 });
    if (slot.status !== 'open') return Response.json({ error: 'Khung giờ này đã đóng' }, { status: 400 });
    if ((slot.booked_count || 0) >= (slot.max_candidates || 1)) {
      return Response.json({ error: 'Khung giờ này đã đủ chỗ. Vui lòng chọn khung khác.' }, { status: 409 });
    }

    let rescheduled = 0;

    if (action === 'reschedule') {
      if (!activeBooking) return Response.json({ error: 'Bạn chưa có lịch để đổi' }, { status: 400 });
      if (activeBooking.rescheduled_count >= 1) {
        return Response.json({ error: 'Bạn đã dùng lượt đổi lịch. Vui lòng liên hệ HR.' }, { status: 400 });
      }
      const currentStart = new Date(activeBooking.date + 'T' + activeBooking.start_time + ':00' + TZ_OFFSET).getTime();
      if (currentStart - Date.now() < 24 * 3600 * 1000) {
        return Response.json({ error: 'Chỉ được đổi lịch trước giờ phỏng vấn ít nhất 24 giờ. Vui lòng liên hệ HR.' }, { status: 400 });
      }
      rescheduled = activeBooking.rescheduled_count + 1;

      // Trả lại chỗ cho khung cũ
      const oldSlot = await base44.asServiceRole.entities.InterviewSlot.get(activeBooking.slot_id).catch(() => null);
      if (oldSlot) {
        await base44.asServiceRole.entities.InterviewSlot.update(oldSlot.id, {
          booked_count: Math.max(0, (oldSlot.booked_count || 1) - 1)
        });
      }
    } else if (activeBooking) {
      return Response.json({ error: 'Bạn đã đặt lịch rồi. Dùng chức năng đổi lịch nếu cần.' }, { status: 400 });
    }

    // Giữ chỗ: tăng số người đã đặt rồi kiểm tra lại để tránh 2 người đặt cùng lúc
    const newCount = (slot.booked_count || 0) + 1;
    await base44.asServiceRole.entities.InterviewSlot.update(slot.id, { booked_count: newCount });
    const slotAfter = await base44.asServiceRole.entities.InterviewSlot.get(slot.id);
    if ((slotAfter.booked_count || 0) > (slotAfter.max_candidates || 1)) {
      await base44.asServiceRole.entities.InterviewSlot.update(slot.id, { booked_count: (slotAfter.booked_count || 1) - 1 });
      return Response.json({ error: 'Khung giờ vừa được người khác đặt. Vui lòng chọn khung khác.' }, { status: 409 });
    }

    const interviewAt = slotIso(slot.date, slot.start_time);
    const bookingData: any = {
      application_id: applicationId,
      slot_id: slot.id,
      job_id: app.job_id,
      job_title: app.job_title,
      candidate_id: app.created_by_id || user.id,
      candidate_name: app.full_name,
      candidate_email: app.email,
      interviewer_name: slot.interviewer_name || '',
      interviewer_email: slot.interviewer_email || '',
      mode: slot.mode || 'online',
      location: slot.location || '',
      meeting_link: slot.meeting_link || '',
      date: slot.date,
      start_time: slot.start_time,
      duration_min: slot.duration_min || 45,
      status: 'booked',
      rescheduled_count: rescheduled,
      reminder_24_sent: false,
      reminder_1_sent: false
    };

    let booking;
    if (action === 'reschedule' && activeBooking) {
      booking = await base44.asServiceRole.entities.InterviewBooking.update(activeBooking.id, bookingData);
    } else {
      booking = await base44.asServiceRole.entities.InterviewBooking.create(bookingData);
    }

    await base44.asServiceRole.entities.Application.update(applicationId, {
      status: 'scheduled',
      interview_booking_id: booking.id,
      interview_at: interviewAt
    });

    const origin = appOrigin(req);
    const place = (slot.mode || 'online') === 'onsite' ? slot.location : slot.meeting_link;
    const ctx = {
      candidateName: app.full_name,
      jobTitle: app.job_title,
      company: app.company,
      slotText: slotText(slot.date, slot.start_time, slot.duration_min || 45),
      interviewerName: slot.interviewer_name || '',
      mode: slot.mode || 'online',
      place: place || '',
      origin
    };

    try {
      const candidateMail = buildEmail('interview_booked', ctx);
      await base44.asServiceRole.integrations.Core.SendEmail({ to: app.email, subject: candidateMail.subject, html: candidateMail.html });
    } catch (e) {}
    if (slot.interviewer_email) {
      try {
        const interviewerMail = buildEmail('interview_booked', { ...ctx, candidateName: slot.interviewer_name || 'Anh/Chị' });
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: slot.interviewer_email,
          subject: `Lịch phỏng vấn: ${app.full_name} — ${app.job_title}`,
          html: interviewerMail.html
        });
      } catch (e) {}
    }

    return Response.json({ ok: true, booking, interview_at: interviewAt, rescheduled: rescheduled > 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}