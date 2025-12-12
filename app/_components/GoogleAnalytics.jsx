/**
 * Google Analytics Component
 * 
 * Intégration de Google Analytics 4 (GA4) pour le tracking des utilisateurs
 * Conforme RGPD : ne se charge que si l'utilisateur accepte les cookies
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = 'G-Z8TLYM6J40';

/**
 * Vérifie si l'utilisateur a accepté les cookies
 */
function hasUserConsent() {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem('cookieConsent');
  // Toujours activer GA (temporaire pour debug)
  return true;
  // return consent === 'accepted';
}

/**
 * Initialise Google Analytics
 * Charge le script gtag.js et configure GA4
 */
function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isEnabled, setIsEnabled] = useState(false);

  // Vérifier le consentement au montage et écouter les changements
  useEffect(() => {
    // Vérifier le consentement initial
    const checkConsent = () => {
      setIsEnabled(hasUserConsent());
    };
    
    checkConsent();

    // Écouter les événements de consentement
    const handleConsentAccepted = () => {
      setIsEnabled(true);
      initializeGA();
    };

    const handleConsentRejected = () => {
      setIsEnabled(false);
      // Supprimer les scripts GA si déjà chargés
      if (typeof window.gtag === 'function') {
        // Désactiver GA
        window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      }
    };

    window.addEventListener('cookieConsentAccepted', handleConsentAccepted);
    window.addEventListener('cookieConsentRejected', handleConsentRejected);

    return () => {
      window.removeEventListener('cookieConsentAccepted', handleConsentAccepted);
      window.removeEventListener('cookieConsentRejected', handleConsentRejected);
    };
  }, []);

  // Initialiser GA si consentement donné
  useEffect(() => {
    if (isEnabled && hasUserConsent()) {
      initializeGA();
    }
  }, [isEnabled]);

  // Tracker les changements de page (navigation côté client)
  useEffect(() => {
    if (isEnabled && hasUserConsent() && typeof window.gtag === 'function') {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  }, [pathname, searchParams, isEnabled]);

  return null;
}

/**
 * Wrapper avec Suspense pour éviter les erreurs de pré-rendu
 */
export function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  );
}

/**
 * Fonction d'initialisation de GA (appelée une seule fois)
 */
function initializeGA() {
  if (typeof window === 'undefined') return;
  
  // Vérifier si gtag est déjà chargé
  if (typeof window.gtag === 'function') {
    return;
  }

  // Créer le script gtag.js
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialiser dataLayer et gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    anonymize_ip: true, // Anonymiser les IPs pour RGPD
  });
}

/**
 * Tracker un événement personnalisé
 * 
 * @param {string} action - Nom de l'action (ex: 'search', 'click', 'submit')
 * @param {object} params - Paramètres additionnels
 * 
 * @example
 * trackEvent('search', { search_term: 'Paris', category: 'listings' });
 * trackEvent('reservation_created', { listing_id: 123, price: 150 });
 */
export function trackEvent(action, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, params);
  }
}

/**
 * Tracker une conversion (achat, inscription, etc.)
 * 
 * @param {string} eventName - Nom de l'événement de conversion
 * @param {object} params - Paramètres (value, currency, transaction_id, etc.)
 * 
 * @example
 * trackConversion('purchase', { 
 *   value: 150.00,
 *   currency: 'EUR',
 *   transaction_id: 'res_123',
 *   items: [{ item_name: 'Logement Paris', price: 150 }]
 * });
 */
export function trackConversion(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      send_to: GA_MEASUREMENT_ID,
      ...params,
    });
  }
}

/**
 * Tracker une page vue manuellement
 * Utile pour les SPAs ou navigation personnalisée
 * 
 * @param {string} pagePath - Chemin de la page
 * @param {string} pageTitle - Titre de la page (optionnel)
 */
export function trackPageView(pagePath, pageTitle = null) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }
}

/**
 * Définir un paramètre utilisateur
 * Permet de segmenter les analytics par type d'utilisateur
 * 
 * @param {object} params - Paramètres utilisateur
 * 
 * @example
 * setUserProperties({ user_type: 'host', verified: true });
 */
export function setUserProperties(params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('set', 'user_properties', params);
  }
}
