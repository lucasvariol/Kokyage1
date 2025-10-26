"use client";

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ListingAssistantChatbot({ onPriceGenerated, onDescriptionGenerated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [assistanceType, setAssistanceType] = useState(null); // 'price' ou 'description'
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Bonjour ! Je peux vous aider à :\n\n💰 **Fixer le bon prix** pour votre logement\n✍️ **Rédiger une description** attractive\n\nQue souhaitez-vous ?',
      showActionButtons: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [listingInfo, setListingInfo] = useState({});

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

  const resetChat = () => {
    setAssistanceType(null);
    setMessages([
      {
        role: 'assistant',
        content: '👋 Bonjour ! Je peux vous aider à :\n\n💰 **Fixer le bon prix** pour votre logement\n✍️ **Rédiger une description** attractive\n\nQue souhaitez-vous ?',
        showActionButtons: true
      }
    ]);
    setInput('');
    setListingInfo({});
  };

  const handleActionSelection = (action) => {
    setAssistanceType(action);
    
    if (action === 'price') {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'Aide-moi à fixer le prix' },
        { 
          role: 'assistant', 
          content: 'Parfait ! Pour vous aider à fixer le **meilleur prix**, j\'ai besoin de quelques informations :\n\n📍 Dans quelle ville se trouve votre logement ?\n🏠 Quel type de logement ? (studio, T2, maison...)\n👥 Combien de voyageurs peut-il accueillir ?\n📅 Période de location ? (vacances d\'été, week-end...)',
          showPriceForm: true
        }
      ]);
    } else if (action === 'description') {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'Aide-moi à rédiger la description' },
        { 
          role: 'assistant', 
          content: 'Super ! Pour créer une **description attractive**, parlez-moi de votre logement :\n\n🏠 Type de logement et superficie\n🛋️ Les points forts (vue, équipements, localisation...)\n🎯 À qui il conviendrait le mieux (famille, couple, télétravail...)\n📍 Le quartier et ses atouts',
          showDescriptionPrompt: true
        }
      ]);
    }
  };

  const handleGeneratePrice = async (info) => {
    setListingInfo(info);
    setIsLoading(true);
    
    const prompt = `Je cherche à fixer le prix pour mon logement sur Kokyage (plateforme de sous-location). Voici les infos :\n- Ville: ${info.city}\n- Type: ${info.type}\n- Voyageurs: ${info.travelers}\n- Période: ${info.period}\n\nSuggère-moi un prix par nuit compétitif avec une fourchette (min-max) et explique pourquoi.`;
    
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: prompt }],
          assistanceType: 'price'
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message,
        showApplyButton: true,
        suggestedPrice: data.suggestedPrice
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Erreur lors de la génération du prix. Réessayez.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDescription = async (info) => {
    setIsLoading(true);
    
    const prompt = `Aide-moi à rédiger une description attractive pour mon logement sur Kokyage :\n${info}`;
    
    setMessages(prev => [...prev, { role: 'user', content: info }]);
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: prompt }],
          assistanceType: 'description'
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message,
        showApplyButton: true,
        generatedDescription: data.description
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Erreur lors de la génération. Réessayez.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMessage }],
          assistanceType: assistanceType
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Erreur. Réessayez.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

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
            background: 'linear-gradient(135deg, #C96745 0%, #D68E74 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(201,103,69,0.4)',
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
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(201,103,69,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,103,69,0.4)';
          }}
          title="Assistant création d'annonce"
        >
          🤖
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '420px',
          maxWidth: 'calc(100vw - 48px)',
          height: '650px',
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
            background: 'linear-gradient(135deg, #C96745 0%, #D68E74 100%)',
            padding: '20px',
            borderRadius: '20px 20px 0 0',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                🤖 Assistant Annonce
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                Aide au prix et à la description
              </p>
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
                <div style={{
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: message.role === 'user' 
                      ? 'linear-gradient(135deg, #C96745 0%, #D68E74 100%)' 
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
                          p: ({node, ...props}) => <p style={{ margin: '0 0 8px 0' }} {...props} />,
                          strong: ({node, ...props}) => <strong style={{ fontWeight: 700, color: '#C96745' }} {...props} />,
                          em: ({node, ...props}) => <em style={{ fontStyle: 'italic' }} {...props} />,
                          ul: ({node, ...props}) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
                          ol: ({node, ...props}) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
                          li: ({node, ...props}) => <li style={{ margin: '4px 0' }} {...props} />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {message.showActionButtons && !assistanceType && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleActionSelection('price')}
                      style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: '12px 20px',
                        background: 'white',
                        border: '2px solid #C96745',
                        borderRadius: '12px',
                        color: '#C96745',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#C96745';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#C96745';
                      }}
                    >
                      💰 Fixer le prix
                    </button>
                    <button
                      onClick={() => handleActionSelection('description')}
                      style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: '12px 20px',
                        background: 'white',
                        border: '2px solid #C96745',
                        borderRadius: '12px',
                        color: '#C96745',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#C96745';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#C96745';
                      }}
                    >
                      ✍️ Rédiger description
                    </button>
                  </div>
                )}

                {/* Apply Button */}
                {message.showApplyButton && (
                  <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                    <button
                      onClick={() => {
                        if (message.suggestedPrice && onPriceGenerated) {
                          onPriceGenerated(message.suggestedPrice);
                        }
                        if (message.generatedDescription && onDescriptionGenerated) {
                          onDescriptionGenerated(message.generatedDescription);
                        }
                        setMessages(prev => [...prev, { 
                          role: 'assistant', 
                          content: '✅ Appliqué ! Vous pouvez ajuster si nécessaire.' 
                        }]);
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #C96745 0%, #D68E74 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(201,103,69,0.3)',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ✅ Appliquer au formulaire
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
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
                      background: '#C96745',
                      animation: 'bounce 1.4s infinite ease-in-out both'
                    }}></span>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: '#C96745',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.2s'
                    }}></span>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: '#C96745',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.4s'
                    }}></span>
                  </div>
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
                onFocus={(e) => e.currentTarget.style.borderColor = '#C96745'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                style={{
                  padding: '12px 20px',
                  background: input.trim() && !isLoading 
                    ? 'linear-gradient(135deg, #C96745 0%, #D68E74 100%)' 
                    : '#E2E8F0',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1.1rem',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  minWidth: '48px'
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
          0%, 100% { box-shadow: 0 8px 24px rgba(201,103,69,0.4); }
          50% { box-shadow: 0 8px 32px rgba(201,103,69,0.6); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
