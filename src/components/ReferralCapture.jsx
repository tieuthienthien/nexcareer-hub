import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const KEY = "nexora_referral_code";

export default function ReferralCapture() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem(KEY, ref);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const ref = localStorage.getItem(KEY);
    if (!ref) return;
    localStorage.removeItem(KEY);
    base44.functions
      .invoke("claimReferral", { code: ref })
      .then((res) => {
        const data = res.data || res;
        if (!data?.credited) localStorage.removeItem(KEY);
      })
      .catch(() => localStorage.setItem(KEY, ref));
  }, [isAuthenticated, user?.id]);

  return null;
}