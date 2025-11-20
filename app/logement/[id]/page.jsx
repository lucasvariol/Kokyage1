"use client";

import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import { OwnerConsentAgreement } from '@/owner-consent';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getFeeMultiplier, percentLabel } from '@/lib/commissions';
import ReviewsSection from '../../_components/ReviewsSection';

const MapPreview = dynamic(() => import('../../_components/MapPreview'), { ssr: false });
// Sélecteur de dates et formats
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { fr } from 'date-fns/locale';
import { differenceInCalendarDays } from 'date-fns';

// --- Galerie professionnelle ---
function Gallery({ images }) {
  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const carouselRef = useRef(null);
  const modalCarouselRef = useRef(null);
  const preventModalClickRef = useRef(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  // Navigation clavier
  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalOpen, current]);

  // Bloquer le scroll du body quand modal ouverte
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const closeModal = () => {
    setModalOpen(false);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Support du swipe sur mobile (galerie principale)
  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const carousel = carouselRef.current;
    if (!carousel) return;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const snapToIndex = (idx) => {
      carousel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      carousel.style.transform = `translateX(-${idx * 100}%)`;
    };

    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      startX = e.touches[0].clientX;
      currentX = startX;
      isDragging = true;
      preventModalClickRef.current = false;
      carousel.style.transition = 'none';
    };

    const onTouchMove = (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      if (Math.abs(diff) > 5) preventModalClickRef.current = true;
      const idx = currentRef.current;
      carousel.style.transform = `translateX(calc(-${idx * 100}% + ${diff}px))`;
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      const diff = currentX - startX;
      const threshold = 50;
      const idx = currentRef.current;

      if (diff < -threshold && idx < images.length - 1) {
        const nextIdx = idx + 1;
        currentRef.current = nextIdx;
        setCurrent(nextIdx);
        snapToIndex(nextIdx);
      } else if (diff > threshold && idx > 0) {
        const prevIdx = idx - 1;
        currentRef.current = prevIdx;
        setCurrent(prevIdx);
        snapToIndex(prevIdx);
      } else {
        snapToIndex(idx);
      }
    };

    carousel.addEventListener('touchstart', onTouchStart, { passive: true });
    carousel.addEventListener('touchmove', onTouchMove, { passive: true });
    carousel.addEventListener('touchend', onTouchEnd, { passive: true });
    carousel.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      carousel.removeEventListener('touchstart', onTouchStart);
      carousel.removeEventListener('touchmove', onTouchMove);
      carousel.removeEventListener('touchend', onTouchEnd);
      carousel.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [images]);

  // Swipe sur modal
  useEffect(() => {
    if (!modalOpen || !images || images.length <= 1) return;
    const carousel = modalCarouselRef.current;
    if (!carousel) return;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const snapToIndex = (idx) => {
      carousel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      carousel.style.transform = `translateX(-${idx * 100}%)`;
    };

    const onTouchStart = (e) => {
      if (imageScale > 1) return; // Pas de swipe si zoom
      if (!e.touches || e.touches.length === 0) return;
      startX = e.touches[0].clientX;
      currentX = startX;
      isDragging = true;
      carousel.style.transition = 'none';
    };

    const onTouchMove = (e) => {
      if (!isDragging || imageScale > 1) return;
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      const idx = currentRef.current;
      carousel.style.transform = `translateX(calc(-${idx * 100}% + ${diff}px))`;
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      const diff = currentX - startX;
      const threshold = 70;
      const idx = currentRef.current;

      if (diff < -threshold && idx < images.length - 1) {
        const nextIdx = idx + 1;
        currentRef.current = nextIdx;
        setCurrent(nextIdx);
        snapToIndex(nextIdx);
      } else if (diff > threshold && idx > 0) {
        const prevIdx = idx - 1;
        currentRef.current = prevIdx;
        setCurrent(prevIdx);
        snapToIndex(prevIdx);
      } else {
        snapToIndex(idx);
      }
    };

    carousel.addEventListener('touchstart', onTouchStart, { passive: true });
    carousel.addEventListener('touchmove', onTouchMove, { passive: true });
    carousel.addEventListener('touchend', onTouchEnd, { passive: true });
    carousel.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      carousel.removeEventListener('touchstart', onTouchStart);
      carousel.removeEventListener('touchmove', onTouchMove);
      carousel.removeEventListener('touchend', onTouchEnd);
      carousel.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [modalOpen, images, imageScale]);

  if (!images || images.length === 0) {
    return (
      <div style={{
        width: '100%',
        maxWidth: 1200,
        aspectRatio: '16/9',
        margin: '0 auto 24px',
        background: '#f9fafb',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: 15,
        fontWeight: 500,
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', opacity: 0.3 }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <div>Aucune photo disponible</div>
        </div>
      </div>
    );
  }

  const prevImage = () => {
    setCurrent((current - 1 + images.length) % images.length);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };
  
  const nextImage = () => {
    setCurrent((current + 1) % images.length);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .gallery-grid {
            display: none !important;
          }
          .mobile-view-all {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .gallery-carousel-wrapper {
            display: none !important;
          }
          .mobile-view-all {
            display: none !important;
          }
        }
      `}</style>

      <div className="gallery-container" style={{
        marginBottom: 32,
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto 32px'
      }}>
        {/* Desktop: Grille d'images */}
        <div className="gallery-grid" style={{
          display: 'grid',
          gridTemplateColumns: images.length === 1 ? '1fr' : '1fr 1fr',
          gap: 12,
          borderRadius: 16,
          overflow: 'hidden',
          height: images.length === 1 ? 500 : 480
        }}>
          {/* Image principale */}
          <div
            onClick={() => { setCurrent(0); setModalOpen(true); }}
            style={{
              position: 'relative',
              gridRow: images.length > 1 ? 'span 2' : 'span 1',
              cursor: 'pointer',
              overflow: 'hidden',
              background: '#000'
            }}
          >
            <img
              src={images[0]}
              alt="Photo principale du logement"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3))',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Images secondaires (max 4) */}
          {images.slice(1, 5).map((url, idx) => (
            <div
              key={idx}
              onClick={() => { setCurrent(idx + 1); setModalOpen(true); }}
              style={{
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                background: '#000'
              }}
            >
              <img
                src={url}
                alt={`Photo ${idx + 2} du logement`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              {/* Badge "Voir plus" sur la dernière image */}
              {idx === 3 && images.length > 5 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 600,
                  transition: 'background 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>+{images.length - 5}</div>
                    <div style={{ fontSize: 14 }}>Voir toutes les photos</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Carousel */}
        <div className="gallery-carousel-wrapper" style={{
          position: 'relative',
          width: '100%',
          background: '#000',
          borderRadius: 12,
          overflow: 'hidden'
        }}>
          <div
            ref={carouselRef}
            style={{
              display: 'flex',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: `translateX(-${current * 100}%)`,
              touchAction: 'pan-y'
            }}
          >
            {images.map((url, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (preventModalClickRef.current) {
                    preventModalClickRef.current = false;
                    return;
                  }
                  setModalOpen(true);
                }}
                style={{
                  minWidth: '100%',
                  aspectRatio: '4/3',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={url}
                  alt={`Photo ${idx + 1} du logement`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                  draggable="false"
                />
              </div>
            ))}
          </div>

          {/* Navigation mobile */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 12,
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                aria-label="Image précédente"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 12,
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                aria-label="Image suivante"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </>
          )}

          {/* Compteur */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 13,
            color: '#fff',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>
            {current + 1} / {images.length}
          </div>
        </div>

        {/* Bouton "Voir toutes les photos" sur mobile */}
        <button
          className="mobile-view-all"
          onClick={() => setModalOpen(true)}
          style={{
            display: 'none',
            marginTop: 12,
            width: '100%',
            padding: '12px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Voir toutes les photos ({images.length})
        </button>
      </div>

      {/* Modal plein écran */}
      {modalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.96)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header de la modal */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '0.3px'
            }}>
              {current + 1} / {images.length}
            </div>
            <button
              onClick={closeModal}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              aria-label="Fermer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Container des images */}
          <div style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div
              ref={modalCarouselRef}
              style={{
                display: 'flex',
                height: '100%',
                width: '100%',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: `translateX(-${current * 100}%)`,
                touchAction: imageScale > 1 ? 'none' : 'pan-y'
              }}
            >
              {images.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    minWidth: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}
                >
                  <img
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: 8,
                      userSelect: 'none',
                      transform: idx === current ? `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)` : 'none',
                      transition: idx === current ? 'none' : 'transform 0.3s ease',
                      cursor: imageScale > 1 ? 'grab' : 'default'
                    }}
                    draggable="false"
                  />
                </div>
              ))}
            </div>

            {/* Navigation desktop */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                  aria-label="Image précédente"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  style={{
                    position: 'absolute',
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                  aria-label="Image suivante"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Thumbnails en bas */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            overflowX: 'auto',
            overflowY: 'hidden',
            display: 'flex',
            gap: 8,
            WebkitOverflowScrolling: 'touch'
          }}>
            {images.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Miniature ${idx + 1}`}
                onClick={() => setCurrent(idx)}
                style={{
                  width: 80,
                  height: 60,
                  minWidth: 80,
                  objectFit: 'cover',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: current === idx ? '2px solid #fff' : '2px solid transparent',
                  opacity: current === idx ? 1 : 0.5,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = current === idx ? '1' : '0.5'}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// --- StarIcon SVG ---
function StarIcon({ size = 18, color = "#C96745" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color} style={{ verticalAlign: 'middle' }}>
      <polygon points="10,2 12.59,7.26 18.2,7.97 14,12.14 15.18,17.63 10,14.77 4.82,17.63 6,12.14 1.8,7.97 7.41,7.26" />
    </svg>
  );
}

// Display-only stars with half-fill support based on value (0.5 increments)
function StarAverageInline({ value = 0, size = 18 }) {
  const rounded = Math.round((Number(value) || 0) * 2) / 2; // nearest 0.5
  const full = Math.floor(rounded);
  const hasHalf = rounded - full === 0.5;

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1,2,3,4,5].map((i) => {
        let fill = 0;
        if (i <= full) fill = 100;
        else if (i === full + 1 && hasHalf) fill = 50;
        return <StarInline key={i} fillPercent={fill} size={size} />;
      })}
    </div>
  );
}

function StarInline({ fillPercent = 0, size = 18 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Outline */}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0 }}>
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
      </svg>
      {/* Filled overlay clipped by width */}
      <div style={{ position: 'absolute', inset: 0, width: `${fillPercent}%`, overflow: 'hidden' }}>
        <svg width={size} height={size} viewBox="0 0 24 24">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}

