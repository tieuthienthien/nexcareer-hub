import { base44 } from "@/api/base44Client";

export const FREE_COURSES = 1;
export const PASS_SCORE = 80;

export function derivedReferralCode(userId) {
  return `NX-${String(userId || "").replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;
}

export function buildReferralLink(userId) {
  return `${window.location.origin}/?ref=${encodeURIComponent(userId || "")}`;
}

export async function loadLearningState(userId) {
  if (!userId) return { enrolled: [], invited: 0, quota: FREE_COURSES, remaining: FREE_COURSES };
  const [enrollmentRes, referralRes] = await Promise.all([
    base44.entities.Enrollment.filter({ user_id: userId }, { limit: 100 }),
    base44.entities.Referral.filter({ inviter_id: userId, status: "credited" }, { limit: 200 }),
  ]);
  const enrolled = enrollmentRes.items || [];
  const invited = (referralRes.items || []).length;
  const quota = FREE_COURSES + invited;
  return { enrolled, invited, quota, remaining: Math.max(0, quota - enrolled.length) };
}

export function groupChapters(lessons) {
  const map = new Map();
  for (const lesson of lessons || []) {
    const index = Number(lesson.chapter_index) || 1;
    if (!map.has(index)) map.set(index, { index, title: lesson.chapter_title || `Chương ${index}`, lessons: [] });
    map.get(index).lessons.push(lesson);
  }
  return [...map.values()].sort((a, b) => a.index - b.index);
}