'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileSearchWorkflow({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: lieu, 2: dates, 3: voyageurs
  const [lieu, setLieu] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [arrivee, setArrivee] = useState(null);
  const [depart, setDepart] = useState(null);
  const [voyageurs, setVoyageurs] = useState(2);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const router = useRouter();
  const inputRef = useRef(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLieu('');
      setSuggestions([]);
      setArrivee(null);
      setDepart(null);
      setVoyageurs(2);
      setSelectedMonth(new Date());
    }
  }, [isOpen]);

  // Auto-focus input when opening
  useEffect(() => {
    if (isOpen && step === 1 && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  // Fetch suggestions from Nominatim API
  useEffect(() => {
    if (lieu.length < 3) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lieu)}&limit=5&accept-language=fr`
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
  }, [lieu]);

  const handleLieuSelect = (suggestion) => {
    setLieu(suggestion.display_name);
    setSuggestions([]);
    setTimeout(() => setStep(2), 300);
  };

  const handleDateSelect = (date) => {
    if (!arrivee) {
      setArrivee(date);
    } else if (!depart) {
      if (date > arrivee) {
        setDepart(date);
        setTimeout(() => setStep(3), 500);
      } else {
        // Reset if selecting earlier date
        setArrivee(date);
        setDepart(null);
      }
    } else {
      // Reset selection
      setArrivee(date);
      setDepart(null);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (lieu) params.append('destination', lieu);
    if (arrivee) params.append('arrivee', arrivee.toISOString().split('T')[0]);
    if (depart) params.append('depart', depart.toISOString().split('T')[0]);
    params.append('voyageurs', voyageurs);
    
    router.push(`/logements?${params.toString()}`);
    onClose();
  };

  // Generate calendar days for current month
  const generateCalendar = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const changeMonth = (offset) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const isDateInRange = (date) => {
    if (!arrivee || !depart || !date) return false;
    return date > arrivee && date < depart;
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    return (arrivee && date.toDateString() === arrivee.toDateString()) ||
           (depart && date.toDateString() === depart.toDateString());
  };

  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
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
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderRadius: '24px 24px 0 0',
        zIndex: 9999,
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'slideUp 0.3s ease',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: '#2D3748'
                }}
              >
                ←
              </button>
            )}
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#2D3748' }}>
              {step === 1 && 'Où allez-vous ?'}
              {step === 2 && 'Quand ?'}
              {step === 3 && 'Combien de voyageurs ?'}
            </h3>
          </div>
          <button
            onClick={onClose}
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

        {/* Progress indicator */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 20px 0' }}>
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: s <= step ? '#C96745' : '#E5E7EB',
                transition: 'background 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 20px', minHeight: '300px' }}>
          {/* Step 1: Lieu */}
          {step === 1 && (
            <div>
              <input
                ref={inputRef}
                type="text"
                value={lieu}
                onChange={e => setLieu(e.target.value)}
                placeholder="Ville, région, pays..."
                style={{
                  width: '100%',
                  padding: '16px 20px',
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
                <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                  Recherche...
                </div>
              )}

              {suggestions.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLieuSelect(sug)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        textAlign: 'left',
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
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
          )}

          {/* Step 2: Dates */}
          {step === 2 && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => changeMonth(-1)}
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
                  onClick={() => changeMonth(1)}
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

              {arrivee && depart && (
                <div style={{
                  background: '#F0F9FF',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  border: '1px solid #BAE6FD',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: '#0369A1', fontWeight: 500 }}>
                    {formatDate(arrivee)} → {formatDate(depart)}
                  </span>
                </div>
              )}

              {/* Weekday headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
                  <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6B7280', padding: '8px 0' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {generateCalendar().map((date, idx) => {
                  if (!date) {
                    return <div key={idx} />;
                  }

                  const isSelected = isDateSelected(date);
                  const inRange = isDateInRange(date);
                  const isPast = isPastDate(date);

                  return (
                    <button
                      key={idx}
                      onClick={() => !isPast && handleDateSelect(date)}
                      disabled={isPast}
                      style={{
                        padding: '12px 4px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isPast ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: isSelected ? 600 : 400,
                        background: isSelected ? '#C96745' : inRange ? '#FEE2E2' : 'transparent',
                        color: isSelected ? 'white' : isPast ? '#D1D5DB' : inRange ? '#DC2626' : '#2D3748',
                        transition: 'all 0.2s ease',
                        opacity: isPast ? 0.4 : 1
                      }}
                      onMouseEnter={e => {
                        if (!isPast && !isSelected) {
                          e.target.style.background = '#F3F4F6';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isPast && !isSelected && !inRange) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {arrivee && !depart && (
                <p style={{ textAlign: 'center', marginTop: '16px', color: '#6B7280', fontSize: '14px' }}>
                  Sélectionnez la date de départ
                </p>
              )}
            </div>
          )}

          {/* Step 3: Voyageurs */}
          {step === 3 && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px',
                background: '#F9FAFB',
                borderRadius: '16px',
                marginBottom: '24px'
              }}>
                <span style={{ fontSize: '18px', fontWeight: 600, color: '#2D3748' }}>
                  Nombre de voyageurs
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={() => setVoyageurs(Math.max(1, voyageurs - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '2px solid #E5E7EB',
                      background: 'white',
                      fontSize: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      color: '#2D3748'
                    }}
                    onMouseEnter={e => e.target.style.borderColor = '#60A29D'}
                    onMouseLeave={e => e.target.style.borderColor = '#E5E7EB'}
                  >
                    −
                  </button>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#2D3748', minWidth: '40px', textAlign: 'center' }}>
                    {voyageurs}
                  </span>
                  <button
                    onClick={() => setVoyageurs(Math.min(20, voyageurs + 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '2px solid #E5E7EB',
                      background: 'white',
                      fontSize: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      color: '#2D3748'
                    }}
                    onMouseEnter={e => e.target.style.borderColor = '#60A29D'}
                    onMouseLeave={e => e.target.style.borderColor = '#E5E7EB'}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={!lieu || !arrivee || !depart}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: (!lieu || !arrivee || !depart) 
                    ? '#D1D5DB' 
                    : 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: (!lieu || !arrivee || !depart) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: (!lieu || !arrivee || !depart) 
                    ? 'none' 
                    : '0 4px 20px rgba(201,103,69,0.3)'
                }}
              >
                Rechercher
              </button>

              <div style={{ marginTop: '16px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                  <strong style={{ color: '#2D3748' }}>Récapitulatif :</strong>
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#2D3748' }}>
                  📍 {lieu}
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#2D3748' }}>
                  📅 {formatDate(arrivee)} → {formatDate(depart)}
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#2D3748' }}>
                  👥 {voyageurs} voyageur{voyageurs > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
