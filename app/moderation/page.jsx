"use client";

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ModerationDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [items, setItems] = useState([]);
  const [allowed, setAllowed] = useState(false);
  // New: tab management and reservations for Paiements
  const [activeTab, setActiveTab] = useState('annonces'); // 'annonces' | 'paiements'
  const [reservations, setReservations] = useState([]);
  const [resLoading, setResLoading] = useState(false);
  const [resError, setResError] = useState('');
  const [resSuccess, setResSuccess] = useState('');
  const [allocatingId, setAllocatingId] = useState(null);

  async function fetchData() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, address, city, status')
      .in('status', ['en attente validation modérateur', 'en attente validation propriétaire'])
      .order('id', { ascending: false });
    if (error) setError(error.message);
    setItems(data || []);
    setLoading(false);
  }

  async function fetchReservations() {
    setResLoading(true);
    setResError('');
    setResSuccess('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = { };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch('/api/moderation/reservations', { headers });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erreur de chargement des réservations');
      setReservations(json.reservations || []);
    } catch (e) {
      setResError(e.message);
    } finally {
      setResLoading(false);
    }
  }

  // Check session and allow only the specific moderator email
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const moderatorEmail = 'lucas.variol@gmail.com';
      if (session?.user?.email === moderatorEmail) {
        setAllowed(true);
        await fetchData();
        // Preload reservations if tab is paiements
        if (activeTab === 'paiements') await fetchReservations();
      } else {
        setAllowed(false);
        setLoading(false);
      }
    })();
  }, []);

  // When switching tab, lazy-load reservations
  useEffect(() => {
    if (allowed && activeTab === 'paiements' && reservations.length === 0 && !resLoading) {
      fetchReservations();
    }
  }, [allowed, activeTab]);

  async function act(listingId, action) {
    setError('');
    setSuccess('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch('/api/listings/moderate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ listingId, action })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erreur serveur');
      setSuccess(`Statut mis à jour: ${json.status}`);
      await fetchData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function allocate(reservationId) {
    setAllocatingId(reservationId);
    setResError('');
    setResSuccess('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch('/api/moderation/allocate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ reservationId })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Erreur allocation');
      setResSuccess(`Allocations effectuées: propriétaire ${Number(json.proprietorAmount || 0).toFixed(2)} €, locataire ${Number(json.mainTenantAmount || 0).toFixed(2)} €`);
      await fetchReservations();
    } catch (e) {
      setResError(e.message);
    } finally {
      setAllocatingId(null);
    }
  }


  return (
    <>
      <Header />
      <main style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)',
        minHeight: '100vh',
        paddingBottom: 0
      }}>
        {/* Hero */}
        <section style={{
          background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
          padding: '60px 24px 90px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.1rem)', fontWeight: 800, marginBottom: 12 }}>Modération des annonces</h1>
            <p style={{ opacity: 0.92 }}>Validez ou refusez les logements en attente.</p>
          </div>
        </section>

        <section style={{ padding: '0 24px 80px', transform: 'translateY(-50px)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            width: '100%',
            maxWidth: 1000,
            margin: '0 auto'
          }}>
            {!allowed ? (
              <div style={{ textAlign: 'center', color: '#B91C1C', padding: 16 }}>
                Accès refusé. Vous devez être connecté avec le compte modérateur autorisé.
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #E2E8F0', marginBottom: 18 }}>
                  <button
                    onClick={() => setActiveTab('annonces')}
                    style={{
                      padding: '10px 12px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: activeTab === 'annonces' ? '2px solid #111827' : '2px solid transparent',
                      fontWeight: 700,
                      color: activeTab === 'annonces' ? '#111827' : '#6B7280'
                    }}
                  >
                    Annonces
                  </button>
                  <button
                    onClick={() => setActiveTab('paiements')}
                    style={{
                      padding: '10px 12px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: activeTab === 'paiements' ? '2px solid #111827' : '2px solid transparent',
                      fontWeight: 700,
                      color: activeTab === 'paiements' ? '#111827' : '#6B7280'
                    }}
                  >
                    Paiements
                  </button>
                </div>
                {error && (
                  <div style={{ padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#B91C1C', marginBottom: 16 }}>⚠️ {error}</div>
                )}
                {success && (
                  <div style={{ padding: 12, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#065F46', marginBottom: 16 }}>✅ {success}</div>
                )}
                {activeTab === 'annonces' && (
                  <>
                    {loading ? (
                      <div style={{ textAlign: 'center', color: '#64748B' }}>Chargement…</div>
                    ) : (
                      <>
                        {/* Section: en attente validation propriétaire (lecture seule) */}
                        <h2 style={{ fontWeight: 800, fontSize: 18, margin: '4px 0 10px', color: '#0F172A' }}>En attente validation propriétaire</h2>
                        {items.filter(i => i.status === 'en attente validation propriétaire').length === 0 ? (
                          <div style={{ textAlign: 'left', color: '#64748B', marginBottom: 16 }}>Aucun logement en attente de validation propriétaire.</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 18 }}>
                            {items.filter(i => i.status === 'en attente validation propriétaire').map((l) => (
                              <div key={`owner-${l.id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, background: '#F8FAFC' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, color: '#1F2937' }}>{l.title || 'Sans titre'}</div>
                                  <div style={{ color: '#64748B', fontSize: 14 }}>{l.address}{l.city ? `, ${l.city}` : ''}</div>
                                  <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>Status: {l.status}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <a href={`/logement/${l.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                    <button type="button" style={{ border: '1px solid #E2E8F0', background: 'white', color: '#0F172A', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>Voir l'annonce</button>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Section: en attente validation modérateur (actions disponibles) */}
                        <h2 style={{ fontWeight: 800, fontSize: 18, margin: '14px 0 10px', color: '#0F172A' }}>En attente validation modérateur</h2>
                        {items.filter(i => i.status === 'en attente validation modérateur').length === 0 ? (
                          <div style={{ textAlign: 'left', color: '#64748B' }}>Aucun logement en attente de validation modérateur.</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                            {items.filter(i => i.status === 'en attente validation modérateur').map((l) => (
                              <div key={`mod-${l.id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, background: '#F8FAFC' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, color: '#1F2937' }}>{l.title || 'Sans titre'}</div>
                                  <div style={{ color: '#64748B', fontSize: 14 }}>{l.address}{l.city ? `, ${l.city}` : ''}</div>
                                  <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>Status: {l.status}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <a href={`/logement/${l.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                    <button type="button" style={{ border: '1px solid #E2E8F0', background: 'white', color: '#0F172A', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>Voir l'annonce</button>
                                  </a>
                                  <button onClick={() => act(l.id, 'approve')} style={{ border: 'none', background: '#10B981', color: 'white', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>Valider</button>
                                  <button onClick={() => act(l.id, 'reject')} style={{ border: '1px solid #E2E8F0', background: 'white', color: '#B91C1C', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>Refuser</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {activeTab === 'paiements' && (
                  <>
                    {resError && (
                      <div style={{ padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#B91C1C', marginBottom: 16 }}>⚠️ {resError}</div>
                    )}
                    {resSuccess && (
                      <div style={{ padding: 12, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#065F46', marginBottom: 16 }}>✅ {resSuccess}</div>
                    )}
                    {resLoading ? (
                      <div style={{ textAlign: 'center', color: '#64748B' }}>Chargement…</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <thead>
                            <tr style={{ background: '#F3F4F6' }}>
                              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #E5E7EB' }}>ID</th>
                              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #E5E7EB' }}>Logement</th>
                              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #E5E7EB' }}>Dates</th>
                              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #E5E7EB' }}>Propriétaire</th>
                              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #E5E7EB' }}>Locataire principal</th>
                              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #E5E7EB' }}>Statut</th>
                              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #E5E7EB' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reservations.map((r) => (
                              <tr key={r.id}>
                                <td style={{ padding: 8, borderBottom: '1px solid #E5E7EB' }}>{r.id}</td>
                                <td style={{ padding: 8, borderBottom: '1px solid #E5E7EB' }}>{r.listing_title || r.listing_id}</td>
                                <td style={{ padding: 8, borderBottom: '1px solid #E5E7EB' }}>{r.start_date} → {r.end_date}</td>
                                <td style={{ padding: 8, borderBottom: '1px solid #E5E7EB' }}>{Number(r.proprietor_share || 0).toFixed(2)} €</td>
                                <td style={{ padding: 8, borderBottom: '1px solid #E5E7EB' }}>{Number(r.main_tenant_share || 0).toFixed(2)} €</td>
                                <td style={{ padding: 8, borderBottom: '1px solid #E5E7EB' }}>
                                  {r.balances_allocated ? (
                                    <span style={{ color: '#065F46', fontWeight: 600 }}>Allocé</span>
                                  ) : (
                                    <span style={{ color: '#92400E', fontWeight: 600 }}>En attente</span>
                                  )}
                                </td>
                                <td style={{ padding: 8, borderBottom: '1px solid #E5E7EB' }}>
                                  <button
                                    onClick={() => allocate(r.id)}
                                    disabled={r.balances_allocated || allocatingId === r.id}
                                    style={{
                                      border: 'none',
                                      background: r.balances_allocated ? '#E5E7EB' : '#111827',
                                      color: r.balances_allocated ? '#6B7280' : 'white',
                                      padding: '8px 12px',
                                      borderRadius: 10,
                                      fontWeight: 700,
                                      cursor: r.balances_allocated ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    {allocatingId === r.id ? 'Transfert…' : 'Transférer sur les soldes'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
