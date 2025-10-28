"use client";

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Chatbot() {
  // Détecte si on est sur mobile et définit isOpen en conséquence
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null); // 'proprietaire', 'locataire', 'voyageur', ou null
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Bonjour ! Je suis l\'assistant Kokyage.\n\nPour mieux vous répondre, dites-moi qui vous êtes :',
      showProfileButtons: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Écouter l'événement pour sélectionner automatiquement un profil
  useEffect(() => {
    const handleProfileEvent = (event) => {
      const profile = event.detail?.profile;
      if (profile && !userProfile) {
        setIsOpen(true);
        // Appeler directement la fonction de sélection de profil
        setUserProfile(profile);
        
        const profileLabels = {
          'proprietaire': 'propriétaire',
          'locataire': 'locataire',
          'voyageur': 'voyageur'
        };
        
        setMessages(prev => [...prev, { 
          role: 'user', 
          content: `Je suis ${profileLabels[profile]}` 
        }]);
        
        const responses = {
          'proprietaire': 'Parfait ! En tant que **propriétaire**, je peux vous aider sur :\n\n✅ Comment autoriser votre locataire à sous-louer\n✅ Vos revenus passifs (40% des sous-locations)\n✅ Les garanties et assurances\n✅ Votre contrôle total sur l\'autorisation\n\nQue souhaitez-vous savoir ?',
          'locataire': 'Parfait ! En tant que **locataire**, je peux vous aider sur :\n\n✅ Comment demander l\'autorisation à votre propriétaire\n✅ Vos revenus (60% des sous-locations)\n✅ Comment publier votre logement\n✅ Les garanties et la sécurité\n\nQue souhaitez-vous savoir ?',
          'voyageur': 'Parfait ! En tant que **voyageur**, je peux vous aider sur :\n\n✅ Comment trouver un logement authentique\n✅ Les garanties et l\'assurance\n✅ Les tarifs et frais\n✅ Le processus de réservation\n\nQue souhaitez-vous savoir ?'
        };
        
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: responses[profile]
          }]);
        }, 300);
      }
    };

    window.addEventListener('chatbot-select-profile', handleProfileEvent);
    return () => window.removeEventListener('chatbot-select-profile', handleProfileEvent);
  }, [userProfile]);

  // Écouter l'événement pour envoyer un message automatiquement
  useEffect(() => {
    const handleCustomMessage = (event) => {
      const message = event.detail?.message;
      if (message && userProfile) {
        setIsOpen(true);
        // Ajouter le message utilisateur
        setMessages(prev => [...prev, { role: 'user', content: message }]);
        setIsLoading(true);

        // Envoyer à l'API
        fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: [...messages, { role: 'user', content: message }],
            userProfile: userProfile
          }),
        })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || 'Erreur lors de la communication avec le chatbot');
          }
          return data;
        })
        .then(data => {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: data.message 
          }]);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Erreur chatbot:', error);
          const errorMsg = error.message || 'Désolé, une erreur est survenue. Réessayez.';
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `❌ ${errorMsg}` 
          }]);
          setIsLoading(false);
        });
      }
    };

    window.addEventListener('chatbot-send-message', handleCustomMessage);
    return () => window.removeEventListener('chatbot-send-message', handleCustomMessage);
  }, [userProfile, messages]);

  const resetChat = () => {
    setUserProfile(null);
    setMessages([
      {
        role: 'assistant',
        content: '👋 Bonjour ! Je suis l\'assistant Kokyage.\n\nPour mieux vous répondre, dites-moi qui vous êtes :',
        showProfileButtons: true
      }
    ]);
    setInput('');
  };

  const handleProfileSelection = (profile) => {
    setUserProfile(profile);
    
    const profileLabels = {
      'proprietaire': 'propriétaire',
      'locataire': 'locataire',
      'voyageur': 'voyageur'
    };
    
    // Ajouter le message de l'utilisateur
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: `Je suis ${profileLabels[profile]}` 
    }]);
    
    // Ajouter la réponse personnalisée
    const responses = {
      'proprietaire': 'Parfait ! En tant que **propriétaire**, je peux vous aider sur :\n\n✅ Comment autoriser votre locataire à sous-louer\n✅ Vos revenus passifs (40% des sous-locations)\n✅ Les garanties et assurances\n✅ Votre contrôle total sur l\'autorisation\n\nQue souhaitez-vous savoir ?',
      'locataire': 'Parfait ! En tant que **locataire**, je peux vous aider sur :\n\n✅ Comment demander l\'autorisation à votre propriétaire\n✅ Vos revenus (60% des sous-locations)\n✅ Comment publier votre logement\n✅ Les garanties et la sécurité\n\nQue souhaitez-vous savoir ?',
      'voyageur': 'Parfait ! En tant que **voyageur**, je peux vous aider sur :\n\n✅ Comment trouver un logement authentique\n✅ Les garanties et l\'assurance\n✅ Les tarifs et frais\n✅ Le processus de réservation\n\nQue souhaitez-vous savoir ?'
    };
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responses[profile]
      }]);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMessage }],
          userProfile: userProfile // Envoyer le profil utilisateur
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la communication avec le chatbot');
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);
    } catch (error) {
      console.error('Erreur chatbot:', error);
      const errorMsg = error.message.includes('fetch') 
        ? '❌ Impossible de contacter le serveur. Vérifiez votre connexion internet.' 
        : error.message.includes('chatbot')
        ? '❌ Le service de chatbot est temporairement indisponible. Réessayez plus tard.'
        : `❌ ${error.message}`;
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMsg
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = userProfile ? {
    'proprietaire': [
      "Comment autoriser mon locataire ?",
      "Combien je vais gagner ?",
      "Puis-je annuler l'autorisation ?",
      "Qui est responsable en cas de problème ?"
    ],
    'locataire': [
      "Comment demander l'autorisation ?",
      "Combien je peux gagner ?",
      "Comment publier mon logement ?",
      "Suis-je protégé en cas de dégâts ?"
    ],
    'voyageur': [
      "C'est différent d'Airbnb ?",
      "Suis-je assuré ?",
      "Comment réserver ?",
      "Quels sont les frais ?"
    ]
  }[userProfile] : [
    "Comment fonctionne Kokyage ?",
    "Quels sont les frais ?",
    "Comment suis-je protégé ?",
    "Est-ce légal ?"
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(96,162,157,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'all 0.3s ease',
            zIndex: 1000,
            animation: 'pulse 2s infinite'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(96,162,157,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,162,157,0.4)';
          }}
          title="Besoin d'aide ?"
        >
          💬
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          maxWidth: 'calc(100vw - 48px)',
          height: '600px',
          maxHeight: 'calc(100vh - 48px)',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
            padding: '20px',
            borderRadius: '20px 20px 0 0',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                💬 Assistant Kokyage
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
                  En ligne • Répond en quelques secondes
                </p>
                {userProfile && (
                  <span style={{
                    background: 'rgba(255,255,255,0.25)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {userProfile === 'proprietaire' ? '🏠 Propriétaire' : 
                     userProfile === 'locataire' ? '👤 Locataire' : 
                     '✈️ Voyageur'}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={resetChat}
                title="Réinitialiser la conversation"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#F7F9FA'
          }}>
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: message.role === 'user' 
                      ? 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)' 
                      : 'white',
                    color: message.role === 'user' ? 'white' : '#2D3748',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    wordBreak: 'break-word'
                  }}>
                    {message.role === 'user' ? (
                      message.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          // Styles personnalisés pour les éléments Markdown
                          p: ({node, ...props}) => <p style={{ margin: '0 0 8px 0' }} {...props} />,
                          strong: ({node, ...props}) => <strong style={{ fontWeight: 700, color: '#60A29D' }} {...props} />,
                          em: ({node, ...props}) => <em style={{ fontStyle: 'italic' }} {...props} />,
                          ul: ({node, ...props}) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
                          ol: ({node, ...props}) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
                          li: ({node, ...props}) => <li style={{ margin: '4px 0' }} {...props} />,
                          a: ({node, ...props}) => <a style={{ color: '#60A29D', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />,
                          code: ({node, inline, ...props}) => 
                            inline ? (
                              <code style={{ 
                                background: 'rgba(96,162,157,0.1)', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                              fontSize: '0.9em',
                              fontFamily: 'monospace'
                            }} {...props} />
                          ) : (
                            <code style={{ 
                              display: 'block',
                              background: 'rgba(96,162,157,0.1)', 
                              padding: '8px 12px', 
                              borderRadius: '6px',
                              fontSize: '0.9em',
                              fontFamily: 'monospace',
                              margin: '8px 0'
                            }} {...props} />
                          )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
              
              {/* Boutons de sélection de profil */}
              {message.showProfileButtons && !userProfile && (
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '-8px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start'
                }}>
                  <button
                    onClick={() => handleProfileSelection('proprietaire')}
                    style={{
                      padding: '10px 18px',
                      background: 'white',
                      border: '2px solid #60A29D',
                      borderRadius: '12px',
                      color: '#60A29D',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#60A29D';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#60A29D';
                    }}
                  >
                    🏠 Propriétaire
                  </button>
                  <button
                    onClick={() => handleProfileSelection('locataire')}
                    style={{
                      padding: '10px 18px',
                      background: 'white',
                      border: '2px solid #60A29D',
                      borderRadius: '12px',
                      color: '#60A29D',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#60A29D';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#60A29D';
                    }}
                  >
                    👤 Locataire
                  </button>
                  <button
                    onClick={() => handleProfileSelection('voyageur')}
                    style={{
                      padding: '10px 18px',
                      background: 'white',
                      border: '2px solid #60A29D',
                      borderRadius: '12px',
                      color: '#60A29D',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#60A29D';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#60A29D';
                    }}
                  >
                    ✈️ Voyageur
                  </button>
                </div>
              )}
            </div>
            ))}

            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: '#60A29D',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0s'
                    }}></span>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: '#60A29D',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.2s'
                    }}></span>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: '#60A29D',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.4s'
                    }}></span>
                  </div>
                </div>
              </div>
            )}

            {/* Questions suggérées - affichées seulement si un profil est sélectionné ET après le message de bienvenue */}
            {userProfile && messages.length >= 3 && messages.length <= 4 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ 
                  fontSize: '0.85rem', 
                  color: '#666', 
                  marginBottom: '12px',
                  fontWeight: 600 
                }}>
                  💡 Questions fréquentes :
                </p>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(question);
                        inputRef.current?.focus();
                      }}
                      style={{
                        padding: '10px 14px',
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        color: '#2D3748',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#60A29D';
                        e.currentTarget.style.background = '#F0F9F8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} style={{
            padding: '16px',
            borderTop: '1px solid #E2E8F0',
            background: 'white',
            borderRadius: '0 0 20px 20px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#60A29D'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                style={{
                  padding: '12px 20px',
                  background: input.trim() && !isLoading 
                    ? 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)' 
                    : '#E2E8F0',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1.1rem',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  minWidth: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (input.trim() && !isLoading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {isLoading ? '⏳' : '📨'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(96,162,157,0.4);
          }
          50% {
            box-shadow: 0 8px 32px rgba(96,162,157,0.6);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
