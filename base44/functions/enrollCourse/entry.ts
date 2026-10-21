import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { quotaFor } from '../../shared/courseProgress.ts';

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Bạn cần đăng nhập để học khóa học.' }, { status: 401 });

    const courseId = String(body.course_id || '').trim();
    if (!courseId) return Response.json({ error: 'Thiếu thông tin khóa học.' }, { status: 400 });

    const course = await base44.asServiceRole.entities.Course.get(courseId);
    if (!course || course.published === false) {
      return Response.json({ error: 'Khóa học không khả dụng.' }, { status: 404 });
    }

    const mine = await base44.asServiceRole.entities.Enrollment.filter(
      { user_id: user.id, course_id: courseId },
      { limit: 1 }
    );
    if (mine?.items?.length) {
      return Response.json({ enrollment: mine.items[0], created: false });
    }

    const [enrollmentRes, referralRes] = await Promise.allSettled([
      base44.asServiceRole.entities.Enrollment.filter({ user_id: user.id }, { limit: 200 }),
      base44.asServiceRole.entities.Referral.filter({ inviter_id: user.id, status: 'credited' }, { limit: 200 })
    ]);

    const used = enrollmentRes.status === 'fulfilled' ? (enrollmentRes.value?.items?.length || 0) : 0;
    const invited = referralRes.status === 'fulfilled' ? (referralRes.value?.items?.length || 0) : 0;
    const quota = quotaFor(invited);

    if (used >= quota) {
      return Response.json(
        {
          error: 'Bạn đã dùng hết số khóa được mở. Hãy mời bạn bè để mở thêm khóa học.',
          quota,
          used,
          invited
        },
        { status: 403 }
      );
    }

    const enrollment = await base44.asServiceRole.entities.Enrollment.create({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name || user.email,
      course_id: courseId,
      course_title: course.title,
      unlocked_via: used === 0 ? 'free' : 'referral',
      completed_lesson_ids: [],
      chapter_scores: [],
      final_score: 0,
      quiz_attempts: 0,
      last_activity_at: new Date().toISOString()
    });

    return Response.json({ enrollment, created: true, quota, used: used + 1, invited });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}