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
        router.push('/connexion');
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
    <div className="min-h-screen bg-[#F5F1ED]">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">⭐</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {reviewerType === 'guest' ? 'Comment s\'est passé votre séjour ?' : 'Évaluez votre voyageur'}
            </h1>
            <p className="text-gray-600">
              {reservation?.listings?.title} • {reservation?.listings?.city}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Note générale
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-5xl transition-transform hover:scale-110 focus:outline-none"
                  >
                    {(hoverRating || rating) >= star ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  {rating === 1 && 'Très décevant'}
                  {rating === 2 && 'Décevant'}
                  {rating === 3 && 'Correct'}
                  {rating === 4 && 'Bien'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                id="comment"
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={reviewerType === 'guest' 
                  ? "Partagez votre expérience : propreté, équipements, communication avec l'hôte..."
                  : "Partagez votre expérience : respect des lieux, communication, ponctualité..."
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-800">
                ⏰ <strong>Vous avez 14 jours</strong> pour laisser votre avis. 
                Votre avis sera publié une fois que l'autre partie aura également laissé son avis, ou automatiquement après 14 jours.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/reservations')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#4ECDC4] to-[#3B82F6] text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Envoi...' : 'Publier l\'avis'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
