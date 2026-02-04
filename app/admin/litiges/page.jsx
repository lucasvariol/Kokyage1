"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '../../_components/Header';
import Footer from '../../_components/Footer';

export default function LitigesAdmin() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, with_caution, litige

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          listings!inner(title, city),
          profiles(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      alert('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureCaution = async () => {
    if (!selectedReservation || !amount || !reason) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 300) {
      alert('Le montant doit être entre 0.01€ et 300€');
      return;
    }

    if (!confirm(`Confirmer le prélèvement de ${amountNum}€ pour la réservation #${selectedReservation.display_id} ?\n\nRaison: ${reason}`)) {
      return;
    }

    setProcessing(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/capture-caution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: selectedReservation.id,
          amount: amountNum,
          reason: reason
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du prélèvement');
      }

      setMessage(`✅ ${result.message}`);
      setShowModal(false);
      setAmount('');
      setReason('');
      setSelectedReservation(null);
      
      // Recharger les réservations
      await loadReservations();

    } catch (error) {
      console.error('Erreur:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (filter === 'with_caution') return r.caution_intent_id && r.caution_status !== 'captured';
    if (filter === 'litige') return r.litige === true;
    return true;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price || 0);
  };

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', padding: '40px 20px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            🔒 Gestion des litiges et cautions
          </h1>
          <p style={{ color: '#64748b', marginBottom: 32 }}>
            Gérez les litiges et prélevez les cautions si nécessaire
          </p>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                border: filter === 'all' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: 8,
                background: filter === 'all' ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              Toutes ({reservations.length})
            </button>
            <button
              onClick={() => setFilter('with_caution')}
              style={{
                padding: '8px 16px',
                border: filter === 'with_caution' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: 8,
                background: filter === 'with_caution' ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              Avec caution ({reservations.filter(r => r.caution_intent_id && r.caution_status !== 'captured').length})
            </button>
            <button
              onClick={() => setFilter('litige')}
              style={{
                padding: '8px 16px',
                border: filter === 'litige' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: 8,
                background: filter === 'litige' ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              En litige ({reservations.filter(r => r.litige === true).length})
            </button>
          </div>

          {message && (
            <div style={{
              padding: 16,
              marginBottom: 20,
              borderRadius: 8,
              background: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${message.startsWith('✅') ? '#86efac' : '#fca5a5'}`,
              color: message.startsWith('✅') ? '#166534' : '#991b1b',
              fontWeight: 600
            }}>
              {message}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              Chargement...
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Logement</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Voyageur</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Dates</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Montant</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Caution</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
                        #{reservation.display_id || reservation.id.slice(0, 8)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14 }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{reservation.listings?.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{reservation.listings?.city}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14 }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{reservation.profiles?.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{reservation.profiles?.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        {formatDate(reservation.date_arrivee)} → {formatDate(reservation.date_depart)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
                        {formatPrice(reservation.total_price)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {reservation.caution_status === 'captured' ? (
                          <span style={{ padding: '4px 8px', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
                            Prélevée ({formatPrice(reservation.refund_amount)})
                          </span>
                        ) : reservation.caution_intent_id ? (
                          <span style={{ padding: '4px 8px', borderRadius: 6, background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600 }}>
                            Enregistrée
                          </span>
                        ) : (
                          <span style={{ padding: '4px 8px', borderRadius: 6, background: '#f1f5f9', color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                            Aucune
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {reservation.caution_intent_id && reservation.caution_status !== 'captured' && (
                          <button
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setShowModal(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#ef4444',
                              color: '#fff',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Prélever caution
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredReservations.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  Aucune réservation trouvée
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de prélèvement */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                Prélever la caution
              </h2>
              <p style={{ color: '#64748b', marginBottom: 24 }}>
                Réservation #{selectedReservation?.display_id} - {selectedReservation?.listings?.title}
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  Montant à prélever (max 300€)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  max="300"
                  step="0.01"
                  placeholder="150.00"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  Raison du prélèvement
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Dégâts constatés dans la cuisine, remplacement nécessaire..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setAmount('');
                    setReason('');
                    setSelectedReservation(null);
                  }}
                  disabled={processing}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: '2px solid #e5e7eb',
                    background: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: processing ? 'not-allowed' : 'pointer',
                    opacity: processing ? 0.5 : 1
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCaptureCaution}
                  disabled={processing || !amount || !reason}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: (processing || !amount || !reason) ? 'not-allowed' : 'pointer',
                    opacity: (processing || !amount || !reason) ? 0.5 : 1
                  }}
                >
                  {processing ? 'Prélèvement...' : 'Confirmer le prélèvement'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
