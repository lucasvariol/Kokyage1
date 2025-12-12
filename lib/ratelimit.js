/**
 * Rate Limiting avec Upstash Redis
 * 
 * Protection contre:
 * - Spam (messages, reviews, réservations)
 * - Brute force (login, password reset)
 * - DoS (surcharge serveur)
 * - Abus API (chatbot, paiements)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configuration Redis (Upstash)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * STRATÉGIES DE RATE LIMITING
 */

/**
 * Rate limit STRICT - Authentification
 * 5 tentatives par 15 minutes
 * Usage: Login, reset password, verify email
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/auth',
    })
  : null;

/**
 * Rate limit MODÉRÉ - Création de contenu
 * 10 requêtes par minute
 * Usage: Messages, reviews, reservations
 */
export const contentRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/content',
    })
  : null;

/**
 * Rate limit SOUPLE - Lecture
 * 100 requêtes par minute
 * Usage: GET endpoints, search, listing views
 */
export const readRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/read',
    })
  : null;

/**
 * Rate limit TRÈS STRICT - Paiements
 * 3 tentatives par 5 minutes
 * Usage: Payment intents, Stripe operations
 */
export const paymentRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '5 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/payment',
    })
  : null;

/**
 * Rate limit CHATBOT - Coûts OpenAI
 * 20 messages par heure
 * Usage: Chatbot API
 */
export const chatbotRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit/chatbot',
    })
  : null;

/**
 * Helper pour obtenir l'identifiant du client
 * Utilise IP + User-Agent pour plus de précision
 */
export function getClientIdentifier(request) {
  // Priorité à l'IP
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  // Ajouter user agent pour différencier les clients derrière le même proxy
  const userAgent = request.headers.get('user-agent') || '';
  const agentHash = userAgent.substring(0, 20); // Tronquer pour économiser Redis
  
  return `${ip}_${agentHash}`;
}

/**
 * Helper pour vérifier le rate limit
 * Retourne une réponse d'erreur si limite dépassée
 * 
 * @param {Ratelimit} rateLimiter - Instance de rate limiter
 * @param {Request} request - Requête HTTP
 * @param {string} customId - ID personnalisé (optionnel, sinon utilise IP)
 * @returns {Promise<{success: boolean, response?: Response}>}
 */
export async function checkRateLimit(rateLimiter, request, customId = null) {
  // Si Redis n'est pas configuré, autoriser (mode dégradé)
  if (!redis || !rateLimiter) {
    console.warn('⚠️ Rate limiting disabled (Redis not configured)');
    return { success: true };
  }

  const identifier = customId || getClientIdentifier(request);

  try {
    const { success, limit, reset, remaining } = await rateLimiter.limit(identifier);

    // Ajouter les headers de rate limit dans tous les cas
    const headers = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    };

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: 'Trop de requêtes',
            message: `Limite atteinte. Réessayez dans ${retryAfter} secondes.`,
            retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': retryAfter.toString(),
              ...headers,
            },
          }
        ),
      };
    }

    return { success: true, headers };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // En cas d'erreur Redis, autoriser (fail open)
    return { success: true };
  }
}

/**
 * Middleware helper pour appliquer le rate limiting
 * 
 * Exemple d'utilisation:
 * 
 * import { applyRateLimit, contentRateLimit } from '@/lib/ratelimit';
 * 
 * export async function POST(request) {
 *   const rateLimitResult = await applyRateLimit(contentRateLimit, request);
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *   
 *   // ... traitement normal
 * }
 */
export async function applyRateLimit(rateLimiter, request, customId = null) {
  return checkRateLimit(rateLimiter, request, customId);
}

/**
 * Rate limit basé sur user ID (pour utilisateurs authentifiés)
 * Plus précis que l'IP
 */
export async function applyUserRateLimit(rateLimiter, userId) {
  if (!redis || !rateLimiter) {
    return { success: true };
  }

  const { success, limit, reset, remaining } = await rateLimiter.limit(`user_${userId}`);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Trop de requêtes',
          message: `Vous avez atteint votre limite. Réessayez dans ${retryAfter} secondes.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          },
        }
      ),
    };
  }

  return { success: true };
}

/**
 * Vérifier si rate limiting est activé
 */
export function isRateLimitEnabled() {
  return redis !== null;
}
