import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Proxy de sécurité Next.js 16
 * S'exécute avant chaque requête pour ajouter les headers de sécurité HTTP
 * et protéger l'application contre les attaques courantes
 */
export default function proxy(request) {
  const response = NextResponse.next();
  
  // ====================
  // HEADERS DE SÉCURITÉ
  // ====================
  
  /**
   * X-Frame-Options: DENY
   * Empêche l'application d'être intégrée dans une iframe
   * Protection contre: Clickjacking (piéger l'utilisateur en cliquant sur des éléments cachés)
   */
  response.headers.set('X-Frame-Options', 'DENY');
  
  /**
   * X-Content-Type-Options: nosniff
   * Force le navigateur à respecter le Content-Type déclaré
   * Protection contre: MIME type sniffing attacks (exécution de JS malveillant)
   */
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  /**
   * X-XSS-Protection: 1; mode=block
   * Active le filtre XSS des anciens navigateurs
   * Protection contre: Cross-Site Scripting (injection de scripts malveillants)
   * Note: Moderne CSP est plus efficace mais garde la rétrocompatibilité
   */
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  /**
   * Referrer-Policy: strict-origin-when-cross-origin
   * Contrôle les informations de référence envoyées
   * - Même origine: URL complète
   * - Origine différente: seulement le domaine
   * Protection contre: Fuite d'informations sensibles dans l'URL
   */
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  /**
   * Permissions-Policy
   * Désactive les API navigateur non utilisées (caméra, micro, géolocalisation...)
   * Protection contre: Accès non autorisé aux capteurs de l'appareil
   */
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(self), usb=()'
  );
  
  /**
   * Strict-Transport-Security (HSTS)
   * Force HTTPS pendant 1 an, y compris sous-domaines
   * Protection contre: Attaques Man-in-the-Middle (interception HTTPS)
   * Note: Actif uniquement en production HTTPS
   */
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  /**
   * Content-Security-Policy (CSP)
   * Politique stricte de sécurité du contenu
   * Définit les sources autorisées pour scripts, styles, images, etc.
   * 
   * Protection contre: XSS, injection de code, sources malveillantes
   * 
   * Directives:
   * - default-src 'self': Par défaut, uniquement le même domaine
   * - script-src: Scripts autorisés
   *   - 'self': Scripts de kokyage.com
   *   - 'unsafe-inline': Inline scripts (React nécessite)
   *   - 'unsafe-eval': eval() (Next.js dev mode)
   *   - https://js.stripe.com: SDK Stripe
   *   - https://maps.googleapis.com: Google Maps
   * - connect-src: Connexions AJAX/fetch autorisées
   *   - https://*.supabase.co: Base de données
   *   - https://api.openai.com: Chatbot
   *   - https://api.stripe.com: Paiements
   *   - https://api-adresse.data.gouv.fr: API Adresse gouvernementale
   * - style-src: Styles CSS autorisés
   * - img-src: Images autorisées
   *   - data:: Images base64 inline
   *   - https:: Toutes images HTTPS (CDN, Supabase Storage...)
   * - font-src: Polices autorisées
   * - frame-src: iframes autorisées (Stripe checkout)
   * - object-src 'none': Bloque <object>, <embed> (vecteur d'attaque)
   * - base-uri 'self': Empêche modification de <base> (attaque injection)
   * - form-action 'self': Formulaires uniquement vers notre domaine
   * - frame-ancestors 'none': Renforce X-Frame-Options
   * - upgrade-insecure-requests: Force HTTPS pour toutes les ressources
   */
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://*.wemap.com",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.stripe.com https://api-adresse.data.gouv.fr https://*.wemap.com wss://*.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspDirectives);
  
  // ====================
  // LOGGING SÉCURITÉ
  // ====================
  
  // Log des requêtes suspectes (en production uniquement)
  if (process.env.NODE_ENV === 'production') {
    const { pathname, searchParams } = request.nextUrl;
    
    // Détection de patterns d'attaque courants
    const suspiciousPatterns = [
      /\.\.\//g,           // Path traversal: ../../../etc/passwd
      /<script/gi,         // XSS attempts
      /union\s+select/gi,  // SQL injection
      /javascript:/gi,     // XSS protocol
      /data:text\/html/gi, // Data URI XSS
      /eval\(/gi,          // Code injection
      /base64/gi,          // Encoded payloads
    ];
    
    const queryString = searchParams.toString();
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(pathname) || pattern.test(queryString)
    );
    
    if (isSuspicious) {
      logger.security('Suspicious request detected', {
        method: request.method,
        path: pathname,
        query: queryString,
        userAgent: request.headers.get('user-agent'),
      });
      
      // Optionnel: bloquer la requête
      // return new NextResponse('Forbidden', { status: 403 });
    }
  }
  
  return response;
}

/**
 * Configuration du matcher
 * Définit sur quelles routes le middleware s'applique
 * 
 * Appliqué sur TOUTES les routes SAUF:
 * - /_next/static: Fichiers statiques Next.js (déjà sécurisés)
 * - /_next/image: API d'optimisation images
 * - /favicon.ico: Icône du site
 * - /images/: Dossier images public
 * - Extensions statiques: .png, .jpg, .svg, .webp, .ico, .css, .js, .woff, .woff2
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - api (internal)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - fichiers statiques (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|otf)$).*)',
  ],
};
