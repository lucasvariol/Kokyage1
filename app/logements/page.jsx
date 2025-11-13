"use client";

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import MobileSearchBar from '../_components/MobileSearchBar';
import { supabase } from '@/lib/supabaseClient';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getFeeMultiplier, percentLabel } from '@/lib/commissions';

const MapPreview = dynamic(() => import('../_components/MapPreview'), { ssr: false });

// Carousel navigation functions for map popups
if (typeof window !== 'undefined') {
  window.carouselIndex = window.carouselIndex || {};
  
  window.nextImage = (id, totalImages) => {
    if (!window.carouselIndex[id]) window.carouselIndex[id] = 0;
    window.carouselIndex[id] = (window.carouselIndex[id] + 1) % totalImages;
    updateCarousel(id, totalImages);
  };
  
  window.prevImage = (id, totalImages) => {
    if (!window.carouselIndex[id]) window.carouselIndex[id] = 0;
    window.carouselIndex[id] = (window.carouselIndex[id] - 1 + totalImages) % totalImages;
    updateCarousel(id, totalImages);
  };
  
  const updateCarousel = (id, totalImages) => {
    const carousel = document.getElementById(`carousel-${id}`);
    const currentIndex = window.carouselIndex[id] || 0;
    if (carousel) {
      carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    // Update dots
    for (let i = 0; i < totalImages; i++) {
      const dot = document.getElementById(`dot-${id}-${i}`);
      if (dot) {
        dot.style.background = i === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)';
      }
    }
  };
  
  // Touch support for swipe on mobile
  window.initCarouselSwipe = (id, totalImages) => {
    const carousel = document.getElementById(`carousel-${id}`);
    if (!carousel || carousel.dataset.swipeInit) return;
    
    carousel.dataset.swipeInit = 'true';
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let hasMoved = false;
    
    carousel.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      currentX = startX;
      isDragging = true;
      hasMoved = false;
      carousel.style.transition = 'none';
    }, { passive: true });
    
    carousel.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      
      if (Math.abs(diff) > 5) {
        hasMoved = true;
      }
      
      const currentIndex = window.carouselIndex[id] || 0;
      carousel.style.transform = `translateX(calc(-${currentIndex * 100}% + ${diff}px))`;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const diff = currentX - startX;
      
      carousel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      
      if (Math.abs(diff) > 50 && hasMoved) {
        if (diff > 0 && (window.carouselIndex[id] || 0) > 0) {
          window.prevImage(id, totalImages);
        } else if (diff < 0 && (window.carouselIndex[id] || 0) < totalImages - 1) {
          window.nextImage(id, totalImages);
        } else {
          updateCarousel(id, totalImages);
        }
      } else {
        // Snap back
        updateCarousel(id, totalImages);
      }
      
      hasMoved = false;
    }, { passive: true });
  };
}

// Map component with multiple price markers for listings
function ListingsMap({ items, center, onCenterChange, searchView, ratings = {} }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapDivRef.current) return;
    
    const L = require('leaflet');
    
    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(mapDivRef.current, {
        center: center || [48.8566, 2.3522], // Paris coordinates by default
        zoom: 11,
        scrollWheelZoom: true,
        zoomControl: false, // Masque les boutons +/-
      });

      // Add tile layer (OSM - same as MapPreview)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add price markers for each listing
    items
      .filter(it => typeof it.latitude === 'number' && typeof it.longitude === 'number')
      .forEach(logement => {
        const pos = [logement.latitude, logement.longitude];
  const price = logement.price_per_night || 0;
  const feeMultiplier = getFeeMultiplier();
        
        // Create custom price marker icon
        const zoom = mapRef.current.getZoom() || 12;
        const baseSize = 0.7;
        const scale = Math.max(0.5, Math.min(1.3, zoom / 12));
        const style = `background:#fff;border:2px solid #222;border-radius:2em;padding:${0.4 * scale}em ${1.1 * scale}em;font-weight:700;color:#222;font-size:${baseSize * scale}em;box-shadow:0 2px 8px rgba(0,0,0,0.12);display:inline-block;min-width:${4 * scale}em;text-align:center;cursor:pointer;white-space:nowrap;`;
  const html = `<div style="${style}"><span style='display:flex;align-items:center;justify-content:center;gap:0.5em;'><span>${(price*feeMultiplier).toFixed(0)}</span><span>€</span></span></div>`;
        const priceIcon = L.divIcon({ className: 'price-marker', html, iconSize: null });

        const marker = L.marker(pos, { icon: priceIcon }).addTo(mapRef.current);

        // Build popup with image carousel and details
        let imagesArr = [];
        if (logement.images) {
          if (Array.isArray(logement.images)) imagesArr = logement.images;
          else if (typeof logement.images === 'string') {
            try { const arr = JSON.parse(logement.images); if (Array.isArray(arr)) imagesArr = arr; } catch {}
          }
        }
        if (!imagesArr.length && logement.image_url) imagesArr = [logement.image_url];
        
        // Rating data
        const rating = ratings[logement.id]?.average_rating || 0;
        const reviewCount = ratings[logement.id]?.review_count || 0;

        const popupHtml = `
          <div style="min-width:200px;max-width:220px;font-family:system-ui,-apple-system,sans-serif;">
            ${imagesArr.length > 0 ? `
              <div style="position:relative;width:100%;height:120px;border-radius:8px;overflow:hidden;margin-bottom:8px;background:#f0f0f0;">
                <div id="carousel-${logement.id}" style="display:flex;transition:transform 0.3s ease;height:100%;">
                  ${imagesArr.map((img, idx) => `
                    <img src="${img}" alt="${logement.title || ''}" 
                      style="min-width:100%;height:100%;object-fit:cover;user-select:none;" 
                      draggable="false" />
                  `).join('')}
                </div>
                ${imagesArr.length > 1 ? `
                  <button onclick="window.prevImage('${logement.id}', ${imagesArr.length})" 
                    style="position:absolute;left:6px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.95);border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;z-index:10;padding:0;">
                    <svg width="12" height="12" viewBox="0 0 20 20"><polyline points="13 5 7 10 13 15" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <button onclick="window.nextImage('${logement.id}', ${imagesArr.length})" 
                    style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.95);border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;z-index:10;padding:0;">
                    <svg width="12" height="12" viewBox="0 0 20 20"><polyline points="7 5 13 10 7 15" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <div style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);display:flex;gap:4px;z-index:10;">
                    ${imagesArr.map((_, idx) => `
                      <div id="dot-${logement.id}-${idx}" style="width:5px;height:5px;border-radius:50%;background:${idx === 0 ? '#fff' : 'rgba(255,255,255,0.5)'};transition:all 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:10px;color:#666;font-weight:500;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:3px;">${logement.city || 'Paris'}</div>
                <div style="font-size:13px;font-weight:700;color:#222;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${logement.title || ''}</div>
              </div>
              ${reviewCount > 0 ? `
                <div style="display:flex;align-items:center;gap:3px;background:#fff7ed;padding:3px 6px;border-radius:6px;margin-left:6px;flex-shrink:0;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span style="font-size:11px;font-weight:600;color:#222;">${rating.toFixed(1)}</span>
                </div>
              ` : ''}
            </div>
            ${logement.nb_voyageurs || logement.bedrooms || logement.bathrooms ? `
              <div style="display:flex;gap:8px;margin-bottom:8px;font-size:11px;color:#666;">
                ${logement.nb_voyageurs ? `<span style="display:flex;align-items:center;gap:3px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>${logement.nb_voyageurs}</span>` : ''}
                ${logement.bedrooms ? `<span style="display:flex;align-items:center;gap:3px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 10.07 10h3.86a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 18.07 7H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/></svg>${logement.bedrooms}</span>` : ''}
                ${logement.bathrooms ? `<span style="display:flex;align-items:center;gap:3px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 22v-4H7a2 2 0 0 1-2-2V7a4 4 0 0 1 8 0v9a2 2 0 0 1-2 2h-2Z"/></svg>${logement.bathrooms}</span>` : ''}
              </div>
            ` : ''}
            <div style="padding-top:8px;border-top:1px solid #f0f0f0;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;">
                <span style="font-weight:700;color:#222;font-size:16px;">${(price*feeMultiplier).toFixed(0)} €</span>
                <span style="font-size:12px;color:#666;">/ nuit</span>
              </div>
            </div>
            <a href="/logement/${logement.id}" 
              style="display:block;text-align:center;padding:8px 16px;background:linear-gradient(135deg,#1f2937 0%,#111827 100%);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.15);transition:all 0.2s;"
              onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)';"
              onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)';">
              Voir le logement
            </a>
          </div>`;
        
        marker.bindPopup(popupHtml, { 
          maxWidth: 220,
          minWidth: 200,
          className: 'custom-popup',
          offset: [0, -10],
          autoPan: true,
          autoPanPaddingTopLeft: [20, 150],
          autoPanPaddingBottomRight: [20, 50]
        });
        
        // Initialize swipe on popup open
        marker.on('popupopen', () => {
          // Reset carousel index
          if (typeof window !== 'undefined') {
            window.carouselIndex = window.carouselIndex || {};
            window.carouselIndex[logement.id] = 0;
            
            // Initialize swipe for mobile
            if (imagesArr.length > 1) {
              setTimeout(() => {
                window.initCarouselSwipe(logement.id, imagesArr.length);
              }, 100);
            }
          }
        });

        markersRef.current.push(marker);
      });

    // Do not auto-fit bounds: we preserve the current center/zoom so that
    // searches or manual interactions are not overridden by marker fitting.

    // Update marker sizes on zoom
    const onZoomEnd = () => {
      const newZoom = mapRef.current.getZoom();
      markersRef.current.forEach((marker, idx) => {
        const logement = items.filter(it => typeof it.latitude === 'number' && typeof it.longitude === 'number')[idx];
        if (!logement) return;
  const price = logement.price_per_night || 0;
  const feeMultiplier = getFeeMultiplier();
        const baseSize = 0.7;
        const scale = Math.max(0.5, Math.min(1.3, newZoom / 12));
        const style = `background:#fff;border:2px solid #222;border-radius:2em;padding:${0.4 * scale}em ${1.1 * scale}em;font-weight:700;color:#222;font-size:${baseSize * scale}em;box-shadow:0 2px 8px rgba(0,0,0,0.12);display:inline-block;min-width:${4 * scale}em;text-align:center;cursor:pointer;white-space:nowrap;`;
  const html = `<div style="${style}"><span style='display:flex;align-items:center;justify-content:center;gap:0.5em;'><span>${(price*feeMultiplier).toFixed(0)}</span><span>€</span></span></div>`;
        const priceIcon = L.divIcon({ className: 'price-marker', html, iconSize: null });
        marker.setIcon(priceIcon);
      });
    };
    mapRef.current.on('zoomend', onZoomEnd);

    // Notify parent when map center changes after user interaction
    const onMoveEnd = () => {
      if (!mapRef.current) return;
      const c = mapRef.current.getCenter();
      // If center didn't actually change (e.g., zoom only), skip notifying parent
      const sameCenter = Array.isArray(center)
        ? Math.abs(c.lat - center[0]) < 1e-9 && Math.abs(c.lng - center[1]) < 1e-9
        : false;
      if (sameCenter) return;
      if (onCenterChange && typeof onCenterChange === 'function') {
        onCenterChange([c.lat, c.lng]);
      }
    };
    mapRef.current.on('moveend', onMoveEnd);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('zoomend', onZoomEnd);
        mapRef.current.off('moveend', onMoveEnd);
      }
    };
  }, [items, center, onCenterChange]);

  // Update map center when center prop changes while preserving current zoom
  useEffect(() => {
    if (!mapRef.current || !center) return;
    const curr = mapRef.current.getCenter();
    const dz = mapRef.current.getZoom();
    const same = Math.abs(curr.lat - center[0]) < 1e-6 && Math.abs(curr.lng - center[1]) < 1e-6;
    if (same) return;
    // Keep current zoom to avoid fighting with user's manual zoom
    mapRef.current.setView(center, dz, { animate: true });
  }, [center]);

  // When a search explicitly requests a view (center + zoom), honor it
  useEffect(() => {
    if (!mapRef.current || !searchView) return;
    const [lat, lng] = searchView.center || [];
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    const curr = mapRef.current.getCenter();
    const same = Math.abs(curr.lat - lat) < 1e-6 && Math.abs(curr.lng - lng) < 1e-6;
    if (same && mapRef.current.getZoom() === searchView.zoom) return;
    mapRef.current.setView([lat, lng], searchView.zoom, { animate: true });
  }, [searchView]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  return (
    <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
  );
}

