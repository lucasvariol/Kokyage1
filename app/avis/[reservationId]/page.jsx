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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%)' }}>
        <Header />
        <div className="container" style={{ padding: 32, textAlign: 'center' }}>
          <div>
            <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 16, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}></div>
            <p style={{ fontSize: 18, color: '#374151', fontWeight: 600 }}>Chargement...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%)' }}>
        <Header />
        <div className="container" style={{ padding: 32 }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)', padding: 24, textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, margin: '0 auto 16px', borderRadius: 40, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 48 }}>⚠️</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>Oups !</h1>
              </div>
              <div style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ fontSize: 18, color: '#374151', marginBottom: 24 }}>{error}</p>
                <button
                  onClick={() => router.push('/reservations')}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', borderRadius: 14, background: 'linear-gradient(90deg, #2563eb, #7c3aed)', color: '#fff', border: 'none' }}
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%)' }}>
        <Header />
        <div className="container" style={{ padding: 32 }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg, #22c55e, #10b981)', padding: 24, textAlign: 'center' }}>
                <div style={{ width: 96, height: 96, margin: '0 auto 16px', borderRadius: 48, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 56 }}>✅</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>Merci pour votre avis !</h1>
              </div>
              <div style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ fontSize: 18, color: '#374151', marginBottom: 8, fontWeight: 600 }}>
                  Votre avis a été enregistré avec succès.
                </p>
                <p style={{ fontSize: 15, color: '#6b7280' }}>
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%)' }}>
      <Header />
      <div className="container" style={{ padding: 24 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Header Card */}
          <div style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: 24, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', padding: 32, marginBottom: 24, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: 16, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 32 }}>{reviewerType === 'guest' ? '⭐' : '👤'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>
                  {reviewerType === 'guest' ? 'Votre avis compte !' : 'Évaluez votre voyageur'}
                </h1>
                <p style={{ color: '#dbeafe', fontSize: 18 }}>
                  {reservation?.listings?.title} · {reservation?.listings?.city}
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
            <form onSubmit={handleSubmit}>
              {/* Rating Section */}
              <div style={{ padding: 32, borderBottom: '1px solid #f3f4f6' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 24, textAlign: 'center' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ transition: 'transform 0.2s ease', outline: 'none' }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <svg 
                        style={{ width: 48, height: 48, transition: 'all 0.2s ease' }}
                        fill={(hoverRating || rating) >= star ? 'url(#starGradient)' : '#E5E7EB'}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p style={{ textAlign: 'center', fontSize: 18, fontWeight: 600, background: 'linear-gradient(90deg, #d97706, #dc2626)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                    {rating === 5 ? '🎉 Excellent !' : rating === 4 ? '👍 Très bien' : rating === 3 ? '👌 Bien' : rating === 2 ? '😐 Moyen' : '😕 Décevant'}
                  </p>
                )}
              </div>

              {/* Comment Section */}
              <div style={{ padding: 32, borderBottom: '1px solid #f3f4f6' }}>
                <label htmlFor="comment" style={{ display: 'block', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
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
                  style={{ width: '100%', padding: '16px 20px', border: '2px solid #e5e7eb', borderRadius: 16, resize: 'none', fontSize: 16, outline: 'none' }}
                />
              </div>

              {/* Notice */}
              <div style={{ padding: 32, background: 'linear-gradient(90deg, #eff6ff, #f5f3ff)', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ width: 40, height: 40, background: '#3b82f6', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>À propos de la publication</h3>
                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>
                      Votre avis sera publié une fois que l'autre partie aura également laissé son avis, ou automatiquement après 14 jours. Vous avez 14 jours pour laisser votre avis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: 32, background: '#fef2f2', borderBottom: '1px solid #fee2e2' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <svg style={{ width: 24, height: 24, color: '#dc2626', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ padding: 32, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <button
                  type="button"
                  onClick={() => router.push('/reservations')}
                  style={{ padding: '12px 24px', borderRadius: 14, fontWeight: 600, color: '#374151', background: '#fff', border: '1px solid #e5e7eb' }}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  style={{ padding: '12px 28px', borderRadius: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(90deg, #2563eb, #7c3aed)', border: 'none', boxShadow: '0 10px 24px rgba(99,102,241,0.35)' }}
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} viewBox="0 0 24 24">
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
