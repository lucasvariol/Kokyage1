"use client";

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import StripeCardForm from '../_components/StripeCardForm';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { getFeeMultiplier, percentLabel } from '@/lib/commissions';

// Charger Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '');

function ConfirmerEtPayerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Paramètres de la réservation
  const listingId = searchParams.get('listingId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const guests = searchParams.get('guests') || '2';
  const totalPrice = searchParams.get('totalPrice') || '0';
  const basePrice = searchParams.get('basePrice') || '0';
  const taxPrice = searchParams.get('taxPrice') || '0';
  const nights = searchParams.get('nights') || '1';

  // États
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Format prix
  const formatEUR = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount || 0);
  };

  // Calculs de prix (même logique que dans la page logement)
  const FEE_MULTIPLIER = getFeeMultiplier(); // centralisé
  // Taxe de séjour dynamique (par défaut 2.88€/nuit si API indisponible)
  const [dynamicPerNightTax, setDynamicPerNightTax] = useState(2.88);

  const calculatedPrices = useMemo(() => {
    if (!listing || !nights) return { baseOnly: 0, platformFees: 0, basePrice: 0, taxPrice: 0, totalPrice: 0 };

    const nightsNum = parseInt(nights) || 0;
    const baseNight = Number(listing.price_per_night) || 0;
    
    // Calculs identiques à la page logement
    const baseTotal = nightsNum * baseNight;
    const feeTotal = nightsNum * baseNight * (FEE_MULTIPLIER - 1);
    const taxTotal = nightsNum * dynamicPerNightTax;
    const basePlusFeesTotal = baseTotal + feeTotal;
    const total = basePlusFeesTotal + taxTotal;

    return {
      baseOnly: baseTotal,
      platformFees: feeTotal,
      basePrice: basePlusFeesTotal, // pour compat DB/paiement
      taxPrice: taxTotal,
      totalPrice: total
    };
  }, [listing, nights, FEE_MULTIPLIER, dynamicPerNightTax]);

  // Charger la taxe de séjour dynamique via API selon la ville, le nombre de voyageurs et le prix
  useEffect(() => {
    const loadTaxe = async () => {
      try {
        if (!listing?.city) {
          setDynamicPerNightTax(2.88);
          return;
        }
        const nightsNum = parseInt(nights) || 0;
        const baseNight = Number(listing?.price_per_night) || 0;
        const guestsNum = parseInt(guests) || 1;
        if (!baseNight || nightsNum <= 0) {
          setDynamicPerNightTax(2.88);
          return;
        }
        const payload = {
          communeName: listing.city,
          category: 'non-classe',
          pricePerNightEUR: baseNight,
          guests: guestsNum,
          adults: guestsNum,
          nights: nightsNum
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
            const guestsCalc = payload.guests || 1;
            const adultsCalc = payload.adults || guestsCalc;
            const perPersonBase = (payload.pricePerNightEUR || 0) / Math.max(1, guestsCalc);
            const perAdultPerNight = Math.min(percent * perPersonBase, cap);
            const basePerNight = perAdultPerNight * adultsCalc;
            const deptRate = data?.appliedAdditions?.departmentRate ?? 0;
            const regionRate = data?.appliedAdditions?.regionRate ?? 0;
            const deptAdd = basePerNight * deptRate;
            const regionAdd = basePerNight * regionRate;
            // Console breakdown pour confirmer-et-payer
            console.groupCollapsed('%cTaxe de séjour – détail (paiement)', 'color:#C96745;font-weight:700');
            console.log('Entrées:', {
              commune: payload.communeName,
              categorie: payload.category,
              prixParNuit: payload.pricePerNightEUR,
              voyageurs: guestsCalc,
              adultes: adultsCalc,
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
              tauxRegionIDF: `${(regionRate * 100).toFixed(2)}%`,
              regionIDF: Boolean(data?.appliedAdditions?.isIDF)
            });
            console.log('Résultat API:', {
              taxeParNuitBase: data.perNightTax,
              taxeParNuitAvecAdditionnelles: data.perNightTotalWithAdditions ?? data.perNightTax,
              taxeTotaleBase: data.totalTax,
              taxeTotaleAvecAdditionnelles: data.totalWithAdditions ?? data.totalTax
            });
            console.groupEnd();
          } catch {}
          setDynamicPerNightTax(Math.max(0, computedPerNight));
        } else {
          console.warn('Taxe séjour (paiement): fallback défaut (2.88€/nuit). Réponse API:', data);
          setDynamicPerNightTax(2.88);
        }
      } catch (e) {
        console.warn('Taxe séjour (paiement): fallback défaut (2.88€/nuit) – erreur API:', e);
        setDynamicPerNightTax(2.88);
      }
    };
    loadTaxe();
  }, [listing?.city, listing?.price_per_night, nights, guests]);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calculer la date d'annulation gratuite (7 jours avant l'arrivée)
  const getCancellationDate = () => {
    if (!startDate) return '';
    const arrival = new Date(startDate);
    const cancellation = new Date(arrival.getTime() - (7 * 24 * 60 * 60 * 1000));
    return cancellation.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Charger les données du logement et de l'utilisateur
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data with listingId:', listingId);
        console.log('All params:', { listingId, startDate, endDate, guests, totalPrice });

        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        console.log('User:', user);

        // Rediriger vers la page de connexion si non connecté
        if (!user) {
          console.log('User not authenticated, redirecting to login');
          // Construire l'URL complète avec tous les paramètres
          const params = new URLSearchParams();
          if (listingId) params.set('listingId', listingId);
          if (startDate) params.set('startDate', startDate);
          if (endDate) params.set('endDate', endDate);
          if (guests) params.set('guests', guests);
          if (totalPrice) params.set('totalPrice', totalPrice);
          if (basePrice) params.set('basePrice', basePrice);
          if (taxPrice) params.set('taxPrice', taxPrice);
          if (nights) params.set('nights', nights);
          
          const currentUrl = `/confirmer-et-payer?${params.toString()}`;
          router.push(`/inscription?redirect=${encodeURIComponent(currentUrl)}`);
          return;
        }

        if (!listingId) {
          console.log('No listingId, redirecting to home');
          router.push('/');
          return;
        }

        // Récupérer les données du logement
        console.log('Fetching listing data...');
        const { data: listingData, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();

        console.log('Listing query result:', { data: listingData, error });

        if (error) throw error;
        setListing(listingData);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        alert('Erreur: ' + error.message);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [listingId, router]);

  // Gérer le paiement avec Stripe
  const handlePaymentSuccess = async (paymentMethodId) => {
    if (!user) {
      alert('Vous devez être connecté pour effectuer une réservation.');
      router.push('/connexion');
      return;
    }

    try {
      // 1. Traiter le paiement via Stripe
      const paymentResponse = await fetch('/api/payment/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
          amount: Math.round(calculatedPrices.totalPrice * 100), // Convertir en centimes pour Stripe
          currency: 'eur',
          userId: user.id,
          userEmail: user.email,
          listingId,
          reservationData: {
            startDate,
            endDate,
            guests: parseInt(guests),
            nights: parseInt(nights)
          }
        })
      });

  const paymentResult = await paymentResponse.json();

      if (!paymentResponse.ok || !paymentResult.success) {
        throw new Error(paymentResult.error || 'Erreur lors du paiement');
      }

      // 2. Si le paiement est réussi, créer la réservation et bloquer les dates
      const reservationResponse = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: searchParams.get('listingId') || listingId,
          guestId: user.id,
          startDate: searchParams.get('startDate') || startDate,
          endDate: searchParams.get('endDate') || endDate,
          guests: searchParams.get('guests') || guests,
          basePrice: calculatedPrices.basePrice,
          taxPrice: calculatedPrices.taxPrice,
          totalPrice: calculatedPrices.totalPrice,
          transactionId: paymentResult.transaction.transactionId,
          cautionIntentId: paymentResult?.cautionIntent?.id || null
        })
      });

      const reservationResult = await reservationResponse.json();

      if (!reservationResponse.ok || !reservationResult.success) {
        throw new Error(reservationResult.error || 'Erreur lors de la création de la réservation');
      }

      // 3. Tenter l'envoi automatique d'une facture Stripe (non bloquant en cas d'échec)
      try {
        await fetch('/api/invoices/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentResult.transaction.transactionId,
            reservationId: reservationResult.reservation.id,
            reservation: reservationResult.reservation,
            listing,
          })
        }).catch(() => {});
      } catch (invoiceError) {
        console.warn('⚠️ Échec de l\'envoi automatique de la facture:', invoiceError);
      }

      // 4. Redirection vers une page de confirmation
      router.push(`/reservations?success=true&reservationId=${reservationResult.reservation.id}`);
      
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      alert(error.message || 'Une erreur est survenue lors du paiement. Veuillez réessayer.');
      setPaymentLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Erreur de paiement:', error);
    setPaymentLoading(false);
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

  if (!listing) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Logement introuvable</div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Header />
      <main style={{
        minHeight: '80vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        paddingTop: 40,
        paddingBottom: 60
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 20px'
        }}>
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
              Confirmer et payer
            </h1>
            <p style={{
              fontSize: 16,
              color: '#64748b',
              fontWeight: 600
            }}>
              Finalisez votre réservation en quelques clics
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 400px)',
            gap: 40,
            alignItems: 'flex-start'
          }}>
            {/* Colonne gauche - Récapitulatif */}
            <div style={{
              background: '#fff',
              borderRadius: 24,
              padding: 32,
              boxShadow: '0 10px 35px rgba(0,0,0,0.1)',
              border: '1px solid #f1f5f9'
            }}>
              {/* Photo et nom du logement */}
              <div style={{
                display: 'flex',
                gap: 20,
                marginBottom: 24,
                paddingBottom: 24,
                borderBottom: '2px solid #f1f5f9'
              }}>
                <img
                  src={listing.images?.[0] || '/placeholder-image.jpg'}
                  alt={listing.title}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 16,
                    objectFit: 'cover',
                    border: '3px solid #f1f5f9'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: 8,
                    lineHeight: 1.3
                  }}>
                    {listing.title}
                  </h2>
                  <div style={{
                    fontSize: 14,
                    color: '#64748b',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 12
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {listing.city}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 13,
                    color: '#64748b'
                  }}>
                    {listing.nb_voyageurs && (
                      <span>{listing.nb_voyageurs} voyageurs max</span>
                    )}
                    {listing.bedrooms && (
                      <span>{listing.bedrooms} chambres</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Encart annulation gratuite */}
              <div style={{
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '2px solid #10b981',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  background: '#10b981',
                  borderRadius: '50%',
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontWeight: 800,
                    color: '#065f46',
                    fontSize: 14,
                    marginBottom: 2
                  }}>
                    Annulation gratuite
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#047857',
                    fontWeight: 600
                  }}>
                    Jusqu'au {getCancellationDate()}
                  </div>
                </div>
              </div>

              {/* Détails du séjour */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: 16
                }}>
                  Détails du séjour
                </h3>
                
                <div style={{
                  display: 'grid',
                  gap: 12
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>
                        Dates
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                        {startDate && endDate && `${nights} nuit${parseInt(nights) > 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                        {formatDate(startDate)}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                        au {formatDate(endDate)}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>
                        Voyageurs
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                      {guests} voyageur{parseInt(guests) > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Détail des prix */}
              <div>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: 16
                }}>
                  Détail du prix
                </h3>
                
                <div style={{
                  background: '#f8fafc',
                  borderRadius: 12,
                  padding: 16
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    fontSize: 14,
                    color: '#374151'
                  }}>
                    <span>Hébergement ({nights} nuit{parseInt(nights) > 1 ? 's' : ''})</span>
                    <span style={{ fontWeight: 700 }}>{formatEUR(calculatedPrices.baseOnly)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    fontSize: 14,
                    color: '#374151'
                  }}>
                    <span>Frais de plateforme ({percentLabel()})</span>
                    <span style={{ fontWeight: 700 }}>{formatEUR(calculatedPrices.platformFees)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                    fontSize: 14,
                    color: '#374151'
                  }}>
                    <span>Taxes de séjour</span>
                    <span style={{ fontWeight: 700 }}>{formatEUR(calculatedPrices.taxPrice)}</span>
                  </div>
                  
                  <div style={{
                    height: 1,
                    background: '#e2e8f0',
                    marginBottom: 12
                  }} />
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 16,
                    color: '#0f172a',
                    fontWeight: 900
                  }}>
                    <span>Total</span>
                    <span>{formatEUR(calculatedPrices.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite - Paiement */}
            <div style={{
              background: '#fff',
              borderRadius: 24,
              padding: 32,
              boxShadow: '0 10px 35px rgba(0,0,0,0.1)',
              border: '1px solid #f1f5f9',
              position: 'sticky',
              top: 100
            }}>
              <h3 style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Paiement sécurisé
              </h3>

              {/* Logo Stripe */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                background: '#f8fafc',
                borderRadius: 10,
                marginBottom: 20,
                border: '1px solid #e2e8f0'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6772e5" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span style={{
                  fontSize: 12,
                  color: '#64748b',
                  fontWeight: 700
                }}>
                  Paiement sécurisé par Stripe
                </span>
              </div>

              {/* Formulaire Stripe */}
              <StripeCardForm
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                amount={formatEUR(calculatedPrices.totalPrice)}
                loading={paymentLoading}
                setLoading={setPaymentLoading}
                disabled={!user}
              />

              <div style={{
                fontSize: 11,
                color: '#64748b',
                textAlign: 'center',
                fontWeight: 600,
                lineHeight: 1.4,
                marginTop: 18
              }}>
                En confirmant, vous acceptez nos conditions générales de vente et notre politique d'annulation.<br />
                <span style={{ color: '#0f172a', fontWeight: 700 }}>
                  Une empreinte bancaire de 300 € sera enregistrée sur votre carte, non débitée, et ne pourra être utilisée qu'en cas de dégradation constatée et validée par nos modérateurs. Le montant débité sera limité au montant réel des dommages.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          div:has(> div[style*="grid-template-columns: minmax(0, 1fr) minmax(0, 400px)"]) > div {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
      
      <Footer />
    </Elements>
  );
}

export default function ConfirmerEtPayerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmerEtPayerContent />
    </Suspense>
  );
}