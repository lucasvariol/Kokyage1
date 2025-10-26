import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

// Simple in-memory cache
let cache = {
  loadedAt: 0,
  xmlPath: null,
  data: null
};

const DEFAULTS = {
  // National rule for non-classé (typical): 5% of pre-tax price per adult per night, with a ceiling per adult per night.
  // We keep a conservative cap fallback if commune is unknown.
  nonClassePercent: 0.05,
  nonClasseCapEUR: 4.10,
  // Surcharges
  departmentRate: 0.10, // +10% of base taxe de séjour
  idfRegionRate: 0.15   // +15% of base taxe de séjour (Île-de-France only)
};

function resolveXmlPath() {
  const envPath = process.env.TAXE_SEJOUR_XML_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  const localPath = path.join(process.cwd(), 'data', 'taxe_sejour_donnees_deliberations.xml');
  return localPath;
}

function loadXml() {
  const xmlPath = resolveXmlPath();
  if (cache.data && cache.xmlPath === xmlPath && Date.now() - cache.loadedAt < 10 * 60 * 1000) {
    return cache.data;
  }
  if (!fs.existsSync(xmlPath)) {
    cache = { loadedAt: Date.now(), xmlPath, data: null };
    return null;
  }
  const xmlStr = fs.readFileSync(xmlPath, 'utf-8');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', parseTagValue: true });
  const json = parser.parse(xmlStr);
  cache = { loadedAt: Date.now(), xmlPath, data: json };
  return json;
}

// Try various shapes to find commune node and non-classé rule
function findCommuneNode(data, { communeName, inseeCode }) {
  if (!data) return null;
  // Heuristic: look for a list of deliberations/communes
  const candidates = [];
  const pushIfArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  // Try common roots
  if (data?.deliberations) candidates.push(...pushIfArray(data.deliberations));
  if (data?.communes) candidates.push(...pushIfArray(data.communes));
  if (data?.root) candidates.push(data.root);

  const allNodes = [];
  const dfs = (node) => {
    if (!node || typeof node !== 'object') return;
    allNodes.push(node);
    Object.values(node).forEach(dfs);
  };
  candidates.forEach(dfs);

  // Match by insee code first
  let found = allNodes.find(n => String(n?.insee || n?.code_insee || n?.codeINSEE || '').toLowerCase() === String(inseeCode || '').toLowerCase());
  if (found) return found;

  // Then by name (case-insensitive)
  const target = (communeName || '').trim().toLowerCase();
  found = allNodes.find(n => String(n?.commune || n?.nom || n?.name || '').trim().toLowerCase() === target);
  return found || null;
}

function extractNonClasseRule(node) {
  if (!node) return null;
  // Heuristics: look for a section mentioning 'non classé' / 'non classe'
  const textify = (v) => (typeof v === 'string' ? v : JSON.stringify(v || ''));
  const walk = (obj, results=[]) => {
    if (!obj || typeof obj !== 'object') return results;
    for (const [k, v] of Object.entries(obj)) {
      const key = (k || '').toLowerCase();
      if (key.includes('non') && key.includes('class')) {
        results.push({ key, value: v });
      }
      if (typeof v === 'object') walk(v, results);
    }
    return results;
  };
  const matches = walk(node);
  // Try to extract percent and/or cap
  let percent = null;
  let cap = null;
  for (const m of matches) {
    const s = textify(m.value).toLowerCase();
    const p = s.match(/([0-9]+(?:\.[0-9]+)?)\s?%/);
    if (p) percent = Number(p[1]) / 100;
    const c = s.match(/plafond[^0-9]*([0-9]+(?:[\.,][0-9]+)?)/) || s.match(/max[^0-9]*([0-9]+(?:[\.,][0-9]+)?)/);
    if (c) cap = Number(String(c[1]).replace(',', '.'));
  }
  if (percent || cap) return { percent: percent ?? DEFAULTS.nonClassePercent, cap: cap ?? DEFAULTS.nonClasseCapEUR };
  return null;
}

