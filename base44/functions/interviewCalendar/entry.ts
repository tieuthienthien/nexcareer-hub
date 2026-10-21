import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CONNECTOR_ID = "6ad8a9f25d7949301dc25629";
const TZ = "Asia/Ho_Chi_Minh";
const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function slotRange(date: string, time: string, durationMin: number) {
  const t = String(time || "09:00").slice(0, 5);
  const [h, m] = t.split(":").map((v) => Number(v) || 0);
  const total = h * 60 + m + (durationMin || 45);
  const endTime = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  return {
    start: { dateTime: `${date}T${t}:00`, timeZone: TZ },
    end: { dateTime: `${date}T${endTime}:00`, timeZone: TZ }
  };
}

function eventBody(booking: any) {
  const onsite = (booking.mode || 'online') === 'onsite';
  const place = onsite ? booking.location || 'Văn phòng' : booking.meeting_link || '';
  const body: any = {
    summary: `Phỏng vấn: ${booking.candidate_name} — ${booking.job_title}`,
    description: [
      `Vị trí: ${booking.job_title}`,
      `Ứng viên: ${booking.candidate_name}${booking.candidate_email ? ` (${booking.candidate_email})` : ''}`,
      `Người phỏng vấn: ${booking.interviewer_name || 'HR'}`,
      onsite ? `Địa điểm: ${place}` : 'Hình thức: Phỏng vấn online',
      'Lịch được tạo tự động từ NexCareer Hub.'
    ].join('\n'),
    ...slotRange(booking.date, booking.start_time, booking.duration_min),
    attendees: [booking.candidate_email, booking.interviewer_email]
      .filter(Boolean)
      .map((email: string) => ({ email })),
    reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 24 * 60 }, { method: 'popup', minutes: 60 }] }
  };
  if (place) body.location = place;
  if (!onsite && !booking.meeting_link) {
    body.conferenceData = {
      createRequest: {
        requestId: `nexcareer-${booking.id}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    };
  }
  return body;
}

async function assignedBookings(base44: any, user: any) {
  const email = String(user.email || '').toLowerCase();
  if (!email) return [];
  const res = await base44.asServiceRole.entities.InterviewBooking.filter(
    { status: 'booked' },
    { sort: 'date', limit: 100 }
  );
  const today = new Date().toISOString().slice(0, 10);
  return (res.items || []).filter(
    (b: any) =>
      String(b.interviewer_email || '').toLowerCase() === email &&
      String(b.date || '') >= today &&
      (!b.google_event_id || (b.calendar_synced_at && b.updated_date && b.updated_date > b.calendar_synced_at))
  );
}

async function statusPayload(base44: any, user: any, accessToken: string, extra: any = {}) {
  const pendingList = await assignedBookings(base44, user);
  let events: any[] = [];
  let apiOk = true;
  const now = new Date().toISOString();
  const res = await fetch(
    `${EVENTS_URL}?timeMin=${now}&maxResults=10&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (res.status === 401 || res.status === 403) {
    apiOk = false;
  } else if (res.ok) {
    const data = await res.json();
    events = (data.items || []).map((e: any) => ({
      id: e.id,
      summary: e.summary || '(Không tiêu đề)',
      start: e.start?.dateTime || e.start?.date || '',
      link: e.htmlLink || ''
    }));
  }
  return {
    connected: apiOk,
    my_email: user.email || '',
    pending: pendingList.length,
    events,
    ...extra
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được dùng Google Calendar' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'status';

    let accessToken = '';
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn?.accessToken || '';
    } catch (e) {
      accessToken = '';
    }
    if (!accessToken) {
      return Response.json({ connected: false, my_email: user.email || '', pending: 0, events: [] });
    }

    if (action === 'remove') {
      const bookingId = body?.booking_id;
      if (!bookingId) return Response.json({ error: 'Thiếu booking_id' }, { status: 400 });
      const booking = await base44.asServiceRole.entities.InterviewBooking.get(bookingId);
      if (booking?.google_event_id) {
        await fetch(`${EVENTS_URL}/${booking.google_event_id}?sendUpdates=all`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        }).catch(() => null);
      }
      await base44.asServiceRole.entities.InterviewBooking.update(bookingId, {
        google_event_id: '',
        google_event_link: '',
        calendar_synced_at: ''
      });
      return Response.json(await statusPayload(base44, user, accessToken, { synced: 0 }));
    }

    if (action === 'sync') {
      const bookingId = body?.booking_id;
      const pendingList = await assignedBookings(base44, user);
      const list = bookingId ? pendingList.filter((b: any) => b.id === bookingId) : pendingList;
      if (bookingId && list.length === 0) {
        const one = await base44.asServiceRole.entities.InterviewBooking.get(bookingId).catch(() => null);
        const reason = !one
          ? 'Không tìm thấy lịch phỏng vấn'
          : one.google_event_id
            ? 'Lịch này đã được gửi lời mời trên Google Calendar'
            : 'Lịch này do HR khác phụ trách — người phỏng vấn không phải bạn';
        return Response.json(await statusPayload(base44, user, accessToken, { synced: 0, failures: [reason] }));
      }
      let synced = 0;
      const failures: string[] = [];
      for (const booking of list.slice(0, 20)) {
        const payload = eventBody(booking);
        try {
          const isUpdate = !!booking.google_event_id;
          const url = isUpdate
            ? `${EVENTS_URL}/${booking.google_event_id}?sendUpdates=all&conferenceDataVersion=1`
            : `${EVENTS_URL}?sendUpdates=all&conferenceDataVersion=1`;
          const res = await fetch(url, {
            method: isUpdate ? 'PATCH' : 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            failures.push(`${booking.candidate_name}: ${res.status}`);
            continue;
          }
          const data = await res.json();
          await base44.asServiceRole.entities.InterviewBooking.update(booking.id, {
            google_event_id: data.id || booking.google_event_id || '',
            google_event_link: data.htmlLink || '',
            meeting_link: data.hangoutLink || booking.meeting_link || '',
            calendar_synced_at: new Date().toISOString()
          });
          synced += 1;
        } catch (e) {
          failures.push(`${booking.candidate_name}: ${e.message}`);
        }
      }
      return Response.json(
        await statusPayload(base44, user, accessToken, { synced, failures })
      );
    }

    return Response.json(await statusPayload(base44, user, accessToken));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}