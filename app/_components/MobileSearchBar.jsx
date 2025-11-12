'use client';

import { useState, useEffect, useRef } from 'react';

export default function MobileSearchBar({ 
  destination, 
  arrivee, 
  depart, 
  voyageurs,
  onUpdate
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localDestination, setLocalDestination] = useState(destination);
  const [localArrivee, setLocalArrivee] = useState(arrivee);
  const [localDepart, setLocalDepart] = useState(depart);
  const [localVoyageurs, setLocalVoyageurs] = useState(voyageurs);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Sync with parent props when they change
  useEffect(() => {
    setLocalDestination(destination);
    setLocalArrivee(arrivee);
    setLocalDepart(depart);
    setLocalVoyageurs(voyageurs);
  }, [destination, arrivee, depart, voyageurs]);

  // Fetch suggestions from Nominatim API
  useEffect(() => {
    if (!isOpen || localDestination.length < 3) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(localDestination)}&limit=5&accept-language=fr`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Erreur suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localDestination, isOpen]);

  const handleApply = () => {
    onUpdate({
      destination: localDestination,
      arrivee: localArrivee,
      depart: localDepart,
      voyageurs: localVoyageurs
    });
    setIsOpen(false);
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getSummary = () => {
    const parts = [];
    if (destination) parts.push(destination.split(',')[0]);
    if (arrivee && depart) parts.push(`${formatDateShort(arrivee)} - ${formatDateShort(depart)}`);
    else if (arrivee) parts.push(`Dès ${formatDateShort(arrivee)}`);
    if (voyageurs) parts.push(`${voyageurs} voyageur${voyageurs > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' • ') : 'Modifier la recherche';
  };

  return (
    <>
      {/* Sticky compact bar */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '600px',
          background: 'white',
          borderRadius: '50px',
          padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          zIndex: 1000,
          border: '1px solid #E5E7EB',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ 
          fontSize: '18px',
          flexShrink: 0
        }}>
          🔍
        </div>
        <div style={{ 
          flex: 1,
          fontSize: '14px',
          color: '#2D3748',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {getSummary()}
        </div>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <span style={{ color: 'white', fontSize: '18px', lineHeight: 1 }}>⚙️</span>
        </div>
      </div>

      {/* Full-screen modal */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 9998,
              animation: 'fadeIn 0.3s ease'
            }}
          />

          {/* Modal */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'white',
            zIndex: 9999,
            overflowY: 'auto',
            animation: 'slideInRight 0.3s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 1
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#2D3748' }}>
                Filtres de recherche
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6B7280',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 20px', paddingBottom: '100px' }}>
              {/* Destination */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2D3748'
                }}>
                  Destination
                </label>
                <input
                  type="text"
                  value={localDestination}
                  onChange={e => setLocalDestination(e.target.value)}
                  placeholder="Ville, région..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'border 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#60A29D'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />

                {isLoadingSuggestions && (
                  <div style={{ textAlign: 'center', padding: '12px', color: '#6B7280', fontSize: '14px' }}>
                    Recherche...
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setLocalDestination(sug.display_name);
                          setSuggestions([]);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          textAlign: 'left',
                          background: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          marginBottom: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#2D3748',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.target.style.background = '#F9FAFB';
                          e.target.style.borderColor = '#60A29D';
                        }}
                        onMouseLeave={e => {
                          e.target.style.background = 'white';
                          e.target.style.borderColor = '#E5E7EB';
                        }}
                      >
                        📍 {sug.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2D3748'
                }}>
                  Dates
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', display: 'block' }}>
                      Arrivée
                    </label>
                    <input
                      type="date"
                      value={localArrivee}
                      onChange={e => setLocalArrivee(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 12px',
                        fontSize: '15px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#60A29D'}
                      onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', display: 'block' }}>
                      Départ
                    </label>
                    <input
                      type="date"
                      value={localDepart}
                      onChange={e => setLocalDepart(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 12px',
                        fontSize: '15px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#60A29D'}
                      onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                    />
                  </div>
                </div>
              </div>

              {/* Voyageurs */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2D3748'
                }}>
                  Nombre de voyageurs
                </label>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '2px solid #E5E7EB'
                }}>
                  <span style={{ fontSize: '16px', color: '#2D3748' }}>Voyageurs</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                      onClick={() => setLocalVoyageurs(Math.max(1, localVoyageurs - 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '2px solid #E5E7EB',
                        background: 'white',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: '#2D3748'
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#2D3748', minWidth: '30px', textAlign: 'center' }}>
                      {localVoyageurs}
                    </span>
                    <button
                      onClick={() => setLocalVoyageurs(Math.min(20, localVoyageurs + 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '2px solid #E5E7EB',
                        background: 'white',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: '#2D3748'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with action buttons */}
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 20px',
              background: 'white',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              gap: '12px',
              zIndex: 1
            }}>
              <button
                onClick={() => {
                  setLocalDestination('');
                  setLocalArrivee('');
                  setLocalDepart('');
                  setLocalVoyageurs(2);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '2px solid #E5E7EB',
                  background: 'white',
                  color: '#2D3748',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Effacer
              </button>
              <button
                onClick={handleApply}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(201,103,69,0.3)'
                }}
              >
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
