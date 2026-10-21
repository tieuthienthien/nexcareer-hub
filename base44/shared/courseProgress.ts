export const PASS_SCORE = 80;
export const FREE_QUOTA = 1;

export function latestByLesson(attempts) {
  const map = new Map();
  for (const attempt of attempts || []) {
    const current = map.get(attempt.lesson_id);
    const at = new Date(attempt.created_date || 0).getTime();
    const currentAt = current ? new Date(current.created_date || 0).getTime() : -1;
    if (at >= currentAt) map.set(attempt.lesson_id, attempt);
  }
  return map;
}

export function computeFinalScore(quizLessons, latest) {
  if (!quizLessons.length) return 0;
  const total = quizLessons.reduce((sum, lesson) => sum + (Number(latest.get(lesson.id)?.percent) || 0), 0);
  return Math.round((total / quizLessons.length) * 10) / 10;
}

export function quotaFor(invitedCount) {
  return FREE_QUOTA + (Number(invitedCount) || 0);
}

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[.,;:!?()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function keywordPoints(answer, keywords, maxPoints) {
  const text = normalizeText(answer);
  if (!text) return 0;
  const list = (keywords || []).filter(Boolean);
  if (!list.length) return 0;
  const hits = list.filter((keyword) => text.includes(normalizeText(keyword))).length;
  if (!hits) return 0;
  const ratio = Math.min(1, hits / Math.ceil(list.length * 0.6));
  return Math.round(ratio * maxPoints * 2) / 2;
}