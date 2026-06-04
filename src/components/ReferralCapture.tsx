import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY = "ysp_referral_by";

export function captureReferral(code: string) {
  try { localStorage.setItem(STORAGE_KEY, code); } catch {}
}

export function consumeReferral(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    return v;
  } catch { return null; }
}

/** Reads ?ref= from the URL and persists it in localStorage. Mount once inside BrowserRouter. */
export function ReferralCapture() {
  const [params] = useSearchParams();
  useEffect(() => {
    const ref = params.get("ref");
    if (ref && ref.length > 8) captureReferral(ref);
  }, [params]);
  return null;
}
