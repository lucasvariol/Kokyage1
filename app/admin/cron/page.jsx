"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '../../_components/Header';
import Footer from '../../_components/Footer';

export default function AdminCronPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');

  // Check session and allow only PLATFORM_USER_ID via API
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAllowed(false);
        setChecking(false);
        router.push('/inscription');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/check-admin', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        
        if (data.isAdmin) {
          setAllowed(true);
        } else {
          setAllowed(false);
          router.push('/inscription');
        }
      } catch (error) {
        console.error('Erreur vérification admin:', error);
        setAllowed(false);
        router.push('/inscription');
      }
      setChecking(false);
    })();
  }, [router]);

  const triggerCron = async (endpoint = '/api/admin/trigger-cron') => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Récupérer le token de session pour l'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // Appeler la route admin ou directement le CRON avec le secret
      const response = await fetch(endpoint, {
        method: endpoint.includes('/api/admin/') ? 'POST' : 'GET',
        headers: {
          'Authorization': endpoint.includes('/api/admin/') 
            ? `Bearer ${session.access_token}` 
            : `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du déclenchement du CRON');
      }

      // Le résultat du CRON est dans result.data pour admin, sinon directement result
      setResult(endpoint.includes('/api/admin/') ? result.data : result);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <>
        <Header />
        <main style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p>Vérification...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <>
      <Header />
      <main style={{
        minHeight: '80vh',
        background: '#f9fafb',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: 1000,
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8
          }}>
            Administration - Tâches CRON
          </h1>
          <p style={{
            fontSize: 16,
            color: '#6b7280',
            marginBottom: 32
          }}>
            Déclenchez manuellement les traitements automatiques
          </p>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            borderBottom: '2px solid #e5e7eb'
          }}>
            <button
              onClick={() => setActiveTab('payments')}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'payments' ? '2px solid #111827' : '2px solid transparent',
                color: activeTab === 'payments' ? '#111827' : '#6b7280',
                fontWeight: activeTab === 'payments' ? 600 : 400,
                cursor: 'pointer',
                fontSize: 15,
                marginBottom: -2
              }}
            >
              💳 Paiements
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'reviews' ? '2px solid #111827' : '2px solid transparent',
                color: activeTab === 'reviews' ? '#111827' : '#6b7280',
                fontWeight: activeTab === 'reviews' ? 600 : 400,
                cursor: 'pointer',
                fontSize: 15,
                marginBottom: -2
              }}
            >
              ⭐ Demandes d'avis
            </button>
            <button
              onClick={() => setActiveTab('publish')}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'publish' ? '2px solid #111827' : '2px solid transparent',
                color: activeTab === 'publish' ? '#111827' : '#6b7280',
                fontWeight: activeTab === 'publish' ? 600 : 400,
                cursor: 'pointer',
                fontSize: 15,
                marginBottom: -2
              }}
            >
              📝 Publication avis
            </button>
          </div>

          {/* Tab: Payments */}
          {activeTab === 'payments' && (
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 32,
              border: '1px solid #e5e7eb',
              marginBottom: 24
            }}>
              <h2 style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 16
              }}>
                Traitement automatique des paiements
              </h2>
            
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              fontSize: 14,
              lineHeight: 1.6,
              color: '#0c4a6e'
            }}>
              <strong>Ce traitement effectue :</strong>
              <ul style={{ marginLeft: 20, marginTop: 8 }}>
                <li>Libération des cautions (14 jours après checkout, si pas de litige)</li>
                <li>Répartition des paiements vers les hôtes et propriétaires</li>
                <li>Virements automatiques Stripe si comptes configurés</li>
                <li>Vérification et paiement des soldes en attente</li>
              </ul>
            </div>

            <button
              onClick={() => triggerCron('/api/admin/trigger-cron')}
              disabled={loading}
              style={{
                background: loading ? '#9ca3af' : '#111827',
                color: '#ffffff',
                padding: '14px 28px',
                borderRadius: 10,
                border: 'none',
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18,
                    height: 18,
                    border: '3px solid #ffffff',
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Déclencher le CRON maintenant
                </>
              )}
            </button>
            </div>
          )}

          {/* Tab: Review Requests */}
          {activeTab === 'reviews' && (
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 32,
              border: '1px solid #e5e7eb',
              marginBottom: 24
            }}>
              <h2 style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 16
              }}>
                Envoi des demandes d'avis
              </h2>
              
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde047',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                fontSize: 14,
                lineHeight: 1.6,
                color: '#92400e'
              }}>
                <strong>Ce traitement effectue :</strong>
                <ul style={{ marginLeft: 20, marginTop: 8 }}>
                  <li>Recherche les réservations se terminant aujourd'hui</li>
                  <li>Envoie un email au voyageur pour noter le séjour</li>
                  <li>Envoie un email à l'hôte pour noter le voyageur</li>
                  <li>Normalement déclenché automatiquement à 18h</li>
                </ul>
              </div>

              <button
                onClick={() => triggerCron('/api/cron/send-review-requests')}
                disabled={loading}
                style={{
                  background: loading ? '#9ca3af' : '#F59E0B',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Envoi en cours...' : '📧 Envoyer les demandes d\'avis'}
              </button>
            </div>
          )}

          {/* Tab: Publish Reviews */}
          {activeTab === 'publish' && (
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 32,
              border: '1px solid #e5e7eb',
              marginBottom: 24
            }}>
              <h2 style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 16
              }}>
                Publication automatique des avis
              </h2>
              
              <div style={{
                background: '#dbeafe',
                border: '1px solid #93c5fd',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                fontSize: 14,
                lineHeight: 1.6,
                color: '#1e40af'
              }}>
                <strong>Ce traitement effectue :</strong>
                <ul style={{ marginLeft: 20, marginTop: 8 }}>
                  <li>Recherche les avis non publiés créés il y a plus de 14 jours</li>
                  <li>Publie automatiquement ces avis (visibles publiquement)</li>
                  <li>Normalement déclenché automatiquement à 3h du matin</li>
                </ul>
              </div>

              <button
                onClick={() => triggerCron('/api/cron/publish-pending-reviews')}
                disabled={loading}
                style={{
                  background: loading ? '#9ca3af' : '#3B82F6',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Publication en cours...' : '📝 Publier les avis en attente'}
              </button>
            </div>
          )}

          {/* Affichage des résultats */}
          {result && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#166534',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Traitement terminé avec succès
              </h3>

              <div style={{
                display: 'grid',
                gap: 12,
                fontSize: 14,
                color: '#166534'
              }}>
                <div>
                  <strong>Réservations traitées :</strong> {result.processed || 0}
                </div>
                
                {result.pending_balances_processed && (
                  <div>
                    <strong>Soldes en attente vérifiés :</strong> {result.pending_balances_processed.processed || 0}
                  </div>
                )}

                {result.pending_balances_processed?.results && result.pending_balances_processed.results.length > 0 && (
                  <div style={{
                    marginTop: 12,
                    background: '#ffffff',
                    borderRadius: 8,
                    padding: 16,
                    border: '1px solid #86efac'
                  }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>
                      Détail des soldes en attente :
                    </strong>
                    {result.pending_balances_processed.results.map((item, idx) => (
                      <div key={idx} style={{
                        padding: '8px 0',
                        borderTop: idx > 0 ? '1px solid #dcfce7' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{item.email}</span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: item.status === 'paid' ? '#dcfce7' : '#fef3c7',
                          color: item.status === 'paid' ? '#166534' : '#92400e'
                        }}>
                          {item.status === 'paid' ? `✓ Payé ${item.amount}€` : item.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {result.results && result.results.length > 0 && (
                  <details style={{ marginTop: 12 }}>
                    <summary style={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: '8px 0'
                    }}>
                      Voir le détail des réservations ({result.results.length})
                    </summary>
                    <div style={{
                      marginTop: 12,
                      background: '#ffffff',
                      borderRadius: 8,
                      padding: 16,
                      border: '1px solid #86efac'
                    }}>
                      {result.results.map((item, idx) => (
                        <div key={idx} style={{
                          padding: '10px 0',
                          borderTop: idx > 0 ? '1px solid #dcfce7' : 'none'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            Réservation #{item.reservation_id}
                          </div>
                          {item.success ? (
                            <div style={{ fontSize: 13 }}>
                              <div>Propriétaire: {item.proprietor_amount}€</div>
                              <div>Locataire principal: {item.main_tenant_amount}€</div>
                              <div>Plateforme: {item.platform_amount}€</div>
                              {item.transfers && item.transfers.length > 0 && (
                                <div style={{ marginTop: 4, color: '#059669' }}>
                                  ✓ {item.transfers.length} virement(s) automatique(s)
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ color: '#dc2626', fontSize: 13 }}>
                              ✗ Erreur: {item.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Affichage des erreurs */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 16,
              padding: 24,
              color: '#991b1b'
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Erreur
              </h3>
              <div style={{ fontSize: 14 }}>
                {error}
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <Footer />
    </>
  );
}
