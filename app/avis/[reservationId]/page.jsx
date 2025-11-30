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
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              {reviewerType === 'guest' ? 'Laissez un avis sur votre séjour' : 'Évaluez votre voyageur'}
            </h1>
            <p className="text-gray-600 text-lg">
              {reservation?.listings?.title} · {reservation?.listings?.city}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div className="pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all duration-150 hover:scale-110 focus:outline-none"
                    >
                      <svg 
                        className="w-10 h-10 transition-colors" 
                        fill={(hoverRating || rating) >= star ? '#FF385C' : '#E5E7EB'}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-base font-medium text-gray-900 mb-2">
                  Commentaire public
                </label>
                <textarea
                  id="comment"
                  rows={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={reviewerType === 'guest' 
                    ? "Partagez les détails de votre expérience avec les futurs voyageurs"
                    : "Partagez votre expérience avec les futurs hôtes"
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-base"
                />
              </div>

              {/* Notice */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                Votre avis sera publié une fois que l'autre partie aura également laissé son avis, ou automatiquement après 14 jours. Vous avez 14 jours pour laisser votre avis.
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/reservations')}
                  className="text-base font-medium text-gray-700 underline hover:text-black transition"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="px-8 py-3 bg-gradient-to-r from-[#FF385C] to-[#E61E4D] text-white rounded-lg font-medium text-base hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi en cours...' : 'Envoyer'}
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
