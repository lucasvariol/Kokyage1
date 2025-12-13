'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '../../_components/Header';
import Footer from '../../_components/Footer';

export default function ReservationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [user, setUser] = useState(null);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  // Format prix - CORRECTION : les prix sont en euros dans la DB (286.56 = 286,56€)
  const formatEUR = (amount) => {
    console.log('🔍 formatEUR appelé avec:', { 
      amount, 
      'type': typeof amount 
    });
    const result = new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount); // PAS de division par 100 car déjà en euros
    console.log('💰 Résultat formaté:', result);
    return result;
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

  // Fonction pour formater une date courte (pour les dates limites de remboursement)
  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculer le taux de remboursement actuel basé sur les dates
  const getRefundInfo = () => {
    if (!reservation || reservation.status !== 'confirmed') {
      return { rate: 0, label: 'Aucun remboursement', color: '#ef4444' };
    }

    const now = new Date();
    const refund50Date = reservation.refund_50_percent_date ? new Date(reservation.refund_50_percent_date) : null;
    const refund0Date = reservation.refund_0_percent_date ? new Date(reservation.refund_0_percent_date) : null;

    // Si pas de dates définies, utiliser les valeurs par défaut (7 jours et 2 jours avant arrivée)
    const arrivalDate = new Date(reservation.date_arrivee || reservation.start_date);
    const defaultRefund50 = refund50Date || new Date(arrivalDate.getTime() - (6 * 24 * 60 * 60 * 1000));
    const defaultRefund0 = refund0Date || new Date(arrivalDate.getTime() - (2 * 24 * 60 * 60 * 1000));

    if (now < defaultRefund50) {
      return { 
        rate: 100, 
        label: 'Remboursement intégral', 
        color: '#10b981',
        deadline: formatShortDate(defaultRefund50)
      };
    } else if (now < defaultRefund0) {
      return { 
        rate: 50, 
        label: 'Remboursement partiel (50%)', 
        color: '#f59e0b',
        deadline: formatShortDate(defaultRefund0)
      };
    } else {
      return { 
        rate: 0, 
        label: 'Aucun remboursement', 
        color: '#ef4444',
        deadline: null
      };
    }
  };

  useEffect(() => {
    const loadReservation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/inscription');
          return;
        }
        setUser(user);

        // Utilisons la même requête que dans la liste des réservations
        const { data: reservationData, error } = await supabase
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
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erreur Supabase:', error);
          throw error;
        }

        // Vérifier que l'utilisateur peut voir cette réservation (guest via user_id, guest_id ou host_id)
        if (
          reservationData.user_id !== user.id &&
          reservationData.guest_id !== user.id &&
          reservationData.host_id !== user.id
        ) {
          router.push('/reservations');
          return;
        }

        // Console log pour vérifier les prix
        console.log('=== DEBUGGING PRIX ===');
        console.log('Données de réservation:', reservationData);
        console.log('Prix récupérés:', {
          base_price: reservationData.base_price,
          tax_price: reservationData.tax_price,
          total_price: reservationData.total_price
        });

        // Adapter les données pour l'affichage
        const adaptedData = {
          ...reservationData,
          listing_title: reservationData.listings?.title || 'Titre non disponible',
          listing_price_per_night: reservationData.listings?.price_per_night || 0,
          listing_address: reservationData.listings?.address || '',
          listing_city: reservationData.listings?.city || ''
        };

        setReservation(adaptedData);
      } catch (error) {
        console.error('Erreur lors du chargement de la réservation:', error);
        router.push('/reservations');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadReservation();
    }
  }, [id, router]);

  const handleCancel = async () => {
    const refundInfo = getRefundInfo();
    const confirmMessage = refundInfo.rate === 100
      ? `Êtes-vous sûr de vouloir annuler cette réservation ? Vous serez remboursé intégralement (${formatEUR(reservation.total_price)}) sous 5 à 10 jours et l'hôte sera notifié.`
      : refundInfo.rate === 50
      ? `Êtes-vous sûr de vouloir annuler cette réservation ? Vous serez remboursé à 50% (${formatEUR(reservation.total_price / 2)}) sous 5 à 10 jours et l'hôte sera notifié.`
      : `Êtes-vous sûr de vouloir annuler cette réservation ? Vous ne serez pas remboursé car le délai d'annulation est dépassé.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setCanceling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          reason: 'Annulé par le voyageur'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      alert(`Réservation annulée avec succès ! ${result.refundAmount ? `Vous serez remboursé de ${result.refundAmount}€` : 'Vous serez remboursé intégralement'} sous 5 à 10 jours ouvrés.`);
      router.push('/reservations');
    } catch (error) {
      alert('Erreur lors de l\'annulation: ' + error.message);
    } finally {
      setCanceling(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!reservation.transaction_id) {
      alert('Aucun paiement associé à cette réservation');
      return;
    }

    setSendingInvoice(true);
    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: reservation.transaction_id,
          reservationId: reservation.id,
          reservation: {
            id: reservation.id,
            base_price: reservation.base_price,
            tax_price: reservation.tax_price,
            total_price: reservation.total_price,
            date_arrivee: reservation.date_arrivee,
            date_depart: reservation.date_depart,
            listing_id: reservation.listing_id,
            nights: reservation.nights,
            listing_price_per_night: reservation.listing_price_per_night
          },
          listing: {
            id: reservation.listing_id,
            price_per_night: reservation.listing_price_per_night
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      if (result.alreadyExists) {
        alert('✅ Facture déjà générée ! Elle a été renvoyée par email.');
      } else {
        alert('✅ Facture générée et envoyée par email avec succès !');
      }

      // Optionnel : ouvrir le PDF dans un nouvel onglet
      if (result.invoice?.invoice_pdf) {
        window.open(result.invoice.invoice_pdf, '_blank');
      }
    } catch (error) {
      alert('❌ Erreur lors de l\'envoi de la facture: ' + error.message);
    } finally {
      setSendingInvoice(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            Chargement de la réservation...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!reservation) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <h2>Réservation non trouvée</h2>
            <button onClick={() => router.push('/reservations')}>
              Retour aux réservations
            </button>
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
        maxWidth: 800,
        margin: '0 auto',
        padding: '40px 20px',
        minHeight: '70vh'
      }}>
        {/* En-tête */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: 16
            }}
          >
            ← Retour
          </button>
          <h1 style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: 8
          }}>
            Détails de la réservation
          </h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>
            Réservation #{reservation.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Carte de réservation */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 10px 35px rgba(0,0,0,0.1)',
          border: '1px solid #f1f5f9',
          marginBottom: 24
        }}>
          {/* Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24
          }}>
            <span style={{
              background: reservation.status === 'confirmed' 
                ? 'linear-gradient(135deg, #86efac 0%, #4ade80 100%)'
                : reservation.status === 'canceled'
                ? 'linear-gradient(135deg, #fca5a5 0%, #f87171 100%)'
                : 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
              color: reservation.status === 'confirmed' ? '#065f46' 
                : reservation.status === 'canceled' ? '#7f1d1d'
                : '#92400e',
              borderRadius: 999,
              padding: '8px 16px',
              fontWeight: 800,
              fontSize: 14
            }}>
              {reservation.status === 'confirmed' ? '✓ Confirmée' 
                : reservation.status === 'canceled' ? '✗ Annulée'
                : '⏳ En attente'}
            </span>
          </div>

          {/* Informations du logement */}
          <h2 style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: 16
          }}>
            {reservation.listing_title}
          </h2>

          {/* Détails du séjour */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24,
            marginBottom: 24
          }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>
                DATES DU SÉJOUR
              </h3>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                {formatDate(reservation.date_arrivee || reservation.start_date)}
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                {formatDate(reservation.date_depart || reservation.end_date)}
              </p>
              <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                {reservation.nights} nuit{reservation.nights > 1 ? 's' : ''}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>
                VOYAGEURS
              </h3>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                {reservation.guests} voyageur{reservation.guests > 1 ? 's' : ''}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>
                ADRESSE
              </h3>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                {reservation.listing_address}
              </p>
              
            </div>
          </div>

          {/* Détails du prix */}
          <div style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: 24,
            marginBottom: 24
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>
              Détail du prix
            </h3>
            <div style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: 16
            }}>
              {/* Hébergement */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#374151' }}>
                <span>Hébergement ({reservation.nights} nuit{reservation.nights > 1 ? 's' : ''})</span>
                <span style={{ fontWeight: 700 }}>
                  {formatEUR((reservation.listing_price_per_night || 0) * reservation.nights)}
                </span>
              </div>
              
              {/* Frais de plateforme */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#374151' }}>
                <span>Frais de plateforme</span>
                <span style={{ fontWeight: 700 }}>
                  {formatEUR(reservation.base_price - ((reservation.listing_price_per_night || 0) * reservation.nights))}
                </span>
              </div>
              
              {/* Taxes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14, color: '#374151' }}>
                <span>Taxes de séjour</span>
                <span style={{ fontWeight: 700 }}>{formatEUR(reservation.tax_price)}</span>
              </div>
              
              {/* Séparateur */}
              <div style={{ height: 1, background: '#e2e8f0', marginBottom: 12 }} />
              
              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: '#0f172a', fontWeight: 900 }}>
                <span>Total</span>
                <span>{formatEUR(reservation.total_price)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions et politique d'annulation */}
        {reservation.status === 'confirmed' && (
          user?.id === reservation.user_id ||
          user?.id === reservation.guest_id ||
          user?.id === reservation.host_id
        ) && (() => {
          // Vérifier si le séjour a déjà commencé
          const now = new Date();
          const arrivalDate = new Date(reservation.date_arrivee);
          const hasStarted = now >= arrivalDate;
          
          // Ne pas afficher le bouton si le séjour a commencé
          if (hasStarted) {
            return null;
          }
          
          const refundInfo = getRefundInfo();
          
          return (
            <div style={{ marginBottom: 32 }}>
              {/* Encart politique d'annulation actuelle */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <div style={{
                  background: refundInfo.color,
                  borderRadius: '50%',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {refundInfo.rate === 100 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : refundInfo.rate === 50 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                      <line x1="12" y1="2" x2="12" y2="22"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    color: '#111827',
                    fontSize: 14,
                    marginBottom: 4
                  }}>
                    {refundInfo.label}
                    {refundInfo.deadline && refundInfo.rate > 0 && (
                      <span style={{ fontWeight: 400, color: '#6b7280' }}>
                        {' '}jusqu'au {refundInfo.deadline}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setShowCancellationPolicy(!showCancellationPolicy)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#111827',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {showCancellationPolicy ? 'Masquer les détails' : 'Voir la politique complète'}
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                      style={{
                        transform: showCancellationPolicy ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Politique d'annulation détaillée */}
              {showCancellationPolicy && (
                <div style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  fontSize: 13,
                  lineHeight: 1.6
                }}>
                  <div style={{
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 12,
                    fontSize: 14
                  }}>
                    Politique d'annulation complète
                  </div>
                  
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{
                        background: '#111827',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        height: 'fit-content',
                        minWidth: 60,
                        textAlign: 'center'
                      }}>
                        100%
                      </div>
                      <div style={{ flex: 1, color: '#374151' }}>
                        <strong>Remboursement intégral</strong><br />
                        Jusqu'au <strong>
                          {formatShortDate(reservation.refund_50_percent_date || 
                            new Date(new Date(reservation.date_arrivee).getTime() - (6 * 24 * 60 * 60 * 1000)))}
                        </strong>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{
                        background: '#6b7280',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        height: 'fit-content',
                        minWidth: 60,
                        textAlign: 'center'
                      }}>
                        50%
                      </div>
                      <div style={{ flex: 1, color: '#374151' }}>
                        <strong>Remboursement partiel (50%)</strong><br />
                        Jusqu'au <strong>
                          {formatShortDate(reservation.refund_0_percent_date || 
                            new Date(new Date(reservation.date_arrivee).getTime() - (2 * 24 * 60 * 60 * 1000)))}
                        </strong>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        height: 'fit-content',
                        minWidth: 60,
                        textAlign: 'center'
                      }}>
                        0%
                      </div>
                      <div style={{ flex: 1, color: '#374151' }}>
                        <strong>Aucun remboursement</strong><br />
                        Après le <strong>
                          {formatShortDate(reservation.refund_0_percent_date || 
                            new Date(new Date(reservation.date_arrivee).getTime() - (2 * 24 * 60 * 60 * 1000)))}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton d'annulation */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  padding: '20px 24px',
                  background: refundInfo.rate === 100
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))'
                    : refundInfo.rate === 50
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.05))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.05))',
                  borderRadius: '16px',
                  border: refundInfo.rate === 100
                    ? '2px solid rgba(16,185,129,0.2)'
                    : refundInfo.rate === 50
                    ? '2px solid rgba(245,158,11,0.2)'
                    : '2px solid rgba(239,68,68,0.2)',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>
                    {refundInfo.rate === 100 ? '✓' : refundInfo.rate === 50 ? '⚠️' : '⚠️'}
                  </div>
                  <p style={{ 
                    color: refundInfo.rate === 100 ? '#065f46' : refundInfo.rate === 50 ? '#92400e' : '#991B1B',
                    fontWeight: 600, 
                    fontSize: '15px',
                    margin: '0 0 8px 0'
                  }}>
                    {refundInfo.label}
                  </p>
                  <p style={{ 
                    color: refundInfo.rate === 100 ? '#047857' : refundInfo.rate === 50 ? '#78350f' : '#7F1D1D',
                    fontSize: '14px',
                    margin: 0,
                    lineHeight: 1.6
                  }}>
                    En annulant maintenant, vous serez remboursé{' '}
                    {refundInfo.rate === 100 ? 'intégralement' : refundInfo.rate === 50 ? 'à 50%' : 'de 0€'}{' '}
                    {refundInfo.rate > 0 && 'sous 5 à 10 jours'} et l'hôte sera automatiquement notifié par email.
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  style={{
                    background: canceling 
                      ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                      : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px 32px',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: canceling ? 'not-allowed' : 'pointer',
                    opacity: canceling ? 0.7 : 1,
                    boxShadow: canceling ? 'none' : '0 10px 25px rgba(239,68,68,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!canceling) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 15px 35px rgba(239,68,68,0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!canceling) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 10px 25px rgba(239,68,68,0.3)';
                    }
                  }}
                >
                  {canceling ? '⏳ Annulation en cours...' : '🚫 Annuler la réservation'}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Bouton facture après la fin du séjour */}
        {reservation.status === 'confirmed' && (() => {
          const now = new Date();
          const departureDate = new Date(reservation.date_depart);
          const hasEnded = now > departureDate;

          if (!hasEnded) return null;

          return (
            <div style={{
              textAlign: 'center',
              padding: 24,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(37,99,235,0.05))',
              borderRadius: 16,
              border: '2px solid rgba(59,130,246,0.2)',
              marginBottom: 32
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📄</div>
              <p style={{ 
                color: '#1e3a8a',
                fontWeight: 600, 
                fontSize: 15,
                marginBottom: 16
              }}>
                Votre séjour est terminé
              </p>
              <button
                onClick={handleSendInvoice}
                disabled={sendingInvoice}
                style={{
                  background: sendingInvoice
                    ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                    : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 32px',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: sendingInvoice ? 'not-allowed' : 'pointer',
                  opacity: sendingInvoice ? 0.7 : 1,
                  boxShadow: sendingInvoice ? 'none' : '0 10px 25px rgba(59,130,246,0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!sendingInvoice) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 15px 35px rgba(59,130,246,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!sendingInvoice) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 10px 25px rgba(59,130,246,0.3)';
                  }
                }}
              >
                {sendingInvoice ? '📧 Envoi en cours...' : '📧 Recevoir la facture par email'}
              </button>
            </div>
          );
        })()}

        {reservation.status === 'canceled' && (
          <div style={{
            textAlign: 'center',
            padding: 24,
            background: '#fef2f2',
            borderRadius: 12,
            border: '1px solid #fecaca'
          }}>
            <p style={{ color: '#7f1d1d', fontWeight: 600 }}>
              Cette réservation a été annulée
            </p>
            {reservation.cancellation_reason && (
              <p style={{ color: '#991b1b', fontSize: 14, marginTop: 8 }}>
                Raison : {reservation.cancellation_reason}
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}