const inputStyle = {
  padding: '14px 18px', borderRadius: 16, border: '1px solid #e0e3e7', fontSize: 16,
  minWidth: 260, maxWidth: 320, background: '#f9fafb', color: '#222',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: 65, boxSizing: 'border-box',
  outline: 'none', transition: 'box-shadow 0.2s, border 0.08s'
};
const btnStyle = {
  width: '100%', minWidth: 150, maxWidth: 150, padding: '12px 16px', borderRadius: 8,
  border: '1px solid #ddd', fontSize: 16, background: '#fff', boxShadow: '0 2px 8px rgba(201,103,69,0.07)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
  cursor: 'pointer', height: 65, boxSizing: 'border-box', outline: 'none', transition: 'box-shadow 0.2s, border 0.08s'
};

function LogementsInner() {
  const [slideDirection, setSlideDirection] = useState({});
  const [imageIndexes, setImageIndexes] = useState({});
  // Keep a ref to latest imageIndexes to avoid stale values in touch handlers
  const imageIndexesRef = useRef({});
  useEffect(() => { imageIndexesRef.current = imageIndexes; }, [imageIndexes]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const searchParams = useSearchParams();
  const initialVoyageurs = parseInt(searchParams.get('voyageurs'), 10) || 2;
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [destination, setDestination] = useState(searchParams.get('destination') || "");
  const [arrivee, setArrivee] = useState(searchParams.get('arrivee') || "");
  const [depart, setDepart] = useState(searchParams.get('depart') || "");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(500);
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [minBathrooms, setMinBathrooms] = useState(0);
  const [minBeds, setMinBeds] = useState(0);
  const [propertyType, setPropertyType] = useState('');
  const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]); // Paris center
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [voyageurs, setVoyageurs] = useState(initialVoyageurs);
  const [showVoyageursMenu, setShowVoyageursMenu] = useState(false);
  const [hasTypedDestination, setHasTypedDestination] = useState(false);
  const [showArriveeCalendar, setShowArriveeCalendar] = useState(false);
  const [showDepartCalendar, setShowDepartCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const destinationBoxRef = useRef(null);
  const mapContainerRef = useRef(null);
  const resultsIndicatorRef = useRef(null);
  const logementsListRef = useRef(null);
  const [searchView, setSearchView] = useState(null); // { center: [lat, lng], zoom }
  const [disponibilities, setDisponibilities] = useState({}); // { listing_id: [date1, date2, ...] }
  const [ratings, setRatings] = useState({}); // { listing_id: { review_count, average_rating } }

  // Responsive helper to stabilize search bar layout on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Helper function to format date as YYYY-MM-DD in local timezone (avoid UTC conversion issues)
  const formatDateForState = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateFromState = (value) => value ? new Date(`${value}T00:00:00`) : null;

  const arriveeDate = parseDateFromState(arrivee);
  const departDate = parseDateFromState(depart);

  // Haversine distance in km between [lat1, lon1] and [lat2, lon2]
  const haversineKm = (a, b) => {
    if (!a || !b) return Infinity;
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLon / 2);
    const aa = s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  };

  // Heuristic: choose a zoom level based on feature type/population/bbox size
  const computeZoomForFeature = (feat) => {
    try {
      const props = feat?.properties || {};
      const typ = (props.type || props.layer || '').toString().toLowerCase();
      const pop = Number(props.population || props.pop || props['population'] || 0) || 0;
      // Prefer bbox-based heuristic if available
      const bbox = feat?.bbox || props?.bbox;
      if (Array.isArray(bbox) && bbox.length === 4) {
        // bbox = [minLon, minLat, maxLon, maxLat]
        const widthKm = haversineKm([bbox[1], bbox[0]], [bbox[3], bbox[2]]);
        if (isFinite(widthKm)) {
          if (widthKm > 500) return 5;   // Region/country scale
          if (widthKm > 200) return 7;   // Large region
          if (widthKm > 80) return 9;    // Metro area
          if (widthKm > 30) return 11;   // City
          if (widthKm > 10) return 12;   // Inner city
          return 13;                     // District/neighborhood
        }
      }
      // Fallback on type/population
      if (typ.includes('country')) return 5;
      if (typ.includes('region')) return 7;
      if (typ.includes('state')) return 7;
      if (typ.includes('city') || typ.includes('municipality') || typ.includes('town')) {
        if (pop > 2000000) return 10; // very large city
        if (pop > 500000) return 11;  // large city
        return 12;                     // medium/small city
      }
      if (typ.includes('village') || typ.includes('suburb') || typ.includes('neighbourhood')) return 13;
      return 11; // sensible default for unknown types
    } catch {
      return 11;
    }
  };

  // Sort filtered items by distance to current mapCenter
  const sortedItems = useMemo(() => {
    if (!Array.isArray(filteredItems) || !filteredItems.length) return [];
    return [...filteredItems]
      .map(it => {
        const hasCoords = typeof it.latitude === 'number' && typeof it.longitude === 'number';
        const d = hasCoords ? haversineKm(mapCenter, [it.latitude, it.longitude]) : Infinity;
        return { it, d };
      })
      .sort((a, b) => a.d - b.d)
      .map(({ it }) => it);
  }, [filteredItems, mapCenter]);

  // Function to find longest continuous availability range
  const findLongestAvailabilityRange = (listingId) => {
    const dates = disponibilities[listingId] || [];
    if (dates.length === 0) return null;

    // Sort dates
    const sortedDates = [...dates].sort();
    
    let longestRange = { start: null, end: null, length: 0 };
    let currentRange = { start: sortedDates[0], end: sortedDates[0], length: 1 };

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      
      // Check if dates are consecutive
      const daysDiff = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Continue current range
        currentRange.end = sortedDates[i];
        currentRange.length++;
      } else {
        // Check if current range is the longest
        if (currentRange.length > longestRange.length) {
          longestRange = { ...currentRange };
        }
        // Start new range
        currentRange = { start: sortedDates[i], end: sortedDates[i], length: 1 };
      }
    }

    // Check final range
    if (currentRange.length > longestRange.length) {
      longestRange = { ...currentRange };
    }

    return longestRange.length > 0 ? longestRange : null;
  };

  // Function to calculate proximity score to requested dates
  const calculateProximityScore = (listingId, requestedStart, requestedEnd) => {
    const range = findLongestAvailabilityRange(listingId);
    if (!range) return Infinity;

    const rangeStart = new Date(range.start);
    const rangeEnd = new Date(range.end);
    const reqStart = new Date(requestedStart);
    const reqEnd = new Date(requestedEnd);

    // Calculate days difference from requested start date
    const daysFromStart = Math.abs(Math.round((rangeStart - reqStart) / (1000 * 60 * 60 * 24)));
    
    // Bonus if the range covers the requested duration
    const requestedNights = Math.round((reqEnd - reqStart) / (1000 * 60 * 60 * 24));
    const durationBonus = range.length >= requestedNights ? -100 : 0;

    return daysFromStart + durationBonus;
  };

  // Get alternative listings when dates are selected - always show them as suggestions
  const alternativeListings = useMemo(() => {
    if (!arrivee || !depart) return [];
    if (!Array.isArray(items) || items.length === 0) return [];
    if (!Array.isArray(filteredItems)) return [];

    // Get IDs of already displayed items to exclude them from alternatives
    const displayedIds = new Set(filteredItems.map(item => item.id));

    // Get items that match all filters except exact availability
    let alternatives = items.filter(item => {
      if (!item) return false;
      // Exclude items already displayed
      if (displayedIds.has(item.id)) return false;
      
      // Apply all filters except availability
      if (typeof item.nb_voyageurs === 'number' && item.nb_voyageurs < voyageurs) return false;
      if (typeof item.price_per_night === 'number') {
        if (item.price_per_night * 1.17 < priceMin || item.price_per_night * 1.17 > priceMax) return false;
      }
      if (minBedrooms > 0 && (typeof item.bedrooms !== 'number' || item.bedrooms < minBedrooms)) return false;
      if (minBathrooms > 0 && (typeof item.bathrooms !== 'number' || item.bathrooms < minBathrooms)) return false;
      if (minBeds > 0 && (typeof item.beds !== 'number' || item.beds < minBeds)) return false;
      if (propertyType && (!item.type || !item.type.toLowerCase().includes(propertyType.toLowerCase()))) return false;
      
      // Must have some disponibilities
      return disponibilities[item.id] && disponibilities[item.id].length > 0;
    });

    // Calculate proximity and add availability info
    alternatives = alternatives.map(item => {
      const range = findLongestAvailabilityRange(item.id);
      const score = calculateProximityScore(item.id, arrivee, depart);
      return { ...item, availabilityRange: range, proximityScore: score };
    });

    // Sort by proximity score and take top 10
    return alternatives
      .sort((a, b) => a.proximityScore - b.proximityScore)
      .slice(0, 10);
  }, [items, arrivee, depart, filteredItems, disponibilities, voyageurs, priceMin, priceMax, minBedrooms, minBathrooms, minBeds, propertyType]);

  // Helper function to get all dates between two dates (nights needed)
  const getDatesBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const dates = [];
    
    // Parse dates - if string is in YYYY-MM-DD format, parse it carefully to avoid timezone shifts
    let start, end;
    if (typeof startDate === 'string') {
      // Split the string and create date in local timezone to avoid UTC conversion
      const parts = startDate.split('-');
      start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      start = new Date(startDate);
    }
    
    if (typeof endDate === 'string') {
      const parts = endDate.split('-');
      end = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      end = new Date(endDate);
    }
    
    // Reset time to midnight to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    console.log('DEBUG - Start date object:', start, 'End date object:', end);
    
    // We need all nights from check-in to check-out (excluding check-out day)
    // If checking in on the 22nd and out on the 25th, we need nights of 22nd, 23rd, 24th
    const current = new Date(start);
    while (current < end) {
      // Format date as YYYY-MM-DD in local timezone
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      dates.push(dateStr);
      current.setDate(current.getDate() + 1);
    }
    
    console.log(`Dates required - Arrivée: ${startDate}, Départ: ${endDate}, Nuits nécessaires:`, dates);
    return dates;
  };

  // Function to apply all filters
  const applyFilters = () => {
    let filtered = [...items];
    
    // Filter by number of travelers
    filtered = filtered.filter(item => {
      return typeof item.nb_voyageurs === 'number' ? item.nb_voyageurs >= voyageurs : true;
    });
    
    // Filter by price range
    filtered = filtered.filter(item => {
      const feeMultiplier = getFeeMultiplier();
      const priceWithFees = (typeof item.price_per_night === 'number') ? item.price_per_night * feeMultiplier : NaN;
      if (!isFinite(priceWithFees)) return true;
      return priceWithFees >= priceMin && priceWithFees <= priceMax;
    });
    
    // Filter by minimum bedrooms (only if > 0)
    if (minBedrooms > 0) {
      filtered = filtered.filter(item => {
        return typeof item.bedrooms === 'number' ? item.bedrooms >= minBedrooms : false;
      });
    }
    
    // Filter by minimum bathrooms (only if > 0)
    if (minBathrooms > 0) {
      filtered = filtered.filter(item => {
        return typeof item.bathrooms === 'number' ? item.bathrooms >= minBathrooms : false;
      });
    }
    
    // Filter by minimum beds (only if > 0)
    if (minBeds > 0) {
      filtered = filtered.filter(item => {
        return typeof item.beds === 'number' ? item.beds >= minBeds : false;
      });
    }
    
    // Filter by property type
    if (propertyType) {
      filtered = filtered.filter(item => {
        return item.type && item.type.toLowerCase().includes(propertyType.toLowerCase());
      });
    }

    // Filter by availability dates (arrivee and depart)
    if (arrivee && depart) {
      const requiredDates = getDatesBetween(arrivee, depart);
      if (requiredDates.length > 0) {
        filtered = filtered.filter(item => {
          const itemDates = disponibilities[item.id] || [];
          if (itemDates.length === 0) return false;
          
          // Normalize dates to ensure consistent format (YYYY-MM-DD)
          const normalizedItemDates = itemDates.map(d => {
            if (typeof d === 'string') {
              // Already in string format, ensure it's YYYY-MM-DD
              return d.split('T')[0];
            }
            return d;
          });
          
          // Check if all required dates are available
          const allAvailable = requiredDates.every(date => normalizedItemDates.includes(date));
          
          // Debug logging (can be removed later)
          if (item.id) {
            const missingDates = requiredDates.filter(d => !normalizedItemDates.includes(d));
            console.log(`Logement ${item.id} (${item.title}): ${allAvailable ? '✅ DISPONIBLE' : '❌ NON DISPONIBLE'}`, {
              requiredDates,
              availableDates: normalizedItemDates, // Show ALL dates
              totalAvailable: normalizedItemDates.length,
              missingDates
            });
          }
          
          return allAvailable;
        });
      }
    }
    
    setFilteredItems(filtered);
  };

  // Effect to apply filters when criteria change
  useEffect(() => {
    if (items.length > 0) {
      applyFilters();
    }
  }, [voyageurs, priceMin, priceMax, minBedrooms, minBathrooms, minBeds, propertyType, items, arrivee, depart, disponibilities]);

  useEffect(() => {
    setMounted(true);
    
    // Load disponibilities from database
    async function loadDisponibilities() {
      try {
        const { data: dispoData, error: dispoError } = await supabase
          .from('disponibilities')
          .select('listing_id, date, booked');
        
        if (dispoError) {
          console.error('Error loading disponibilities:', dispoError);
          return;
        }

        if (!Array.isArray(dispoData) || dispoData.length === 0) {
          console.log('No disponibilities data available');
          setDisponibilities({});
          return;
        }

        // Regroupe par logement + date et détermine si la date est réellement libre
        const groupedByListing = {};

        dispoData.forEach(item => {
          if (!item) return;
          const listingId = item?.listing_id;
          if (!listingId) return;

          const normalizedDate = typeof item.date === 'string'
            ? item.date.split('T')[0]
            : item.date;
          if (!normalizedDate) return;

          if (!groupedByListing[listingId]) {
            groupedByListing[listingId] = {};
          }

          if (!groupedByListing[listingId][normalizedDate]) {
            groupedByListing[listingId][normalizedDate] = { hasAvailable: false, hasReservation: false };
          }

          const status = (item?.booked ?? '').toString().trim().toLowerCase();
          if (status === 'yes') {
            groupedByListing[listingId][normalizedDate].hasReservation = true;
          } else {
            groupedByListing[listingId][normalizedDate].hasAvailable = true;
          }
        });

        const dispoByListing = {};
        Object.entries(groupedByListing).forEach(([listingId, dates]) => {
          const availableDates = Object.entries(dates)
            .filter(([, status]) => status.hasAvailable && !status.hasReservation)
            .map(([date]) => date)
            .sort();
          if (availableDates.length > 0) {
            dispoByListing[listingId] = availableDates;
          }
        });

        console.log('Disponibilities loaded (available only, deduped):', dispoByListing);
        setDisponibilities(dispoByListing);
      } catch (err) {
        console.error('Exception loading disponibilities:', err);
        setDisponibilities({});
      }
    }

    // Load only listings that have been validated by a moderator
    supabase.from('listings').select('*').eq('status', 'validé modérateur').order('created_at', { ascending: false }).then(async ({ data, error }) => {
      try {
        if (error) {
          console.error('Error loading listings:', error);
          setItems([]);
          setFilteredItems([]);
          return;
        }

        if (!Array.isArray(data)) {
          console.log('No listings data available');
          setItems([]);
          setFilteredItems([]);
          return;
        }

        // Géocode les adresses manquantes
        const geocoded = await Promise.all(data.map(async (item) => {
          if (!item) return null;
          if (typeof item.latitude === 'number' && typeof item.longitude === 'number') return item;
          if (item.address) {
            try {
              const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.address)}`;
              const res = await fetch(url);
              const geo = await res.json();
              if (geo && geo[0]) {
                return {
                  ...item,
                  latitude: parseFloat(geo[0].lat),
                  longitude: parseFloat(geo[0].lon)
                };
              }
            } catch {}
          }
          return item;
        }));
        
        const validGeocoded = geocoded.filter(item => item !== null);
        setItems(validGeocoded);
        // Initially show all items, filters will be applied by useEffect
        setFilteredItems(validGeocoded);
        
        // Load ratings for all listings
        if (validGeocoded.length > 0) {
          const listingIds = validGeocoded.map(item => item.id).join(',');
          try {
            const ratingsRes = await fetch(`/api/reviews/batch?listing_ids=${listingIds}`);
            const ratingsData = await ratingsRes.json();
            if (ratingsRes.ok && ratingsData.ratings) {
              setRatings(ratingsData.ratings);
            }
          } catch (err) {
            console.error('Error loading ratings:', err);
          }
        }
      } catch (err) {
        console.error('Exception loading listings:', err);
        setItems([]);
        setFilteredItems([]);
      }
    });
    
    loadDisponibilities();
    if (destination) handleSearch();
  }, []);

  async function handleSearch() {
    applyFilters();
    
    // Scroll to results indicator on mobile after search
    if (isMobile && resultsIndicatorRef.current) {
      setTimeout(() => {
        resultsIndicatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    
    if (!destination) {
      // Reset to Paris center if no destination
      setMapCenter([48.8566, 2.3522]);
      setSearchView({ center: [48.8566, 2.3522], zoom: 11 });
      return;
    }
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(destination)}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && Array.isArray(data.features) && data.features.length > 0) {
      const feat = data.features[0];
      const coords = feat.geometry.coordinates;
      const latlng = [coords[1], coords[0]];
      const zoom = computeZoomForFeature(feat);
      setMapCenter(latlng);
      setSearchView({ center: latlng, zoom });
    } else {
      // If no results found, keep Paris center
      console.log('No location found for:', destination);
    }
  }

  useEffect(() => {
    if (!destination || destination.length < 2) { 
      setSuggestions([]); 
      setHasTypedDestination(false);
      return; 
    }
    setHasTypedDestination(true);
    setIsLoadingSuggestions(true);
    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(destination)}&limit=5`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        if (data && Array.isArray(data.features)) {
          setSuggestions(data.features);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 300);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [destination]);

  // Close destination suggestions when clicking outside the destination box
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!destinationBoxRef.current) return;
      if (destinationBoxRef.current.contains(e.target)) return;
      if (hasTypedDestination || (suggestions && suggestions.length)) {
        setHasTypedDestination(false);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hasTypedDestination, suggestions]);

  async function handleSuggestionSelect(s) {
    setDestination(s.properties.label);
    setSuggestions([]);
    setHasTypedDestination(false);
    if (s.geometry && s.geometry.coordinates) {
      const latlng = [s.geometry.coordinates[1], s.geometry.coordinates[0]];
      const zoom = computeZoomForFeature(s);
      setMapCenter(latlng);
      setSearchView({ center: latlng, zoom });
    }
  }

  // Reset map center to Paris when destination is cleared (but not on initial load)
  useEffect(() => {
    if (mounted && (!destination || destination.trim() === '')) {
      setMapCenter([48.8566, 2.3522]); // Paris coordinates
      setSearchView({ center: [48.8566, 2.3522], zoom: 11 });
    }
  }, [destination, mounted]);

  // Initialize swipe on listing cards for mobile
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const touchHandlers = {}; // Track handlers by element id for cleanup
    
    const initSwipe = (listingId, totalImages, prefix = 'listing') => {
      const elId = `${prefix}-carousel-${listingId}`;
      const carousel = document.getElementById(elId);
      if (!carousel) return;
      
      // Remove old listeners if they exist for this element
      if (touchHandlers[elId]) {
        const { handleTouchStart, handleTouchMove, handleTouchEnd } = touchHandlers[elId];
        carousel.removeEventListener('touchstart', handleTouchStart);
        carousel.removeEventListener('touchmove', handleTouchMove);
        carousel.removeEventListener('touchend', handleTouchEnd);
      }
      
      let startX = 0;
      let currentX = 0;
      let isDragging = false;
      
      const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
        currentX = startX;
        isDragging = true;
        // Disable transition during drag for immediate response
        carousel.style.transition = 'none';
      };
      
      const handleTouchMove = (e) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault(); // prevent page scroll while swiping
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        const currentIndex = imageIndexesRef.current[listingId] || 0;
        carousel.style.transform = `translateX(calc(-${currentIndex * 100}% + ${diff}px))`;
      };
      
      const handleTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const diff = currentX - startX;
        const threshold = 50;
        const currentIndex = imageIndexesRef.current[listingId] || 0;
        let nextIndex = currentIndex;
        
        if (Math.abs(diff) > threshold) {
          if (diff > 0 && currentIndex > 0) {
            nextIndex = currentIndex - 1; // Swipe right -> previous
          } else if (diff < 0 && currentIndex < totalImages - 1) {
            nextIndex = currentIndex + 1; // Swipe left -> next
          }
        }
        // Restore transition for snap/slide and set final position
        carousel.style.transition = 'transform 0.3s ease';
        carousel.style.transform = `translateX(-${nextIndex * 100}%)`;
        
        if (nextIndex !== currentIndex) {
          setImageIndexes(idx => ({ ...idx, [listingId]: nextIndex }));
        }
      };
      
      // Store handlers and attach listeners
      touchHandlers[elId] = { handleTouchStart, handleTouchMove, handleTouchEnd };
      carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
      // touchmove must be non-passive to allow preventDefault
      carousel.addEventListener('touchmove', handleTouchMove, { passive: false });
      carousel.addEventListener('touchend', handleTouchEnd, { passive: true });
    };
    
    // Initialize swipe for main listings
    if (Array.isArray(sortedItems)) {
      sortedItems.forEach(item => {
        if (!item) return;
        let imagesArr = [];
        if (item.images) {
          if (Array.isArray(item.images)) imagesArr = item.images;
          else if (typeof item.images === 'string') {
            try { const arr = JSON.parse(item.images); if (Array.isArray(arr)) imagesArr = arr; } catch {}
          }
        }
        if (!imagesArr.length && item.image_url) imagesArr = [item.image_url];
        
        if (imagesArr.length > 1) {
          initSwipe(item.id, imagesArr.length, 'listing');
        }
      });
    }
    
    // Initialize swipe for alternative listings
    if (Array.isArray(alternativeListings)) {
      alternativeListings.forEach(item => {
        if (!item) return;
        let imagesArr = [];
        if (item.images) {
          if (Array.isArray(item.images)) imagesArr = item.images;
          else if (typeof item.images === 'string') {
            try { const arr = JSON.parse(item.images); if (Array.isArray(arr)) imagesArr = arr; } catch {}
          }
        }
        if (!imagesArr.length && item.image_url) imagesArr = [item.image_url];
        
        if (imagesArr.length > 1) {
          initSwipe(item.id, imagesArr.length, 'alt');
        }
      });
    }
    
    // Cleanup: remove old listeners on unmount or before re-init
    return () => {
      Object.keys(touchHandlers).forEach(elId => {
        const { handleTouchStart, handleTouchMove, handleTouchEnd } = touchHandlers[elId];
        const carousel = document.getElementById(elId);
        if (carousel) {
          carousel.removeEventListener('touchstart', handleTouchStart);
          carousel.removeEventListener('touchmove', handleTouchMove);
          carousel.removeEventListener('touchend', handleTouchEnd);
        }
      });
    };
  }, [mounted, sortedItems, alternativeListings, imageIndexes]);

  const handleMobileSearchUpdate = (updates) => {
    setDestination(updates.destination);
    setArrivee(updates.arrivee);
    setDepart(updates.depart);
    setVoyageurs(updates.voyageurs);
  };

  return (
    <>
      <Header />
      
      {/* Mobile sticky search bar */}
      {isMobile && (
        <MobileSearchBar
          destination={destination}
          arrivee={arrivee}
          depart={depart}
          voyageurs={voyageurs}
          onUpdate={handleMobileSearchUpdate}
          onFiltersClick={() => setShowAdvancedFilters(true)}
        />
      )}
      
      {/* Hero Section - cachée sur mobile */}
      {!isMobile && (
      <section style={{
        background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
        padding: '60px 20px 40px',
        color: 'white',
        position: 'relative',
        overflow: 'visible',
        zIndex: 1
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: 800, 
            marginBottom: '16px',
            textAlign: 'center'
          }}>
          Trouvez votre logement idéal
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.2rem)', 
            textAlign: 'center',
            marginBottom: '32px',
            opacity: 0.95
          }}>
            Des logements authentiques, loués par des hôtes de confiance
          </p>

          {/* Barre de recherche moderne - cachée sur mobile */}
          {!isMobile && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            gap: 8,
            alignItems: 'stretch',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10
          }}>
            {/* Destination avec autocomplétion */}
            <div ref={destinationBoxRef} style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Où allez-vous ?"
                value={destination}
                onChange={e => { setDestination(e.target.value); setHasTypedDestination(true); }}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setHasTypedDestination(false); setSuggestions([]); }
                  if (e.key === 'Enter') { handleSearch(); }
                }}
                style={{
                  ...inputStyle,
                  width: '100%',
                  minWidth: 'unset',
                  maxWidth: 'unset',
                  height: 65,
                  fontSize: 16,
                  padding: '14px 18px'
                }}
                autoComplete="off"
              />
              {suggestions.length > 0 && hasTypedDestination && (
                <ul style={{
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  marginTop: 4,
                  background: '#fff',
                  border: '1px solid #ddd', 
                  borderRadius: 12, 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 10000, 
                  listStyle: 'none', 
                  margin: '4px 0 0 0', 
                  padding: 0, 
                  maxHeight: 240, 
                  overflowY: 'auto'
                }}>
                  {suggestions.map((s, idx) => (
                    <li
                      key={s.properties.id || idx}
                      onClick={() => handleSuggestionSelect(s)}
                      onMouseDown={e => e.preventDefault()}
                      style={{
                        padding: '12px 16px', 
                        cursor: 'pointer',
                        borderBottom: idx < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                        transition: 'background 0.15s',
                        fontSize: 15
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f7f8fa'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ fontWeight: 500, color: '#222' }}>{s.properties.name || s.properties.label}</div>
                      {s.properties.context && (
                        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{s.properties.context}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {isLoadingSuggestions && (
                <div style={{
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0,
                  marginTop: 4,
                  background: '#fff',
                  border: '1px solid #ddd', 
                  borderRadius: 12, 
                  zIndex: 10000, 
                  padding: '12px 16px',
                  fontSize: 14, 
                  color: '#888', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }}>
                  🔍 Recherche en cours...
                </div>
              )}
            </div>

            {/* Date d'arrivée - Sans DatePicker */}
            <div style={{ position: 'relative', flex: '0 0 160px' }}>
              <button
                type="button"
                onClick={() => setShowArriveeCalendar(!showArriveeCalendar)}
                style={{
                  ...btnStyle,
                  width: '100%',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 12,
                  paddingRight: 12,
                  height: 65
                }}
              >
                <span style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Arrivée</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>
                  {arriveeDate
                    ? arriveeDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : "Date"}
                </span>
              </button>
            </div>

            {/* Date de départ - Sans DatePicker */}
            <div style={{ position: 'relative', flex: '0 0 160px' }}>
              <button
                type="button"
                onClick={() => setShowDepartCalendar(!showDepartCalendar)}
                style={{
                  ...btnStyle,
                  width: '100%',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 12,
                  paddingRight: 12,
                  height: 65
                }}
              >
                <span style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Départ</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>
                  {departDate
                    ? departDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : "Date"}
                </span>
              </button>
            </div>

            {/* Voyageurs */}
            <div style={{ position: 'relative', flex: '0 0 140px' }}>
              <button
                type="button"
                style={{
                  ...btnStyle,
                  width: '100%',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 12,
                  paddingRight: 12,
                  height: 65
                }}
                onClick={() => setShowVoyageursMenu(v => !v)}
              >
                <span style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voyageurs</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>
                  {voyageurs} {voyageurs > 1 ? 'personnes' : 'personne'}
                </span>
              </button>
              {showVoyageursMenu && (
                <ul style={{
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0,
                  marginTop: 4,
                  background: '#fff',
                  border: '1px solid #e0e3e7', 
                  borderRadius: 12, 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  margin: '4px 0 0 0', 
                  padding: '8px 0', 
                  listStyle: 'none', 
                  zIndex: 10000
                }}>
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <li
                      key={num}
                      style={{
                        padding: '10px 16px', 
                        cursor: 'pointer', 
                        fontSize: 15,
                        background: voyageurs === num ? '#60A29D' : '#fff',
                        color: voyageurs === num ? '#fff' : '#222',
                        fontWeight: voyageurs === num ? 600 : 400,
                        transition: 'all 0.15s'
                      }}
                      onMouseDown={(e) => { 
                        e.preventDefault();
                        setVoyageurs(num); 
                        setShowVoyageursMenu(false); 
                      }}
                      onMouseEnter={e => {
                        if (voyageurs !== num) e.currentTarget.style.background = '#f7f8fa';
                      }}
                      onMouseLeave={e => {
                        if (voyageurs !== num) e.currentTarget.style.background = '#fff';
                      }}
                    >
                      {num} {num > 1 ? 'personnes' : 'personne'}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bouton Rechercher */}
            <button
              type="button"
              style={{
                background: '#C96745',
                border: 'none',
                borderRadius: 12,
                width: 56,
                height: 65,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(201,103,69,0.25)',
                transition: 'all 0.2s',
                flex: '0 0 56px'
              }}
              onClick={handleSearch}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(201,103,69,0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,103,69,0.25)';
              }}
              aria-label="Rechercher"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {/* Bouton Filtres avancés */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(true)}
              style={{
                padding: '0 20px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                background: '#fff',
                color: '#C96745',
                border: '2px solid #C96745',
                height: 65,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                flex: '0 0 auto',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#C96745';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#C96745';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"/>
                <line x1="4" y1="10" x2="4" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12" y2="3"/>
                <line x1="20" y1="21" x2="20" y2="16"/>
                <line x1="20" y1="12" x2="20" y2="3"/>
                <line x1="1" y1="14" x2="7" y2="14"/>
                <line x1="9" y1="8" x2="15" y2="8"/>
                <line x1="17" y1="16" x2="23" y2="16"/>
              </svg>
              Filtres
            </button>
          </div>
          )}
        </div>
      </section>
      )}

      {/* Calendrier Arrivée - Modal desktop */}
      {!isMobile && showArriveeCalendar && (
        <>
          <div 
            onClick={() => setShowArriveeCalendar(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            zIndex: 9999,
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            maxWidth: '400px',
            width: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedMonth(newDate);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  color: '#2D3748'
                }}
              >
                ‹
              </button>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#2D3748' }}>
                {selectedMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedMonth(newDate);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  color: '#2D3748'
                }}
              >
                ›
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6B7280', padding: '8px 0' }}>
                  {day}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {(() => {
                const year = selectedMonth.getFullYear();
                const month = selectedMonth.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const daysInMonth = lastDay.getDate();
                const startingDayOfWeek = firstDay.getDay();
                const days = [];
                
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(null);
                }
                for (let day = 1; day <= daysInMonth; day++) {
                  days.push(new Date(year, month, day));
                }

                return days.map((date, idx) => {
                  if (!date) return <div key={idx} />;

                  const isSelected = arriveeDate && date.toDateString() === arriveeDate.toDateString();
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = date < today;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!isPast) {
                          setArrivee(formatDateForState(date));
                          setShowArriveeCalendar(false);
                        }
                      }}
                      disabled={isPast}
                      style={{
                        padding: '12px 4px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isPast ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: isSelected ? 600 : 400,
                        background: isSelected ? '#60A29D' : 'transparent',
                        color: isSelected ? 'white' : isPast ? '#D1D5DB' : '#2D3748',
                        transition: 'all 0.2s ease',
                        opacity: isPast ? 0.4 : 1
                      }}
                      onMouseEnter={e => {
                        if (!isPast && !isSelected) {
                          e.target.style.background = '#F3F4F6';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isPast && !isSelected) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}

      {/* Calendrier Départ - Modal desktop */}
      {!isMobile && showDepartCalendar && (
        <>
          <div 
            onClick={() => setShowDepartCalendar(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            zIndex: 9999,
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            maxWidth: '400px',
            width: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedMonth(newDate);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  color: '#2D3748'
                }}
              >
                ‹
              </button>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#2D3748' }}>
                {selectedMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedMonth(newDate);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  color: '#2D3748'
                }}
              >
                ›
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6B7280', padding: '8px 0' }}>
                  {day}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {(() => {
                const year = selectedMonth.getFullYear();
                const month = selectedMonth.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const daysInMonth = lastDay.getDate();
                const startingDayOfWeek = firstDay.getDay();
                const days = [];
                
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(null);
                }
                for (let day = 1; day <= daysInMonth; day++) {
                  days.push(new Date(year, month, day));
                }

                return days.map((date, idx) => {
                  if (!date) return <div key={idx} />;

                  const isSelected = departDate && date.toDateString() === departDate.toDateString();
                  const minDate = arriveeDate ? new Date(arriveeDate) : new Date();
                  minDate.setHours(0, 0, 0, 0);
                  const isPast = date <= minDate;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!isPast) {
                          setDepart(formatDateForState(date));
                          setShowDepartCalendar(false);
                        }
                      }}
                      disabled={isPast}
                      style={{
                        padding: '12px 4px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isPast ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: isSelected ? 600 : 400,
                        background: isSelected ? '#60A29D' : 'transparent',
                        color: isSelected ? 'white' : isPast ? '#D1D5DB' : '#2D3748',
                        transition: 'all 0.2s ease',
                        opacity: isPast ? 0.4 : 1
                      }}
                      onMouseEnter={e => {
                        if (!isPast && !isSelected) {
                          e.target.style.background = '#F3F4F6';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isPast && !isSelected) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}
      
      {/* Global override moved to app/globals.css to avoid styled-jsx transform issues */}

      {/* Indicateur de résultats - masqué sur mobile */}
      {mounted && !isMobile && (
        <section ref={resultsIndicatorRef} style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 20px'
        }}>
          <div style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '16px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontWeight: 600, color: '#C96745' }}>
                {filteredItems.length}
              </span>
              <span style={{ color: '#666' }}>
                {filteredItems.length === 1 ? 'logement trouvé' : 'logements trouvés'}
              </span>
              {arriveeDate && departDate && (
                <span style={{ color: '#888', fontSize: '14px' }}>
                  • du {arriveeDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au {departDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              )}
              {voyageurs > 1 && (
                <span style={{ color: '#888', fontSize: '14px' }}>
                  • {voyageurs} {voyageurs > 1 ? 'personnes' : 'personne'}
                </span>
              )}
              {(priceMin > 0 || priceMax < 500) && (
                <span style={{ color: '#888', fontSize: '14px' }}>
                  • {priceMin}€ - {priceMax}€/nuit
                </span>
              )}
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              color: '#666'
            }}>
              {(propertyType || minBedrooms > 0 || minBathrooms > 0 || minBeds > 0) && (
                <>
                  <span>Filtres actifs:</span>
                  {propertyType && (
                    <span style={{
                      background: '#f0f9ff',
                      color: '#0369a1',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {propertyType}
                    </span>
                  )}
                  {minBedrooms > 0 && (
                    <span style={{
                      background: '#f0f9ff',
                      color: '#0369a1',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {minBedrooms}+ chambres
                    </span>
                  )}
                  {minBathrooms > 0 && (
                    <span style={{
                      background: '#f0f9ff',
                      color: '#0369a1',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {minBathrooms}+ SdB
                    </span>
                  )}
                  {minBeds > 0 && (
                    <span style={{
                      background: '#f0f9ff',
                      color: '#0369a1',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {minBeds}+ lits
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Modal des filtres avancés */}
      {showAdvancedFilters && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(34,34,34,0.5)', zIndex: 100000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowAdvancedFilters(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              padding: '40px', maxWidth: 500, width: '90vw', maxHeight: '90vh',
              position: 'relative', overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAdvancedFilters(false)}
              style={{
                position: 'absolute', top: 16, right: 20, background: '#f5f5f5',
                border: 'none', borderRadius: '50%', width: 32, height: 32,
                fontSize: 18, color: '#666', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#C96745';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.color = '#666';
              }}
              aria-label="Fermer"
            >×</button>
            
            <h3 style={{ 
              fontSize: 24, fontWeight: 700, color: '#222', marginBottom: 32,
              textAlign: 'center'
            }}>
              🎯 Filtres de recherche
            </h3>

            {/* Type de propriété */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ 
                fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'block', color: '#333'
              }}>
                🏠 Type de logement [indisponible, ne pas toucher]
              </label>
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 16px', borderRadius: 12, 
                  border: '2px solid #e5e7eb', fontSize: 16, background: '#fff',
                  transition: 'border-color 0.2s', outline: 'none'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#C96745'}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <option value="">Tous les types</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
                <option value="loft">Loft</option>
              </select>
            </div>

            {/* Fourchette de prix */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ 
                fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'block', color: '#333'
              }}>
                💰 Gamme de prix par nuit
              </label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Minimum</div>
                  <div style={{ 
                    background: '#f8f9fa', borderRadius: 12, padding: '12px 16px',
                    border: '2px solid #e5e7eb', fontSize: 18, fontWeight: 600, textAlign: 'center'
                  }}>
                    {priceMin}€
                  </div>
                </div>
                <div style={{ fontSize: 20, color: '#C96745', fontWeight: 600 }}>-</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Maximum</div>
                  <div style={{ 
                    background: '#f8f9fa', borderRadius: 12, padding: '12px 16px',
                    border: '2px solid #e5e7eb', fontSize: 18, fontWeight: 600, textAlign: 'center'
                  }}>
                    {priceMax}€
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', height: 40, paddingTop: 20 }}>
                {/* Track background */}
                <div style={{
                  position: 'absolute', top: 25, left: 0, right: 0, height: 6,
                  background: '#e5e7eb', borderRadius: 3, pointerEvents: 'none'
                }}></div>
                {/* Active range */}
                <div style={{
                  position: 'absolute', top: 25, 
                  left: `${(priceMin / 500) * 100}%`, 
                  right: `${100 - (priceMax / 500) * 100}%`, 
                  height: 6, background: '#C96745', borderRadius: 3, pointerEvents: 'none'
                }}></div>
                {/* Minimum slider */}
                <input
                  type="range"
                  min={0}
                  max={500}
                  value={priceMin}
                  onChange={e => { 
                    const val = Number(e.target.value); 
                    if (val <= priceMax - 10) setPriceMin(val); 
                  }}
                  className="range-slider range-slider-min"
                  style={{
                    position: 'absolute', top: 20, left: 0, width: '100%', height: 16,
                    background: 'transparent', outline: 'none',
                    WebkitAppearance: 'none', appearance: 'none', 
                    cursor: 'pointer', pointerEvents: 'none',
                    zIndex: priceMin > 500 - 100 ? 5 : 3
                  }}
                />
                {/* Maximum slider */}
                <input
                  type="range"
                  min={0}
                  max={500}
                  value={priceMax}
                  onChange={e => { 
                    const val = Number(e.target.value); 
                    if (val >= priceMin + 10) setPriceMax(val); 
                  }}
                  className="range-slider range-slider-max"
                  style={{
                    position: 'absolute', top: 20, left: 0, width: '100%', height: 16,
                    background: 'transparent', outline: 'none',
                    WebkitAppearance: 'none', appearance: 'none',
                    cursor: 'pointer', pointerEvents: 'none',
                    zIndex: priceMax < 100 ? 5 : 4
                  }}
                />
                <style>{`
                  /* Enable pointer events only on the thumb */
                  .range-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #C96745;
                    cursor: pointer;
                    border: 3px solid #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    pointer-events: auto;
                    position: relative;
                    z-index: 100;
                  }
                  .range-slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #C96745;
                    cursor: pointer;
                    border: 3px solid #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    pointer-events: auto;
                    position: relative;
                    z-index: 100;
                  }
                  .range-slider::-webkit-slider-thumb:hover {
                    box-shadow: 0 2px 12px rgba(201,103,69,0.4);
                    transform: scale(1.1);
                  }
                  .range-slider::-moz-range-thumb:hover {
                    box-shadow: 0 2px 12px rgba(201,103,69,0.4);
                    transform: scale(1.1);
                  }
                  .range-slider::-webkit-slider-thumb:active {
                    box-shadow: 0 2px 16px rgba(201,103,69,0.6);
                    transform: scale(1.15);
                  }
                  .range-slider::-moz-range-thumb:active {
                    box-shadow: 0 2px 16px rgba(201,103,69,0.6);
                    transform: scale(1.15);
                  }
                `}</style>
              </div>
            </div>

            {/* Configuration du logement */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ 
                fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'block', color: '#333'
              }}>
                🛏️ Configuration du logement
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20 }}>
                {/* Chambres */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Chambres min.</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setMinBedrooms(Math.max(0, minBedrooms - 1))}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', 
                        border: '2px solid #e5e7eb', background: '#fff', 
                        fontSize: 20, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#C96745';
                        e.currentTarget.style.background = '#C96745';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#000';
                      }}
                    >-</button>
                    <div style={{ 
                      minWidth: 32, fontSize: 18, fontWeight: 700, 
                      textAlign: 'center', color: '#C96745' 
                    }}>
                      {minBedrooms === 0 ? 'Toutes' : minBedrooms}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMinBedrooms(minBedrooms + 1)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '2px solid #e5e7eb', background: '#fff',
                        fontSize: 18, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#C96745';
                        e.currentTarget.style.background = '#C96745';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#000';
                      }}
                    >+</button>
                  </div>
                </div>

                {/* Salles de bain */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>S. de bain min.</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setMinBathrooms(Math.max(0, minBathrooms - 1))}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '2px solid #e5e7eb', background: '#fff',
                        fontSize: 20, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#C96745';
                        e.currentTarget.style.background = '#C96745';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#000';
                      }}
                    >-</button>
                    <div style={{ 
                      minWidth: 32, fontSize: 18, fontWeight: 700,
                      textAlign: 'center', color: '#C96745' 
                    }}>
                      {minBathrooms === 0 ? 'Toutes' : minBathrooms}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMinBathrooms(minBathrooms + 1)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '2px solid #e5e7eb', background: '#fff',
                        fontSize: 18, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#C96745';
                        e.currentTarget.style.background = '#C96745';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#000';
                      }}
                    >+</button>
                  </div>
                </div>

                {/* Lits */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Lits min.</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setMinBeds(Math.max(0, minBeds - 1))}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '2px solid #e5e7eb', background: '#fff',
                        fontSize: 20, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#C96745';
                        e.currentTarget.style.background = '#C96745';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#000';
                      }}
                    >-</button>
                    <div style={{ 
                      minWidth: 32, fontSize: 18, fontWeight: 700,
                      textAlign: 'center', color: '#C96745' 
                    }}>
                      {minBeds === 0 ? 'Tous' : minBeds}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMinBeds(minBeds + 1)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '2px solid #e5e7eb', background: '#fff',
                        fontSize: 18, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#C96745';
                        e.currentTarget.style.background = '#C96745';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#000';
                      }}
                    >+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button
                onClick={() => {
                  // Reset all filters
                  setPropertyType('');
                  setPriceMin(0);
                  setPriceMax(500);
                  setMinBedrooms(0);
                  setMinBathrooms(0);
                  setMinBeds(0);
                  applyFilters();
                }}
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: 12, fontSize: 16,
                  background: '#f8f9fa', color: '#666', border: '2px solid #e5e7eb',
                  cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#e5e7eb';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.color = '#666';
                }}
              >
                🔄 Réinitialiser
              </button>
              <button
                onClick={() => {
                  applyFilters();
                  setShowAdvancedFilters(false);
                }}
                style={{
                  flex: 2, padding: '14px 20px', borderRadius: 12, fontSize: 16,
                  background: '#C96745', color: '#fff', border: 'none',
                  cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(201,103,69,0.25)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#b85a3e';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(201,103,69,0.35)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#C96745';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,103,69,0.25)';
                }}
              >
                ✨ Appliquer les filtres
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main style={{ background: '#f7f8fa', minHeight: '100vh', paddingBottom: 32, paddingTop: isMobile ? 0 : undefined }}>
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0' : '0 16px' }}>
          <div
            ref={mapContainerRef}
            style={{
            position: 'relative',
            width: isMobile ? '100vw' : '100%',
            minWidth: isMobile ? 'unset' : 320,
            minHeight: 300,
            height: isMobile ? 540 : 400,
            borderRadius: isMobile ? 0 : 16,
            marginBottom: 32,
            marginTop: isMobile ? 0 : undefined,
            overflow: 'hidden',
            background: '#ddd',
            // full-bleed on mobile
            marginLeft: isMobile ? 0 : 0,
            marginRight: isMobile ? 0 : 0,
            // subtle top inner shadow to hint draggability
            boxShadow: isMobile ? 'inset 0 14px 24px -12px rgba(0,0,0,0.28)' : 'none'
          }}>
            {mounted && (
              <ListingsMap items={filteredItems} center={mapCenter} onCenterChange={setMapCenter} searchView={searchView} ratings={ratings} />
            )}
            
            {/* Scroll indicator - mobile only */}
            {isMobile && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 60%, rgba(255,255,255,1) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 16,
                  pointerEvents: 'auto',
                  zIndex: 1000,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (logementsListRef.current) {
                    logementsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  animation: 'bounce 2s infinite'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C96745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: '#C96745',
                    textAlign: 'center',
                    textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                  }}>
                    Voir les logements
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <style jsx>{`
            @keyframes bounce {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-8px);
              }
            }
          `}</style>
          
          {/* Liste des logements */}
          <div ref={logementsListRef} className="logements-list" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', 
            gap: 'clamp(16px, 3vw, 24px)',
            padding: '0 clamp(12px, 3vw, 0)'
          }}>
            {sortedItems.map((it) => {
              // Parse images array
              let imagesArr = [];
              if (it.images) {
                if (Array.isArray(it.images)) imagesArr = it.images;
                else if (typeof it.images === "string") {
                  try { const arr = JSON.parse(it.images); if (Array.isArray(arr)) imagesArr = arr; } catch {}
                }
              }
              if (!imagesArr.length && it.image_url) imagesArr = [it.image_url];
              const imgIdx = imageIndexes[it.id] || 0;
              const img = imagesArr[imgIdx] || null;

              // Calculate distance
              const hasCoords = typeof it.latitude === 'number' && typeof it.longitude === 'number';
              const distance = hasCoords ? Math.round(haversineKm(mapCenter, [it.latitude, it.longitude]) * 10) / 10 : null;

              // Mock rating data (replace with real data from database when available)
              const rating = ratings[it.id]?.average_rating || 0;
              const reviewCount = ratings[it.id]?.review_count || 0;

              return (
                <article 
                  key={it.id} 
                  className="logement-card" 
                  style={{ 
                    background: '#fff', 
                    borderRadius: 'clamp(12px, 2.5vw, 16px)', 
                    boxShadow: '0 1px 8px rgba(0,0,0,0.06)', 
                    overflow: 'hidden',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                    setHoveredCard(it.id);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)';
                    setHoveredCard(null);
                  }}
                  onClick={() => window.location.href = `/logement/${it.id}`}
                >
                  {/* Image container */}
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '4 / 3',
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)', 
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {img ? (
                      <>
                        {/* Carousel container */}
                        <div 
                          id={`listing-carousel-${it.id}`}
                          className="listing-carousel-swipe"
                          data-listing-id={it.id}
                          data-images-count={imagesArr.length}
                          style={{
                            display: 'flex',
                            height: '100%',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: `translateX(-${imgIdx * 100}%)`,
                            touchAction: 'pan-y'
                          }}
                          onTouchStart={(e) => {
                            if (imagesArr.length <= 1) return;
                            const carousel = e.currentTarget;
                            carousel.dataset.startX = e.touches[0].clientX;
                            carousel.dataset.startY = e.touches[0].clientY;
                            carousel.dataset.isDragging = 'true';
                            carousel.dataset.preventClick = 'false';
                            carousel.dataset.isHorizontal = 'false';
                            carousel.style.transition = 'none';
                          }}
                          onTouchMove={(e) => {
                            if (imagesArr.length <= 1) return;
                            const carousel = e.currentTarget;
                            if (carousel.dataset.isDragging !== 'true') return;
                            
                            const currentX = e.touches[0].clientX;
                            const currentY = e.touches[0].clientY;
                            const startX = parseFloat(carousel.dataset.startX);
                            const startY = parseFloat(carousel.dataset.startY);
                            const diffX = currentX - startX;
                            const diffY = currentY - startY;
                            
                            // Détecter la direction du swipe
                            if (carousel.dataset.isHorizontal === 'false' && (Math.abs(diffX) > 5 || Math.abs(diffY) > 5)) {
                              carousel.dataset.isHorizontal = Math.abs(diffX) > Math.abs(diffY) ? 'true' : 'false';
                            }
                            
                            // Si c'est un swipe horizontal, bloquer le scroll vertical
                            if (carousel.dataset.isHorizontal === 'true') {
                              carousel.dataset.currentX = currentX;
                              carousel.dataset.preventClick = 'true';
                              carousel.style.transform = `translateX(calc(-${imgIdx * 100}% + ${diffX}px))`;
                            }
                          }}
                          onTouchEnd={(e) => {
                            if (imagesArr.length <= 1) return;
                            const carousel = e.currentTarget;
                            if (carousel.dataset.isDragging !== 'true') return;
                            
                            carousel.dataset.isDragging = 'false';
                            const currentX = parseFloat(carousel.dataset.currentX || carousel.dataset.startX);
                            const startX = parseFloat(carousel.dataset.startX);
                            const diff = currentX - startX;
                            const threshold = 50;
                            
                            carousel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                            
                            if (carousel.dataset.isHorizontal === 'true') {
                              if (diff < -threshold && imgIdx < imagesArr.length - 1) {
                                setImageIndexes(idx => ({ 
                                  ...idx, 
                                  [it.id]: imgIdx + 1
                                }));
                              } else if (diff > threshold && imgIdx > 0) {
                                setImageIndexes(idx => ({ 
                                  ...idx, 
                                  [it.id]: imgIdx - 1
                                }));
                              } else {
                                carousel.style.transform = `translateX(-${imgIdx * 100}%)`;
                              }
                            } else {
                              carousel.style.transform = `translateX(-${imgIdx * 100}%)`;
                            }
                            
                            // Reset preventClick after a short delay
                            setTimeout(() => {
                              carousel.dataset.preventClick = 'false';
                              carousel.dataset.isHorizontal = 'false';
                            }, 100);
                          }}
                          onClick={(e) => {
                            const carousel = e.currentTarget;
                            if (carousel.dataset.preventClick === 'true') {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {imagesArr.map((image, idx) => (
                            <img
                              key={idx}
                              src={image}
                              alt={`${it.title} - Image ${idx + 1}`}
                              style={{
                                minWidth: '100%',
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                transition: 'transform 0.4s cubic-bezier(.7,.2,.3,1)',
                                transform: hoveredCard === it.id ? 'scale(1.05)' : 'scale(1)',
                                userSelect: 'none',
                                pointerEvents: 'none'
                              }}
                              draggable="false"
                            />
                          ))}
                        </div>
                        {/* Image navigation buttons - Desktop only */}
                        {imagesArr.length > 1 && hoveredCard === it.id && (
                          <>
                            <button
                              type="button"
                              aria-label="Précédent"
                              className="carousel-btn-desktop"
                              style={{ 
                                position: 'absolute', 
                                left: 8, 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                background: 'rgba(255,255,255,0.95)', 
                                border: 'none', 
                                borderRadius: '50%', 
                                width: 32, 
                                height: 32, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer', 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                transition: 'all 0.2s',
                                zIndex: 10
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                setImageIndexes(idx => ({ 
                                  ...idx, 
                                  [it.id]: (imgIdx - 1 + imagesArr.length) % imagesArr.length 
                                }));
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                e.currentTarget.style.background = '#fff';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                              </svg>
                            </button>
                            <button
                              type="button"
                              aria-label="Suivant"
                              className="carousel-btn-desktop"
                              style={{ 
                                position: 'absolute', 
                                right: 8, 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                background: 'rgba(255,255,255,0.95)', 
                                border: 'none', 
                                borderRadius: '50%', 
                                width: 32, 
                                height: 32, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer', 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                transition: 'all 0.2s',
                                zIndex: 10
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                setImageIndexes(idx => ({ 
                                  ...idx, 
                                  [it.id]: (imgIdx + 1) % imagesArr.length 
                                }));
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                e.currentTarget.style.background = '#fff';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </button>
                          </>
                        )}
                        {/* Image indicator dots */}
                        {imagesArr.length > 1 && (
                          <div style={{
                            position: 'absolute',
                            bottom: 10,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 5,
                            zIndex: 5
                          }}>
                            {imagesArr.map((_, idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: idx === imgIdx ? 18 : 6,
                                  height: 6,
                                  borderRadius: 3,
                                  background: idx === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: 48,
                        opacity: 0.3
                      }}>
                        🏠
                      </div>
                    )}
                    
                    {/* Distance badge */}
                    {distance != null && isFinite(distance) && (
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(6px)',
                        padding: 'clamp(4px, 1vw, 5px) clamp(8px, 2vw, 10px)',
                        borderRadius: 16,
                        fontSize: 'clamp(11px, 2vw, 12px)',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C96745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {distance} km
                      </div>
                    )}

                    {/* Availability badge (when dates are selected) */}
                    {arrivee && depart && (
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: 'rgba(34,197,94,0.92)',
                        backdropFilter: 'blur(6px)',
                        padding: 'clamp(4px, 1vw, 5px) clamp(8px, 2vw, 10px)',
                        borderRadius: 16,
                        fontSize: 'clamp(11px, 2vw, 12px)',
                        fontWeight: 600,
                        color: '#fff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Disponible
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: 'clamp(14px, 3vw, 18px)', display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 10px)', flex: 1 }}>
                    {/* City and rating */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        fontSize: 'clamp(12px, 2.2vw, 13px)', 
                        color: '#666', 
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                      {it.city || 'Non spécifié'}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 3,
                        background: '#fffbf5',
                        padding: '3px 8px',
                        borderRadius: 10,
                        flexShrink: 0
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <span style={{ fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: 600, color: '#1a1a1a' }}>
                          {rating.toFixed(1)}
                        </span>
                        <span style={{ fontSize: 'clamp(10px, 1.8vw, 11px)', color: '#999' }}>
                          ({reviewCount})
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 style={{ 
                      fontSize: 'clamp(14px, 2.8vw, 16px)', 
                      fontWeight: 700, 
                      color: '#1a1a1a',
                      margin: 0,
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: 'clamp(36px, 7vw, 40px)'
                    }}>
                      {it.title}
                    </h3>

                    {/* Rating badge */}
                    {ratings[it.id] && ratings[it.id].review_count > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 6
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                        </svg>
                        <span style={{ 
                          fontSize: 'clamp(12px, 2.3vw, 13px)', 
                          fontWeight: 600, 
                          color: '#92400e' 
                        }}>
                          {ratings[it.id].average_rating}
                        </span>
                        <span style={{ 
                          fontSize: 'clamp(10px, 2vw, 11px)', 
                          color: '#999' 
                        }}>
                          ({ratings[it.id].review_count})
                        </span>
                      </div>
                    )}

                    {/* Property details */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'clamp(10px, 2.5vw, 14px)',
                      fontSize: 'clamp(11px, 2.2vw, 13px)',
                      color: '#666',
                      flexWrap: 'wrap'
                    }}>
                      {it.nb_voyageurs && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          <span>{it.nb_voyageurs}</span>
                        </div>
                      )}
                      {it.bedrooms && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 10.07 10h3.86a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 18.07 7H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                            <path d="M3 9v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/>
                          </svg>
                          <span>{it.bedrooms} ch</span>
                        </div>
                      )}
                      {it.bathrooms && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 22v-4H7a2 2 0 0 1-2-2V7a4 4 0 0 1 8 0v9a2 2 0 0 1-2 2h-2Z"/>
                            <path d="M13 9h5a2 2 0 0 1 2 2v5"/>
                          </svg>
                          <span>{it.bathrooms} sdb</span>
                        </div>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div style={{ 
                      marginTop: 'auto',
                      paddingTop: 'clamp(10px, 2vw, 12px)',
                      borderTop: '1px solid #f3f3f3',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <div>
                        {(() => {
                          const feeMult = getFeeMultiplier();
                          const base = Number(it.price_per_night) || 0;
                          const fee = base * (feeMult - 1);
                          const total = base + fee;
                          return (
                            <>
                              <div style={{ 
                                fontSize: 'clamp(18px, 3.5vw, 20px)', 
                                fontWeight: 700, 
                                color: '#C96745',
                                lineHeight: 1
                              }}>
                                {Math.round(total)}€
                              </div>
                              <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: '#999', marginTop: 2 }}>
                                par nuit
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <a
                        href={`/logement/${it.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3vw, 18px)',
                          borderRadius: 10,
                          background: '#C96745',
                          color: '#fff',
                          border: 'none',
                          fontSize: 'clamp(12px, 2.3vw, 14px)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          display: 'inline-block',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 6px rgba(201,103,69,0.18)',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#b85a3e';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 10px rgba(201,103,69,0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#C96745';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(201,103,69,0.18)';
                        }}
                      >
                        Voir plus
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Alternative listings section - shown when dates are selected */}
          {arrivee && depart && Array.isArray(alternativeListings) && alternativeListings.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: 32,
                padding: '24px',
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                borderRadius: 16,
                border: '1px solid #fed7aa'
              }}>
                <h2 style={{ 
                  fontSize: 24, 
                  fontWeight: 700, 
                  color: '#C96745',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {filteredItems.length > 0 ? 'Autres dates disponibles' : 'Dates alternatives disponibles'}
                </h2>
                <p style={{ 
                  fontSize: 15, 
                  color: '#92400e', 
                  margin: 0,
                  maxWidth: 600,
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}>
                  {filteredItems.length > 0 
                    ? 'Découvrez d\'autres logements correspondant à vos critères avec des disponibilités proches de vos dates.'
                    : 'Ces logements correspondent à vos critères mais ne sont pas disponibles aux dates exactes demandées. Découvrez leurs prochaines disponibilités !'}
                </p>
              </div>

              <div className="alternative-listings" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
                gap: 24 
              }}>
                {alternativeListings.map((it) => {
                  // Parse images array
                  let imagesArr = [];
                  if (it.images) {
                    if (Array.isArray(it.images)) imagesArr = it.images;
                    else if (typeof it.images === "string") {
                      try { const arr = JSON.parse(it.images); if (Array.isArray(arr)) imagesArr = arr; } catch {}
                    }
                  }
                  if (!imagesArr.length && it.image_url) imagesArr = [it.image_url];
                  const imgIdx = imageIndexes[it.id] || 0;
                  const img = imagesArr[imgIdx] || null;

                  // Calculate distance
                  const hasCoords = typeof it.latitude === 'number' && typeof it.longitude === 'number';
                  const distance = hasCoords ? Math.round(haversineKm(mapCenter, [it.latitude, it.longitude]) * 10) / 10 : null;

                  // Mock rating data
                  const rating = ratings[it.id]?.average_rating || 0;
                  const reviewCount = ratings[it.id]?.review_count || 0;

                  const range = it.availabilityRange;

                  return (
                    <article 
                      key={it.id} 
                      className="alternative-card" 
                      style={{ 
                        background: '#fff', 
                        borderRadius: 20, 
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', 
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        border: '2px solid #fed7aa'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                        setHoveredCard(it.id);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                        setHoveredCard(null);
                      }}
                      onClick={() => window.location.href = `/logement/${it.id}`}
                    >
                      {/* Image container */}
                      <div style={{ 
                        width: '100%', 
                        height: 240, 
                        background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)', 
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {img ? (
                          <>
                            {/* Carousel container */}
                            <div 
                              id={`alt-carousel-${it.id}`}
                              style={{
                                display: 'flex',
                                height: '100%',
                                transition: 'transform 0.3s ease',
                                transform: `translateX(-${imgIdx * 100}%)`
                              }}
                            >
                              {imagesArr.map((image, idx) => (
                                <img
                                  key={idx}
                                  src={image}
                                  alt={`${it.title} - Image ${idx + 1}`}
                                  style={{
                                    minWidth: '100%',
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    transition: 'transform 0.4s cubic-bezier(.7,.2,.3,1)',
                                    transform: hoveredCard === it.id ? 'scale(1.05)' : 'scale(1)',
                                    userSelect: 'none',
                                    pointerEvents: 'none'
                                  }}
                                  draggable="false"
                                />
                              ))}
                            </div>
                            {/* Image navigation buttons */}
                            {imagesArr.length > 1 && hoveredCard === it.id && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Précédent"
                                  style={{ 
                                    position: 'absolute', 
                                    left: 12, 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    background: 'rgba(255,255,255,0.95)', 
                                    border: 'none', 
                                    borderRadius: '50%', 
                                    width: 36, 
                                    height: 36, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    cursor: 'pointer', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    transition: 'all 0.2s',
                                    zIndex: 10
                                  }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setImageIndexes(idx => ({ 
                                      ...idx, 
                                      [it.id]: (imgIdx - 1 + imagesArr.length) % imagesArr.length 
                                    }));
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                    e.currentTarget.style.background = '#fff';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                                  }}
                                >
                                  <svg width="20" height="20" viewBox="0 0 20 20">
                                    <polyline points="13 5 7 10 13 15" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  aria-label="Suivant"
                                  style={{ 
                                    position: 'absolute', 
                                    right: 12, 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    background: 'rgba(255,255,255,0.95)', 
                                    border: 'none', 
                                    borderRadius: '50%', 
                                    width: 36, 
                                    height: 36, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    cursor: 'pointer', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    transition: 'all 0.2s',
                                    zIndex: 10
                                  }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setImageIndexes(idx => ({ 
                                      ...idx, 
                                      [it.id]: (imgIdx + 1) % imagesArr.length 
                                    }));
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                    e.currentTarget.style.background = '#fff';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                                  }}
                                >
                                  <svg width="20" height="20" viewBox="0 0 20 20">
                                    <polyline points="7 5 13 10 7 15" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              </>
                            )}
                            {/* Image indicator dots */}
                            {imagesArr.length > 1 && (
                              <div style={{
                                position: 'absolute',
                                bottom: 12,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: 6,
                                zIndex: 5
                              }}>
                                {imagesArr.map((_, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      background: idx === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                                      transition: 'all 0.3s',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: 48,
                            opacity: 0.3
                          }}>
                            🏠
                          </div>
                        )}
                        
                        {/* Distance badge */}
                        {distance != null && isFinite(distance) && (
                          <div style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(8px)',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#222',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C96745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {distance} km
                          </div>
                        )}

                        {/* Alternative dates badge */}
                        {range && (
                          <div style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            background: 'rgba(245,158,11,0.95)',
                            backdropFilter: 'blur(8px)',
                            padding: '8px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: 2,
                            maxWidth: '70%'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span style={{ fontSize: 11, opacity: 0.9 }}>Disponible:</span>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>
                              {new Date(range.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {new Date(range.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.85 }}>
                              ({range.length} {range.length > 1 ? 'nuits' : 'nuit'})
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                        {/* City and rating */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: 14, 
                              color: '#666', 
                              fontWeight: 500,
                              marginBottom: 4
                            }}>
                              📍 {it.city || 'Non spécifié'}
                            </div>
                          </div>
                          {reviewCount > 0 && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 4,
                              background: '#fff7ed',
                              padding: '4px 10px',
                              borderRadius: 12
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>
                                {rating.toFixed(1)}
                              </span>
                              <span style={{ fontSize: 13, color: '#888' }}>
                                ({reviewCount})
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 style={{ 
                          fontSize: 18, 
                          fontWeight: 700, 
                          color: '#222',
                          margin: 0,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {it.title}
                        </h3>

                        {/* Property details */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 16,
                          fontSize: 14,
                          color: '#666',
                          flexWrap: 'wrap'
                        }}>
                          {it.nb_voyageurs && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                              </svg>
                              <span>{it.nb_voyageurs}</span>
                            </div>
                          )}
                          {it.bedrooms && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 10.07 10h3.86a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 18.07 7H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                                <path d="M3 9v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/>
                              </svg>
                              <span>{it.bedrooms} ch</span>
                            </div>
                          )}
                          {it.bathrooms && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 22v-4H7a2 2 0 0 1-2-2V7a4 4 0 0 1 8 0v9a2 2 0 0 1-2 2h-2Z"/>
                                <path d="M13 9h5a2 2 0 0 1 2 2v5"/>
                              </svg>
                              <span>{it.bathrooms} sdb</span>
                            </div>
                          )}
                        </div>

                        {/* Price and CTA */}
                        <div style={{ 
                          marginTop: 'auto',
                          paddingTop: 16,
                          borderTop: '1px solid #f0f0f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ 
                              fontSize: 22, 
                              fontWeight: 700, 
                              color: '#C96745',
                              lineHeight: 1
                            }}>
                              {(it.price_per_night * 1.17).toFixed(0)}€
                            </div>
                            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                              par nuit
                            </div>
                          </div>
                          <a
                            href={`/logement/${it.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              padding: '10px 20px',
                              borderRadius: 12,
                              background: '#f59e0b',
                              color: '#fff',
                              border: 'none',
                              fontSize: 15,
                              fontWeight: 600,
                              cursor: 'pointer',
                              textDecoration: 'none',
                              display: 'inline-block',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 8px rgba(245,158,11,0.2)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#d97706';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f59e0b';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,158,11,0.2)';
                            }}
                          >
                            Voir dates
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LogementsInner />
    </Suspense>
  );
}