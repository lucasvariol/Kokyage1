"use client";

import { useState, useEffect } from 'react';
import Header from '../../_components/Header';
import Footer from '../../_components/Footer';

export default function AdminFinancesPage() {
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/finances');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des données');
      }

      setFinancialData(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatEUR = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={{
          minHeight: '80vh',
          background: '#f9fafb',
          padding: '40px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 16,
            fontWeight: 600,
            color: '#64748b'
          }}>
            <div style={{
              width: 24,
              height: 24,
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Chargement des données financières...
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

  if (error) {
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
            margin: '0 auto',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 16,
            padding: 24,
            color: '#991b1b'
          }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 12
            }}>
              Erreur
            </h3>
            <div style={{ fontSize: 14 }}>{error}</div>
          </div>
        </main>
        <Footer />
      </>
    );
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
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#111827',
              marginBottom: 8
            }}>
              Finances Kokyage
            </h1>
            <p style={{
              fontSize: 16,
              color: '#6b7280'
            }}>
              Vue d'ensemble de vos revenus et de la trésorerie
            </p>
          </div>

          {/* Cartes principales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 32
          }}>
            {/* Balance Stripe totale */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16
              }}>
                <div style={{
                  background: '#f0f9ff',
                  borderRadius: 12,
                  padding: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontSize: 13,
                    color: '#6b7280',
                    fontWeight: 600,
                    marginBottom: 2
                  }}>
                    Balance Stripe totale
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#9ca3af'
                  }}>
                    Argent disponible + en attente
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#111827'
              }}>
                {formatEUR(financialData?.stripeBalance?.available + financialData?.stripeBalance?.pending)}
              </div>
              <div style={{
                display: 'flex',
                gap: 12,
                marginTop: 12,
                fontSize: 12,
                color: '#6b7280'
              }}>
                <div>
                  Disponible: <strong>{formatEUR(financialData?.stripeBalance?.available)}</strong>
                </div>
                <div>
                  En attente: <strong>{formatEUR(financialData?.stripeBalance?.pending)}</strong>
                </div>
              </div>
            </div>

            {/* Dû aux hôtes */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16
              }}>
                <div style={{
                  background: '#fef3c7',
                  borderRadius: 12,
                  padding: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                    <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontSize: 13,
                    color: '#6b7280',
                    fontWeight: 600,
                    marginBottom: 2
                  }}>
                    Dû aux hôtes
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#9ca3af'
                  }}>
                    Soldes en attente de paiement
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#f59e0b'
              }}>
                -{formatEUR(financialData?.totalOwedToHosts)}
              </div>
              <div style={{
                fontSize: 12,
                color: '#6b7280',
                marginTop: 12
              }}>
                {financialData?.hostsWithPendingBalance || 0} hôte(s) en attente
              </div>
            </div>

            {/* Revenus Kokyage disponibles */}
            <div style={{
              background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #374151'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  padding: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontSize: 13,
                    color: '#d1d5db',
                    fontWeight: 600,
                    marginBottom: 2
                  }}>
                    Revenus Kokyage
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#9ca3af'
                  }}>
                    Argent disponible pour retrait
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 900,
                color: '#ffffff'
              }}>
                {formatEUR(financialData?.availableForPlatform)}
              </div>
              <div style={{
                fontSize: 12,
                color: '#d1d5db',
                marginTop: 12,
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 12px',
                borderRadius: 8
              }}>
                💡 Balance - Dû aux hôtes
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
            marginBottom: 32
          }}>
            {/* Commissions totales */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 16
              }}>
                Commissions totales
              </h3>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#059669',
                marginBottom: 8
              }}>
                {formatEUR(financialData?.totalPlatformCommissions)}
              </div>
              <div style={{
                fontSize: 13,
                color: '#6b7280'
              }}>
                Depuis le début
              </div>
            </div>

            {/* Réservations traitées */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 16
              }}>
                Réservations traitées
              </h3>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#3b82f6',
                marginBottom: 8
              }}>
                {financialData?.processedReservations || 0}
              </div>
              <div style={{
                fontSize: 13,
                color: '#6b7280'
              }}>
                Paiements distribués
              </div>
            </div>
          </div>

          {/* Informations complémentaires */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 16,
            padding: 24
          }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#0c4a6e',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0c4a6e" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Comment ça fonctionne
            </h3>
            <div style={{
              fontSize: 14,
              color: '#0c4a6e',
              lineHeight: 1.6
            }}>
              <ul style={{ marginLeft: 20, marginTop: 8 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Balance Stripe :</strong> Tout l'argent reçu (paiements des voyageurs)
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Dû aux hôtes :</strong> Montants dans leurs soldes `to_be_paid_to_user` (en attente de compte Stripe ou de retrait manuel)
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Revenus Kokyage :</strong> Balance Stripe - Dû aux hôtes = Argent que tu peux retirer
                </li>
                <li>
                  <strong>Pour retirer :</strong> Dashboard Stripe → Payouts → Configure les virements automatiques ou manuels
                </li>
              </ul>
            </div>
          </div>

          {/* Bouton refresh */}
          <div style={{
            marginTop: 24,
            textAlign: 'center'
          }}>
            <button
              onClick={loadFinancialData}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                padding: '12px 24px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Actualiser les données
            </button>
          </div>
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
