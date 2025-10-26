// Centralized commissions configuration and helpers
// Allows controlling platform commission from a single place.
// Client-safe: reads NEXT_PUBLIC_PLATFORM_PERCENT (e.g., 0.17 for 17%).

function readPlatformPercent() {
  // Env is inlined by Next.js at build time on the client when using NEXT_PUBLIC_
  const raw = process.env.NEXT_PUBLIC_PLATFORM_PERCENT;
  const n = raw != null ? Number(raw) : NaN;
  if (!isFinite(n) || n < 0) return 0.17; // default 17%
  return n;
}

export function getPlatformPercent() {
  return readPlatformPercent();
}

export function getFeeMultiplier() {
  return 1 + readPlatformPercent();
}

export function computeFeeTotal(baseAmount) {
  const pct = readPlatformPercent();
  const amt = Number(baseAmount || 0);
  return amt * pct;
}

export function computePricingFromBaseNight(baseNight, nights) {
  const nightsNum = Math.max(0, Number(nights || 0));
  const base = Math.max(0, Number(baseNight || 0));
  const baseTotal = nightsNum * base;
  const feeTotal = computeFeeTotal(baseTotal);
  const basePlusFeesTotal = baseTotal + feeTotal;
  return { baseTotal, feeTotal, basePlusFeesTotal };
}

// Optional: format helper (keep UI files in control of actual formatting)
export function percentLabel() {
  return `${Math.round(readPlatformPercent() * 100)}%`;
}
