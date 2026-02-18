"use client";

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import StripeCardForm from '../_components/StripeCardForm';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { trackEvent, trackConversion } from '../_components/GoogleAnalytics';
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
  const [connected, setConnected] = useState(false);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  
  // États pour la modal d'authentification
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('inscription');
  const [authNom, setAuthNom] = useState('');
  const [authPrenom, setAuthPrenom] = useState('');
  const [authDateNaissance, setAuthDateNaissance] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authAcceptCGU, setAuthAcceptCGU] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
  // État local pour le nombre de voyageurs (modifiable)
  const [selectedGuests, setSelectedGuests] = useState(parseInt(guests) || 2);
  
  // Synchroniser selectedGuests avec le paramètre guests
  useEffect(() => {
    setSelectedGuests(parseInt(guests) || 2);
  }, [guests]);

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

  // Fonction pour calculer l'âge
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Gestion de l'inscription
  const handleAuthSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    if (!authAcceptCGU) {
      setAuthError('Veuillez accepter les CGU');
      setAuthLoading(false);
      return;
    }

    if (calculateAge(authDateNaissance) < 18) {
      setAuthError('Vous devez avoir au moins 18 ans');
      setAuthLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            nom: authNom,
            prenom: authPrenom,
            date_naissance: authDateNaissance,
            full_name: `${authPrenom} ${authNom}`
          }
        }
      });

      if (error) throw error;

      const user = data.user;
      if (user) {
        await supabase.from('profiles').insert({
          id: user.id,
          name: `${authPrenom} ${authNom}`,
          email: authEmail
        });

        // Tracker l'inscription
        trackEvent('sign_up', {
          method: 'email'
        });

        // Envoyer l'email de vérification
        const emailResponse = await fetch('/api/emails/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            email: authEmail,
            nom: authNom,
            prenom: authPrenom
          })
        });

        if (!emailResponse.ok) {
          console.error('Erreur lors de l\'envoi de l\'email de vérification');
        }
      }

      setAuthSuccess('✅ Compte créé ! Vérifiez votre email pour confirmer votre compte.');
      setAuthLoading(false);

      setTimeout(() => {
        setAuthTab('connexion');
        setAuthSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Erreur inscription:', err);
      setAuthError(err.message || 'Erreur lors de l\'inscription');
      setAuthLoading(false);
    }
  };

  // Gestion de la connexion
  const handleAuthLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setAuthError('Email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed')) {
          setAuthError('Veuillez confirmer votre adresse email avant de vous connecter');
        } else {
          setAuthError(error.message || 'Erreur de connexion');
        }
        setAuthLoading(false);
        return;
      }

      const user = data.user;

      // ✅ Vérification côté serveur (supabaseAdmin, bypass RLS)
      let isVerified = false;
      try {
        const verifyResponse = await fetch('/api/auth/check-email-verified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        const verifyResult = await verifyResponse.json();
        isVerified = verifyResult.verified === true;
      } catch (verifyErr) {
        console.error('[Login] Erreur vérification email:', verifyErr);
        isVerified = false;
      }

      if (!isVerified) {
        setAuthError('⚠️ Email non vérifié. Veuillez cliquer sur le lien de vérification envoyé à votre adresse email.');
        setAuthLoading(false);
        await supabase.auth.signOut();
        return;
      }

      if (user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!existingProfile) {
          const fullName = user.user_metadata?.full_name ||
            `${user.user_metadata?.prenom || ''} ${user.user_metadata?.nom || ''}`.trim() ||
            user.email.split('@')[0];

          await supabase.from('profiles').insert({
            id: user.id,
            name: fullName
          });
        }
      }

      setAuthSuccess('✅ Connexion réussie !');
      setAuthLoading(false);

      // Tracker la connexion
      trackEvent('login', {
        method: 'email'
      });

      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccess('');
        setUser(user);
        setConnected(true);
      }, 1000);

    } catch (err) {
      console.error('Erreur connexion:', err);
      setAuthError('Une erreur est survenue lors de la connexion');
      setAuthLoading(false);
    }
  };

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
          guests: selectedGuests,
          adults: selectedGuests,
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
  }, [listing?.city, listing?.price_per_night, nights, selectedGuests]);

  // Parser date YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss en date locale (pour éviter problèmes de timezone)
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    // Extraire seulement la partie date si contient l'heure
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day);
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = parseLocalDate(dateStr);
    if (!date) return '';
    
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculer la date d'annulation gratuite (7 jours avant l'arrivée)
  const getCancellationDate = () => {
    if (!startDate) return '';
    const arrival = parseLocalDate(startDate);
    if (!arrival) return '';
    const cancellation = new Date(arrival.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${cancellation.getDate()} ${months[cancellation.getMonth()]} ${cancellation.getFullYear()}`;
  };

  // Calculer la date de la veille de l'arrivée
  const getDayBeforeArrival = () => {
    if (!startDate) return '';
    const arrival = parseLocalDate(startDate);
    if (!arrival) return '';
    const dayBefore = new Date(arrival.getTime() - (2 * 24 * 60 * 60 * 1000));
    
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${dayBefore.getDate()} ${months[dayBefore.getMonth()]} ${dayBefore.getFullYear()}`;
  };

  // Calculer 6 jours avant l'arrivée
  const getSixDaysBeforeArrival = () => {
    if (!startDate) return '';
    const arrival = parseLocalDate(startDate);
    if (!arrival) return '';
    const sixDaysBefore = new Date(arrival.getTime() - (6 * 24 * 60 * 60 * 1000));
    
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${sixDaysBefore.getDate()} ${months[sixDaysBefore.getMonth()]} ${sixDaysBefore.getFullYear()}`;
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
        setConnected(!!user);
        console.log('User:', user);

        if (!listingId || listingId === '') {
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
      router.push('/inscription');
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
          listingId: listingId,
          reservationData: {
            startDate,
            endDate,
            guests: parseInt(selectedGuests),
            nights: parseInt(nights)
          }
        })
      });

      const paymentResult = await paymentResponse.json();

      // Gérer le cas où une action 3D Secure est requise
      if (paymentResult.requiresAction && paymentResult.paymentIntent?.client_secret) {
        console.log('🔐 3D Secure requis, confirmation en cours...');
        
        // Sauvegarder le customer ID du paymentIntent initial avant confirmation
        const initialCustomerId = paymentResult.paymentIntent?.customer || null;
        
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '');
        if (!stripe) {
          throw new Error('Stripe non chargé');
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          paymentResult.paymentIntent.client_secret
        );

        if (confirmError) {
          throw new Error(confirmError.message || 'Échec de la confirmation 3D Secure');
        }

        if (paymentIntent.status !== 'requires_capture' && paymentIntent.status !== 'succeeded') {
          throw new Error('Paiement non confirmé après 3D Secure');
        }

        console.log('✅ 3D Secure confirmé, poursuite de la réservation...');
        
        // Mettre à jour paymentResult avec le PaymentIntent confirmé
        paymentResult.success = true;
        paymentResult.transaction = {
          transactionId: paymentIntent.id,
          status: paymentIntent.status
        };
        paymentResult.payment_method_id = paymentMethodId;

        // Créer le SetupIntent pour la caution maintenant que le paiement est confirmé
        try {
          const setupResponse = await fetch('/api/payment/setup-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentMethodId: paymentMethodId,
              customerId: initialCustomerId, // Utiliser le customer ID de la réponse initiale
              userId: user.id,
              listingId: listingId,
              reservationData: {
                startDate,
                endDate,
                guests: parseInt(selectedGuests),
                nights: parseInt(nights)
              }
            })
          });

          const setupResult = await setupResponse.json();
          console.log('📝 SetupIntent response:', setupResult);
          
          if (setupResult.success) {
            paymentResult.setupIntent = setupResult.setupIntent;
            console.log('✅ SetupIntent créé:', setupResult.setupIntent.id);
          } else {
            console.error('❌ Échec création SetupIntent:', setupResult.error);
          }
        } catch (setupError) {
          console.error('❌ Erreur SetupIntent:', setupError);
          // Ne pas bloquer la réservation si le SetupIntent échoue
        }
        
        console.log('📦 PaymentResult final avant réservation:', {
          setupIntentId: paymentResult?.setupIntent?.id,
          paymentMethodId: paymentResult?.payment_method_id
        });
      }

      if (!paymentResponse.ok || !paymentResult.success) {
        throw new Error(paymentResult.error || 'Erreur lors du paiement');
      }

      // 2. Si le paiement est réussi, créer la réservation et bloquer les dates
      
      // Calculer les dates de remboursement
      const arrivalDate = parseLocalDate(searchParams.get('startDate') || startDate);
      const refund50Date = new Date(arrivalDate.getTime() - (6 * 24 * 60 * 60 * 1000)); // 6 jours avant
      const refund0Date = new Date(arrivalDate.getTime() - (2 * 24 * 60 * 60 * 1000));  // 2 jours avant
      
      const reservationPayload = {
        listingId: listingId,
        guestId: user.id,
        startDate: searchParams.get('startDate') || startDate,
        endDate: searchParams.get('endDate') || endDate,
        guests: selectedGuests,
        basePrice: calculatedPrices.basePrice,
        taxPrice: calculatedPrices.taxPrice,
        totalPrice: calculatedPrices.totalPrice,
        transactionId: paymentResult.transaction.transactionId,
        cautionIntentId: paymentResult?.setupIntent?.id || null,
        paymentMethodId: paymentResult?.payment_method_id || null,
        refund50PercentDate: refund50Date.toISOString().split('T')[0],
        refund0PercentDate: refund0Date.toISOString().split('T')[0]
      };
      
      console.log('📤 Envoi réservation avec:', {
        cautionIntentId: reservationPayload.cautionIntentId,
        paymentMethodId: reservationPayload.paymentMethodId
      });
      
      const reservationResponse = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationPayload)
      });

      const reservationResult = await reservationResponse.json();

      if (!reservationResponse.ok || !reservationResult.success) {
        // ⚠️ CRITIQUE: Le paiement a réussi mais la réservation a échoué
        // On doit rembourser immédiatement pour éviter de prendre l'argent sans service
        console.error('❌ Réservation échouée après paiement réussi - remboursement nécessaire');
        
        try {
          // Tenter un remboursement automatique
          const refundResponse = await fetch('/api/payment/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId: paymentResult.transaction.transactionId,
              reason: 'Échec de création de réservation'
            })
          });
          
          if (refundResponse.ok) {
            alert('Le paiement a été annulé et remboursé car la réservation n\'a pas pu être créée. Veuillez réessayer ou contacter le support.');
          } else {
            alert('ATTENTION: Le paiement a été effectué mais la réservation a échoué. Contactez immédiatement le support avec ce code: ' + paymentResult.transaction.transactionId);
          }
        } catch (refundError) {
          console.error('Échec du remboursement automatique:', refundError);
          alert('ATTENTION: Le paiement a été effectué mais la réservation a échoué. Contactez immédiatement le support avec ce code: ' + paymentResult.transaction.transactionId);
        }
        
        throw new Error(reservationResult.error || 'Erreur lors de la création de la réservation');
      }

      // Tracker la conversion (réservation payée)
      trackConversion('purchase', {
        value: parseFloat(totalPrice),
        currency: 'EUR',
        transaction_id: reservationResult.reservation.id,
        items: [{
          item_id: listing.id,
          item_name: listing.title,
          item_category: 'Logement',
          price: parseFloat(totalPrice),
          quantity: 1
        }]
      });

      // Tracker l'événement de réservation
      trackEvent('reservation_completed', {
        listing_id: listing.id,
        listing_city: listing.city,
        price: parseFloat(totalPrice),
        guests: parseInt(guests),
        nights: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
      });

      // DÉSACTIVÉ: L'envoi automatique de facture créait des PaymentIntents parasites
      // La facture peut maintenant être générée manuellement depuis la page réservation
      /*
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
      */

      // 3. Redirection vers une page de confirmation
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
        background: '#ffffff',
        paddingTop: 20,
        paddingBottom: 60
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 16px'
        }}>
          {/* Titre */}
          <div style={{
            marginBottom: 32,
            paddingTop: 20
          }}>
            <h1 style={{
              fontSize: 'clamp(24px, 5vw, 36px)',
              fontWeight: 700,
              color: '#111827',
              marginBottom: 8,
              letterSpacing: '-0.02em'
            }}>
              Confirmer et payer
            </h1>

          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 20
          }} className="payment-grid">

            {/* Colonne gauche - Récapitulatif */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '20px',
              border: '1px solid #e5e7eb'
            }} className="summary-card">

              {/* Photo et nom du logement */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginBottom: 20,
                paddingBottom: 20,
                borderBottom: '1px solid #e5e7eb'
              }} className="listing-header">

                <img
                  src={listing.images?.[0] || '/placeholder-image.jpg'}
                  alt={listing.title}
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 12,
                    objectFit: 'cover',
                    border: '1px solid #e5e7eb'
                  }}
                  className="listing-image"
                />
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: 8,
                    lineHeight: 1.3
                  }}>
                    {listing.title}
                  </h2>
                  <div style={{
                    fontSize: 14,
                    color: '#6b7280',
                    fontWeight: 500,
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
                    gap: 12,
                    fontSize: 13,
                    color: '#6b7280',
                    flexWrap: 'wrap'
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
                  background: '#111827',
                  borderRadius: '50%',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    color: '#111827',
                    fontSize: 14,
                    marginBottom: 2
                  }}>
                    Annulation gratuite jusqu'au {getCancellationDate()}
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
                    {showCancellationPolicy ? 'Masquer les détails' : 'Voir les détails'}
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
                    Politique d'annulation
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
                        Jusqu'au <strong>{getCancellationDate()}</strong>
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
                        Jusqu'au <strong>{getDayBeforeArrival()}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Détails du séjour */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: 14
                }}>
                  Détails du séjour
                </h3>
                
                <div style={{
                  display: 'grid',
                  gap: 0
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                        Dates
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                        {startDate && endDate && `${nights} nuit${parseInt(nights) > 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                        du {formatDate(startDate)}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
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
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                        Voyageurs
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => setSelectedGuests(Math.max(1, selectedGuests - 1))}
                        disabled={selectedGuests <= 1}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          border: '2px solid #e5e7eb',
                          background: selectedGuests <= 1 ? '#f3f4f6' : 'white',
                          color: selectedGuests <= 1 ? '#9ca3af' : '#111827',
                          cursor: selectedGuests <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: 18,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          if (selectedGuests > 1) {
                            e.target.style.borderColor = '#60A29D';
                            e.target.style.color = '#60A29D';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (selectedGuests > 1) {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.color = '#111827';
                          }
                        }}
                      >
                        −
                      </button>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', minWidth: 80, textAlign: 'center' }}>
                        {selectedGuests} voyageur{selectedGuests > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => setSelectedGuests(Math.min(listing?.nb_voyageurs || 10, selectedGuests + 1))}
                        disabled={selectedGuests >= (listing?.nb_voyageurs || 10)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          border: '2px solid #e5e7eb',
                          background: selectedGuests >= (listing?.nb_voyageurs || 10) ? '#f3f4f6' : 'white',
                          color: selectedGuests >= (listing?.nb_voyageurs || 10) ? '#9ca3af' : '#111827',
                          cursor: selectedGuests >= (listing?.nb_voyageurs || 10) ? 'not-allowed' : 'pointer',
                          fontSize: 18,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          if (selectedGuests < (listing?.nb_voyageurs || 10)) {
                            e.target.style.borderColor = '#60A29D';
                            e.target.style.color = '#60A29D';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (selectedGuests < (listing?.nb_voyageurs || 10)) {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.color = '#111827';
                          }
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détail des prix */}
              <div>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: 14
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
                    <span>Frais de plateforme</span>
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
              background: '#ffffff',
              borderRadius: 16,
              padding: '20px',
              border: '1px solid #e5e7eb'
            }} className="payment-card">

              {connected ? (
                <>
                  <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
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
                padding: '10px',
                background: '#f9fafb',
                borderRadius: 10,
                marginBottom: 18,
                border: '1px solid #e5e7eb'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span style={{
                  fontSize: 12,
                  color: '#6b7280',
                  fontWeight: 600
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
                color: '#6b7280',
                textAlign: 'center',
                fontWeight: 500,
                lineHeight: 1.5,
                marginTop: 16
              }}>
                En confirmant, vous acceptez nos conditions générales de vente et notre politique d'annulation.
                <br /><br />
                <span style={{ color: '#111827', fontWeight: 600 }}>
                  Une empreinte bancaire de 300 € sera enregistrée sur votre carte, non débitée, et ne pourra être utilisée qu'en cas de dégradation constatée et validée par nos modérateurs. Le montant débité sera limité au montant réel des dommages.
                </span>
              </div>
                </>
              ) : (
                <>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                    Connexion requise
                  </h3>

                  <div style={{
                    textAlign: 'center',
                    padding: '30px 20px'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, #60A29D 0%, #4A8B87 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      fontSize: '40px'
                    }}>
                      🔐
                    </div>

                    <h4 style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#2D3748',
                      marginBottom: 12
                    }}>
                      Authentification requise
                    </h4>

                    <p style={{
                      fontSize: 14,
                      color: '#718096',
                      marginBottom: 24,
                      lineHeight: 1.6
                    }}>
                      Connectez-vous ou créez un compte pour finaliser votre réservation
                    </p>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}>
                      <button 
                        onClick={() => {
                          setAuthTab('inscription');
                          setShowAuthModal(true);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #60A29D 0%, #4A8B87 100%)',
                          color: 'white',
                          padding: '14px 24px',
                          borderRadius: 12,
                          border: 'none',
                          fontWeight: 600,
                          fontSize: 15,
                          boxShadow: '0 4px 15px rgba(96,162,157,0.3)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(96,162,157,0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 15px rgba(96,162,157,0.3)';
                        }}>
                        S'inscrire
                      </button>

                      <button 
                        onClick={() => {
                          setAuthTab('connexion');
                          setShowAuthModal(true);
                        }}
                        style={{
                          background: 'rgba(96,162,157,0.1)',
                          color: '#60A29D',
                          padding: '14px 24px',
                          borderRadius: 12,
                          border: '2px solid rgba(96,162,157,0.3)',
                          fontWeight: 600,
                          fontSize: 15,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = 'rgba(96,162,157,0.15)';
                          e.target.style.borderColor = 'rgba(96,162,157,0.5)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'rgba(96,162,157,0.1)';
                          e.target.style.borderColor = 'rgba(96,162,157,0.3)';
                        }}>
                        Se connecter
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal d'authentification */}
        {showAuthModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => {
            setShowAuthModal(false);
            setAuthError('');
            setAuthSuccess('');
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              position: 'relative',
              margin: '20px 0'
            }}
            onClick={(e) => e.stopPropagation()}>
              
              {/* Bouton fermer */}
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                  setAuthSuccess('');
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(0,0,0,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#718096',
                  transition: 'all 0.3s ease',
                  zIndex: 10
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(0,0,0,0.05)';
                }}>
                ✕
              </button>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '32px',
                borderBottom: '2px solid #F7FAFC'
              }}>
                <button
                  onClick={() => {
                    setAuthTab('inscription');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: authTab === 'inscription' ? 'white' : 'transparent',
                    color: authTab === 'inscription' ? '#60A29D' : '#A0AEC0',
                    border: 'none',
                    borderBottom: authTab === 'inscription' ? '3px solid #60A29D' : '3px solid transparent',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '15px',
                    transition: 'all 0.3s ease',
                    borderRadius: '8px 8px 0 0'
                  }}>
                  Inscription
                </button>
                <button
                  onClick={() => {
                    setAuthTab('connexion');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: authTab === 'connexion' ? 'white' : 'transparent',
                    color: authTab === 'connexion' ? '#60A29D' : '#A0AEC0',
                    border: 'none',
                    borderBottom: authTab === 'connexion' ? '3px solid #60A29D' : '3px solid transparent',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '15px',
                    transition: 'all 0.3s ease',
                    borderRadius: '8px 8px 0 0'
                  }}>
                  Connexion
                </button>
              </div>

              {/* Titre */}
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#2D3748',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                {authTab === 'connexion' ? 'Bon retour' : 'Bienvenue'}
              </h2>

              <p style={{
                fontSize: '14px',
                color: '#718096',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                {authTab === 'connexion' ? 'Connectez-vous pour continuer' : 'Créez votre compte pour continuer'}
              </p>

              {/* Messages */}
              {authError && (
                <div style={{
                  padding: '12px 16px',
                  background: '#FEE',
                  border: '1px solid #FCC',
                  borderRadius: '8px',
                  color: '#C53030',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}>
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div style={{
                  padding: '12px 16px',
                  background: '#E6FFFA',
                  border: '1px solid #81E6D9',
                  borderRadius: '8px',
                  color: '#234E52',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}>
                  {authSuccess}
                </div>
              )}

              {/* Formulaire d'inscription */}
              {authTab === 'inscription' && (
                <form onSubmit={handleAuthSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#2D3748' }}>
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={authNom}
                      onChange={(e) => setAuthNom(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#60A29D'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#2D3748' }}>
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={authPrenom}
                      onChange={(e) => setAuthPrenom(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#60A29D'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#2D3748' }}>
                      Date de naissance *
                    </label>
                    <input
                      type="date"
                      value={authDateNaissance}
                      onChange={(e) => setAuthDateNaissance(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#60A29D'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                    {authDateNaissance && calculateAge(authDateNaissance) < 18 && (
                      <p style={{ fontSize: '13px', color: '#E53E3E', marginTop: '6px' }}>
                        Vous devez avoir au moins 18 ans
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#2D3748' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#60A29D'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#2D3748' }}>
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      minLength={6}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#60A29D'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                    <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                      Minimum 6 caractères
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={authAcceptCGU}
                      onChange={(e) => setAuthAcceptCGU(e.target.checked)}
                      style={{ marginTop: '4px' }}
                    />
                    <label style={{ fontSize: '13px', color: '#4A5568', lineHeight: '1.5' }}>
                      J'accepte les{' '}
                      <a href="/cgu" target="_blank" style={{ color: '#60A29D', textDecoration: 'underline' }}>
                        Conditions Générales d'Utilisation
                      </a>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: authLoading ? '#CBD5E0' : 'linear-gradient(135deg, #60A29D 0%, #4A8B87 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '16px',
                      cursor: authLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      marginTop: '8px'
                    }}>
                    {authLoading ? 'Création en cours...' : 'Créer mon compte'}
                  </button>
                </form>
              )}

              {/* Formulaire de connexion */}
              {authTab === 'connexion' && (
                <form onSubmit={handleAuthLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#2D3748' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#60A29D'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#2D3748' }}>
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#60A29D'}
                      onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: authLoading ? '#CBD5E0' : 'linear-gradient(135deg, #60A29D 0%, #4A8B87 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '16px',
                      cursor: authLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      marginTop: '8px'
                    }}>
                    {authLoading ? 'Connexion...' : 'Se connecter'}
                  </button>
                  
                  <p style={{ fontSize: '13px', color: '#718096', textAlign: 'center', marginTop: '8px' }}>
                    <a href="/mot-de-passe-oublie" style={{ color: '#60A29D', textDecoration: 'underline' }}>
                      Mot de passe oublié ?
                    </a>
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (min-width: 1025px) {
          .payment-grid {
            grid-template-columns: 1.4fr 0.6fr !important;
            gap: 32px !important;
          }
          .payment-card {
            position: sticky !important;
            top: 100px !important;
          }
        }
        
        @media (min-width: 768px) {
          .summary-card, .payment-card {
            padding: 28px !important;
          }
        }
        
        @media (min-width: 640px) {
          .listing-header {
            flex-direction: row !important;
            gap: 20px !important;
          }
          .listing-image {
            width: 120px !important;
            height: 120px !important;
            flex-shrink: 0 !important;
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