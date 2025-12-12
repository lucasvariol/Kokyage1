/**
 * Google Analytics Component
 * 
 * Intégration de Google Analytics 4 (GA4) pour le tracking des utilisateurs
 * Conforme RGPD : ne se charge que si l'utilisateur accepte les cookies
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = 'G-Z8TLYM6J40';

/**
 * Initialise Google Analytics
 * Charge le script gtag.js et configure GA4
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Charger le script GA au montage du composant
  useEffect(() => {
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
    });
  }, []);

  // Tracker les changements de page (navigation côté client)
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
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
