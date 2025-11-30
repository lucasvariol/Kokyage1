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
      <div className="min-h-screen bg-[#F5F1ED]">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg text-gray-600">Chargement...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F1ED]">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Oups !</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/reservations')}
              className="px-6 py-3 bg-gradient-to-r from-[#4ECDC4] to-[#3B82F6] text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Retour aux réservations
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F1ED]">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Merci pour votre avis !</h1>
            <p className="text-gray-600 mb-2">
              Votre avis a été enregistré avec succès.
            </p>
            <p className="text-sm text-gray-500">
              Il sera publié une fois que l'autre partie aura également laissé son avis, ou automatiquement après 14 jours.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20">
      <Header />
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          {/* Header Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-100/50 border border-white/60 overflow-hidden mb-6">
            <div className="relative bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 px-8 py-12 text-center">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl mb-4 shadow-lg">
                  <span className="text-5xl">⭐</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
                  {reviewerType === 'guest' ? 'Partagez votre expérience' : 'Évaluez votre voyageur'}
                </h1>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white/95 text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                  {reservation?.listings?.title} • {reservation?.listings?.city}
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-100/50 border border-white/60 p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Rating */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Votre note
                </label>
                <div className="flex justify-center gap-3 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="group relative transition-all duration-300 hover:scale-125 focus:outline-none focus:scale-125"
                    >
                      <span className={`text-6xl transition-all duration-300 ${
                        (hoverRating || rating) >= star 
                          ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                          : 'opacity-30 grayscale'
                      }`}>
                        {(hoverRating || rating) >= star ? '⭐' : '☆'}
                      </span>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <div className="text-center">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                      rating === 5 ? 'bg-green-100 text-green-800' :
                      rating === 4 ? 'bg-blue-100 text-blue-800' :
                      rating === 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {rating === 1 && '😞 Très décevant'}
                      {rating === 2 && '😕 Décevant'}
                      {rating === 3 && '😐 Correct'}
                      {rating === 4 && '😊 Bien'}
                      {rating === 5 && '🤩 Excellent'}
                    </span>
                  </div>
                )}
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  Votre avis <span className="text-gray-400 normal-case font-normal">(optionnel)</span>
                </label>
                <textarea
                  id="comment"
                  rows={6}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={reviewerType === 'guest' 
                    ? "Qu'avez-vous particulièrement apprécié ? Propreté, équipements, communication avec l'hôte, emplacement..."
                    : "Comment s'est comporté votre voyageur ? Respect des lieux, communication, ponctualité, propreté..."
                  }
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 placeholder:text-gray-400 bg-white/50 backdrop-blur"
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  Soyez honnête et constructif. Votre avis aide la communauté.
                </p>
              </div>

              {/* Notice */}
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full -mr-16 -mt-16"></div>
                <div className="relative flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
                      <span className="text-xl">⏰</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Publication différée</p>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Vous avez <strong>14 jours</strong> pour laisser votre avis. 
                      Il sera publié une fois que l'autre partie aura également laissé son avis, ou automatiquement après 14 jours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-5">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-400 rounded-xl flex items-center justify-center">
                        <span className="text-xl">⚠️</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-900 mb-1">Erreur</p>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/reservations')}
                  className="flex-1 px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                      </svg>
                      Publier l'avis
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Trust Badge */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Vos données sont protégées et votre avis anonyme jusqu'à publication
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