function extractAdditions(node) {
  // Try to pick explicit rates from the node; if not present, return nulls and we will fallback to defaults
  if (!node) return { departmentRate: null, regionRate: null, deptCode: null, regionName: null, regionCode: null };
  const lower = JSON.stringify(node).toLowerCase();
  const pct = (s) => {
    const m = s.match(/([0-9]+(?:[\.,][0-9]+)?)\s?%/);
    return m ? Number(String(m[1]).replace(',', '.')) / 100 : null;
  };
  // Attempt to detect department and region identifiers
  const deptCode = String(node?.code_departement || node?.departement || node?.dept || node?.codeDept || '') || null;
  const regionName = String(node?.region || node?.nom_region || node?.name_region || '') || null;
  const regionCode = String(node?.code_region || node?.codeRegion || '') || null;

  // Departmental additional tax
  let departmentRate = null;
  // Look for keys indicating departmental additional
  if (lower.includes('additionnel') || lower.includes('additionnelle') || lower.includes('departement')) {
    // remove commas for easier parsing
    departmentRate = pct(lower.match(/departement[a-z\s:,-]*([0-9]+(?:[\.,][0-9]+)?)\s?%/)?.[0] || '')
      ?? pct(lower.match(/additionnel[a-z\s:,-]*([0-9]+(?:[\.,][0-9]+)?)\s?%/)?.[0] || '')
      ?? null;
  }

  // Regional additional tax (IDF)
  let regionRate = null;
  // Look for mentions of Île-de-France or regional additional
  const idfMention = lower.includes('île-de-france') || lower.includes("ile-de-france") || lower.includes('idf');
  if (idfMention) {
    regionRate = pct(lower.match(/r[ée]gion[a-z\s:,-]*([0-9]+(?:[\.,][0-9]+)?)\s?%/)?.[0] || '') ?? null;
  }

  return { departmentRate, regionRate, deptCode, regionName, regionCode };
}

const IDF_DEPTS = new Set(['75','77','78','91','92','93','94','95']);

export function computeTaxeSejour({ communeName, inseeCode, category = 'non-classe', pricePerNightEUR, guests = 1, nights = 1, assumedAdults = null }) {
  const data = loadXml();
  let rule = null;
  if (category === 'non-classe') {
    const node = findCommuneNode(data, { communeName, inseeCode });
    rule = extractNonClasseRule(node) || { percent: DEFAULTS.nonClassePercent, cap: DEFAULTS.nonClasseCapEUR };

    // Compute additions (departmental + regional IDF)
    const addInfo = extractAdditions(node);
    // Determine IDF status
    const isIDF = Boolean(
      (addInfo.regionName && addInfo.regionName.toLowerCase().includes('île-de-france')) ||
      (addInfo.regionCode && String(addInfo.regionCode) === '11') ||
      (addInfo.deptCode && IDF_DEPTS.has(String(addInfo.deptCode))) ||
      // Heuristic fallback: well-known commune names
      (String(communeName || '').toLowerCase() === 'paris')
    );

    // If rates not present in XML, fallback to defaults (dept always, region only if IDF)
    const departmentRate = addInfo.departmentRate ?? DEFAULTS.departmentRate;
    const regionRate = isIDF ? (addInfo.regionRate ?? DEFAULTS.idfRegionRate) : 0;

    // Adults: if not provided, assume all guests are adults (conservative). Caller can pass a different number later.
    const adults = Math.max(0, Number(assumedAdults ?? guests) || 0);
    const perPerson = (Number(pricePerNightEUR || 0) / Math.max(1, guests));
    const perAdultPerNight = Math.min((rule?.percent ?? DEFAULTS.nonClassePercent) * perPerson, rule?.cap ?? DEFAULTS.nonClasseCapEUR);
    const basePerNightTax = perAdultPerNight * adults;

    // Additional taxes apply as a percentage of the base communal taxe de séjour
    const departmentAddPerNight = basePerNightTax * departmentRate;
    const regionAddPerNight = basePerNightTax * regionRate;
    const perNightTotalWithAdditions = basePerNightTax + departmentAddPerNight + regionAddPerNight;
    const totalWithAdditions = perNightTotalWithAdditions * Math.max(0, nights || 0);

    const totalTax = basePerNightTax * Math.max(0, nights || 0);

    return {
      perNightTax: basePerNightTax,
      totalTax,
      perNightTotalWithAdditions,
      totalWithAdditions,
      departmentAddPerNight,
      regionAddPerNight,
      appliedRule: rule,
      appliedAdditions: {
        departmentRate,
        regionRate,
        isIDF,
        deptCode: addInfo.deptCode || null,
        regionName: addInfo.regionName || null,
        regionCode: addInfo.regionCode || null
      }
    };
  }
  // If category is not 'non-classe' and we have no rule, fallback with zeros
  const adults = Math.max(0, Number(assumedAdults ?? guests) || 0);
  const perPerson = (Number(pricePerNightEUR || 0) / Math.max(1, guests));
  const perAdultPerNight = Math.min((rule?.percent ?? DEFAULTS.nonClassePercent) * perPerson, rule?.cap ?? DEFAULTS.nonClasseCapEUR);
  const basePerNightTax = perAdultPerNight * adults;
  const totalTax = basePerNightTax * Math.max(0, nights || 0);
  return {
    perNightTax: basePerNightTax,
    totalTax,
    perNightTotalWithAdditions: basePerNightTax,
    totalWithAdditions: totalTax,
    departmentAddPerNight: 0,
    regionAddPerNight: 0,
    appliedRule: rule || { percent: DEFAULTS.nonClassePercent, cap: DEFAULTS.nonClasseCapEUR },
    appliedAdditions: { departmentRate: 0, regionRate: 0, isIDF: false }
  };
}
