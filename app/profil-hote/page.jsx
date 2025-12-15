
"use client";

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Page() {
  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [tenantBookings, setTenantBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);
  const [connectError, setConnectError] = useState('');
  const [activeTab, setActiveTab] = useState('logements'); // 'logements' | 'paiements' | 'reservations'
  const [earnings, setEarnings] = useState({ total_earnings: 0, to_be_paid_to_user: 0 });
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');
  const [hostReservations, setHostReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [hostValidationLoading, setHostValidationLoading] = useState(null);
  const [hostRejectionLoading, setHostRejectionLoading] = useState(null);
  const [hostCancellationLoading, setHostCancellationLoading] = useState(null);
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [showCancelledReservations, setShowCancelledReservations] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setError("");
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        setUserListings([]);
        setTenantBookings([]);
        setLoading(false);
        return;
      }
      const currentUser = session.user;
      setUser(currentUser);

      // Fetch owner listings and tenant reservations in parallel
      const [listingsRes, bookingsRes] = await Promise.all([
        supabase
          .from('listings')
          .select('id, title, city, status, created_at, owner_id, id_proprietaire')
          .or(`owner_id.eq.${currentUser.id},id_proprietaire.eq.${currentUser.id}`),
        supabase
          .from('reservations')
          .select('id, listing_id, date_arrivee, date_depart, total_price, listings!inner(id, title, city, owner_id)')
          .eq('user_id', currentUser.id)
      ]);

      if (listingsRes.error) {
        console.error(listingsRes.error);
        setError("Impossible de récupérer vos logements.");
      } else if (listingsRes.data) {
  setUserListings(listingsRes.data);
      }

      if (bookingsRes.error) {
        console.error(bookingsRes.error);
        // Non bloquant, on laisse la page fonctionner même sans les réservations locataire
      } else if (bookingsRes.data) {
        setTenantBookings(bookingsRes.data);
      }

      setLoading(false);
    }
    fetchData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
  setUserListings([]);
        setTenantBookings([]);
      } else {
        fetchData();
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    async function refreshStatus() {
      if (!user) return;
      try {
        console.log('[Connect Status] Fetching status for user', user.id);
        const res = await fetch('/api/connect/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        const json = await res.json();
        console.log('[Connect Status] Response:', json);
        setConnectStatus(json);
        if (json.error) {
          setConnectError(json.error);
        }
      } catch (e) {
        console.error('[Connect Status] Error:', e);
        setConnectError(e.message);
      }
    }
    refreshStatus();
  }, [user]);

  // Récupérer les revenus de l'utilisateur
  useEffect(() => {
    async function fetchEarnings() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('total_earnings, to_be_paid_to_user')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setEarnings({
            total_earnings: data.total_earnings || 0,
            to_be_paid_to_user: data.to_be_paid_to_user || 0
          });
        }
      } catch (e) {
        console.error('[Earnings] Error fetching earnings:', e);
      }
    }
    fetchEarnings();
  }, [user]);

  // Détecter le retour depuis Stripe et rafraîchir le statut
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('onboarding') === 'return' || params.get('update') === 'return') {
      console.log('[Connect] User returned from Stripe, refreshing status in 2s...');
      // Attendre un peu que Stripe finalise
      setTimeout(() => {
        if (user) {
          fetch('/api/connect/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          })
          .then(res => res.json())
          .then(json => {
            console.log('[Connect] Refreshed status:', json);
            setConnectStatus(json);
            // Basculer sur l'onglet paiements pour montrer le résultat
            setActiveTab('paiements');
            // Nettoyer l'URL
            window.history.replaceState({}, '', '/profil-hote');
          })
          .catch(e => console.error('[Connect] Refresh error:', e));
        }
      }, 2000);
    }
  }, [user]);

  // Fonction unifiée pour ouvrir Stripe (onboarding initial ou modification)
  const openStripeConnect = async () => {
    if (!user) return;
    setConnectLoading(true);
    setConnectError('');
    try {
      // Si le compte existe déjà, utiliser l'API update qui détermine automatiquement le bon type de lien
      // Sinon, utiliser l'API onboard pour créer un nouveau compte
      const endpoint = connectStatus?.connected ? '/api/connect/update' : '/api/connect/onboard';
      
      console.log('[Connect] Opening Stripe Connect via', endpoint);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      });
      const json = await res.json();
      console.log('[Connect] Response', res.status, json);
      
      if (res.ok && json?.url) {
        window.location.href = json.url;
      } else {
        const msg = json.error || 'Impossible d\'ouvrir Stripe Connect';
        setConnectError(msg);
        alert(msg);
      }
    } catch (e) {
      setConnectError(e.message || 'Erreur inconnue');
      alert(e.message);
    } finally {
      setConnectLoading(false);
    }
  };

  // Alias pour compatibilité avec le code existant
  const startOnboarding = openStripeConnect;

  // Charger les réservations où l'utilisateur est hôte
  useEffect(() => {
    async function loadHostReservations() {
      if (!user) return;
      if (activeTab !== 'reservations') return; // Charger uniquement si on est sur l'onglet
      
      setReservationsLoading(true);
      try {
        // Récupérer les réservations avec les listings
        const { data: reservationsData, error: reservationsError } = await supabase
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
          .eq('host_id', user.id)
          .order('created_at', { ascending: false });

        if (reservationsError) throw reservationsError;

        // Récupérer les profils des voyageurs séparément
        if (reservationsData && reservationsData.length > 0) {
          const guestIds = [...new Set(reservationsData.map(r => r.user_id).filter(Boolean))];
          
          if (guestIds.length > 0) {
            // Récupérer les profils des voyageurs avec photo
            const { data: guestsData } = await supabase
              .from('profiles')
              .select('id, name, email, photo_url')
              .in('id', guestIds);

            // Récupérer les avis reçus par chaque voyageur
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select('reviewee_id, rating')
              .in('reviewee_id', guestIds);

            // Calculer la note moyenne pour chaque voyageur
            const guestRatings = {};
            guestIds.forEach(guestId => {
              const guestReviews = reviewsData?.filter(r => r.reviewee_id === guestId) || [];
              const avgRating = guestReviews.length > 0
                ? guestReviews.reduce((sum, r) => sum + r.rating, 0) / guestReviews.length
                : 0;
              guestRatings[guestId] = {
                averageRating: avgRating,
                reviewCount: guestReviews.length
              };
            });

            // Enrichir les réservations avec les infos des guests
            const enrichedData = reservationsData.map(reservation => {
              const guest = guestsData?.find(g => g.id === reservation.user_id) || null;
              return {
                ...reservation,
                guest: guest ? {
                  ...guest,
                  ...guestRatings[guest.id]
                } : null
              };
            });

            setHostReservations(enrichedData);
          } else {
            setHostReservations(reservationsData);
          }
        } else {
          setHostReservations([]);
        }
      } catch (error) {
        console.error('Erreur chargement réservations hôte:', error);
        setHostReservations([]);
      } finally {
        setReservationsLoading(false);
      }
    }
    loadHostReservations();
  }, [user, activeTab]);

  // Fonction pour recharger les réservations après une action
  const reloadHostReservations = async () => {
    if (!user) return;
    
    try {
      const { data: reservationsData, error: reservationsError } = await supabase
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
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (reservationsError) throw reservationsError;

      if (reservationsData && reservationsData.length > 0) {
        const guestIds = [...new Set(reservationsData.map(r => r.user_id).filter(Boolean))];
        
        if (guestIds.length > 0) {
          // Récupérer les profils des voyageurs avec photo
          const { data: guestsData } = await supabase
            .from('profiles')
            .select('id, name, email, photo_url')
            .in('id', guestIds);

          // Récupérer les avis reçus par chaque voyageur
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('reviewee_id, rating')
            .in('reviewee_id', guestIds);

          // Calculer la note moyenne pour chaque voyageur
          const guestRatings = {};
          guestIds.forEach(guestId => {
            const guestReviews = reviewsData?.filter(r => r.reviewee_id === guestId) || [];
            const avgRating = guestReviews.length > 0
              ? guestReviews.reduce((sum, r) => sum + r.rating, 0) / guestReviews.length
              : 0;
            guestRatings[guestId] = {
              averageRating: avgRating,
              reviewCount: guestReviews.length
            };
          });

          const enrichedData = reservationsData.map(reservation => {
            const guest = guestsData?.find(g => g.id === reservation.user_id) || null;
            return {
              ...reservation,
              guest: guest ? {
                ...guest,
                ...guestRatings[guest.id]
              } : null
            };
          });

          setHostReservations(enrichedData);
        } else {
          setHostReservations(reservationsData);
        }
      } else {
        setHostReservations([]);
      }
    } catch (error) {
      console.error('Erreur rechargement réservations:', error);
    }
  };

  // Valider une réservation (hôte)
  const handleHostValidation = async (reservationId) => {
    if (!window.confirm('Confirmer cette réservation ?')) return;
    
    setHostValidationLoading(reservationId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch('/api/reservations/host-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ reservationId, hostValidation: true })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert('Réservation validée avec succès !');
      
      // Recharger les réservations
      try {
        await reloadHostReservations();
      } catch (reloadError) {
        console.error('Erreur rechargement:', reloadError);
        // Recharger la page en dernier recours
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur validation réservation:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setHostValidationLoading(null);
    }
  };

  // Rejeter une réservation (hôte)
  const handleHostRejection = async (reservationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir refuser cette réservation ?')) return;
    
    setHostRejectionLoading(reservationId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch('/api/reservations/host-reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ reservationId, reason: 'Refusé par l\'hôte' })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert('Réservation refusée. Le voyageur sera remboursé.');
      
      // Recharger les réservations
      try {
        await reloadHostReservations();
      } catch (reloadError) {
        console.error('Erreur rechargement:', reloadError);
        // Recharger la page en dernier recours
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur refus réservation:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setHostRejectionLoading(null);
    }
  };

  // Annuler une réservation (hôte)
  const handleHostCancellation = async (reservationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ? Le voyageur sera remboursé intégralement.')) return;
    
    setHostCancellationLoading(reservationId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch('/api/reservations/host-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          reservationId,
          reason: 'Annulée par l\'hôte'
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert('Réservation annulée. Le voyageur sera remboursé.');
      
      // Recharger les réservations
      try {
        await reloadHostReservations();
      } catch (reloadError) {
        console.error('Erreur rechargement:', reloadError);
        // Recharger la page en dernier recours
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur annulation réservation:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setHostCancellationLoading(null);
    }
  };

  // Fonction pour déclencher le virement vers l'utilisateur
  const handlePayout = async () => {
    if (!user) return;
    
    const amount = earnings.to_be_paid_to_user;
    if (amount <= 0) {
      alert('Aucun montant à virer.');
      return;
    }

    // Confirmation
    const confirmed = confirm(
      `Confirmer le virement de ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)} vers votre compte bancaire ?`
    );
    
    if (!confirmed) return;

    setPayoutLoading(true);
    setPayoutError('');
    setPayoutSuccess('');

    try {
      console.log('[Payout] Initiating payout for user', user.id);
      const res = await fetch('/api/payment/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      const json = await res.json();
      console.log('[Payout] Response:', json);

      if (res.ok && json.success) {
        setPayoutSuccess(`Virement de ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)} effectué avec succès !`);
        
        // Mettre à jour les revenus localement
        setEarnings({
          total_earnings: json.updated_profile.total_earnings,
          to_be_paid_to_user: json.updated_profile.to_be_paid_to_user
        });

        // Rafraîchir depuis la base après 1 seconde
        setTimeout(async () => {
          const { data } = await supabase
            .from('profiles')
            .select('total_earnings, to_be_paid_to_user')
            .eq('id', user.id)
            .single();
          
          if (data) {
            setEarnings({
              total_earnings: data.total_earnings || 0,
              to_be_paid_to_user: data.to_be_paid_to_user || 0
            });
          }
        }, 1000);

      } else {
        const errorMsg = json.error || 'Erreur lors du virement';
        setPayoutError(errorMsg);
        alert(errorMsg);
      }
    } catch (e) {
      console.error('[Payout] Error:', e);
      const errorMsg = e.message || 'Erreur inconnue';
      setPayoutError(errorMsg);
      alert(errorMsg);
    } finally {
      setPayoutLoading(false);
    }
  };

  const upcomingTenantBookings = useMemo(() => {
    const today = new Date();
    return tenantBookings.filter(b => new Date(b.date_depart) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  }, [tenantBookings]);

  const statusChip = (status) => {
    const label = status || 'En attente';
    const theme = !status ? 'pending' : /refus/i.test(status) ? 'rejected' : /valid/i.test(status) ? 'approved' : 'info';
    return <span className={`chip ${theme}`}>{label}</span>;
  };

  return (
    <>
      <Header />
      <main style={{ background: '#f7f8fa', minHeight: '100vh' }}>
        <section style={{
          background: 'radial-gradient(1100px 200px at 10% -20%, #e6f1ff 0%, transparent 60%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          padding: '36px 20px',
          borderBottom: '1px solid #eef2f7'
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#0f172a' }}>Tableau de bord hôte</h1>
              <p style={{ margin: '6px 0 0', color: '#475569' }}>Gérez vos logements et paramètres de paiement</p>
            </div>

            {/* Navigation par onglets */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #e5e7eb' }}>
              <button
                onClick={() => setActiveTab('logements')}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'logements' ? '#0066ff' : '#64748b',
                  fontWeight: activeTab === 'logements' ? 700 : 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'logements' ? '2px solid #0066ff' : '2px solid transparent',
                  marginBottom: -2,
                  transition: 'all 0.2s'
                }}
              >
                Mes logements
              </button>
              <button
                onClick={() => setActiveTab('paiements')}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'paiements' ? '#0066ff' : '#64748b',
                  fontWeight: activeTab === 'paiements' ? 700 : 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'paiements' ? '2px solid #0066ff' : '2px solid transparent',
                  marginBottom: -2,
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  Paiements
                  {connectStatus?.connected && connectStatus?.charges_enabled && connectStatus?.payouts_enabled ? (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                  ) : (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('reservations')}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'reservations' ? '#0066ff' : '#64748b',
                  fontWeight: activeTab === 'reservations' ? 700 : 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'reservations' ? '2px solid #0066ff' : '2px solid transparent',
                  marginBottom: -2,
                  transition: 'all 0.2s'
                }}
              >
                Réservations
              </button>
            </div>
          </div>
        </section>

        <section style={{ maxWidth: 1100, margin: '24px auto', padding: '0 20px' }}>
          {!user ? (
            <div style={{ padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #eef2f7' }}>
              <p style={{ margin: 0 }}>
                Vous devez être connecté pour accéder à votre profil.
                {' '}<a href="/inscription" style={{ color: '#0066ff', fontWeight: 600 }}>Se connecter</a>
              </p>
            </div>
          ) : loading ? (
            <div style={{ padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #eef2f7' }}>Chargement…</div>
          ) : (
            <>
              {/* Onglet Paiements */}
              {activeTab === 'paiements' && (
                <div style={{ background: '#fff', borderRadius: 20, padding: 40, border: '1px solid #eef2f7', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                      Informations de paiement
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 15 }}>
                      Configurez votre compte Stripe pour recevoir vos revenus de location
                    </p>
                  </div>

                  {connectError && (
                    <div style={{ marginBottom: 20, padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#991b1b', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <div>{connectError}</div>
                    </div>
                  )}

                  {!connectStatus?.connected ? (
                    // État: Non connecté
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 40px rgba(99,102,241,0.3)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
                        Connectez votre compte bancaire
                      </h3>
                      <p style={{ color: '#64748b', marginBottom: 32, maxWidth: 460, margin: '0 auto 32px' }}>
                        Pour recevoir vos revenus de sous-location, vous devez connecter votre compte bancaire via Stripe. Le processus est sécurisé et prend moins de 3 minutes.
                      </p>
                      <button
                        type="button"
                        onClick={startOnboarding}
                        disabled={connectLoading}
                        style={{
                          padding: '16px 32px',
                          borderRadius: 12,
                          border: 'none',
                          background: connectLoading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: '#fff',
                          fontSize: 16,
                          fontWeight: 700,
                          cursor: connectLoading ? 'not-allowed' : 'pointer',
                          boxShadow: connectLoading ? 'none' : '0 8px 24px rgba(99,102,241,0.4)',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 10
                        }}
                      >
                        {connectLoading ? (
                          <>
                            <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            Connexion en cours…
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14"></path>
                              <path d="M12 5l7 7-7 7"></path>
                            </svg>
                            Configurer mon compte Stripe
                          </>
                        )}
                      </button>
                    </div>
                  ) : !connectStatus.charges_enabled || !connectStatus.payouts_enabled ? (
                    // État: Connecté mais incomplet
                    <div>
                      <div style={{ padding: 20, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: 16, marginBottom: 24, border: '2px solid #fbbf24' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                              <line x1="12" y1="9" x2="12" y2="13"></line>
                              <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#92400e' }}>
                              Configuration incomplète
                            </h4>
                            <p style={{ margin: '0 0 16px', color: '#92400e', fontSize: 14 }}>
                              Votre compte Stripe est connecté mais des informations supplémentaires sont requises pour recevoir des paiements.
                            </p>
                            <button
                              type="button"
                              onClick={startOnboarding}
                              disabled={connectLoading}
                              style={{
                                padding: '10px 20px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#fff',
                                color: '#92400e',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: connectLoading ? 'not-allowed' : 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            >
                              {connectLoading ? 'Ouverture…' : 'Compléter mon profil Stripe'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: 16 }}>
                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: connectStatus.details_submitted ? '#10b981' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {connectStatus.details_submitted ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }}></span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Informations personnelles</div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>{connectStatus.details_submitted ? 'Complété' : 'En attente'}</div>
                          </div>
                        </div>
                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: connectStatus.payouts_enabled ? '#10b981' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {connectStatus.payouts_enabled ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }}></span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Compte bancaire</div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>{connectStatus.payouts_enabled ? 'Vérifié' : 'En attente'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // État: Tout est OK
                    <div>
                      <div style={{ padding: 24, background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderRadius: 16, marginBottom: 24, border: '2px solid #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#065f46' }}>
                              Compte actif
                            </h4>
                            <p style={{ margin: 0, color: '#047857', fontSize: 14 }}>
                              Votre compte est configuré et prêt à recevoir des paiements
                            </p>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                        <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>Identité vérifiée</div>
                            <div style={{ fontSize: 14, color: '#64748b' }}>Vos informations ont été validées par Stripe</div>
                          </div>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                          </div>
                        </div>
                        <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>Compte bancaire connecté</div>
                            <div style={{ fontSize: 14, color: '#64748b' }}>Vos revenus seront versés automatiquement</div>
                          </div>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                              <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={openStripeConnect}
                        disabled={connectLoading}
                        style={{
                          padding: '12px 24px',
                          borderRadius: 10,
                          border: '1px solid #e5e7eb',
                          background: '#fff',
                          color: '#0f172a',
                          fontSize: 15,
                          fontWeight: 700,
                          cursor: connectLoading ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { if (!connectLoading) e.target.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.target.style.background = '#fff'; }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        {connectLoading ? 'Ouverture…' : 'Modifier mes informations'}
                      </button>

                      {/* Section Revenus */}
                      <div style={{ marginTop: 40, paddingTop: 40, borderTop: '2px solid #f1f5f9' }}>
                        <div style={{ marginBottom: 24 }}>
                          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                            Vos revenus
                          </h3>
                          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                            Suivi de vos gains depuis le début
                          </p>
                        </div>

                        <div style={{ padding: 32, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: 20, border: '2px solid #e2e8f0', marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                              </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Revenus totaux
                              </div>
                              <div style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(earnings.total_earnings)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: 20, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>
                              Prochain virement
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(earnings.to_be_paid_to_user)}
                            </div>
                          </div>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: earnings.to_be_paid_to_user > 0 ? '#fef3c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={earnings.to_be_paid_to_user > 0 ? '#f59e0b' : '#94a3b8'} strokeWidth="2">
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                          </div>
                        </div>

                        {/* Messages de succès/erreur */}
                        {payoutSuccess && (
                          <div style={{ marginTop: 16, padding: 16, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, color: '#047857', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <div>{payoutSuccess}</div>
                          </div>
                        )}

                        {payoutError && (
                          <div style={{ marginTop: 16, padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#991b1b', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <div>{payoutError}</div>
                          </div>
                        )}

                        {/* Bouton de virement */}
                        <button
                          type="button"
                          onClick={handlePayout}
                          disabled={payoutLoading || earnings.to_be_paid_to_user <= 0 || !connectStatus?.payouts_enabled}
                          style={{
                            marginTop: 20,
                            width: '100%',
                            padding: '16px 24px',
                            borderRadius: 12,
                            border: 'none',
                            background: (payoutLoading || earnings.to_be_paid_to_user <= 0 || !connectStatus?.payouts_enabled) 
                              ? '#e5e7eb' 
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: (payoutLoading || earnings.to_be_paid_to_user <= 0 || !connectStatus?.payouts_enabled) 
                              ? '#94a3b8' 
                              : '#fff',
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: (payoutLoading || earnings.to_be_paid_to_user <= 0 || !connectStatus?.payouts_enabled) 
                              ? 'not-allowed' 
                              : 'pointer',
                            boxShadow: (payoutLoading || earnings.to_be_paid_to_user <= 0 || !connectStatus?.payouts_enabled) 
                              ? 'none' 
                              : '0 8px 20px rgba(16,185,129,0.3)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12
                          }}
                        >
                          {payoutLoading ? (
                            <>
                              <div style={{ width: 18, height: 18, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                              Virement en cours...
                            </>
                          ) : earnings.to_be_paid_to_user <= 0 ? (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                              </svg>
                              Aucun montant à virer
                            </>
                          ) : !connectStatus?.payouts_enabled ? (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                              </svg>
                              Compte bancaire non configuré
                            </>
                          ) : (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 11 12 14 22 4"></polyline>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                              </svg>
                              Recevoir {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(earnings.to_be_paid_to_user)}
                            </>
                          )}
                        </button>

                        {earnings.to_be_paid_to_user > 0 && connectStatus?.payouts_enabled && (
                          <p style={{ marginTop: 12, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                            Le virement sera effectué sur votre compte bancaire connecté
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Logements */}
              {activeTab === 'logements' && (
                <>
                  {error && (
                    <div style={{ marginBottom: 16, padding: '10px 12px', background: '#fff1f1', color: '#b40000', border: '1px solid #ffd1d1', borderRadius: 10 }}>{error}</div>
                  )}

                  {userListings.length === 0 ? (
                    <div style={{ padding: 24, background: '#fff', borderRadius: 16, border: '1px solid #eef2f7' }}>
                      <p style={{ margin: 0 }}>Vous n'avez publié aucun logement pour l'instant.</p>
                    </div>
                  ) : (
                    <div>
                  {(() => {
                    const uid = user?.id;
                    const owners = userListings.filter(l => uid && l?.id_proprietaire && String(l.id_proprietaire) === String(uid));
                    const tenants = userListings.filter(l => uid && l?.owner_id && String(l.owner_id) === String(uid) && String(l.id_proprietaire) !== String(uid));
                    return (
                      <>
                        {owners.length > 0 && (
                          <div style={{ marginBottom: 18 }}>
                            <h2 style={{ fontSize: 20, color: '#0f172a', margin: '0 0 10px' }}>En tant que Propriétaire</h2>
                            <div className="cards-grid">
                              {owners.map(l => (
                                <article key={l.id} className="card">
                                  <div className="card-head">
                                    <h3 className="card-title">{l.title}</h3>
                                    {statusChip(l.status)}
                                  </div>
                                  <div className="card-meta">{l.city || 'Ville inconnue'}</div>
                                  <div className="card-actions">
                                    <span className="role owner">Propriétaire</span>
                                    <div className="spacer" />
                                    <a className="btn secondary" href={`/logement/${l.id}`}>Voir la fiche</a>
                                    {/* Pas de gestion de calendrier pour le rôle propriétaire */}
                                  </div>
                                </article>
                              ))}
                            </div>
                          </div>
                        )}
                        {tenants.length > 0 && (
                          <div>
                            <h2 style={{ fontSize: 20, color: '#0f172a', margin: '20px 0 10px' }}>En tant que Locataire</h2>
                            <div className="cards-grid">
                              {tenants.map(l => (
                                <article key={l.id} className="card">
                                  <div className="card-head">
                                    <h3 className="card-title">{l.title}</h3>
                                    {statusChip(l.status)}
                                  </div>
                                  <div className="card-meta">{l.city || 'Ville inconnue'}</div>
                                  <div className="card-actions">
                                    <span className="role tenant">Locataire</span>
                                    <div className="spacer" />
                                    <a className="btn secondary" href={`/logement/${l.id}`}>Voir la fiche</a>
                                    <a className="btn primary" href={`/calendrier?listingId=${l.id}`}>Gérer le calendrier</a>
                                  </div>
                                </article>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  </div>
                )}

                  <div style={{ marginTop: 28 }}>
                  <h2 style={{ fontSize: 20, color: '#0f172a', marginBottom: 12 }}> Mes actions requises </h2>
                  {upcomingTenantBookings.length === 0 ? (
                    <div style={{ padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #eef2f7', color: '#64748b' }}>
                      Aucune action requise pour le moment.
                    </div>
                  ) : (
                  <ul className="bookings-list">
                    {upcomingTenantBookings.map(b => {
                      const start = new Date(b.date_arrivee);
                      const end = new Date(b.date_depart);
                      const fmt = (d) => d.toLocaleDateString('fr-FR');
                      return (
                        <li key={b.id} className="booking-item">
                          <div>
                            <div className="booking-title">{b.listings?.title || 'Logement'}</div>
                            <div className="booking-sub">{fmt(start)} → {fmt(end)}</div>
                          </div>
                          <span className="role tenant">Locataire</span>
                        </li>
                      );
                    })}
                  </ul>
                  )}
                  </div>
                </>
              )}

              {/* Onglet Réservations */}
              {activeTab === 'reservations' && (
                <div style={{ background: '#fff', borderRadius: 20, padding: 40, border: '1px solid #eef2f7', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                  <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                      Mes réservations en tant qu'hôte
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 15 }}>
                      Gérez les réservations de vos logements
                    </p>
                  </div>

                  {reservationsLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        border: '3px solid #e2e8f0',
                        borderTop: '3px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                      }} />
                      Chargement des réservations...
                    </div>
                  ) : hostReservations.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      color: '#64748b',
                      background: '#f8fafc',
                      borderRadius: 16,
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                      <p style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#475569' }}>
                        Aucune réservation
                      </p>
                      <p style={{ margin: 0, fontSize: 14 }}>
                        Les réservations pour vos logements apparaîtront ici
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 20 }}>
                      {/* Réservations actives (en attente ou confirmées à venir) */}
                      {hostReservations.filter(r => {
                        if (r.status === 'cancelled' || r.status === 'canceled' || r.status === 'rejected') return false;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const checkoutDate = new Date(r.date_depart || r.end_date);
                        checkoutDate.setHours(0, 0, 0, 0);
                        return checkoutDate >= today;
                      }).map(reservation => {
                        const listing = reservation.listings;
                        const guest = reservation.guest;
                        const statusColors = {
                          pending: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
                          confirmed: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
                          canceled: { bg: '#fee2e2', color: '#7f1d1d', border: '#fca5a5' },
                          rejected: { bg: '#fecaca', color: '#991b1b', border: '#f87171' }
                        };
                        const statusLabels = {
                          pending: '⏳ En attente',
                          confirmed: '✓ Confirmée',
                          canceled: '✗ Annulée',
                          rejected: '✗ Refusée'
                        };
                        const status = statusColors[reservation.status] || statusColors.pending;

                        return (
                          <div
                            key={reservation.id}
                            style={{
                              padding: 24,
                              background: '#fff',
                              borderRadius: 16,
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                              transition: 'all 0.2s'
                            }}
                          >
                            {/* En-tête */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                              <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                                  {listing?.title || 'Logement'}
                                </h3>
                                <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                                  {listing?.city} • Réservation #{reservation.id.slice(0, 8).toUpperCase()}
                                </p>
                              </div>
                              <span style={{
                                padding: '6px 12px',
                                borderRadius: 999,
                                fontSize: 13,
                                fontWeight: 700,
                                background: status.bg,
                                color: status.color,
                                border: `1px solid ${status.border}`
                              }}>
                                {statusLabels[reservation.status]}
                              </span>
                            </div>

                            {/* Informations voyageur */}
                            <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                {/* Photo du voyageur */}
                                <div style={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  border: '2px solid #e2e8f0',
                                  flexShrink: 0
                                }}>
                                  {guest?.photo_url ? (
                                    <img
                                      src={guest.photo_url}
                                      alt={guest.name || 'Voyageur'}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                    />
                                  ) : (
                                    <div style={{
                                      width: '100%',
                                      height: '100%',
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#fff',
                                      fontSize: 24,
                                      fontWeight: 700
                                    }}>
                                      {(guest?.name || guest?.email || 'V')[0].toUpperCase()}
                                    </div>
                                  )}
                                </div>

                                {/* Infos et note */}
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: '0 0 6px' }}>
                                    VOYAGEUR
                                  </p>
                                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                                    {guest?.name || guest?.email || 'Voyageur'}
                                  </p>
                                  
                                  {/* Note et avis */}
                                  {guest?.reviewCount > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 16 }}>⭐</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                          {guest.averageRating.toFixed(1)}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: 13, color: '#64748b' }}>
                                        ({guest.reviewCount} avis)
                                      </span>
                                    </div>
                                  ) : (
                                    <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0', fontStyle: 'italic' }}>
                                      Aucun avis
                                    </p>
                                  )}

                                  {guest?.email && (
                                    <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                                      {guest.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Détails du séjour */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                              gap: 16,
                              marginBottom: 16
                            }}>
                              <div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                  ARRIVÉE
                                </p>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                  {new Date(reservation.date_arrivee || reservation.start_date).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                  DÉPART
                                </p>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                  {new Date(reservation.date_depart || reservation.end_date).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                  VOYAGEURS
                                </p>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                  {reservation.guests} {reservation.guests > 1 ? 'personnes' : 'personne'}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                  MONTANT TOTAL
                                </p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(reservation.total_price || 0)}
                                </p>
                              </div>
                            </div>

                            {/* Actions pour les réservations en attente de validation hôte */}
                            {!reservation.host_validation_ok && (reservation.status === 'pending' || reservation.status === 'confirmed') && (
                              <div style={{
                                display: 'flex',
                                gap: 12,
                                marginTop: 16,
                                paddingTop: 16,
                                borderTop: '1px solid #e2e8f0'
                              }}>
                                <button
                                  onClick={() => handleHostValidation(reservation.id)}
                                  disabled={hostValidationLoading === reservation.id}
                                  style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: hostValidationLoading === reservation.id 
                                      ? '#94a3b8' 
                                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: hostValidationLoading === reservation.id ? 'not-allowed' : 'pointer',
                                    opacity: hostValidationLoading === reservation.id ? 0.7 : 1,
                                    boxShadow: hostValidationLoading === reservation.id ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {hostValidationLoading === reservation.id ? '⏳ Validation...' : '✓ Accepter'}
                                </button>
                                <button
                                  onClick={() => handleHostRejection(reservation.id)}
                                  disabled={hostRejectionLoading === reservation.id}
                                  style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: hostRejectionLoading === reservation.id 
                                      ? '#94a3b8' 
                                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: hostRejectionLoading === reservation.id ? 'not-allowed' : 'pointer',
                                    opacity: hostRejectionLoading === reservation.id ? 0.7 : 1,
                                    boxShadow: hostRejectionLoading === reservation.id ? 'none' : '0 4px 12px rgba(239,68,68,0.3)',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {hostRejectionLoading === reservation.id ? '⏳ Refus...' : '✗ Refuser'}
                                </button>
                              </div>
                            )}

                            {/* Bouton d'annulation pour les réservations validées par l'hôte */}
                            {reservation.status === 'confirmed' && reservation.host_validation_ok && (
                              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                                <button
                                  onClick={() => handleHostCancellation(reservation.id)}
                                  disabled={hostCancellationLoading === reservation.id}
                                  style={{
                                    width: '100%',
                                    padding: '12px 20px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: hostCancellationLoading === reservation.id 
                                      ? '#94a3b8' 
                                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: hostCancellationLoading === reservation.id ? 'not-allowed' : 'pointer',
                                    opacity: hostCancellationLoading === reservation.id ? 0.7 : 1,
                                    boxShadow: hostCancellationLoading === reservation.id ? 'none' : '0 4px 12px rgba(245,158,11,0.3)',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {hostCancellationLoading === reservation.id ? '⏳ Annulation...' : '🚫 Annuler cette réservation'}
                                </button>
                              </div>
                            )}

                            {/* Message pour les réservations annulées/refusées */}
                            {(reservation.status === 'canceled' || reservation.status === 'rejected') && reservation.cancellation_reason && (
                              <div style={{
                                marginTop: 16,
                                padding: 12,
                                background: '#fef2f2',
                                borderRadius: 12,
                                border: '1px solid #fecaca'
                              }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', margin: '0 0 4px' }}>
                                  RAISON
                                </p>
                                <p style={{ fontSize: 14, color: '#7f1d1d', margin: 0 }}>
                                  {reservation.cancellation_reason}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Réservations passées - Menu déroulant */}
                      {hostReservations.filter(r => {
                        if (r.status === 'cancelled' || r.status === 'canceled' || r.status === 'rejected') return false;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const checkoutDate = new Date(r.date_depart || r.end_date);
                        checkoutDate.setHours(0, 0, 0, 0);
                        return checkoutDate < today;
                      }).length > 0 && (
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
                            <span>📅 Réservations passées ({hostReservations.filter(r => {
                              if (r.status === 'cancelled' || r.status === 'canceled' || r.status === 'rejected') return false;
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const checkoutDate = new Date(r.date_depart || r.end_date);
                              checkoutDate.setHours(0, 0, 0, 0);
                              return checkoutDate < today;
                            }).length})</span>
                            <span style={{ fontSize: 20, transition: 'transform 0.2s', transform: showPastReservations ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                          </button>
                          
                          {showPastReservations && (
                            <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
                              {hostReservations.filter(r => {
                                if (r.status === 'cancelled' || r.status === 'canceled' || r.status === 'rejected') return false;
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const checkoutDate = new Date(r.date_depart || r.end_date);
                                checkoutDate.setHours(0, 0, 0, 0);
                                return checkoutDate < today;
                              }).map((reservation) => {
                                const listing = reservation.listings;
                                const guest = reservation.guest;
                                
                                return (
                                  <div
                                    key={reservation.id}
                                    style={{
                                      padding: 24,
                                      background: '#f8fafc',
                                      borderRadius: 16,
                                      border: '1px solid #e2e8f0',
                                      opacity: 0.8
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                      <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                                          {listing?.title || 'Logement'}
                                        </h3>
                                        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                                          {listing?.city} • Réservation #{reservation.id.slice(0, 8).toUpperCase()}
                                        </p>
                                      </div>
                                      <span style={{
                                        padding: '6px 12px',
                                        borderRadius: 999,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        background: '#e0f2fe',
                                        color: '#075985',
                                        border: '1px solid #bae6fd'
                                      }}>
                                        ✓ Terminée
                                      </span>
                                    </div>

                                    <div style={{ marginBottom: 16, padding: 12, background: '#fff', borderRadius: 12 }}>
                                      <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: '0 0 6px' }}>
                                        VOYAGEUR
                                      </p>
                                      <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                        {guest?.name || guest?.email || 'Voyageur'}
                                      </p>
                                    </div>

                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                      gap: 16
                                    }}>
                                      <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                          ARRIVÉE
                                        </p>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                          {new Date(reservation.date_arrivee || reservation.start_date).toLocaleDateString('fr-FR')}
                                        </p>
                                      </div>
                                      <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                          DÉPART
                                        </p>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                          {new Date(reservation.date_depart || reservation.end_date).toLocaleDateString('fr-FR')}
                                        </p>
                                      </div>
                                      <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                          MONTANT TOTAL
                                        </p>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(reservation.total_price || 0)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Réservations annulées - Menu déroulant */}
                      {hostReservations.filter(r => r.status === 'cancelled' || r.status === 'canceled' || r.status === 'rejected').length > 0 && (
                        <div style={{
                          background: '#fff',
                          borderRadius: 20,
                          padding: 20,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                          border: '1px solid #e2e8f0',
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
                              color: '#0f172a'
                            }}
                          >
                            <span>❌ Réservations annulées ({hostReservations.filter(r => r.status === 'cancelled' || r.status === 'canceled' || r.status === 'rejected').length})</span>
                            <span style={{ fontSize: 20, transition: 'transform 0.2s', transform: showCancelledReservations ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                          </button>
                          
                          {showCancelledReservations && (
                            <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
                              {hostReservations.filter(r => r.status === 'cancelled' || r.status === 'canceled' || r.status === 'rejected').map((reservation) => {
                                const listing = reservation.listings;
                                const guest = reservation.guest;
                                const isRejected = reservation.status === 'rejected';
                                
                                return (
                                  <div
                                    key={reservation.id}
                                    style={{
                                      padding: 24,
                                      background: '#fef2f2',
                                      borderRadius: 16,
                                      border: '1px solid #fecaca',
                                      opacity: 0.9
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                      <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#991b1b', margin: '0 0 4px' }}>
                                          {listing?.title || 'Logement'}
                                        </h3>
                                        <p style={{ color: '#7f1d1d', fontSize: 14, margin: 0 }}>
                                          {listing?.city} • Réservation #{reservation.id.slice(0, 8).toUpperCase()}
                                        </p>
                                      </div>
                                      <span style={{
                                        padding: '6px 12px',
                                        borderRadius: 999,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                        border: '1px solid #fca5a5'
                                      }}>
                                        {isRejected ? '✗ Refusée' : '✗ Annulée'}
                                      </span>
                                    </div>

                                    <div style={{ marginBottom: 16, padding: 12, background: '#fff', borderRadius: 12 }}>
                                      <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: '0 0 6px' }}>
                                        VOYAGEUR
                                      </p>
                                      <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                        {guest?.name || guest?.email || 'Voyageur'}
                                      </p>
                                    </div>

                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                      gap: 16,
                                      marginBottom: reservation.cancellation_reason ? 16 : 0
                                    }}>
                                      <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                          ARRIVÉE
                                        </p>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                          {new Date(reservation.date_arrivee || reservation.start_date).toLocaleDateString('fr-FR')}
                                        </p>
                                      </div>
                                      <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                          DÉPART
                                        </p>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                          {new Date(reservation.date_depart || reservation.end_date).toLocaleDateString('fr-FR')}
                                        </p>
                                      </div>
                                      <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>
                                          MONTANT
                                        </p>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', margin: 0, textDecoration: 'line-through' }}>
                                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(reservation.total_price || 0)}
                                        </p>
                                      </div>
                                    </div>

                                    {reservation.cancellation_reason && (
                                      <div style={{
                                        padding: 12,
                                        background: '#fff',
                                        borderRadius: 12,
                                        border: '1px solid #fecaca'
                                      }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', margin: '0 0 4px' }}>
                                          RAISON
                                        </p>
                                        <p style={{ fontSize: 14, color: '#7f1d1d', margin: 0 }}>
                                          {reservation.cancellation_reason}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .cards-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;
          }
          .card { background: #fff; border: 1px solid #eef2f7; border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
          .card-head { display: flex; align-items: center; gap: 10px; justify-content: space-between; }
          .card-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
          .card-meta { color: #64748b; font-size: 14px; margin-top: 6px; }
          .card-actions { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
          .spacer { flex: 1; }
          .btn { text-decoration: none; padding: 10px 12px; border-radius: 10px; font-weight: 700; font-size: 14px; }
          .btn.primary { background: linear-gradient(180deg, #2980ff 0%, #0066ff 100%); color: #fff; box-shadow: 0 6px 20px rgba(0,102,255,0.15); }
          .btn.secondary { background: #f1f4f8; color: #0f172a; border: 1px solid #e5eaf0; }
          .role { padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
          .role.owner { background: #eef5ff; color: #1d4ed8; }
          .role.tenant { background: #ecfdf5; color: #047857; }
          .chip { padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 800; border: 1px solid transparent; }
          .chip.approved { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
          .chip.rejected { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
          .chip.pending { background: #f1f5f9; color: #334155; border-color: #e2e8f0; }
          .chip.info { background: #eef5ff; color: #1d4ed8; border-color: #bfdbfe; }
          .bookings-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
          .booking-item { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #eef2f7; border-radius: 12px; padding: 12px; }
          .booking-title { font-weight: 700; color: #0f172a; }
          .booking-sub { font-size: 13px; color: #64748b; }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
