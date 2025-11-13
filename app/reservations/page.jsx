
"use client";

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ReservationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const success = searchParams.get('success');
  const reservationId = searchParams.get('reservationId');

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [hostValidationLoading, setHostValidationLoading] = useState(null);
  const [hostRejectionLoading, setHostRejectionLoading] = useState(null);
  const [hostCancellationLoading, setHostCancellationLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [showCancelledReservations, setShowCancelledReservations] = useState(false);
  // Vue actuelle: voyageur (user_id) ou hôte (host_id)
  const [viewMode, setViewMode] = useState('guest'); // 'guest' | 'host'

  // Format prix - Les prix sont stockés en euros dans la DB
  const formatEUR = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount); // Pas de division car déjà en euros
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Charger les réservations de l'utilisateur
  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/connexion');
          return;
        }
        setUser(user);

        const { data: { session } } = await supabase.auth.getSession();
        setAccessToken(session?.access_token || null);

        // Charger les réservations de l'utilisateur
        const filterField = viewMode === 'host' ? 'host_id' : 'user_id';

        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            listings!inner(
              id,
              title,
              city,
              address,
              images,
              price_per_night
            )
          `)
          .eq(filterField, user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReservations(data || []);
        setActionError('');
      } catch (error) {
        console.error('Erreur lors du chargement des réservations:', error);
        setActionError("Impossible de charger les réservations. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [router, viewMode]);

  const handleHostValidation = async (reservationId, desiredState = true) => {
    if (!reservationId) return;
    if (!accessToken) {
      setActionError("Session expirée. Veuillez vous reconnecter pour valider la réservation.");
      return;
    }

    try {
      setHostValidationLoading(reservationId);
      setActionError('');

      const response = await fetch('/api/reservations/host-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ reservationId, hostValidation: desiredState })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Erreur serveur');
      }

      const nextValue = payload?.reservation?.host_validation_ok ?? desiredState;
      setReservations((prev) => prev.map((item) => (
        item.id === reservationId
          ? { ...item, host_validation_ok: nextValue }
          : item
      )));
    } catch (error) {
      console.error('Erreur validation hôte:', error);
      setActionError(error.message || 'Une erreur est survenue lors de la validation.');
    } finally {
      setHostValidationLoading(null);
    }
  };

  const handleHostRejection = async (reservationId) => {
    if (!reservationId) return;
    if (!accessToken) {
      setActionError("Session expirée. Veuillez vous reconnecter pour refuser la réservation.");
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir refuser cette réservation ? Le voyageur sera remboursé automatiquement.')) {
      return;
    }

    try {
      setHostRejectionLoading(reservationId);
      setActionError('');

      const response = await fetch('/api/reservations/host-reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ reservationId })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Erreur serveur');
      }

      // Retirer la réservation de la liste
      setReservations((prev) => prev.filter((item) => item.id !== reservationId));
    } catch (error) {
      console.error('Erreur refus hôte:', error);
      setActionError(error.message || 'Une erreur est survenue lors du refus.');
    } finally {
      setHostRejectionLoading(null);
    }
  };

  const handleHostCancellation = async (reservationId) => {
    if (!reservationId) return;
    if (!accessToken) {
      setActionError("Session expirée. Veuillez vous reconnecter pour annuler la réservation.");
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation déjà validée ? Le voyageur sera remboursé intégralement.')) {
      return;
    }

    try {
      setHostCancellationLoading(reservationId);
      setActionError('');

      const response = await fetch('/api/reservations/host-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ reservationId })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Erreur serveur');
      }

      // Retirer la réservation de la liste
      setReservations((prev) => prev.filter((item) => item.id !== reservationId));
    } catch (error) {
      console.error('Erreur annulation hôte:', error);
      setActionError(error.message || 'Une erreur est survenue lors de l\'annulation.');
    } finally {
      setHostCancellationLoading(null);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 16,
            fontWeight: 600,
            color: '#64748b'
          }}>
            <div style={{
              width: 24,
              height: 24,
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Chargement...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{
        minHeight: '80vh',
        background: '#f9fafb',
        paddingTop: 40,
        paddingBottom: 60
      }}>
        <div style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '0 20px'
        }}>
          {/* Message de succès */}
          {success && reservationId && (
            <div style={{
              background: '#ecfdf5',
              border: '2px solid #10b981',
              borderRadius: 12,
              padding: 24,
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{
                background: '#10b981',
                borderRadius: '50%',
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <h2 style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#065f46',
                  marginBottom: 4
                }}>
                  Paiement confirmé !
                </h2>
                <p style={{
                  fontSize: 14,
                  color: '#047857',
                  fontWeight: 600,
                  margin: 0
                }}>
                  Votre paiement a été traité avec succès. Votre hôte a été notifié de votre réservation et peut désormais la valider.
                </p>
              </div>
            </div>
          )}

          {actionError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 16,
              padding: 16,
              marginBottom: 28,
              color: '#991b1b',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {actionError}
            </div>
          )}

          {/* Titre */}
          <div style={{
            marginBottom: 40,
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              color: '#0f172a',
              marginBottom: 12,
              letterSpacing: '-0.02em'
            }}>
              Mes réservations
            </h1>
            <p style={{
              fontSize: 16,
              color: '#64748b',
              fontWeight: 600
            }}>
              Retrouvez toutes vos réservations en cours et passées
            </p>
            {/* Onglets Voyageur / Hôte */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginTop: 16
            }}>
              <button
                onClick={() => setViewMode('guest')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  background: viewMode === 'guest'
                    ? '#111827'
                    : '#fff',
                  color: viewMode === 'guest' ? '#ffffff' : '#111827'
                }}
              >
                En tant que voyageur
              </button>
              <button
                onClick={() => setViewMode('host')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  background: viewMode === 'host'
                    ? '#111827'
                    : '#fff',
                  color: viewMode === 'host' ? '#ffffff' : '#111827'
                }}
              >
                En tant qu'hôte
              </button>
            </div>
          </div>

          {/* Liste des réservations */}
          {reservations.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 24,
              padding: 60,
              textAlign: 'center',
              boxShadow: '0 10px 35px rgba(0,0,0,0.1)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 80,
                height: 80,
                background: '#f1f5f9',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h2 style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: 12
              }}>
                Aucune réservation
              </h2>
              <p style={{
                fontSize: 16,
                color: '#64748b',
                fontWeight: 600,
                marginBottom: 24
              }}>
                {viewMode === 'host'
                  ? "Vous n'avez pas encore reçu de réservations en tant qu'hôte."
                  : "Vous n'avez pas encore effectué de réservation."}
              </p>
              <button
                onClick={() => router.push('/logements')}
                style={{
                  background: '#111827',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '16px 24px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(37,99,235,0.3)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Découvrir les logements
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: 24
            }}>
              {/* Réservations en cours */}
              {reservations.filter(r => r.status !== 'cancelled' && new Date(r.date_depart) >= new Date()).map((reservation) => (
                <div
                  key={reservation.id}
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    padding: 24,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    border: '1px solid #f1f5f9',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: 20,
                    alignItems: 'center'
                  }}>
                    {/* Image du logement */}
                    <img
                      src="/placeholder-image.jpg"
                      alt={reservation.listings?.title}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 12,
                        objectFit: 'cover',
                        border: '2px solid #f1f5f9'
                      }}
                    />

                    {/* Informations de la réservation */}
                    <div>
                      <h3 style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: '#0f172a',
                        marginBottom: 8
                      }}>
                        {reservation.listings?.title}
                      </h3>
                      
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 16,
                        marginBottom: 8,
                        fontSize: 14,
                        color: '#64748b',
                        fontWeight: 600
                      }}>
                        <span>
                          📅 {formatDate(reservation.date_arrivee)} → {formatDate(reservation.date_depart)}
                        </span>
                        <span>
                          👥 {reservation.guests} voyageur{reservation.guests > 1 ? 's' : ''}
                        </span>
                        <span>
                        🌙 {reservation.nights} nuit{reservation.nights > 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                        fontSize: 12,
                        color: '#64748b',
                        fontWeight: 600
                      }}>
                        <span>📍 {reservation.listings?.address || reservation.listings?.city}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          background: reservation.host_validation_ok
                            ? '#bae6fd'
                            : '#ffedd5',
                          color: reservation.host_validation_ok ? '#075985' : '#9a3412',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontWeight: 600,
                          fontSize: 12,
                          border: `1px solid ${reservation.host_validation_ok ? '#38bdf8' : '#fdba74'}`
                        }}>
                          {reservation.host_validation_ok ? 'Validation hôte : OK' : 'Validation hôte en attente'}
                        </span>
                      </div>
                    </div>

                    {/* Prix et actions */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: '#0f172a',
                        marginBottom: 12
                      }}>
                        {formatEUR(reservation.total_price)}
                      </div>
                      
                      <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                        <button
                          onClick={() => router.push(`/reservations/${reservation.id}`)}
                          style={{
                            background: '#111827',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 16px',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1f2937';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#111827';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          Voir détails
                        </button>
                        
                        <button
                          onClick={() => router.push(`/logement/${reservation.listing_id}`)}
                          style={{
                            background: '#f9fafb',
                            color: '#111827',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            padding: '8px 16px',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          Voir logement
                        </button>
                        {viewMode === 'host' && !reservation.host_validation_ok && reservation.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => handleHostValidation(reservation.id, true)}
                              disabled={hostValidationLoading === reservation.id || hostRejectionLoading === reservation.id || hostCancellationLoading === reservation.id}
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 16px',
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: (hostValidationLoading === reservation.id || hostRejectionLoading === reservation.id || hostCancellationLoading === reservation.id) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: (hostValidationLoading === reservation.id || hostRejectionLoading === reservation.id || hostCancellationLoading === reservation.id) ? 0.7 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (hostValidationLoading === reservation.id || hostRejectionLoading === reservation.id || hostCancellationLoading === reservation.id) return;
                                e.currentTarget.style.background = '#059669';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#10b981';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              {hostValidationLoading === reservation.id ? 'Validation…' : 'Valider'}
                            </button>
                            <button
                              onClick={() => handleHostRejection(reservation.id)}
                              disabled={hostValidationLoading === reservation.id || hostRejectionLoading === reservation.id || hostCancellationLoading === reservation.id}
                              style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 16px',
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: (hostValidationLoading === reservation.id || hostRejectionLoading === reservation.id || hostCancellationLoading === reservation.id) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: (hostValidationLoading === reservation.id || hostRejectionLoading === reservation.id || hostCancellationLoading === reservation.id) ? 0.7 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (hostValidationLoading === reservation.id || hostRejectionLoading === reservation.id || hostCancellationLoading === reservation.id) return;
                                e.currentTarget.style.background = '#dc2626';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ef4444';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              {hostRejectionLoading === reservation.id ? 'Refus…' : 'Refuser'}
                            </button>
                          </>
                        )}
                        {viewMode === 'host' && reservation.host_validation_ok && reservation.status !== 'cancelled' && (
                          <button
                            onClick={() => handleHostCancellation(reservation.id)}
                            disabled={hostCancellationLoading === reservation.id}
                            style={{
                              background: '#f97316',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '8px 16px',
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: hostCancellationLoading === reservation.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: hostCancellationLoading === reservation.id ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (hostCancellationLoading === reservation.id) return;
                              e.currentTarget.style.background = '#ea580c';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f97316';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {hostCancellationLoading === reservation.id ? 'Annulation…' : 'Annuler la réservation'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Réservations passées - Menu déroulant */}
              {reservations.filter(r => r.status !== 'cancelled' && new Date(r.date_depart) < new Date()).length > 0 && (
                <div style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                  marginTop: 12
                }}>
                  <button
                    onClick={() => setShowPastReservations(!showPastReservations)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: 16,
                      color: '#0f172a'
                    }}
                  >
                    <span>📅 Réservations passées ({reservations.filter(r => r.status !== 'cancelled' && new Date(r.date_depart) < new Date()).length})</span>
                    <span style={{ fontSize: 20, transition: 'transform 0.2s', transform: showPastReservations ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                  </button>
                  
                  {showPastReservations && (
                    <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
                      {reservations.filter(r => r.status !== 'cancelled' && new Date(r.date_depart) < new Date()).map((reservation) => (
                        <div
                          key={reservation.id}
                          style={{
                            background: '#f8fafc',
                            borderRadius: 16,
                            padding: 20,
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            gap: 16,
                            alignItems: 'center'
                          }}>
                            <img
                              src="/placeholder-image.jpg"
                              alt={reservation.listings?.title}
                              style={{
                                width: 80,
                                height: 80,
                                borderRadius: 10,
                                objectFit: 'cover',
                                border: '2px solid #e2e8f0'
                              }}
                            />
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                                {reservation.listings?.title}
                              </h4>
                              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                                {formatDate(reservation.date_arrivee)} → {formatDate(reservation.date_depart)}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                                {formatEUR(reservation.total_price)}
                              </div>
                              <button
                                onClick={() => router.push(`/reservations/${reservation.id}`)}
                                style={{
                                  marginTop: 8,
                                  background: '#e2e8f0',
                                  color: '#475569',
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '6px 12px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Détails
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Réservations annulées/refusées - Menu déroulant */}
              {reservations.filter(r => r.status === 'cancelled').length > 0 && (
                <div style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '1px solid #fee2e2',
                  marginTop: 12
                }}>
                  <button
                    onClick={() => setShowCancelledReservations(!showCancelledReservations)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: 16,
                      color: '#991b1b'
                    }}
                  >
                    <span>❌ Réservations annulées ({reservations.filter(r => r.status === 'cancelled').length})</span>
                    <span style={{ fontSize: 20, transition: 'transform 0.2s', transform: showCancelledReservations ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                  </button>
                  
                  {showCancelledReservations && (
                    <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
                      {reservations.filter(r => r.status === 'cancelled').map((reservation) => (
                        <div
                          key={reservation.id}
                          style={{
                            background: '#fef2f2',
                            borderRadius: 16,
                            padding: 20,
                            border: '1px solid #fecaca'
                          }}
                        >
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            gap: 16,
                            alignItems: 'center'
                          }}>
                            <img
                              src="/placeholder-image.jpg"
                              alt={reservation.listings?.title}
                              style={{
                                width: 80,
                                height: 80,
                                borderRadius: 10,
                                objectFit: 'cover',
                                border: '2px solid #fecaca',
                                opacity: 0.7
                              }}
                            />
                            <div>
                              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#991b1b', margin: '0 0 6px' }}>
                                {reservation.listings?.title}
                              </h4>
                              <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0 }}>
                                {formatDate(reservation.date_arrivee)} → {formatDate(reservation.date_depart)}
                              </p>
                              <span style={{
                                display: 'inline-block',
                                marginTop: 6,
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: 999,
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 700
                              }}>
                                Annulée
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#991b1b', textDecoration: 'line-through' }}>
                                {formatEUR(reservation.total_price)}
                              </div>
                              <button
                                onClick={() => router.push(`/reservations/${reservation.id}`)}
                                style={{
                                  marginTop: 8,
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '6px 12px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Détails
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          /* Mobile responsive grid for reservation cards */
          div[style*="gridTemplateColumns: auto 1fr auto"] {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          /* Stack buttons vertically on mobile */
          div[style*="flexDirection: column"] button {
            width: 100%;
          }
          
          /* Full width images on mobile */
          img[style*="width: 100px"] {
            width: 100% !important;
            height: 180px !important;
          }
        }
      `}</style>
      
      <Footer />
    </>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReservationsContent />
    </Suspense>
  );
}