export default function Page({ params }) {
  const [item, setItem] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [images, setImages] = useState([]);
  const [copied, setCopied] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  // Sélection de dates et prix
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [availableDates, setAvailableDates] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [activeField, setActiveField] = useState('from');
  const [showPriceDetail, setShowPriceDetail] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState(1);
  // Avis et statistiques d'avis
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ count: 0, avg: 0 });
  // Pause accord propriétaire
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [confirmPauseChecked, setConfirmPauseChecked] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [pauseError, setPauseError] = useState('');
  // Réactivation accord propriétaire
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivateConsentChecked, setReactivateConsentChecked] = useState(false);
  const [reactivateConsentOpen, setReactivateConsentOpen] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [reactivateError, setReactivateError] = useState('');
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false); // Mode lecture seule
  // Modal d'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [currentImages, setCurrentImages] = useState([]); // Images existantes
  const [newImages, setNewImages] = useState([]);
  const [newPreviewImages, setNewPreviewImages] = useState([]);
  // Champs du formulaire d'édition
  const [editTitle, setEditTitle] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNbVoyageurs, setEditNbVoyageurs] = useState(1);
  const [editBedrooms, setEditBedrooms] = useState(1);
  const [editBathrooms, setEditBathrooms] = useState(1);
  const [editBeds, setEditBeds] = useState(1);
  const [editOwnerEmail, setEditOwnerEmail] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  // Autocomplete adresse
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const router = useRouter();

  // Helper d'affichage pour montrer le libellé exact du statut et des couleurs cohérentes
  function getStatusMeta(status) {
    const s = (status || '').toString();
    if (s === 'validé modérateur') {
      return { label: s, bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#065f46', border: '#6ee7b7' };
    }
    if (s === 'Accord propriétaire en pause') {
      return { label: s, bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#7f1d1d', border: '#fecaca' };
    }
    if (s === 'en attente validation modérateur' || s === 'en attente validation propriétaire' || s === 'pending') {
      // compat: 'pending' => on affiche comme "en attente validation modérateur"
      const label = s === 'pending' ? 'en attente validation modérateur' : s;
      return { label, bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e', border: '#fcd34d' };
    }
    if (s === 'published') {
      // compat: published => validé modérateur
      return { label: 'validé modérateur', bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#065f46', border: '#6ee7b7' };
    }
    return { label: s || '—', bg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', color: '#334155', border: '#cbd5e1' };
  }

  // Mapping util pour les statuts
  function getStatusMeta(status) {
    const s = (status || '').toString();
    if (s === 'validé modérateur') {
      return {
        label: 'Publié',
        bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        color: '#065f46',
        border: '#6ee7b7',
        icon: 'check',
      };
    }
    if (s === 'Accord propriétaire en pause') {
      return {
        label: 'Accord propriétaire en pause',
        bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        color: '#7f1d1d',
        border: '#fecaca',
        icon: 'pause',
      };
    }
    if (s === 'en attente validation propriétaire' || s === 'en attente validation modérateur' || s === 'pending') {
      return {
        label: s === 'pending' ? 'en attente validation modérateur' : s,
        bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        color: '#92400e',
        border: '#fcd34d',
        icon: 'clock',
      };
    }
    if (s === 'published') {
      // compat ancien code si présent encore
      return {
        label: 'validé modérateur',
        bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        color: '#065f46',
        border: '#6ee7b7',
        icon: 'check',
      };
    }
    // défaut
    return {
      label: s || '—',
      bg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      color: '#334155',
      border: '#cbd5e1',
      icon: 'info',
    };
  }

  // Récupère le token d'accès pour authentifier les appels aux routes sécurisées
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted && data?.session?.access_token) {
          setAccessToken(data.session.access_token);
        }
      } catch (e) {
        // noop: si on n'a pas de token, l'API répondra 401
      }
    })();
    return () => { mounted = false; };
  }, []);

  // --- Fonctions principales ---
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const handleEdit = () => {
    if (!item) return;
    // Pré-remplir tous les champs avec les données actuelles
    setEditTitle(item.title || '');
    setEditCity(item.city || '');
    setEditStreet(item.address || '');
    setEditPrice(item.price_per_night?.toString() || '');
    setEditDescription(item.description || '');
    setEditNbVoyageurs(item.nb_voyageurs || 1);
    setEditBedrooms(item.bedrooms || 1);
    setEditBathrooms(item.bathrooms || 1);
    setEditBeds(item.beds || 1);
    setEditLatitude(item.latitude?.toString() || '');
    setEditLongitude(item.longitude?.toString() || '');
    setAddressConfirmed(true); // Adresse déjà validée
    setCurrentImages(item.images || []); // Initialise les images existantes
    setNewImages([]);
    setNewPreviewImages([]);
    setEditError('');
    setShowEditModal(true);
  };

  // Fonctions pour le modal d'édition
  const handleEditAddressChange = (e) => {
    const value = e.target.value;
    setEditStreet(value);
    setAddressConfirmed(false); // Réinitialise la confirmation

    if (!value.trim()) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    setIsLoadingSuggestions(true);
    setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`
        );
        const data = await response.json();
        setAddressSuggestions(data.features || []);
      } catch (error) {
        console.error('Erreur lors de la recherche d\'adresse:', error);
        setAddressSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  };

  const selectEditAddress = (suggestion) => {
    const properties = suggestion.properties;
    setEditStreet(properties.label);
    setEditCity(properties.city || '');
    setEditLatitude(suggestion.geometry.coordinates[1]);
    setEditLongitude(suggestion.geometry.coordinates[0]);
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setAddressConfirmed(true);
  };

  const handleNewFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewPreviewImages(previews);
  };

  const removeNewImage = (index) => {
    const updatedImages = newImages.filter((_, i) => i !== index);
    const updatedPreviews = newPreviewImages.filter((_, i) => i !== index);
    setNewImages(updatedImages);
    setNewPreviewImages(updatedPreviews);
  };

  const removeCurrentImage = (index) => {
    const updatedImages = currentImages.filter((_, i) => i !== index);
    setCurrentImages(updatedImages);
  };

  const uploadNewImages = async (files) => {
    const uploadPromises = files.map(async (file) => {
      const safeName = file.name.replace(/[^A-Za-z0-9_.-]/g, '_');
      const path = `listings/${item.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from('photos')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

      if (error) {
        console.error('Erreur upload:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(path);

      return publicUrlData?.publicUrl || null;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls.filter((url) => url);
  };

  const handleSaveEdit = async () => {
    setEditLoading(true);
    setEditError('');

    if (!editTitle || !editStreet || !editCity || !editPrice || !editDescription) {
      setEditError('Veuillez remplir tous les champs obligatoires');
      setEditLoading(false);
      return;
    }

    if (!addressConfirmed) {
      setEditError('Veuillez sélectionner une adresse dans les suggestions');
      setEditLoading(false);
      return;
    }

    // Upload des nouvelles images si présentes et combine avec les images existantes conservées
    let imageUrls = [...currentImages]; // Part des images existantes non supprimées
    if (newImages.length > 0) {
      const newUrls = await uploadNewImages(newImages);
      if (newUrls.length === 0) {
        setEditError("Erreur lors de l'upload des images");
        setEditLoading(false);
        return;
      }
      imageUrls = [...imageUrls, ...newUrls];
    }

    const updateFields = {
      title: editTitle,
      city: editCity,
      address: editStreet,
      price_per_night: parseFloat(editPrice),
      description: editDescription,
      nb_voyageurs: editNbVoyageurs,
      bedrooms: editBedrooms,
      bathrooms: editBathrooms,
      beds: editBeds,
      latitude: parseFloat(editLatitude) || null,
      longitude: parseFloat(editLongitude) || null,
      images: imageUrls,
    };

    const { error } = await supabase
      .from('listings')
      .update(updateFields)
      .eq('id', item.id);

    if (!error) {
      setItem({ ...item, ...updateFields });
      setShowEditModal(false);
      setEditLoading(false);
    } else {
      setEditError("Erreur lors de la sauvegarde");
      setEditLoading(false);
    }
  };

  const handleCancelEditModal = () => {
    setShowEditModal(false);
    setEditError('');
    setCurrentImages([]); // Réinitialise les images actuelles
    setNewImages([]);
    setNewPreviewImages([]);
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };
  const handleCancelEdit = () => {
    setEditMode(false);
    setForm(item);
  };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = async () => {
    // Prépare un objet avec toutes les colonnes attendues
    const updateFields = {
      title: form.title || "",
      status: form.status || "pending",
      city: form.city || "",
      address: form.address || "",
      price_per_night: Number(form.price_per_night) || 0,
      bedrooms: Number(form.bedrooms) || 0,
      beds: Number(form.beds) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      surface: Number(form.surface) || 0,
      description: form.description || "",
      // Ajoute ici d'autres colonnes si besoin, exemple :
      // images: JSON.stringify(images),
      // amenities: form.amenities ? JSON.stringify(form.amenities) : null,
      // etc.
    };

    const { error } = await supabase
      .from('listings')
      .update(updateFields)
      .eq('id', item.id);

    if (!error) {
      setItem({ ...item, ...updateFields });
      setEditMode(false);
    } else {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce logement ?")) return;
    await supabase.from('listings').delete().eq('id', item.id);
    router.push('/profil-hote'); // Redirection vers la page "profil hote"
  };

  // --- useEffect principal ---
  useEffect(() => {
    async function fetchData() {
      // Récupère utilisateur courant pour le rôle
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user || null;
      setUser(currentUser);
      setAccessToken(sessionData?.session?.access_token || '');
      
      // Fetch listing data inline to avoid getListing dependency issues
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          host:profiles!listings_owner_id_fkey(
            id,
            prenom,
            photo_url
          )
        `)
        .eq('id', params.id)
        .single();
      
      if (error || !data) {
        console.error('Error loading listing:', error);
        return;
      }
      
      // Vérification d'accès pour les annonces non publiées
      if (data) {
        const isPublished = data.status === 'validé modérateur';
        
        if (!isPublished) {
          // Annonce non publiée : vérifier les droits d'accès
          if (!currentUser) {
            // Utilisateur non connecté : redirection
            router.push('/inscription');
            return;
          }
          
          const userId = currentUser.id;
          const isOwner = data.id_proprietaire && String(data.id_proprietaire) === String(userId);
          const isTenant = data.owner_id && String(data.owner_id) === String(userId);
          
          if (!isOwner && !isTenant) {
            // Ni propriétaire ni locataire : accès refusé
            router.push('/logements');
            return;
          }
        }
      }
      
      setItem(data);
      setForm(data || {}); // Ajout
      if (data) {
        const imgs = Array.isArray(data.images)
          ? data.images
          : (data.images ? JSON.parse(data.images) : []);
        setImages(imgs);

        // Récupérer réservations
        const { data: resData } = await supabase
          .from('reservations')
          .select('id, user:users(full_name), start_date, end_date, status')
          .eq('listing_id', params.id)
          .order('start_date', { ascending: false });
        setReservations(resData || []);

        // Récupérer disponibilités (nuits sélectionnables) - filtrer côté client pour robustesse
        setAvailabilityLoading(true);
        const { data: dispoData } = await supabase
          .from('disponibilities')
          .select('date, booked')
          .eq('listing_id', params.id);

        const perDateStatus = {};
        (dispoData || []).forEach(d => {
          if (!d?.date) return;
          const dt = new Date(d.date);
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          if (!perDateStatus[key]) {
            perDateStatus[key] = { hasAvailable: false, hasReservation: false };
          }
          const status = (d?.booked ?? '').toString().trim().toLowerCase();
          if (status === 'yes') {
            perDateStatus[key].hasReservation = true;
          } else {
            perDateStatus[key].hasAvailable = true;
          }
        });

        const normalized = Object.entries(perDateStatus)
          .filter(([, status]) => status.hasAvailable && !status.hasReservation)
          .map(([date]) => {
            const [year, month, day] = date.split('-').map(Number);
            return new Date(year, month - 1, day);
          })
          .sort((a, b) => a.getTime() - b.getTime());

        setAvailableDates(normalized);
        setAvailabilityLoading(false);

        // Récupérer statistiques des avis via API (plus robuste)
        try {
          const res = await fetch(`/api/reviews?listing_id=${params.id}&limit=1&offset=0`, { cache: 'no-store' });
          if (res.ok) {
            const dataJson = await res.json();
            const summary = dataJson?.summary || { review_count: 0, average_rating: 0 };
            setStats({ count: summary.review_count || 0, avg: Number(summary.average_rating || 0) });
          } else {
            setStats({ count: 0, avg: 0 });
          }
        } catch (e) {
          setStats({ count: 0, avg: 0 });
        }
      }
    }
    fetchData();
  }, [params.id, router]);

  const role = useMemo(() => {
    if (!item || !user) return null;
    const uid = user.id;
    if (item.id_proprietaire && String(item.id_proprietaire) === String(uid)) return 'owner';
    if (item.owner_id && String(item.owner_id) === String(uid)) return 'tenant';
    return null;
  }, [item, user]);

  // Matchers désactivés: passé + réservations confirmées + jours non disponibles
  const disabledDays = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const confirmed = (reservations || []).filter(r => r.status === 'confirmed');
    const ranges = confirmed.map(r => {
      const from = new Date(r.start_date);
      const to = new Date(r.end_date);
      return { from, to };
    });
    // Set des dates disponibles (jour civil)
    const availSet = new Set((availableDates || []).map(d => d.getTime()));
    // Fonction: désactiver tout jour non dans availSet
    const notAvailable = (date) => {
      const onlyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      // si pas encore chargé, on désactive tout pour éviter mauvaise sélection
      if ((availableDates || []).length === 0) return true;
      const isAvail = availSet.has(onlyDate);
      if (isAvail) return false;
      // Nouveau: afficher comme disponible toute journée dont la veille est disponible (checkout possible),
      // même avant la sélection d'une arrivée. Le clic sur ce jour ne définira pas l'arrivée (protégé par isForbidden),
      // mais l'utilisateur voit clairement que la date peut servir de départ.
      const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      prev.setDate(prev.getDate() - 1);
      const prevKey = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate()).getTime();
      if (availSet.has(prevKey)) return false;
      // Exception: permettre de sélectionner la date de départ (to) même si non disponible,
      // à condition que la veille soit disponible et que le trajet depuis l'arrivée soit contigu.
      try {
        if (typeof activeField !== 'undefined' && activeField === 'to' && range?.from) {
          const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          prev.setDate(prev.getDate() - 1);
          const prevKey = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate()).getTime();
          if (availSet.has(prevKey)) {
            // Vérifier contiguïté jusqu'à la veille
            let cur = new Date(range.from);
            cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
            cur.setDate(cur.getDate() + 1);
            const end = new Date(prev);
            while (cur <= end) {
              const k = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()).getTime();
              if (!availSet.has(k)) return true; // non contigu -> on désactive
              cur.setDate(cur.getDate() + 1);
            }
            // Contigu et veille dispo -> ne pas désactiver cette date (autoriser départ)
            return false;
          }
        }
      } catch {}
      return true;
    };
    return [{ before: startOfToday }, ...ranges, notAvailable];
  }, [reservations, availableDates, range?.from, activeField]);

  const nights = useMemo(() => {
    return range?.from && range?.to
      ? Math.max(0, differenceInCalendarDays(range.to, range.from))
      : 0;
  }, [range]);
  // Pricing constants
  const FEE_MULTIPLIER = getFeeMultiplier(); // centralisé
  // Taxe de séjour dynamique (par défaut 2.88€/nuit si API indisponible)
  const [dynamicPerNightTax, setDynamicPerNightTax] = useState(2.88);
  const PER_NIGHT_TAX = dynamicPerNightTax;
  const formatEUR = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0);
  // Per-night computations
  const baseNight = Number(item?.price_per_night) || 0;
  const perNightBaseWithFees = useMemo(() => baseNight * FEE_MULTIPLIER, [baseNight, FEE_MULTIPLIER]);
  const perNightTotal = useMemo(() => perNightBaseWithFees + PER_NIGHT_TAX, [perNightBaseWithFees, dynamicPerNightTax]);
  const total = useMemo(() => nights * perNightTotal, [nights, perNightTotal]);
  // Totals (séjour) for breakdown — no per-night subtotals displayed
  const baseTotal = useMemo(() => nights * baseNight, [nights, baseNight]);
  const feeTotal = useMemo(() => nights * baseNight * (FEE_MULTIPLIER - 1), [nights, baseNight, FEE_MULTIPLIER]);
  const taxTotal = useMemo(() => nights * PER_NIGHT_TAX, [nights, dynamicPerNightTax]);
  const basePlusFeesTotal = useMemo(() => baseTotal + feeTotal, [baseTotal, feeTotal]);
  // Month control for DayPicker to avoid month jumping on selection
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Charger la taxe de séjour dynamique via API selon la ville, le nombre de voyageurs et le prix
  useEffect(() => {
    const loadTaxe = async () => {
      try {
        if (!item?.city || !baseNight || nights <= 0) {
          setDynamicPerNightTax(2.88);
          return;
        }
        const payload = {
          communeName: item.city,
          category: 'non-classe',
          pricePerNightEUR: baseNight,
          guests: selectedGuests || 1,
          adults: selectedGuests || 1,
          nights
        };
        const res = await fetch('/api/taxe-sejour/calc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        const computedPerNight = (typeof data?.perNightTotalWithAdditions === 'number' && isFinite(data.perNightTotalWithAdditions))
          ? data.perNightTotalWithAdditions
          : (typeof data?.perNightTax === 'number' && isFinite(data.perNightTax) ? data.perNightTax : null);
        if (res.ok && computedPerNight !== null) {
          // Détail du calcul dans la console
          try {
            const percent = (data?.appliedRule?.percent ?? 0.05);
            const cap = (data?.appliedRule?.cap ?? 4.10);
            const guests = payload.guests || 1;
            const adults = payload.adults || guests;
            const perPersonBase = (payload.pricePerNightEUR || 0) / Math.max(1, guests);
            const perAdultPerNight = Math.min(percent * perPersonBase, cap);
            const basePerNight = perAdultPerNight * adults;
            const deptRate = data?.appliedAdditions?.departmentRate ?? 0;
            const regionRate = data?.appliedAdditions?.regionRate ?? 0;
            const deptAdd = basePerNight * deptRate;
            const regionAdd = basePerNight * regionRate;
            const recomputedPerNightTaxTotal = basePerNight + deptAdd + regionAdd;

            // Console breakdown
            // Use a collapsed group to keep console tidy
            console.groupCollapsed('%cTaxe de séjour – détail', 'color:#C96745;font-weight:700');
            console.log('Entrées:', {
              commune: payload.communeName,
              categorie: payload.category,
              prixParNuit: payload.pricePerNightEUR,
              voyageurs: guests,
              adultes: adults,
              nuits: payload.nights
            });
            console.log('Règle appliquée:', {
              pourcentage: `${(percent * 100).toFixed(2)}%`,
              plafondParAdulteParNuit: cap
            });
            console.log('Intermédiaires base:', {
              prixParPersonne: perPersonBase,
              taxeParAdulteEtParNuit: perAdultPerNight,
              taxeBaseParNuit: basePerNight
            });
            console.log('Taxes additionnelles:', {
              tauxDepartement: `${(deptRate * 100).toFixed(2)}%`,
              montantDepartementParNuit: deptAdd,
              tauxRegionIDF: `${(regionRate * 100).toFixed(2)}%`,
              montantRegionParNuit: regionAdd,
              regionIDF: Boolean(data?.appliedAdditions?.isIDF)
            });
            console.log('Résultat API:', {
              taxeParNuitBase: data.perNightTax,
              taxeParNuitAvecAdditionnelles: data.perNightTotalWithAdditions ?? data.perNightTax,
              taxeTotaleBase: data.totalTax,
              taxeTotaleAvecAdditionnelles: data.totalWithAdditions ?? data.totalTax
            });
            console.groupEnd();
          } catch (logErr) {
            // pas bloquant si logging échoue
          }
          setDynamicPerNightTax(Math.max(0, computedPerNight));
        } else {
          console.warn('Taxe séjour: fallback défaut (2.88€/nuit). Réponse API:', data);
          setDynamicPerNightTax(2.88);
        }
      } catch (e) {
        console.warn('Taxe séjour: fallback défaut (2.88€/nuit) – erreur API:', e);
        setDynamicPerNightTax(2.88);
      }
    };
    loadTaxe();
  }, [item?.city, baseNight, nights, selectedGuests]);

  // Helpers dates
  const normalizeDate = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : undefined);
  const todayOnly = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const availSet = useMemo(() => new Set((availableDates || []).map(d => d.getTime())), [availableDates]);
  const isInConfirmedReservation = (date) => {
    return (reservations || []).some(r => r.status === 'confirmed' && normalizeDate(new Date(r.start_date)) <= date && date <= normalizeDate(new Date(r.end_date)));
  };
  const isForbidden = (date) => {
    if (!date) return true;
    const n = normalizeDate(date);
    if (n < todayOnly) return true;
    if (isInConfirmedReservation(n)) return true;
    if (!availSet.has(n.getTime())) return true;
    return false;
  };
  // Désactive dynamiquement les jours non atteignables comme départ depuis l'arrivée sélectionnée
  const disableToNonContiguous = (date) => {
    if (activeField !== 'to' || !range?.from) return false;
    const d = normalizeDate(date);
    const from = normalizeDate(range.from);
    if (!d || !from) return true;
    // Interdit de choisir une date de départ <= arrivée
    if (d <= from) return true;
    // Toute date interdite entre from et d rend d non cliquable
    let cur = new Date(from);
    cur.setDate(cur.getDate() + 1);
    // Exception checkout: si d n'est pas dispo mais la veille l'est, on vérifie la contiguïté jusqu'à la veille
    const dKey = d.getTime();
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    const allowCheckout = !availSet.has(dKey) && availSet.has(prev.getTime());
    const endLoop = allowCheckout ? prev : d;
    while (cur <= endLoop) {
      if (isForbidden(cur)) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  };
  // Lorsqu'on édite l'arrivée, n'autorise pas de choisir une arrivée >= au départ courant
  const disableFromAfterTo = (date) => {
    if (activeField !== 'from' || !range?.to) return false;
    const d = normalizeDate(date);
    const to = normalizeDate(range.to);
    if (!d || !to) return false;
    return d >= to;
  };
  const isContiguous = (from, to) => {
    if (!from || !to) return false;
    let cur = new Date(from);
    cur.setDate(cur.getDate() + 1);
    while (cur <= to) {
      if (isForbidden(cur)) return false;
      cur.setDate(cur.getDate() + 1);
    }
    return true;
  };
  const getMaxContiguousTo = (from, desiredTo) => {
    if (!from || !desiredTo) return undefined;
    if (desiredTo <= from) return undefined;
    let cur = new Date(from);
    let lastOK = undefined;
    cur.setDate(cur.getDate() + 1);
    while (cur <= desiredTo) {
      if (isForbidden(cur)) break;
      lastOK = new Date(cur);
      cur.setDate(cur.getDate() + 1);
    }
    return lastOK;
  };

  const handleDayClick = (day) => {
    const d = normalizeDate(day);
    if (isForbidden(d)) {
      // Autoriser sélection du départ sur un jour non dispo si la veille est dispo et le tronçon est contigu
      if (activeField === 'to' && range?.from) {
        const from = normalizeDate(range.from);
        const prev = new Date(d);
        prev.setDate(prev.getDate() - 1);
        if (!isForbidden(prev) && differenceInCalendarDays(d, from) >= 1 && isContiguous(from, prev)) {
          // Permettre cette sélection plus bas (ne pas return)
        } else {
          return;
        }
      } else {
        return;
      }
    }

    // Si une plage complète est sélectionnée et qu'on ne modifie pas explicitement le départ,
    // un nouveau clic réinitialise la sélection pour choisir une nouvelle arrivée.
    if (range.from && range.to && activeField !== 'to') {
      setRange({ from: d, to: undefined });
      setActiveField('to'); // le prochain clic définira le départ
      return;
    }

    if (activeField === 'from') {
      const newFrom = d;
      // Toujours réinitialiser le départ lorsqu'on modifie l'arrivée
      setRange({ from: newFrom, to: undefined });
      setActiveField('to'); // après avoir choisi l'arrivée, passer au départ
      return;
    }

    // activeField === 'to'
    if (!range.from) {
      // Si aucune arrivée n'est définie, un clic définit l'arrivée
      setRange({ from: d, to: undefined });
      setActiveField('to');
      return;
    }
    if (differenceInCalendarDays(d, range.from) < 1) {
      // ne pas permettre une date de départ <= arrivée
      return;
    }
    // Vérifier que toutes les dates entre l'arrivée et le départ souhaité sont disponibles (contigües)
    // Exception checkout: si le jour de départ n'est pas dispo mais la veille l'est, valider jusqu'à la veille
    const from = normalizeDate(range.from);
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    const allowCheckout = isForbidden(d) && !isForbidden(prev) && isContiguous(from, prev);
    if (!allowCheckout && !isContiguous(range.from, d)) {
      // Si on ne peut pas atteindre cette date sans passer par des dates indisponibles, ignorer le clic
      return;
    }
    // Si la date cliquée est atteignable, on la définit comme départ
    setRange({ from: range.from, to: d });
    setActiveField('from'); // une fois la plage complète, prochain clic prépare une nouvelle arrivée
  };

  return (
    <>
      <Header />
      <main style={{
        background: '#f8fafc',
        minHeight: '100vh',
        paddingBottom: 0,
        overflowX: 'hidden',
        width: '100%',
        maxWidth: '100vw'
      }}>
        {!item ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '70vh',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '4px solid #e2e8f0',
              borderTopColor: '#C96745',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ fontSize: 18, color: '#64748b', fontWeight: 500 }}>
              Chargement du logement...
            </p>
          </div>
        ) : (
          <article className="logement-detail" style={{ maxWidth: 1400, margin: '0 auto' }}>
            {editMode ? (
              // --- Formulaire édition ---
              <form
                onSubmit={e => { e.preventDefault(); handleSave(); }}
                style={{
                  background: '#f7f7fa',
                  borderRadius: 16,
                  padding: 32,
                  boxShadow: '0 2px 16px rgba(201,103,69,0.07)',
                  marginBottom: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                  maxWidth: 700
                }}
              >
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                      Titre du logement
                    </label>
                    <input
                      name="title"
                      value={form.title || ""}
                      onChange={handleChange}
                      placeholder="Titre"
                      style={{
                        width: '100%',
                        fontSize: 22,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #ddd',
                        marginBottom: 8
                      }}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                      Statut
                    </label>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background:
                          (form.status || item?.status) === 'published'
                            ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                            : (form.status || item?.status) === 'Accord propriétaire en pause'
                              ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                              : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        color:
                          (form.status || item?.status) === 'published'
                            ? '#065f46'
                            : (form.status || item?.status) === 'Accord propriétaire en pause'
                              ? '#7f1d1d'
                              : '#92400e',
                        borderRadius: 10,
                        border:
                          (form.status || item?.status) === 'published'
                            ? '1px solid #6ee7b7'
                            : (form.status || item?.status) === 'Accord propriétaire en pause'
                              ? '1px solid #fecaca'
                              : '1px solid #fcd34d',
                        padding: '8px 12px',
                        fontWeight: 800,
                        fontSize: 13,
                        userSelect: 'none'
                      }}
                    >
                      <span>
                        {(() => {
                          const s = (form.status || item?.status || '').toString();
                          if (s === 'published') return 'Publié';
                          if (s === 'pending') return 'En attente';
                          return s || '—';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                      Ville
                    </label>
                    <input
                      name="city"
                      value={form.city || ""}
                      onChange={handleChange}
                      placeholder="Ville"
                      style={{
                        width: '100%',
                        fontSize: 18,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #ddd'
                      }}
                      required
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                      Adresse
                    </label>
                    <input
                      name="address"
                      value={form.address || ""}
                      onChange={handleChange}
                      placeholder="Adresse"
                      style={{
                        width: '100%',
                        fontSize: 18,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #ddd'
                      }}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                      Prix / nuit (€)
                    </label>
                    <input
                      name="price_per_night"
                      type="number"
                      value={form.price_per_night || ""}
                      onChange={handleChange}
                      placeholder="Prix"
                      style={{
                        width: '100%',
                        fontSize: 18,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #ddd'
                      }}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                      Chambres
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, bedrooms: Math.max(1, (form.bedrooms || 0) - 1) })}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', fontSize: 18, cursor: 'pointer', transition: 'transform 0.18s' }}
                      >-</button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 500 }}>{form.bedrooms || 0}</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, bedrooms: (form.bedrooms || 0) + 1 })}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', fontSize: 18, cursor: 'pointer', transition: 'transform 0.18s' }}
                      >+</button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                      Lits
                    </label>
                    <input
                      name="beds"
                      type="number"
                      value={form.beds || ""}
                      onChange={handleChange}
                      placeholder="Lits"
                      style={{
                        width: '100%',
                        fontSize: 18,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #ddd'
                      }}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                      Salles de bain
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, bathrooms: Math.max(1, (form.bathrooms || 0) - 1) })}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', fontSize: 18, cursor: 'pointer', transition: 'transform 0.18s' }}
                      >-</button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 500 }}>{form.bathrooms || 0}</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, bathrooms: (form.bathrooms || 0) + 1 })}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', fontSize: 18, cursor: 'pointer', transition: 'transform 0.18s' }}
                      >+</button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                      Surface (m²)
                    </label>
                    <input
                      name="surface"
                      type="number"
                      value={form.surface || ""}
                      onChange={handleChange}
                      placeholder="Surface"
                      style={{
                        width: '100%',
                        fontSize: 18,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #ddd'
                      }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: '#C96745', marginBottom: 6, display: 'block' }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    placeholder="Décrivez votre logement..."
                    style={{
                      width: '100%',
                      fontSize: 18,
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      minHeight: 80
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  <button
                    type="submit"
                    style={{
                      background: '#C96745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 24px',
                      fontWeight: 700,
                      fontSize: 17,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(201,103,69,0.10)'
                    }}
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      background: '#eee',
                      color: '#C96745',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 24px',
                      fontWeight: 700,
                      fontSize: 17,
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              // --- Affichage moderne 2025 ---
              <>
                {/* Hero Gallery Full Width */}
                <div style={{ marginBottom: 0 }}>
                  <Gallery images={images} />
                </div>

                {/* Container principal avec grid moderne */}
                <div style={{ 
                  padding: '0 16px 48px',
                  maxWidth: 1400,
                  margin: '0 auto',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div className="detail-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr', 
                    gap: 24,
                    marginTop: -32,
                    position: 'relative'
                  }}>
                    {/* Colonne principale gauche */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Card Header */}
                      <div className="card-header" style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <div className="header-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          <div style={{ flex: 1 }}>
                            {role === 'tenant' && (
                              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                                {(() => { const m = getStatusMeta(item.status); return (
                                  <span style={{
                                    background: m.bg,
                                    color: m.color,
                                    borderRadius: 8,
                                    padding: '6px 12px',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    border: `1px solid ${m.border}`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}>
                                    {m.label}
                                  </span>
                                ); })()}
                                <span style={{ 
                                  background: '#f3f4f6', 
                                  color: '#374151', 
                                  padding: '6px 12px', 
                                  borderRadius: 6, 
                                  fontWeight: 600, 
                                  fontSize: 12,
                                  border: '1px solid #d1d5db',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                  </svg>
                                  Locataire
                                </span>
                              </div>
                            )}
                            <h1 className="main-title" style={{ 
                              fontSize: 'clamp(20px, 4vw, 32px)', 
                              fontWeight: 700, 
                              color: '#111827', 
                              margin: '0 0 10px 0',
                              lineHeight: 1.3,
                              letterSpacing: '-0.01em'
                            }}>
                              {item.title}
                            </h1>

                            <div style={{ 
                              fontSize: 14, 
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              marginBottom: 12
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              <span style={{ fontWeight: 600 }}>{item.city}</span>
                            </div>

                            {/* Informations hôte */}
                            {item.host && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 0'
                              }}>
                                <div style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {item.host.photo_url ? (
                                    <img 
                                      src={item.host.photo_url} 
                                      alt={item.host.prenom || 'Hôte'}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                    />
                                  ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                      <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <div style={{
                                    fontSize: 13,
                                    color: '#6b7280',
                                    fontWeight: 500,
                                    marginBottom: 2
                                  }}>
                                    Hôte
                                  </div>
                                  <div style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#111827'
                                  }}>
                                    {item.host.prenom || 'Hôte'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={handleCopy}
                            className="share-button"
                            style={{
                              background: copied ? '#1f2937' : '#fff',
                              color: copied ? '#fff' : '#4b5563',
                              border: copied ? 'none' : '1px solid #d1d5db',
                              borderRadius: 8,
                              padding: '10px 16px',
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: 'pointer',
                              boxShadow: copied ? '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              minWidth: 100
                            }}
                            aria-label="Copier le lien"
                          >
                            {copied ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Copié
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                </svg>
                                Partager
                              </>
                            )}
                          </button>
                        </div>

                        {/* Chips d'infos */}
                        <div className="info-chips-grid" style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                          gap: 8,
                          marginBottom: 16
                        }}>
                          {typeof item.nb_voyageurs === 'number' && (
                            <div className="info-chip" style={{ 
                              background: '#fff', 
                              padding: '12px', 
                              borderRadius: 8,
                              border: '1px solid #e5e7eb',
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#9ca3af';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ margin: '0 auto 6px' }}>
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                              </svg>
                              <div className="info-chip-value" style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 2 }}>{item.nb_voyageurs}</div>
                              <div className="info-chip-label" style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>voyageurs</div>
                            </div>
                          )}
                          {typeof item.bedrooms === 'number' && (
                            <div className="info-chip" style={{ 
                              background: '#fff', 
                              padding: '12px', 
                              borderRadius: 8,
                              border: '1px solid #e5e7eb',
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#9ca3af';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ margin: '0 auto 6px' }}>
                                <path d="M2 4v16"></path>
                                <path d="M2 8h18a2 2 0 0 1 2 2v10"></path>
                                <path d="M2 17h20"></path>
                                <path d="M6 8v9"></path>
                              </svg>
                              <div className="info-chip-value" style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 2 }}>{item.bedrooms}</div>
                              <div className="info-chip-label" style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>chambres</div>
                            </div>
                          )}
                          {typeof item.beds === 'number' && (
                            <div className="info-chip" style={{ 
                              background: '#fff', 
                              padding: '12px', 
                              borderRadius: 8,
                              border: '1px solid #e5e7eb',
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#9ca3af';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ margin: '0 auto 6px' }}>
                                <rect x="2" y="7" width="20" height="14" rx="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                              </svg>
                              <div className="info-chip-value" style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 2 }}>{item.beds}</div>
                              <div className="info-chip-label" style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>lits</div>
                            </div>
                          )}
                          {typeof item.bathrooms === 'number' && (
                            <div className="info-chip" style={{ 
                              background: '#fff', 
                              padding: '12px', 
                              borderRadius: 8,
                              border: '1px solid #e5e7eb',
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#9ca3af';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ margin: '0 auto 6px' }}>
                                <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"></path>
                                <line x1="10" y1="5" x2="8" y2="7"></line>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <line x1="7" y1="19" x2="7" y2="21"></line>
                                <line x1="17" y1="19" x2="17" y2="21"></line>
                              </svg>
                              <div className="info-chip-value" style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 2 }}>{item.bathrooms}</div>
                              <div className="info-chip-label" style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>sdb</div>
                            </div>
                          )}
                          {typeof item.surface === 'number' && item.surface > 0 && (
                            <div className="info-chip" style={{ 
                              background: '#fff', 
                              padding: '12px', 
                              borderRadius: 8,
                              border: '1px solid #e5e7eb',
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#9ca3af';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ margin: '0 auto 6px' }}>
                                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                <path d="M3 9h18"></path>
                                <path d="M9 21V9"></path>
                              </svg>
                              <div className="info-chip-value" style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 2 }}>{item.surface}</div>
                              <div className="info-chip-label" style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>m²</div>
                            </div>
                          )}
                        </div>
                        {/* Stats Row */}
                        <div className="stats-row" style={{
                          display: 'flex', 
                          gap: 16, 
                          padding: '14px 0',
                          borderTop: '1px solid #f3f4f6',
                          borderBottom: '1px solid #f3f4f6',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <StarAverageInline value={stats.avg} size={18} />
                              <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
                                {stats.avg > 0 ? (Number(stats.avg).toFixed(1)) : '—'}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                              {stats.count} avis
                            </div>
                          </div>
                          <div className="stats-divider" style={{ width: 1, background: '#e2e8f0' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ 
                              background: '#f9fafb',
                              padding: 8,
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #e5e7eb'
                            }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>
                                {reservations.length}
                              </div>
                              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
                                réservations
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions - Seulement pour le locataire (owner_id) */}
                        {role === 'tenant' && (
                          <div className="actions-row" style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                            <a
                              href={`/calendrier?listingId=${item.id}`}
                              style={{ 
                                background: '#1f2937', 
                                color: '#fff', 
                                textDecoration: 'none', 
                                border: 'none', 
                                borderRadius: 8, 
                                padding: '11px 18px', 
                                fontWeight: 600, 
                                fontSize: 13, 
                                cursor: 'pointer', 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                e.currentTarget.style.background = '#111827';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                e.currentTarget.style.background = '#1f2937';
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                              Gérer le calendrier
                            </a>
                            <button
                              onClick={handleEdit}
                              style={{ 
                                background: '#fff', 
                                color: '#374151', 
                                border: '1px solid #d1d5db', 
                                borderRadius: 8, 
                                padding: '11px 18px', 
                                fontWeight: 600, 
                                fontSize: 13, 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#9ca3af';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                              Modifier
                            </button>
                            <button
                              onClick={handleDelete}
                              style={{ 
                                background: '#fff', 
                                color: '#dc2626', 
                                border: '1px solid #fca5a5', 
                                borderRadius: 8, 
                                padding: '11px 18px', 
                                fontWeight: 600, 
                                fontSize: 13, 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#fef2f2';
                                e.currentTarget.style.borderColor = '#f87171';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(220,38,38,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.borderColor = '#fca5a5';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                              Supprimer
                            </button>
                          </div>
                        )}
                        {/* Removed owner info box when not tenant, per request */}
                      </div>

                      {/* Card Description */}
                      <div className="card-description" style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: '1px solid #f3f4f6'
                      }}>
                        <h2 style={{ 
                          fontSize: 20, 
                          fontWeight: 700, 
                          color: '#111827', 
                          marginBottom: 16,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          Description
                        </h2>
                        <p style={{ 
                          whiteSpace: 'pre-wrap', 
                          lineHeight: 1.7, 
                          color: '#4b5563',
                          fontSize: 14
                        }}>
                          {item.description || 'Aucune description fournie pour le moment.'}
                        </p>
                      </div>

                      {/* Card Localisation */}
                      {(item.latitude && item.longitude) ? (
                        <div className="card-map" style={{
                          background: '#fff',
                          borderRadius: 16,
                          padding: '24px',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                          border: '1px solid #f3f4f6'
                        }}>
                          <h2 style={{ 
                            fontSize: 20, 
                            fontWeight: 700, 
                            color: '#111827', 
                            marginBottom: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            Localisation
                          </h2>
                          <div style={{ 
                            borderRadius: 12, 
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                          }}>
                            <MapPreview latitude={item.latitude} longitude={item.longitude} />
                          </div>
                        </div>
                      ) : null}
                      {/* Card Réservations */}
                      {reservations.length > 0 && (
                        <div className="card-reservations" style={{
                          background: '#fff',
                          borderRadius: 16,
                          padding: '24px',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                          border: '1px solid #f3f4f6'
                        }}>
                          <h2 style={{ 
                            fontSize: 20, 
                            fontWeight: 700, 
                            color: '#111827', 
                            marginBottom: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Réservations ({reservations.length})
                          </h2>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {reservations.map(r => (
                              <div key={r.id} className="reservation-item" style={{
                                background: '#f9fafb',
                                borderRadius: 10,
                                padding: '14px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '1px solid #e5e7eb',
                                transition: 'transform 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                              >
                                <div>
                                  <div style={{ fontWeight: 600, color: '#111827', fontSize: 15, marginBottom: 4 }}>
                                    {r.user?.full_name || "Voyageur"}
                                  </div>
                                  <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                                    {new Date(r.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(r.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                </div>
                                <span style={{
                                  background: r.status === "confirmed" ? '#f0fdf4' : '#fef3c7',
                                  color: r.status === "confirmed" ? "#166534" : "#92400e",
                                  borderRadius: 6,
                                  padding: "6px 12px",
                                  fontWeight: 600,
                                  fontSize: 11,
                                  border: `1px solid ${r.status === "confirmed" ? "#bbf7d0" : "#fde68a"}`
                                }}>
                                  {r.status === "confirmed" ? "✓ Confirmée" : "⏳ En attente"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Card Avis - Nouveau composant interactif */}
                      {item && item.id && <ReviewsSection listingId={item.id} />}
                    </div>

                    {/* Colonne droite - Card de réservation sticky (masquée pour le propriétaire) */}
                    {role !== 'tenant' && (
                      <div style={{ position: 'relative' }}>
                        <div className="booking-sidebar" style={{
                          position: 'sticky',
                          top: 100,
                          background: '#fff',
                          borderRadius: 16,
                          padding: '24px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          border: '1px solid #f3f4f6'
                        }}>

                        {/* Sélecteur de dates / disponibilités */}
                        <div style={{
                          padding: '16px',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          borderRadius: 14,
                          marginBottom: 20,
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>Arrivée</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                  readOnly
                                  onClick={() => setActiveField('from')}
                                  value={range.from ? range.from.toLocaleDateString('fr-FR') : ''}
                                  placeholder="jj/mm/aaaa"
                                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: activeField==='from' ? '2px solid #93c5fd' : '1px solid #e2e8f0', background: '#fff' }}
                                />
                              </div>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>Départ</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                  readOnly
                                  onClick={() => setActiveField('to')}
                                  value={range.to ? range.to.toLocaleDateString('fr-FR') : ''}
                                  placeholder="jj/mm/aaaa"
                                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: activeField==='to' ? '2px solid #93c5fd' : '1px solid #e2e8f0', background: '#fff' }}
                                />
                              </div>
                            </div>
                          </div>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, background: '#fff' }}>
                            <DayPicker
                              mode="range"
                              selected={range}
                              onDayClick={handleDayClick}
                              numberOfMonths={1}
                              locale={fr}
                              showOutsideDays
                              month={currentMonth}
                              onMonthChange={setCurrentMonth}
                              disabled={[...disabledDays, disableToNonContiguous, disableFromAfterTo]}
                              fromDate={new Date()}
                              modifiersClassNames={{
                                selected: 'selected-night',
                                range_start: 'selected-night',
                                range_end: 'selected-night',
                                range_middle: 'selected-night'
                              }}
                              styles={{
                                caption: { textTransform: 'capitalize' }
                              }}
                            />
                          </div>
                          <div style={{
                            marginTop: 10,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                              {range?.from ? range.from.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'Arrivée'}
                              {' — '}
                              {range?.to ? range.to.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Départ'}
                            </div>
                          </div>

                          {/* Sélecteur de nombre de voyageurs */}
                          <div style={{
                            marginTop: 12,
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '14px 16px'
                          }}>
                            <div style={{ 
                              fontSize: 12, 
                              color: '#64748b', 
                              fontWeight: 700, 
                              marginBottom: 8 
                            }}>
                              Nombre de voyageurs
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>
                                {selectedGuests} voyageur{selectedGuests > 1 ? 's' : ''}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedGuests(Math.max(1, selectedGuests - 1))}
                                  disabled={selectedGuests <= 1}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '50%',
                                    background: selectedGuests <= 1 ? '#f1f5f9' : '#fff',
                                    color: selectedGuests <= 1 ? '#94a3b8' : '#475569',
                                    cursor: selectedGuests <= 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: 14,
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedGuests > 1) {
                                      e.currentTarget.style.background = '#f8fafc';
                                      e.currentTarget.style.borderColor = '#cbd5e1';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedGuests > 1) {
                                      e.currentTarget.style.background = '#fff';
                                      e.currentTarget.style.borderColor = '#e2e8f0';
                                    }
                                  }}
                                >
                                  −
                                </button>
                                <span style={{
                                  fontSize: 16,
                                  fontWeight: 800,
                                  color: '#0f172a',
                                  minWidth: 24,
                                  textAlign: 'center'
                                }}>
                                  {selectedGuests}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedGuests(Math.min(item?.nb_voyageurs || 8, selectedGuests + 1))}
                                  disabled={selectedGuests >= (item?.nb_voyageurs || 8)}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '50%',
                                    background: selectedGuests >= (item?.nb_voyageurs || 8) ? '#f1f5f9' : '#fff',
                                    color: selectedGuests >= (item?.nb_voyageurs || 8) ? '#94a3b8' : '#475569',
                                    cursor: selectedGuests >= (item?.nb_voyageurs || 8) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: 14,
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedGuests < (item?.nb_voyageurs || 8)) {
                                      e.currentTarget.style.background = '#f8fafc';
                                      e.currentTarget.style.borderColor = '#cbd5e1';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedGuests < (item?.nb_voyageurs || 8)) {
                                      e.currentTarget.style.background = '#fff';
                                      e.currentTarget.style.borderColor = '#e2e8f0';
                                    }
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            {item?.nb_voyageurs && (
                              <div style={{
                                fontSize: 11,
                                color: '#64748b',
                                fontWeight: 600,
                                marginTop: 6
                              }}>
                                Maximum : {item.nb_voyageurs} voyageurs
                              </div>
                            )}
                          </div>

                          {/* Section Prix moderne */}
                          <div style={{
                            marginTop: 12,
                            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                            border: '2px solid #e2e8f0',
                            borderRadius: 14,
                            padding: '16px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontSize: nights > 0 ? 32 : 28, 
                                fontWeight: 900, 
                                color: '#0f172a',
                                lineHeight: 1,
                                marginBottom: 4,
                                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                              }}>
                                {nights > 0 ? formatEUR(total) : formatEUR(perNightBaseWithFees)}
                              </div>
                              <div style={{ 
                                fontSize: 12, 
                                color: '#64748b', 
                                fontWeight: 600 
                              }}>
                                {nights > 0 ? 'Total du séjour' : 'Par nuit'}
                              </div>
                            </div>
                            {nights > 0 && (
                              <div style={{
                                textAlign: 'right',
                                paddingLeft: 12,
                                borderLeft: '1px solid #e2e8f0'
                              }}>
                                <div style={{ 
                                  fontSize: 20, 
                                  fontWeight: 800, 
                                  color: '#2563eb',
                                  lineHeight: 1,
                                  marginBottom: 4
                                }}>
                                  {nights}
                                </div>
                                <div style={{ 
                                  fontSize: 11, 
                                  color: '#64748b', 
                                  fontWeight: 600 
                                }}>
                                  nuit{nights > 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Détail du prix (totaux du séjour) — affiché uniquement au clic */}
                          {nights > 0 && (
                            <>
                              <button
                                type="button"
                                aria-expanded={showPriceDetail}
                                onClick={() => setShowPriceDetail(v => !v)}
                                style={{
                                  marginTop: 12,
                                  width: '100%',
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 12,
                                  padding: '12px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  color: '#334155',
                                  fontWeight: 800,
                                  fontSize: 13
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                    <path d="M20 7h-9a4 4 0 0 0 0 8h9"></path>
                                    <path d="M4 7h1"></path>
                                    <path d="M4 15h1"></path>
                                  </svg>
                                  Détail du prix
                                </span>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#64748b"
                                  strokeWidth="2.5"
                                  style={{ transform: showPriceDetail ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
                                >
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </button>
                              {showPriceDetail && (
                                <div style={{
                                  marginTop: 8,
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 12,
                                  padding: '14px 14px 10px',
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#334155' }}>
                                      <span>Hébergement</span>
                                      <span style={{ fontWeight: 700 }}>{formatEUR(baseTotal)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#334155' }}>
                                      <span>Frais de plateforme ({percentLabel()})</span>
                                      <span style={{ fontWeight: 700 }}>{formatEUR(feeTotal)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#334155' }}>
                                      <span>Taxes de séjour</span>
                                      <span style={{ fontWeight: 700 }}>{formatEUR(taxTotal)}</span>
                                    </div>
                                    <div style={{ height: 1, background: '#e2e8f0', margin: '6px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#0f172a' }}>
                                      <span style={{ fontWeight: 800 }}>Total</span>
                                      <span style={{ fontWeight: 900 }}>{formatEUR(total)}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 600 }}>
                                      Basé sur {nights} nuit{nights > 1 ? 's' : ''}.
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (nights > 0) {
                              // Construire les paramètres pour la page de confirmation
                              const params = new URLSearchParams({
                                listingId: item.id,
                                startDate: range.from?.toISOString(),
                                endDate: range.to?.toISOString(),
                                guests: selectedGuests,
                                nights: nights,
                                basePrice: Math.round(basePlusFeesTotal * 100), // Centimes
                                taxPrice: Math.round(taxTotal * 100), // Centimes
                                totalPrice: Math.round(total * 100) // Centimes
                              });
                              router.push(`/confirmer-et-payer?${params.toString()}`);
                            }
                          }}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 14,
                            padding: '18px 24px',
                            fontWeight: 800,
                            fontSize: 16,
                            cursor: nights > 0 ? 'pointer' : 'not-allowed',
                            boxShadow: '0 8px 25px rgba(37,99,235,0.3)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            marginBottom: 12,
                            opacity: nights > 0 ? 1 : 0.6
                          }}
                          disabled={nights === 0}
                          onMouseEnter={(e) => {
                            if (nights > 0) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 12px 35px rgba(37,99,235,0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(37,99,235,0.3)';
                          }}
                        >
                          {nights > 0 ? 'Réserver maintenant' : 'Sélectionnez vos dates'}
                        </button>

                        <div style={{ 
                          fontSize: 12, 
                          color: '#64748b', 
                          textAlign: 'center',
                          fontWeight: 600
                        }}>
                          Vous ne serez pas débité immédiatement
                        </div>

                        {/* Bouton propriétaire: mettre en pause l'accord */}
                        {role === 'owner' && (
                          item?.status === 'Accord propriétaire en pause' ? (
                            <>
                              <button
                                type="button"
                                disabled={reactivateLoading}
                                onClick={() => {
                                  setIsReadOnlyMode(false);
                                  setShowReactivateModal(true);
                                  setReactivateConsentChecked(false);
                                  setReactivateConsentOpen(false);
                                  setReactivateError('');
                                }}
                                style={{
                                  marginTop: 16,
                                  width: '100%',
                                  background: reactivateLoading ? '#86efac' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 12,
                                  padding: '14px 16px',
                                  fontWeight: 900,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 10,
                                  boxShadow: '0 8px 25px rgba(34,197,94,0.3)',
                                  cursor: reactivateLoading ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <polyline points="8 12 11 15 16 9" />
                                </svg>
                                Réactiver mon accord propriétaire
                              </button>
                              {reactivateError && (
                                <div style={{
                                  marginTop: 8,
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#991b1b',
                                  padding: '8px 10px',
                                  borderRadius: 10,
                                  fontWeight: 700
                                }}>
                                  {reactivateError}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => { setShowPauseModal(true); setConfirmPauseChecked(false); setPauseError(''); }}
                                style={{
                                  marginTop: 16,
                                  width: '100%',
                                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 12,
                                  padding: '14px 16px',
                                  fontWeight: 900,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 10,
                                  boxShadow: '0 8px 25px rgba(239,68,68,0.3)',
                                  cursor: 'pointer'
                                }}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <line x1="10" y1="8" x2="10" y2="16" />
                                  <line x1="14" y1="8" x2="14" y2="16" />
                                </svg>
                                Mettre en pause mon accord propriétaire
                              </button>
                              
                              {/* Bouton pour relire l'accord */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsReadOnlyMode(true);
                                  setShowReactivateModal(true);
                                  setReactivateConsentChecked(false);
                                  setReactivateConsentOpen(true);
                                  setReactivateError('');
                                }}
                                style={{
                                  marginTop: 12,
                                  width: '100%',
                                  background: 'transparent',
                                  color: '#C96745',
                                  border: '2px solid #C96745',
                                  borderRadius: 12,
                                  padding: '12px 16px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 10,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#C96745';
                                  e.target.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'transparent';
                                  e.target.style.color = '#C96745';
                                }}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                                Relire l'accord de consentement propriétaire
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </div>
                      )}
                  </div>
                </div>
                {/* Modal de confirmation pause accord propriétaire */}
                {showPauseModal && (
                  <div
                    onClick={() => !pauseLoading && setShowPauseModal(false)}
                    style={{
                      position: 'fixed',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2000
                    }}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: 'min(560px, 92vw)',
                        background: '#fff',
                        borderRadius: 16,
                        padding: 24,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        border: '1px solid #fee2e2'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                            <line x1="10" y1="6" x2="10" y2="18" />
                            <line x1="14" y1="6" x2="14" y2="18" />
                          </svg>
                        </div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#991b1b' }}>Mettre en pause l'accord propriétaire</h3>
                      </div>
                      <p style={{ color: '#334155', lineHeight: 1.6, marginTop: 0 }}>
                        Êtes-vous certain de vouloir mettre en pause votre accord propriétaire ?
                        Cette action suspendra temporairement la disponibilité de votre logement.
                      </p>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12, color: '#334155', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={confirmPauseChecked}
                          onChange={(e) => setConfirmPauseChecked(e.target.checked)}
                          style={{ width: 18, height: 18, marginTop: 2 }}
                        />
                        <span>Je comprends et je confirme cette action</span>
                      </label>
                      {pauseError && (
                        <div style={{
                          marginTop: 12,
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#991b1b',
                          padding: '10px 12px',
                          borderRadius: 10,
                          fontWeight: 700
                        }}>
                          {pauseError}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                        <button
                          type="button"
                          onClick={() => !pauseLoading && setShowPauseModal(false)}
                          style={{
                            background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0',
                            borderRadius: 10, padding: '10px 16px', fontWeight: 800, cursor: pauseLoading ? 'not-allowed' : 'pointer'
                          }}
                          disabled={pauseLoading}
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirmPauseChecked) {
                              setPauseError('Veuillez cocher la case de confirmation.');
                              return;
                            }
                            try {
                              setPauseLoading(true);
                              setPauseError('');
                              const res = await fetch('/api/listings/pause', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                                },
                                body: JSON.stringify({ listingId: item.id })
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data?.error || 'Request failed');
                              // MàJ UI locale (statut uniquement)
                              setItem(prev => prev ? { ...prev, status: data.status || 'Accord propriétaire en pause' } : prev);
                              setShowPauseModal(false);
                            } catch (e) {
                              setPauseError(e.message || 'Une erreur est survenue. Veuillez réessayer.');
                            } finally {
                              setPauseLoading(false);
                            }
                          }}
                          style={{
                            background: confirmPauseChecked ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : '#fecaca',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            padding: '10px 16px',
                            fontWeight: 900,
                            cursor: confirmPauseChecked && !pauseLoading ? 'pointer' : 'not-allowed',
                            boxShadow: confirmPauseChecked ? '0 6px 18px rgba(239,68,68,0.35)' : 'none'
                          }}
                          disabled={!confirmPauseChecked || pauseLoading}
                        >
                          {pauseLoading ? 'Validation…' : 'Valider'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal d'édition complet */}
                {showEditModal && (
                  <div
                    onClick={handleCancelEditModal}
                    style={{
                      position: 'fixed',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 3000,
                      overflowY: 'auto',
                      padding: '20px'
                    }}
                  >
                    <div
                      className="modal-content modal-body"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: 'min(800px, 100%)',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        background: '#fff',
                        borderRadius: 20,
                        padding: 32,
                        boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                        border: '1px solid #e5e7eb'
                      }}
                    ><h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24, color: '#111' }}>
                        Modifier l'annonce
                      </h2>

                      {editError && (
                        <div style={{
                          background: '#fee2e2',
                          color: '#991b1b',
                          padding: '12px 16px',
                          borderRadius: 12,
                          marginBottom: 20,
                          fontSize: 14
                        }}>
                          {editError}
                        </div>
                      )}

                      {/* Titre */}
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151' }}>
                          Titre de l'annonce *
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Ex: Appartement lumineux en centre-ville"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 12,
                            fontSize: 15,
                            transition: 'border-color 0.2s',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                      </div>

                      {/* Adresse avec autocomplete */}
                      <div style={{ marginBottom: 20, position: 'relative' }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151' }}>
                          Adresse *
                        </label>
                        <input
                          type="text"
                          value={editStreet}
                          onChange={handleEditAddressChange}
                          placeholder="Commencez à taper une adresse..."
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: `2px solid ${addressConfirmed ? '#10b981' : '#e5e7eb'}`,
                            borderRadius: 12,
                            fontSize: 15,
                            transition: 'border-color 0.2s',
                            outline: 'none'
                          }}
                          onFocus={(e) => !addressConfirmed && (e.target.style.borderColor = '#3b82f6')}
                          onBlur={(e) => !addressConfirmed && (e.target.style.borderColor = '#e5e7eb')}
                        />
                        {addressConfirmed && (
                          <div style={{
                            position: 'absolute',
                            right: 14,
                            top: 42,
                            color: '#10b981',
                            fontWeight: 700,
                            fontSize: 14
                          }}>
                            ✓ Confirmée
                          </div>
                        )}
                        {showSuggestions && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#fff',
                            border: '2px solid #e5e7eb',
                            borderRadius: 12,
                            marginTop: 4,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            maxHeight: 300,
                            overflowY: 'auto'
                          }}>
                            {isLoadingSuggestions ? (
                              <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>
                                Recherche en cours...
                              </div>
                            ) : addressSuggestions.length > 0 ? (
                              addressSuggestions.map((suggestion, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => selectEditAddress(suggestion)}
                                  style={{
                                    padding: '12px 14px',
                                    cursor: 'pointer',
                                    borderBottom: idx < addressSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                  onMouseLeave={(e) => e.target.style.background = '#fff'}
                                >
                                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>
                                    {suggestion.properties.label}
                                  </div>
                                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                    {suggestion.properties.context}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>
                                Aucune suggestion
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Ville */}
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151' }}>
                          Ville *
                        </label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="Ville"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 12,
                            fontSize: 15,
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Prix par nuit */}
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151' }}>
                          Prix par nuit (€) *
                        </label>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="120"
                          min="0"
                          step="1"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 12,
                            fontSize: 15,
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151' }}>
                          Description *
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Décrivez votre logement..."
                          rows={5}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '2px solid #e5e7eb',
                            borderRadius: 12,
                            fontSize: 15,
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      {/* Nombre de voyageurs, chambres, salles de bain, lits */}
                      <div className="edit-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 20 }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151', fontSize: 14 }}>
                            Voyageurs
                          </label>
                          <input
                            type="number"
                            value={editNbVoyageurs}
                            onChange={(e) => setEditNbVoyageurs(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '2px solid #e5e7eb',
                              borderRadius: 12,
                              fontSize: 15,
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151', fontSize: 14 }}>
                            Chambres
                          </label>
                          <input
                            type="number"
                            value={editBedrooms}
                            onChange={(e) => setEditBedrooms(Math.max(0, parseInt(e.target.value) || 0))}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '2px solid #e5e7eb',
                              borderRadius: 12,
                              fontSize: 15,
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151', fontSize: 14 }}>
                            Salles de bain
                          </label>
                          <input
                            type="number"
                            value={editBathrooms}
                            onChange={(e) => setEditBathrooms(Math.max(0, parseInt(e.target.value) || 0))}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '2px solid #e5e7eb',
                              borderRadius: 12,
                              fontSize: 15,
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151', fontSize: 14 }}>
                            Lits
                          </label>
                          <input
                            type="number"
                            value={editBeds}
                            onChange={(e) => setEditBeds(Math.max(0, parseInt(e.target.value) || 0))}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '2px solid #e5e7eb',
                              borderRadius: 12,
                              fontSize: 15,
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      {/* Photos existantes */}
                      {currentImages.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151' }}>
                            Photos actuelles ({currentImages.length})
                          </label>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {currentImages.map((imageUrl, idx) => (
                              <div key={idx} style={{ position: 'relative' }}>
                                <img
                                  src={imageUrl}
                                  alt={`Photo ${idx + 1}`}
                                  style={{
                                    width: 100,
                                    height: 100,
                                    objectFit: 'cover',
                                    borderRadius: 12,
                                    border: '2px solid #e5e7eb'
                                  }}
                                />
                                <button
                                  onClick={() => removeCurrentImage(idx)}
                                  type="button"
                                  style={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    width: 24,
                                    height: 24,
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload de nouvelles images */}
                      <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#374151' }}>
                          Ajouter des photos
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleNewFileChange}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '2px dashed #d1d5db',
                            borderRadius: 12,
                            fontSize: 14,
                            cursor: 'pointer'
                          }}
                        />
                        {newPreviewImages.length > 0 && (
                          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                            {newPreviewImages.map((preview, idx) => (
                              <div key={idx} style={{ position: 'relative' }}>
                                <img
                                  src={preview}
                                  alt={`Preview ${idx}`}
                                  style={{
                                    width: 100,
                                    height: 100,
                                    objectFit: 'cover',
                                    borderRadius: 12,
                                    border: '2px solid #e5e7eb'
                                  }}
                                />
                                <button
                                  onClick={() => removeNewImage(idx)}
                                  type="button"
                                  style={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    width: 24,
                                    height: 24,
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Boutons */}
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleCancelEditModal}
                          disabled={editLoading}
                          style={{
                            padding: '12px 24px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: editLoading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                            opacity: editLoading ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => !editLoading && (e.target.style.background = '#e5e7eb')}
                          onMouseLeave={(e) => !editLoading && (e.target.style.background = '#f3f4f6')}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={editLoading}
                          style={{
                            padding: '12px 24px',
                            background: editLoading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: editLoading ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                          }}
                          onMouseEnter={(e) => !editLoading && (e.target.style.transform = 'translateY(-2px)')}
                          onMouseLeave={(e) => !editLoading && (e.target.style.transform = 'translateY(0)')}
                        >
                          {editLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </article>
        )}

        {/* Modal Réactivation Accord Propriétaire */}
        {showReactivateModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20,
              overflowY: 'auto'
            }}
            onClick={() => setShowReactivateModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: 20,
                padding: 32,
                maxWidth: 700,
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <h2 style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#1F2937',
                marginBottom: 16,
                textAlign: 'center'
              }}>
                {isReadOnlyMode ? 'Accord de consentement propriétaire' : 'Réactiver l\'accord propriétaire'}
              </h2>
              
              <p style={{
                color: '#64748B',
                marginBottom: 24,
                textAlign: 'center',
                lineHeight: 1.6
              }}>
                {isReadOnlyMode 
                  ? 'Voici l\'accord de consentement que vous avez accepté lors de la validation du logement.'
                  : 'Pour réactiver votre accord, veuillez lire et accepter à nouveau le consentement du propriétaire.'
                }
              </p>

              {reactivateError && !isReadOnlyMode && (
                <div style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#B91C1C'
                }}>
                  ⚠️ {reactivateError}
                </div>
              )}

              {/* Checkbox + bouton afficher détail */}
              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                background: '#F8FAFC'
              }}>
                {!isReadOnlyMode && (
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    cursor: 'pointer',
                    marginBottom: 12
                  }}>
                    <input
                      type="checkbox"
                      checked={reactivateConsentChecked}
                      onChange={(e) => setReactivateConsentChecked(e.target.checked)}
                      style={{ marginTop: 2 }}
                    />
                    <span style={{
                      color: '#0F172A',
                      fontWeight: 600,
                      lineHeight: 1.5
                    }}>
                      J'ai lu et j'accepte l'accord de consentement du propriétaire
                    </span>
                  </label>
                )}
                
                <button
                  type="button"
                  onClick={() => setReactivateConsentOpen(v => !v)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#C96745',
                    fontWeight: 700,
                    padding: 0,
                    cursor: 'pointer',
                    marginTop: isReadOnlyMode ? 0 : 0
                  }}
                >
                  {reactivateConsentOpen ? 'Masquer le détail' : 'Afficher le détail'}
                </button>

                {/* Contrat */}
                {reactivateConsentOpen && (
                  <div style={{
                    marginTop: 16,
                    maxHeight: '50vh',
                    minHeight: '40vh',
                    overflowY: 'auto',
                    padding: 20,
                    background: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    lineHeight: 1.6,
                    fontSize: 14
                  }}>
                    <OwnerConsentAgreement
                      ownerName={(user?.user_metadata?.full_name || user?.user_metadata?.name || `${user?.user_metadata?.prenom || ''} ${user?.user_metadata?.nom || ''}`.trim() || user?.email || 'Le Propriétaire')}
                      tenantName={(item?.tenant_name || 'Nom du locataire principal')}
                      fullAddress={`${item?.address || ''}${item?.city ? ', ' + item.city : ''}`.trim()}
                    />
                  </div>
                )}
              </div>

              {/* Boutons */}
              <div style={{
                display: 'flex',
                gap: 12,
                marginTop: 24
              }}>
                {isReadOnlyMode ? (
                  <button
                    onClick={() => setShowReactivateModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 10px 20px rgba(59,130,246,0.3)'
                    }}
                  >
                    Fermer
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowReactivateModal(false)}
                      disabled={reactivateLoading}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        background: '#f3f4f6',
                        color: '#1F2937',
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: reactivateLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        if (!reactivateConsentChecked) {
                          setReactivateError('Vous devez accepter l\'accord de consentement');
                          return;
                        }
                        try {
                          setReactivateLoading(true);
                          setReactivateError('');
                          const res = await fetch('/api/listings/resume', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
                            },
                            body: JSON.stringify({ listingId: item.id })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || 'Request failed');
                          setItem(prev => prev ? { ...prev, status: data.status || 'en attente validation modérateur' } : prev);
                          setShowReactivateModal(false);
                        } catch (e) {
                      setReactivateError(e.message || 'Une erreur est survenue. Veuillez réessayer.');
                    } finally {
                      setReactivateLoading(false);
                    }
                  }}
                  disabled={!reactivateConsentChecked || reactivateLoading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: (!reactivateConsentChecked || reactivateLoading) ? '#94A3B8' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: (!reactivateConsentChecked || reactivateLoading) ? 'not-allowed' : 'pointer',
                    boxShadow: (!reactivateConsentChecked || reactivateLoading) ? 'none' : '0 10px 20px rgba(34,197,94,0.3)'
                  }}
                >
                  {reactivateLoading ? 'Réactivation...' : 'Valider et réactiver'}
                </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          /* Responsive design pour desktop */
          @media (min-width: 1025px) {
            .detail-grid {
              grid-template-columns: 1.4fr 0.6fr !important;
              gap: 28px !important;
            }
          }
          
          /* Responsive design pour tablette et mobile */
          @media (max-width: 1024px) {
            .detail-grid {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
              margin-top: -20px !important;
            }
          }

          @media (max-width: 768px) {
            /* Adaptation du padding global */
            :global(.logement-detail) {
              padding: 0 !important;
              max-width: 100vw !important;
              overflow-x: hidden !important;
            }
            
            /* Container de la grille */
            .detail-grid {
              padding: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            
            /* Container principal pour éviter le débordement */
            :global(main) {
              padding-left: 0 !important;
              padding-right: 0 !important;
              overflow-x: hidden !important;
              max-width: 100vw !important;
            }
            
            :global(body) {
              overflow-x: hidden !important;
              max-width: 100vw !important;
            }
            
            :global(*) {
              max-width: 100vw !important;
            }
            
            /* Ajuste le padding des containers principaux */
            :global(.logement-detail > div) {
              padding-left: 0 !important;
              padding-right: 0 !important;
              max-width: 100vw !important;
              box-sizing: border-box !important;
            }
            
            /* Container avec padding */
            :global(main > article > div) {
              padding-left: 0 !important;
              padding-right: 0 !important;
              max-width: 100vw !important;
              box-sizing: border-box !important;
            }
            
            /* Galerie mobile - pleine largeur */
            :global(.gallery-container) {
              margin-bottom: 20px !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
              width: 100% !important;
            }
            
            :global(.gallery-container > div:first-child) {
              border-radius: 0 !important;
              max-width: 100% !important;
              width: 100vw !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            
            /* Thumbnails en scroll horizontal sur mobile */
            :global(.gallery-thumbnails) {
              overflow-x: auto !important;
              flex-wrap: nowrap !important;
              -webkit-overflow-scrolling: touch !important;
              scrollbar-width: none !important;
              padding-left: 12px !important;
              padding-right: 12px !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            
            :global(.gallery-thumbnails::-webkit-scrollbar) {
              display: none !important;
            }
            
            /* Cards principales - éviter le débordement */
            :global(.card-header),
            :global(.card-description),
            :global(.card-map),
            :global(.card-reviews),
            :global(.card-reservations) {
              border-radius: 12px !important;
              padding: 16px !important;
              margin-bottom: 14px !important;
              margin-left: 12px !important;
              margin-right: 12px !important;
              width: calc(100vw - 24px) !important;
              max-width: calc(100vw - 24px) !important;
              box-sizing: border-box !important;
              overflow-x: hidden !important;
            }
            
            /* Éléments à l'intérieur des cards */
            :global(.card-header *),
            :global(.card-description *),
            :global(.card-map *),
            :global(.card-reviews *),
            :global(.card-reservations *) {
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            
            /* Titre principal */
            :global(.main-title) {
              font-size: 20px !important;
              line-height: 1.3 !important;
            }
            
            /* Grid des infos (voyageurs, chambres, etc.) */
            :global(.info-chips-grid) {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 6px !important;
              margin-bottom: 16px !important;
            }
            
            :global(.info-chip) {
              padding: 8px 4px !important;
              min-width: 0 !important;
            }
            
            :global(.info-chip svg) {
              width: 16px !important;
              height: 16px !important;
              margin-bottom: 4px !important;
            }
            
            :global(.info-chip-value) {
              font-size: 14px !important;
            }
            
            :global(.info-chip-label) {
              font-size: 9px !important;
            }
            
            /* Stats row */
            :global(.stats-row) {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 12px !important;
            }
            
            :global(.stats-divider) {
              display: none !important;
            }
            
            /* Actions row */
            :global(.actions-row) {
              flex-direction: column !important;
              gap: 8px !important;
              max-width: 100% !important;
            }
            
            :global(.actions-row > *) {
              width: 100% !important;
              max-width: 100% !important;
              justify-content: center !important;
              box-sizing: border-box !important;
            }
            
            /* Bouton partager */
            :global(.share-button) {
              min-width: auto !important;
              width: 100% !important;
            }
            
            /* Sidebar de réservation */
            :global(.booking-sidebar) {
              position: static !important;
              bottom: auto !important;
              left: auto !important;
              right: auto !important;
              top: auto !important;
              margin: 14px 12px !important;
              width: calc(100vw - 24px) !important;
              max-width: calc(100vw - 24px) !important;
              border-radius: 12px !important;
              box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
              z-index: auto !important;
              padding: 16px !important;
              max-height: none !important;
              overflow-y: visible !important;
              overflow-x: hidden !important;
              box-sizing: border-box !important;
            }
            
            /* Éléments dans la sidebar */
            :global(.booking-sidebar *) {
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            
            /* Calendrier */
            :global(.rdp) {
              font-size: 13px !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
            }
            
            :global(.rdp .rdp-months) {
              flex-direction: column !important;
              max-width: 100% !important;
            }
            
            :global(.rdp .rdp-month) {
              width: 100% !important;
              max-width: 100% !important;
            }
            
            :global(.rdp-table) {
              max-width: 100% !important;
            }
            
            /* Price breakdown */
            :global(.price-detail-row) {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
            }
            
            /* Section titre/header avec statut */
            :global(.header-top-row) {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 12px !important;
            }
            
            /* Bouton partager en pleine largeur */
            :global(.share-button) {
              min-width: auto !important;
              width: 100% !important;
              justify-content: center !important;
            }
            
            /* Modal */
            :global(.modal-content) {
              width: calc(100vw - 24px) !important;
              max-width: calc(100vw - 24px) !important;
              max-height: 90vh !important;
              overflow-y: auto !important;
              margin: 12px !important;
            }
            
            :global(.modal-body) {
              padding: 16px !important;
            }
            
            /* Form d'édition */
            :global(.edit-form-row) {
              flex-direction: column !important;
              gap: 16px !important;
            }
            
            :global(.edit-form-row > *) {
              flex: 1 1 auto !important;
              width: 100% !important;
            }
            
            /* Sélecteur de voyageurs */
            :global(.guests-selector) {
              width: 100% !important;
            }
            
            /* Review et reservation items */
            :global(.review-item),
            :global(.reservation-item) {
              padding: 12px !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
              overflow-x: hidden !important;
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 10px !important;
            }
            
            :global(.review-item *),
            :global(.reservation-item *) {
              max-width: 100% !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
            
            /* Réservations */
            :global(.reservation-actions) {
              width: 100% !important;
              max-width: 100% !important;
              flex-direction: column !important;
              gap: 8px !important;
              box-sizing: border-box !important;
            }
            
            :global(.reservation-actions > *) {
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
          }

          @media (max-width: 480px) {
            /* Très petits écrans */
            :global(.info-chips-grid) {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 6px !important;
            }
            
            :global(.main-title) {
              font-size: 18px !important;
              line-height: 1.3 !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
            
            :global(.card-header),
            :global(.card-description),
            :global(.card-map),
            :global(.card-reviews),
            :global(.card-reservations) {
              padding: 14px !important;
              margin-left: 8px !important;
              margin-right: 8px !important;
              width: calc(100vw - 16px) !important;
              max-width: calc(100vw - 16px) !important;
            }
            
            :global(.gallery-thumbnails) {
              padding-left: 8px !important;
              padding-right: 8px !important;
            }
            
            :global(.booking-sidebar) {
              margin: 14px 8px !important;
              width: calc(100vw - 16px) !important;
              max-width: calc(100vw - 16px) !important;
              padding: 14px !important;
            }
          }
          
          :global(.selected-night) {
            background: #1f2937 !important;
            color: #fff !important;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          :global(.rdp) {
            --rdp-accent-color: #374151;
            --rdp-background-color: #f3f4f6;
            --rdp-outline: 2px solid #d1d5db;
          }
          :global(.rdp .rdp-day) {
            transition: transform .05s ease, background-color .2s ease, color .2s ease;
            border-radius: 6px;
          }
          :global(.rdp .rdp-day:hover) {
            background: #f9fafb;
          }
          :global(.rdp .rdp-day_today) {
            outline: 1px dashed #9ca3af;
            outline-offset: -2px;
          }
          :global(.rdp .rdp-day_disabled) {
            color: #d1d5db !important;
          }
          :global(.rdp .rdp-nav button) {
            border-radius: 6px;
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}