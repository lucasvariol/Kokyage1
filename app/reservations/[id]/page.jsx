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

  useEffect(() => {
    const loadReservation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/connexion');
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
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ? Vous serez remboursé intégralement et l\'hôte sera notifié.')) {
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

          {/* Détails du prix - Prix récupérés depuis la table reservations dans Supabase */}
          <div style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: 24
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#64748b', marginBottom: 12 }}>
              DÉTAIL DU PRIX
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Prix de base ({reservation.nights} nuit{reservation.nights > 1 ? 's' : ''})</span>
              <span>{formatEUR(reservation.base_price)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Taxes et frais</span>
              <span>{formatEUR(reservation.tax_price)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 18,
              fontWeight: 800,
              color: '#0f172a',
              paddingTop: 12,
              borderTop: '1px solid #f1f5f9'
            }}>
              <span>Total</span>
              <span>{formatEUR(reservation.total_price)}</span>
            </div>
          </div>

          {/* Informations de paiement */}
          {reservation.transaction_id && (
            <div style={{
              marginTop: 24,
              padding: 16,
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #f1f5f9'
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>
                TRANSACTION
              </h3>
              <p style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                ID: {reservation.transaction_id}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {reservation.status === 'confirmed' && (
          user?.id === reservation.user_id ||
          user?.id === reservation.guest_id ||
          user?.id === reservation.host_id
        ) && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.05))',
              borderRadius: '16px',
              border: '2px solid rgba(239,68,68,0.2)',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
              <p style={{ 
                color: '#991B1B', 
                fontWeight: 600, 
                fontSize: '15px',
                margin: '0 0 8px 0'
              }}>
                Annulation avec remboursement intégral
              </p>
              <p style={{ 
                color: '#7F1D1D', 
                fontSize: '14px',
                margin: 0,
                lineHeight: 1.6
              }}>
                En annulant, vous serez remboursé sous 5 à 10 jours et l'hôte sera automatiquement notifié par email.
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
        )}

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