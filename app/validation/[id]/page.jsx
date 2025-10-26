"use client";

import { useState, useEffect } from 'react';

export default function ValidationPage({ params }) {
  const { id } = params;
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function act(action) {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/listings/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f9fafb', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 520, width: '100%', boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin: 0, marginBottom: 8, color: '#C96745' }}>Validation du logement</h1>
        <p style={{ marginTop: 0, color: '#444' }}>Confirmez ou refusez la validation de ce logement.</p>
        {error && (
          <div style={{ background: '#ffecec', color: '#b20000', border: '1px solid #ffbcbc', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>
        )}
        {done ? (
          <div style={{ background: '#ecfff2', color: '#176e3a', border: '1px solid #b5f0c6', padding: '10px 12px', borderRadius: 8 }}>
            Merci, votre décision a été enregistrée.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <button disabled={loading} onClick={() => act('approve')} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #d8d8d8', background: '#1f9d55', color: '#fff', fontWeight: 600 }}>
              {loading ? 'Traitement…' : 'Valider'}
            </button>
            <button disabled={loading} onClick={() => act('reject')} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #d8d8d8', background: '#c53030', color: '#fff', fontWeight: 600 }}>
              {loading ? 'Traitement…' : 'Refuser'}
            </button>
          </div>
        )}
        <p style={{ fontSize: 12, color: '#666', marginTop: 12 }}>ID du logement: {id}</p>
      </div>
    </main>
  );
}
