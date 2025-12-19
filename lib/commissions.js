// Centralized commissions configuration and helpers
// Allows controlling platform commission from a single place.
// Client-safe: reads NEXT_PUBLIC_COMMISSION_GUEST (e.g., 0.17 for 17%).

// ========================================
// CONSTANTES DE COMMISSION (depuis variables d'environnement)
// ========================================

function getEnvNumber(key, defaultValue) {
  const raw = process.env[key];
  const n = raw != null ? Number(raw) : NaN;
  return isFinite(n) && n >= 0 ? n : defaultValue;
}

// Commission sur voyageur (frais de plateforme) - Default: 17%
const GUEST_COMMISSION = getEnvNumber('COMMISSION_GUEST', 0.17);

// Commission sur hôtes (prélevée sur le prix de base) - Default: 3%
const HOST_COMMISSION = getEnvNumber('COMMISSION_HOST', 0.03);

// Répartition entre propriétaire et locataire principal - Default: 40% / 60%
const PROPRIETOR_SHARE = getEnvNumber('SHARE_PROPRIETOR', 0.40);
const MAIN_TENANT_SHARE = getEnvNumber('SHARE_MAIN_TENANT', 0.60);

// ========================================
// FONCTIONS PUBLIQUES
// ========================================

function readPlatformPercent() {
  // Utiliser COMMISSION_GUEST (variable serveur et client via NEXT_PUBLIC_)
  // Priorité: NEXT_PUBLIC_COMMISSION_GUEST > COMMISSION_GUEST > défaut
  const rawPublic = process.env.NEXT_PUBLIC_COMMISSION_GUEST;
  const rawServer = process.env.COMMISSION_GUEST;
  const raw = rawPublic || rawServer;
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
  const VAT_RATE = Number(process.env.VAT_RATE || 20) / 100; // Taux TVA depuis env (défaut 20%)
  
  // fraisPlateforme est TTC (inclut la TVA) - 17% voyageur
  // commission hôte est aussi TTC - 3% de l'hébergement
  const commissionHoteTTC = hebergementTotal * HOST_COMMISSION;
  
  // Total plateforme TTC = frais voyageur + commission hôte
  const platformTotalTTC = fraisPlateforme + commissionHoteTTC;
  
  // Calculer HT et TVA sur le total
  const platform_share = platformTotalTTC / (1 + VAT_RATE); // HT
  const platform_tva = platformTotalTTC - platform_share; // TVA
  
  const afterHostCommission = hebergementTotal * (1 - HOST_COMMISSION); // 97%
  const main_tenant_share = afterHostCommission * MAIN_TENANT_SHARE;
  const proprietor_share = afterHostCommission * PROPRIETOR_SHARE;
  
  return {
    platform_share,
    platform_tva,
    main_tenant_share,
    proprietor_share
  };
}
