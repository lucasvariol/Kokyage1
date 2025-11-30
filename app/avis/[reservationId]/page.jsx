'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/app/_components/Header';
import Footer from '@/app/_components/Footer';

export default function ReviewPage({ params }) {
  const router = useRouter();
  const { reservationId } = params;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [reviewerType, setReviewerType] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/inscription');
        return;
      }

      // Récupérer la réservation
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select(`
          id,
          guest_id,
          host_id,
          user_id,
          date_depart,
          listing_id,
          listings (
            id,
            title,
            city
          )
        `)
        .eq('id', reservationId)
        .single();

      if (resError || !resData) {
        setError('Réservation introuvable');
        return;
      }

      // Vérifier le délai de 14 jours
      const departDate = new Date(resData.date_depart);
      const today = new Date();
      const daysSinceDeparture = Math.floor((today - departDate) / (1000 * 60 * 60 * 24));

      if (daysSinceDeparture > 14) {
        setError('Le délai de 14 jours pour laisser un avis est dépassé');
        return;
      }

      // Déterminer si l'utilisateur est guest ou host
      const guestId = resData.guest_id || resData.user_id;
      const hostId = resData.host_id;

      if (user.id === guestId) {
        setReviewerType('guest');
      } else if (user.id === hostId) {
        setReviewerType('host');
      } else {
        setError('Vous n\'êtes pas autorisé à laisser un avis pour cette réservation');
        return;
      }

      // Vérifier si un avis n'a pas déjà été laissé
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('reservation_id', reservationId)
        .eq('user_id', user.id)
        .single();

      if (existingReview) {
        setError('Vous avez déjà laissé un avis pour cette réservation');
        return;
      }

      setReservation(resData);
      setLoading(false);

    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Erreur lors du chargement');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/connexion');
        return;
      }

      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId,
          rating,
          comment: comment.trim() || null,
          reviewerType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi de l\'avis');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/reservations');
      }, 3000);

    } catch (err) {
      console.error('Erreur soumission:', err);
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl"></div>
            <p className="text-lg font-medium text-gray-700">Chargement...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
                <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                  <span className="text-5xl">⚠️</span>
                </div>
                <h1 className="text-3xl font-bold text-white">Oups !</h1>
              </div>
              <div className="p-8 text-center">
                <p className="text-lg text-gray-700 mb-8">{error}</p>
                <button
                  onClick={() => router.push('/reservations')}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  Retour aux réservations
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
                <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <span className="text-6xl">✅</span>
                </div>
                <h1 className="text-3xl font-bold text-white">Merci pour votre avis !</h1>
              </div>
              <div className="p-8 text-center">
                <p className="text-lg text-gray-700 mb-3 font-medium">
                  Votre avis a été enregistré avec succès.
                </p>
                <p className="text-base text-gray-600">
                  Il sera publié une fois que l'autre partie aura également laissé son avis, ou automatiquement après 14 jours.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-4xl">{reviewerType === 'guest' ? '⭐' : '👤'}</span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-1">
                  {reviewerType === 'guest' ? 'Votre avis compte !' : 'Évaluez votre voyageur'}
                </h1>
                <p className="text-blue-100 text-lg">
                  {reservation?.listings?.title} · {reservation?.listings?.city}
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Rating Section */}
              <div className="p-8 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Comment évaluez-vous cette expérience ?
                </h2>
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                  <defs>
                    <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#F59E0B'}} />
                      <stop offset="100%" style={{stopColor: '#EF4444'}} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex items-center justify-center gap-4 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all duration-200 hover:scale-125 focus:outline-none group"
                    >
                      <svg 
                        className="w-12 h-12 md:w-14 md:h-14 transition-all" 
                        fill={(hoverRating || rating) >= star ? 'url(#starGradient)' : '#E5E7EB'}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-lg font-medium bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                    {rating === 5 ? '🎉 Excellent !' : rating === 4 ? '👍 Très bien' : rating === 3 ? '👌 Bien' : rating === 2 ? '😐 Moyen' : '😕 Décevant'}
                  </p>
                )}
              </div>

              {/* Comment Section */}
              <div className="p-8 border-b border-gray-100">
                <label htmlFor="comment" className="block text-lg font-semibold text-gray-900 mb-3">
                  Partagez votre expérience
                </label>
                <textarea
                  id="comment"
                  rows={6}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={reviewerType === 'guest' 
                    ? "Racontez-nous ce qui a rendu votre séjour mémorable..."
                    : "Décrivez votre expérience avec ce voyageur..."
                  }
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base transition-all"
                />
              </div>

              {/* Notice */}
              <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">À propos de la publication</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Votre avis sera publié une fois que l'autre partie aura également laissé son avis, ou automatiquement après 14 jours. Vous avez 14 jours pour laisser votre avis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-8 bg-red-50 border-b border-red-100">
                  <div className="flex gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/reservations')}
                  className="w-full sm:w-auto px-8 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-base hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi...
                    </span>
                  ) : (
                    'Publier mon avis'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
