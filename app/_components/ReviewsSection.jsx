'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Star rating component
function StarRating({ rating, onRatingChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRatingChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: readonly ? 'default' : 'pointer',
            padding: 0,
            fontSize: 24,
            transition: 'transform 0.15s ease',
            transform: !readonly && hover >= star ? 'scale(1.15)' : 'scale(1)'
          }}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill={(hover || rating) >= star ? '#fbbf24' : 'none'} 
            stroke={(hover || rating) >= star ? '#f59e0b' : '#d1d5db'} 
            strokeWidth="1.5"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ listingId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ review_count: 0, average_rating: 0 });
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load reviews
  const loadReviews = async (append = false) => {
    try {
      const currentOffset = append ? offset : 0;
      const res = await fetch(`/api/reviews?listing_id=${listingId}&limit=10&offset=${currentOffset}`);
      const data = await res.json();
      
      if (res.ok) {
        setReviews(append ? [...reviews, ...data.reviews] : data.reviews);
        setSummary(data.summary);
        setHasMore(data.has_more);
        setOffset(currentOffset + data.reviews.length);
      }
    } catch (err) {
      console.error('Load reviews error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [listingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('Vous devez être connecté pour laisser un avis');
      return;
    }

    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          listing_id: listingId,
          rating,
          comment: comment.trim() || null
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Votre avis a été publié avec succès !');
        setRating(0);
        setComment('');
        setShowForm(false);
        // Reload reviews
        loadReviews();
      } else {
        setError(data.error || 'Erreur lors de la publication de l\'avis');
      }
    } catch (err) {
      console.error('Submit review error:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
        Chargement des avis...
      </div>
    );
  }

  return (
    <div className="card-reviews" style={{
      background: '#fff',
      borderRadius: 20,
      padding: 32,
      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
      border: '1px solid #f1f5f9'
    }}>
      {/* Header with average rating */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ 
          fontSize: 24, 
          fontWeight: 800, 
          color: '#0f172a', 
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            padding: 10,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
          Avis voyageurs
        </h2>

        {summary.review_count > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)',
            borderRadius: 12,
            border: '1px solid #fde68a',
            marginBottom: 20
          }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#92400e' }}>
              {summary.average_rating}
            </div>
            <div>
              <StarRating rating={Math.round(summary.average_rating)} readonly />
              <div style={{ fontSize: 14, color: '#78716c', marginTop: 4, fontWeight: 600 }}>
                Basé sur {summary.review_count} avis
              </div>
            </div>
          </div>
        )}

        {/* Add review button */}
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(201,103,69,0.3)',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ✍️ Laisser un avis
          </button>
        )}

        {!user && (
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            textAlign: 'center',
            fontSize: 14,
            color: '#64748b',
            fontWeight: 600
          }}>
            Connectez-vous pour laisser un avis
          </div>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
          padding: 24,
          borderRadius: 16,
          border: '2px solid #fde68a',
          marginBottom: 24
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            Votre avis
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
              Note *
            </label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 15,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#C96745'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              color: '#dc2626',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              background: '#d1fae5',
              border: '1px solid #86efac',
              borderRadius: 10,
              color: '#059669',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12
            }}>
              {success}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: submitting || rating === 0 ? '#d1d5db' : 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: submitting || rating === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? 'Publication...' : 'Publier'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setRating(0);
                setComment('');
                setError('');
                setSuccess('');
              }}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#64748b',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 15,
          fontWeight: 600,
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: 12,
          border: '1px dashed #cbd5e1'
        }}>
          Aucun avis pour le moment. Soyez le premier à en laisser un !
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map(review => (
            <div key={review.id} className="review-item" style={{
              background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
              borderRadius: 14,
              padding: 20,
              border: '1px solid #fde68a'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 4 }}>
                    {review.profiles?.prenom || 'Voyageur'} {review.profiles?.nom?.[0] || ''}.
                  </div>
                  <StarRating rating={review.rating} readonly />
                </div>
                <div style={{ fontSize: 13, color: '#78716c', fontWeight: 600 }}>
                  {new Date(review.created_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
              {review.comment && (
                <p style={{ 
                  color: '#475569', 
                  lineHeight: 1.6, 
                  fontSize: 15,
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => loadReviews(true)}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#C96745',
                border: '2px solid #C96745',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#C96745';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#C96745';
              }}
            >
              Voir plus d'avis
            </button>
          )}
        </div>
      )}
    </div>
  );
}
