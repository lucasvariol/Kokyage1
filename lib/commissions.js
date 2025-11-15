// Centralized commissions configuration and helpers
// Allows controlling platform commission from a single place.
// Client-safe: reads NEXT_PUBLIC_PLATFORM_PERCENT (e.g., 0.17 for 17%).

// ========================================
// CONSTANTES DE COMMISSION
// ========================================

// Commission sur voyageur (frais de plateforme)
const GUEST_COMMISSION = 0.17; // 17%

// Commission sur hôtes (prélevée sur le prix de base)
const HOST_COMMISSION = 0.03; // 3%

// Répartition entre propriétaire et locataire principal (sur les 97% restants)
const PROPRIETOR_SHARE = 0.40; // 40%
const MAIN_TENANT_SHARE = 0.60; // 60%

// ========================================
// FONCTIONS PUBLIQUES
// ========================================

function readPlatformPercent() {
  // Env is inlined by Next.js at build time on the client when using NEXT_PUBLIC_
  const raw = process.env.NEXT_PUBLIC_PLATFORM_PERCENT;
  const n = raw != null ? Number(raw) : NaN;
  if (!isFinite(n) || n < 0) return GUEST_COMMISSION; // default 17%
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

// ========================================
// FONCTIONS POUR LES CALCULS DE PARTS HÔTES
// ========================================

export function getHostCommission() {
  return HOST_COMMISSION;
}

export function getProprietorShare() {
  return PROPRIETOR_SHARE;
}

export function getMainTenantShare() {
  return MAIN_TENANT_SHARE;
}

// Calculer les parts pour une réservation
export function calculateShares(hebergementTotal, fraisPlateforme) {
  const platform_share = fraisPlateforme + (hebergementTotal * HOST_COMMISSION);
  const afterHostCommission = hebergementTotal * (1 - HOST_COMMISSION); // 97%
  const main_tenant_share = afterHostCommission * MAIN_TENANT_SHARE;
  const proprietor_share = afterHostCommission * PROPRIETOR_SHARE;
  
  return {
    platform_share,
    main_tenant_share,
    proprietor_share
  };
}
