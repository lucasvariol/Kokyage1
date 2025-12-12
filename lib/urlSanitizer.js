/**
 * URL Sanitizer - Protection contre XSS via liens malveillants
 * 
 * Bloque les protocoles dangereux et valide les URLs avant utilisation
 * dans href, window.location, etc.
 */

/**
 * Protocoles dangereux qui peuvent exécuter du code
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
];

/**
 * Protocoles sûrs autorisés
 */
const SAFE_PROTOCOLS = [
  'http:',
  'https:',
  'mailto:',
  'tel:',
  'sms:',
];

/**
 * Vérifie si une URL est sûre (pas de XSS)
 * 
 * @param {string} url - URL à vérifier
 * @returns {boolean} - true si sûre, false sinon
 * 
 * @example
 * isSafeUrl('https://kokyage.com') // true
 * isSafeUrl('javascript:alert(1)') // false
 * isSafeUrl('data:text/html,<script>alert(1)</script>') // false
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Bloquer les URLs vides ou invalides
  if (trimmedUrl === '' || trimmedUrl === '#') {
    return true; // Anchors vides sont OK
  }

  // Bloquer les protocoles dangereux
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (trimmedUrl.startsWith(protocol)) {
      console.warn('[Security] Blocked dangerous URL protocol:', protocol, url);
      return false;
    }
  }

  // Vérifier si c'est un protocole explicite
  if (trimmedUrl.includes(':')) {
    const parts = trimmedUrl.split(':');
    const protocol = parts[0];
    
    // Si protocole non reconnu comme sûr, bloquer
    if (!SAFE_PROTOCOLS.includes(protocol + ':')) {
      console.warn('[Security] Blocked unknown URL protocol:', protocol, url);
      return false;
    }
  }

  // URLs relatives sont OK (/page, ./page, ../page)
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('.')) {
    return true;
  }

  // Si pas de protocole et ne commence pas par /, c'est suspect
  if (!trimmedUrl.includes(':') && !trimmedUrl.startsWith('/')) {
    // Autoriser les liens d'ancre (#section)
    if (trimmedUrl.startsWith('#')) {
      return true;
    }
    // Autres cas suspects
    console.warn('[Security] Suspicious URL format:', url);
    return false;
  }

  return true;
}

/**
 * Sanitize une URL pour utilisation sûre
 * Retourne l'URL si sûre, sinon retourne une URL par défaut
 * 
 * @param {string} url - URL à sanitizer
 * @param {string} fallback - URL de secours si dangereuse (default: '#')
 * @returns {string} - URL sûre
 * 
 * @example
 * sanitizeUrl('https://kokyage.com') // 'https://kokyage.com'
 * sanitizeUrl('javascript:alert(1)') // '#'
 * sanitizeUrl('javascript:alert(1)', '/') // '/'
 */
export function sanitizeUrl(url, fallback = '#') {
  return isSafeUrl(url) ? url : fallback;
}

/**
 * Valide une redirection (window.location, router.push, etc.)
 * Lance une erreur si l'URL est dangereuse
 * 
 * @param {string} url - URL de destination
 * @throws {Error} - Si URL dangereuse
 * 
 * @example
 * validateRedirect('https://kokyage.com') // OK
 * validateRedirect('javascript:alert(1)') // throws Error
 */
export function validateRedirect(url) {
  if (!isSafeUrl(url)) {
    throw new Error(`[Security] Blocked redirect to dangerous URL: ${url}`);
  }
}

/**
 * Vérifie si une URL est une redirection ouverte (open redirect)
 * Bloque les redirections vers des domaines externes non autorisés
 * 
 * @param {string} url - URL à vérifier
 * @param {string[]} allowedDomains - Domaines autorisés (default: kokyage.com)
 * @returns {boolean} - true si sûre, false si redirection ouverte
 * 
 * @example
 * isOpenRedirect('/logements') // false (sûr, relatif)
 * isOpenRedirect('https://kokyage.com/page') // false (sûr, même domaine)
 * isOpenRedirect('https://evil.com') // true (dangereux, externe)
 */
export function isOpenRedirect(url, allowedDomains = ['kokyage.com', 'www.kokyage.com']) {
  if (!url || typeof url !== 'string') {
    return true; // Suspect
  }

  const trimmedUrl = url.trim();

  // URLs relatives sont sûres
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('.') || trimmedUrl.startsWith('#')) {
    return false;
  }

  try {
    const urlObj = new URL(trimmedUrl, 'https://kokyage.com');
    const hostname = urlObj.hostname.toLowerCase();

    // Vérifier si le domaine est autorisé
    const isAllowed = allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      console.warn('[Security] Blocked open redirect to external domain:', hostname, url);
      return true; // C'est une redirection ouverte
    }

    return false; // Domaine autorisé
  } catch (e) {
    // URL invalide = suspect
    console.warn('[Security] Invalid URL in redirect check:', url, e.message);
    return true;
  }
}

/**
 * Sanitize une URL de redirection
 * Bloque les redirections ouvertes et les protocoles dangereux
 * 
 * @param {string} url - URL de redirection
 * @param {string} fallback - URL de secours (default: '/')
 * @param {string[]} allowedDomains - Domaines autorisés
 * @returns {string} - URL sûre
 * 
 * @example
 * sanitizeRedirect('https://kokyage.com/page') // 'https://kokyage.com/page'
 * sanitizeRedirect('https://evil.com') // '/'
 * sanitizeRedirect('javascript:alert(1)') // '/'
 */
export function sanitizeRedirect(url, fallback = '/', allowedDomains = undefined) {
  // Vérifier protocole dangereux
  if (!isSafeUrl(url)) {
    return fallback;
  }

  // Vérifier redirection ouverte
  if (isOpenRedirect(url, allowedDomains)) {
    return fallback;
  }

  return url;
}

/**
 * Helper pour utiliser avec window.location
 * 
 * @example
 * import { safeNavigate } from '@/lib/urlSanitizer';
 * 
 * // Au lieu de:
 * // window.location.href = userInput; // DANGEREUX
 * 
 * // Utiliser:
 * safeNavigate(userInput); // SÉCURISÉ
 */
export function safeNavigate(url, fallback = '/') {
  const safeUrl = sanitizeRedirect(url, fallback);
  if (typeof window !== 'undefined') {
    window.location.href = safeUrl;
  }
  return safeUrl;
}
