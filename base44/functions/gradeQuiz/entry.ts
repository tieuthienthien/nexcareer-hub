import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  computeFinalScore,
  keywordPoints,
  latestByLesson,
  normalizeText
} from '../../shared/courseProgress.ts';

const rubric = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question_id: { type: 'string' },
          points_awarded: { type: 'number' },
          feedback: { type: 'string' }
        },
        required: ['question_id', 'points_awarded', 'feedback']
      }
    }
  },
  required: ['results']
};

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Bạn cần đăng nhập để làm bài.' }, { status: 401 });

    const lessonId = String(body.lesson_id || '').trim();
    const submitted = Array.isArray(body.answers) ? body.answers : [];
    if (!lessonId) return Response.json({ error: 'Thiếu thông tin bài làm.' }, { status: 400 });

    const lesson = await base44.asServiceRole.entities.Lesson.get(lessonId);
    if (!lesson || lesson.type !== 'quiz') {
      return Response.json({ error: 'Không tìm thấy bài kiểm tra.' }, { status: 404 });
    }

    const enrollmentPage = await base44.asServiceRole.entities.Enrollment.filter(
      { user_id: user.id, course_id: lesson.course_id },
      { limit: 1 }
    );
    const enrollment = enrollmentPage?.items?.[0];
    if (!enrollment) {
      return Response.json({ error: 'Bạn cần bắt đầu khóa học trước khi làm bài.' }, { status: 403 });
    }

    const questions = Array.isArray(lesson.questions) ? lesson.questions : [];
    const results = [];
    const shortItems = [];

    for (const question of questions) {
      const given = String(
        submitted.find((item) => String(item?.question_id) === String(question.id))?.answer ?? ''
      ).trim();
      const maxPoints = Number(question.points) || (question.type === 'mcq' ? 1 : 2);

      if (question.type === 'mcq') {
        const correct = normalizeText(given) === normalizeText(question.answer);
        results.push({
          question_id: question.id,
          type: 'mcq',
          prompt: question.prompt,
          answer: given,
          max_points: maxPoints,
          points_awarded: correct ? maxPoints : 0,
          feedback: correct ? 'Chính xác.' : `Chưa đúng. Đáp án đúng: ${question.answer}`
        });
      } else {
        shortItems.push({ question, given, maxPoints });
      }
    }

    if (shortItems.length) {
      let graded = [];
      try {
        const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: [
            'Bạn là giảng viên chấm bài khóa "Lập trình viên" của NexCareer Hub.',
            'Chấm điểm từng câu trả lời NGẮN của học viên dựa trên đáp án mẫu và các từ khóa chấp nhận được.',
            'Quy tắc:',
            '- Điểm tối đa của mỗi câu là max_points; được phép cho điểm lẻ 0.5.',
            '- Đánh giá mức độ hiểu đúng bản chất, không yêu cầu trùng từ ngữ với đáp án mẫu.',
            '- Câu trả lời trống, lan man hoặc lạc đề được 0 điểm.',
            '- feedback: 1-2 câu tiếng Việt ngắn gọn, chỉ ra điều đúng và điều còn thiếu.',
            '- Trả về đúng JSON theo schema, mỗi câu đúng question_id đã cho.',
            'Dữ liệu cần chấm:',
            JSON.stringify(
              shortItems.map(({ question, given, maxPoints }) => ({
                question_id: question.id,
                question: question.prompt,
                max_points: maxPoints,
                sample_answer: question.answer || '',
                accepted_keywords: question.keywords || [],
                student_answer: given
              }))
            )
          ].join('\n'),
          response_json_schema: rubric
        });
        graded = Array.isArray(ai?.results) ? ai.results : [];
      } catch (error) {
        graded = [];
      }

      for (const { question, given, maxPoints } of shortItems) {
        const match = graded.find((item) => String(item?.question_id) === String(question.id));
        const aiPoints = Number(match?.points_awarded);
        const points = Number.isFinite(aiPoints)
          ? Math.max(0, Math.min(maxPoints, Math.round(aiPoints * 2) / 2))
          : keywordPoints(given, question.keywords, maxPoints);
        results.push({
          question_id: question.id,
          type: 'short',
          prompt: question.prompt,
          answer: given,
          max_points: maxPoints,
          points_awarded: points,
          feedback: match?.feedback || (points >= maxPoints ? 'Đủ ý cốt lõi.' : 'Cần bổ sung ý quan trọng còn thiếu.')
        });
      }
    }

    const ordered = questions.map((question) => results.find((item) => item.question_id === question.id)).filter(Boolean);
    const score = Math.round(ordered.reduce((sum, item) => sum + item.points_awarded, 0) * 10) / 10;
    const maxScore = ordered.reduce((sum, item) => sum + item.max_points, 0);
    const percent = maxScore ? Math.round((score / maxScore) * 1000) / 10 : 0;

    await base44.asServiceRole.entities.QuizAttempt.create({
      user_id: user.id,
      course_id: lesson.course_id,
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      chapter_index: lesson.chapter_index,
      answers: ordered,
      score,
      max_score: maxScore,
      percent,
      ai_feedback: percent >= 80 ? 'Hoàn thành tốt chương này.' : 'Cần ôn lại nội dung chương và làm lại bài.'
    });

    const lessonsPage = await base44.asServiceRole.entities.Lesson.filter(
      { course_id: lesson.course_id },
      { limit: 200 }
    );
    const quizLessons = (lessonsPage?.items || []).filter((item) => item.type === 'quiz');
    const attemptsPage = await base44.asServiceRole.entities.QuizAttempt.filter(
      { user_id: user.id, course_id: lesson.course_id },
      { sort: '-created_date', limit: 300 }
    );
    const latest = latestByLesson(attemptsPage?.items || []);
    const finalScore = computeFinalScore(quizLessons, latest);

    const completed = new Set(enrollment.completed_lesson_ids || []);
    completed.add(lesson.id);
    const chapterScores = (enrollment.chapter_scores || []).filter((item) => item.lesson_id !== lesson.id);
    chapterScores.push({ chapter_index: lesson.chapter_index, lesson_id: lesson.id, percent });

    await base44.asServiceRole.entities.Enrollment.update(enrollment.id, {
      completed_lesson_ids: [...completed],
      chapter_scores: chapterScores,
      quiz_attempts: (Number(enrollment.quiz_attempts) || 0) + 1,
      final_score: finalScore,
      last_activity_at: new Date().toISOString()
    });

    return Response.json({
      score,
      max_score: maxScore,
      percent,
      results: ordered,
      final_score: finalScore,
      quiz_completed: quizLessons.filter((item) => latest.has(item.id)).length,
      quiz_total: quizLessons.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}