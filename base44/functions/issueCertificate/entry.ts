import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { computeFinalScore, latestByLesson, PASS_SCORE } from '../../shared/courseProgress.ts';

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });

    const courseId = String(body.course_id || '').trim();
    if (!courseId) return Response.json({ error: 'Thiếu thông tin khóa học.' }, { status: 400 });

    const enrollmentPage = await base44.asServiceRole.entities.Enrollment.filter(
      { user_id: user.id, course_id: courseId },
      { limit: 1 }
    );
    const enrollment = enrollmentPage?.items?.[0];
    if (!enrollment) return Response.json({ error: 'Bạn chưa tham gia khóa học này.' }, { status: 403 });

    const existing = await base44.asServiceRole.entities.Certificate.filter(
      { user_id: user.id, course_id: courseId },
      { limit: 1 }
    );
    if (existing?.items?.length) {
      return Response.json({ certificate: existing.items[0], score: existing.items[0].score, created: false });
    }

    const course = await base44.asServiceRole.entities.Course.get(courseId);
    const lessonsPage = await base44.asServiceRole.entities.Lesson.filter(
      { course_id: courseId },
      { limit: 200 }
    );
    const quizLessons = (lessonsPage?.items || []).filter((item) => item.type === 'quiz');
    if (!quizLessons.length) {
      return Response.json({ error: 'Khóa học chưa có bài kiểm tra để cấp chứng chỉ.' }, { status: 400 });
    }

    const attemptsPage = await base44.asServiceRole.entities.QuizAttempt.filter(
      { user_id: user.id, course_id: courseId },
      { sort: '-created_date', limit: 300 }
    );
    const latest = latestByLesson(attemptsPage?.items || []);
    const missing = quizLessons.filter((item) => !latest.has(item.id));
    if (missing.length) {
      return Response.json(
        { error: 'Bạn cần hoàn thành tất cả bài kiểm tra cuối chương trước khi nhận chứng chỉ.', missing: missing.length },
        { status: 400 }
      );
    }

    const score = computeFinalScore(quizLessons, latest);
    if (score < PASS_SCORE) {
      return Response.json(
        { error: `Điểm cuối khóa ${score}/100 chưa đạt 80. Hãy làm lại bài để cải thiện điểm.`, score },
        { status: 403 }
      );
    }

    const code = `NX-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const certificate = await base44.asServiceRole.entities.Certificate.create({
      user_id: user.id,
      user_name: user.full_name || enrollment.user_name || user.email,
      course_id: courseId,
      course_title: course?.title || enrollment.course_title || 'Khóa học',
      score,
      code,
      issued_at: new Date().toISOString()
    });

    await base44.asServiceRole.entities.Enrollment.update(enrollment.id, {
      certificate_code: code,
      final_score: score,
      last_activity_at: new Date().toISOString()
    });

    return Response.json({ certificate, score, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}