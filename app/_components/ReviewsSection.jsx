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
  const [canReview, setCanReview] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Check if user can review (has past confirmed reservation)
      if (user) {
        setCheckingEligibility(true);
        try {
          const now = new Date().toISOString();
          const { data: pastReservations, error } = await supabase
            .from('reservations')
            .select('id, end_date, status')
            .eq('listing_id', listingId)
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .lt('end_date', now);

          if (!error && pastReservations && pastReservations.length > 0) {
            setCanReview(true);
          } else {
            setCanReview(false);
          }
        } catch (err) {
          console.error('Error checking review eligibility:', err);
          setCanReview(false);
        } finally {
          setCheckingEligibility(false);
        }
      } else {
        setCanReview(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setCanReview(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [listingId]);

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
      borderRadius: 16,
      padding: 24,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid #f3f4f6'
    }}>
      {/* Header with average rating */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ 
          fontSize: 20, 
          fontWeight: 700, 
          color: '#111827', 
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          Avis voyageurs
        </h2>

        {summary.review_count > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            padding: '14px 16px',
            background: '#f9fafb',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            marginBottom: 16
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
              {summary.average_rating}
            </div>
            <div>
              <StarAverage value={summary.average_rating} />
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>
                Basé sur {summary.review_count} avis
              </div>
            </div>
          </div>
        )}

        {/* Add review button */}
        {user && canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '11px 18px',
              background: '#1f2937',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            Laisser un avis
          </button>
        )}

      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#f9fafb',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          marginBottom: 20
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Votre avis
          </h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Note *
            </label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#9ca3af'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
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

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              style={{
                flex: 1,
                padding: '10px 18px',
                background: submitting || rating === 0 ? '#e5e7eb' : '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
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
                padding: '10px 18px',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
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
          padding: '32px 16px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 14,
          fontWeight: 500,
          background: '#f9fafb',
          borderRadius: 10,
          border: '1px dashed #d1d5db'
        }}>
          Aucun avis pour le moment. Soyez le premier à en laisser un !
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(review => (
            <div key={review.id} className="review-item" style={{
              background: '#f9fafb',
              borderRadius: 10,
              padding: 16,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: 15, marginBottom: 6 }}>
                    {review.author_first_name || 'Voyageur'}
                  </div>
                  <StarRating rating={review.rating} readonly />
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                  {new Date(review.created_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
              {review.comment && (
                <p style={{ 
                  color: '#4b5563', 
                  lineHeight: 1.6, 
                  fontSize: 14,
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
                padding: '10px 18px',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
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

// Display-only stars with half-fill support based on value (0.5 increments)
function StarAverage({ value = 0 }) {
  const rounded = Math.round((Number(value) || 0) * 2) / 2; // nearest 0.5
  const full = Math.floor(rounded);
  const hasHalf = rounded - full === 0.5;

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1,2,3,4,5].map((i) => {
        let fill = 0;
        if (i <= full) fill = 100;
        else if (i === full + 1 && hasHalf) fill = 50;
        return <Star key={i} fillPercent={fill} />;
      })}
    </div>
  );
}

function Star({ fillPercent = 0, size = 24 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Outline */}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0 }}>
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
      </svg>
      {/* Filled overlay clipped by width */}
      <div style={{ position: 'absolute', inset: 0, width: `${fillPercent}%`, overflow: 'hidden' }}>
        <svg width={size} height={size} viewBox="0 0 24 24">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}
