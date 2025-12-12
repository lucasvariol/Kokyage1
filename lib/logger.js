/**
 * Utilitaire de logging sécurisé pour Kokyage
 * 
 * Règles de sécurité:
 * 1. Ne JAMAIS logger de secrets (API keys, tokens, mots de passe)
 * 2. Masquer les données sensibles (emails partiels, IDs tronqués)
 * 3. Logs détaillés uniquement en développement
 * 4. Logs minimaux en production (performance + sécurité)
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Masque une chaîne sensible
 * Ex: "lucas.variol@gmail.com" → "luc***@gmail.com"
 */
function maskString(str, showStart = 3, showEnd = 0) {
  if (!str || str.length <= showStart + showEnd) return '***';
  const start = str.substring(0, showStart);
  const end = showEnd > 0 ? str.substring(str.length - showEnd) : '';
  return `${start}***${end}`;
}

/**
 * Masque un email
 * Ex: "lucas.variol@gmail.com" → "luc***@gmail.com"
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return `${maskString(local, 3)}@${domain}`;
}

/**
 * Tronque un ID/token
 * Ex: "abc123xyz789" → "abc123..."
 */
function truncateId(id, length = 6) {
  if (!id) return '***';
  return id.length > length ? `${id.substring(0, length)}...` : id;
}

/**
 * Nettoie un objet de ses données sensibles
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveKeys = [
    'password', 'token', 'secret', 'apiKey', 'api_key',
    'authorization', 'cookie', 'session', 'privateKey', 'private_key',
    'serviceRoleKey', 'service_role_key', 'stripeSecret', 'stripe_secret'
  ];
  
  const cleaned = { ...obj };
  
  for (const key in cleaned) {
    const lowerKey = key.toLowerCase();
    
    // Masquer les clés sensibles
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      cleaned[key] = '***REDACTED***';
    }
    
    // Masquer les emails
    if (lowerKey.includes('email') && typeof cleaned[key] === 'string') {
      cleaned[key] = maskEmail(cleaned[key]);
    }
    
    // Récursif pour objets imbriqués
    if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
      cleaned[key] = sanitizeObject(cleaned[key]);
    }
  }
  
  return cleaned;
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Logs informatifs (développement uniquement)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },
  
  /**
   * Logs de débogage détaillés (développement uniquement)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  /**
   * Warnings (toujours logués mais nettoyés)
   */
  warn: (...args) => {
    const cleaned = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : arg
    );
    console.warn('[WARN]', ...cleaned);
  },
  
  /**
   * Erreurs (toujours loguées mais nettoyées)
   */
  error: (...args) => {
    const cleaned = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : arg
    );
    console.error('[ERROR]', ...cleaned);
  },
  
  /**
   * Logs de sécurité (toujours logués avec timestamp)
   */
  security: (message, data = {}) => {
    console.warn('[SECURITY]', {
      timestamp: new Date().toISOString(),
      message,
      data: sanitizeObject(data)
    });
  },
  
  /**
   * Logs API (développement: détaillés, production: minimal)
   */
  api: (method, path, data = {}) => {
    if (isDevelopment) {
      console.log(`[API] ${method} ${path}`, sanitizeObject(data));
    } else if (isProduction) {
      // En production, log uniquement method + path (pas de données)
      console.log(`[API] ${method} ${path}`);
    }
  },
  
  /**
   * Logs de paiement (toujours logués, données masquées)
   */
  payment: (action, data = {}) => {
    console.log('[PAYMENT]', {
      timestamp: new Date().toISOString(),
      action,
      data: sanitizeObject(data)
    });
  },
  
  /**
   * NE JAMAIS utiliser cette fonction
   * Placeholder pour rappeler de ne pas logger de secrets
   */
  secret: () => {
    if (isDevelopment) {
      console.error('[CRITICAL] Tentative de log de secret détectée - BLOQUÉ');
    }
  },
};

/**
 * Utilitaires de masquage exportés
 */
export const mask = {
  email: maskEmail,
  string: maskString,
  id: truncateId,
  object: sanitizeObject,
};

/**
 * Helper pour logger l'état d'une variable d'environnement
 * sans révéler sa valeur
 */
export function logEnvStatus(varName) {
  const value = process.env[varName];
  if (isDevelopment) {
    logger.debug(`Env ${varName}:`, value ? '✓ Définie' : '✗ MANQUANTE');
  }
}

export default logger;
