'use client';

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingResetRef = useRef(null);
  const typingChannelRef = useRef(null);
  const messagesChannelRef = useRef(null);

  const ATTACHMENT_PREFIX = '__KOKYAGE_ATTACHMENT__:';

  function parseRichMessage(raw) {
    if (!raw || typeof raw !== 'string') return null;
    if (!raw.startsWith(ATTACHMENT_PREFIX)) return null;
    const json = raw.slice(ATTACHMENT_PREFIX.length);
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function messagePreview(raw) {
    const parsed = parseRichMessage(raw);
    if (parsed?.attachment?.name) return `📎 ${parsed.attachment.name}`;
    if (typeof raw !== 'string') return '';
    return raw.replace(/\s+/g, ' ').trim();
  }

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.threadId);
    }
  }, [selectedConversation]);

  // Realtime: messages + typing indicator
  useEffect(() => {
    if (!user || !selectedConversation?.threadId) return;

    const otherUserId = selectedConversation.threadId;

    // Cleanup previous channels
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current);
      messagesChannelRef.current = null;
    }
    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current);
      typingChannelRef.current = null;
    }

    setOtherTyping(false);

    const messagesChannel = supabase
      .channel(`messages-thread-${user.id}-${otherUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new || payload.old;
          if (!row) return;
          const senderId = row.sender_id;
          const receiverId = row.receiver_id;
          const isInThread =
            (senderId === otherUserId && receiverId === user.id) ||
            (senderId === user.id && receiverId === otherUserId);
          if (!isInThread) return;

          if (payload.eventType === 'INSERT') {
            setMessages((prev) => {
              if (prev.some((m) => String(m.id) === String(payload.new.id))) return prev;
              return [...prev, payload.new].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            });
            loadConversations();
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map((m) => (String(m.id) === String(payload.new.id) ? payload.new : m)));
            loadConversations();
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => String(m.id) !== String(payload.old.id)));
            loadConversations();
          }
        }
      )
      // Also listen to changes where I'm the sender (deletes/updates of my own messages)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new || payload.old;
          if (!row) return;
          const senderId = row.sender_id;
          const receiverId = row.receiver_id;
          const isInThread =
            (senderId === otherUserId && receiverId === user.id) ||
            (senderId === user.id && receiverId === otherUserId);
          if (!isInThread) return;

          if (payload.eventType === 'INSERT') {
            setMessages((prev) => {
              if (prev.some((m) => String(m.id) === String(payload.new.id))) return prev;
              return [...prev, payload.new].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            });
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map((m) => (String(m.id) === String(payload.new.id) ? payload.new : m)));
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => String(m.id) !== String(payload.old.id)));
          }
          loadConversations();
        }
      );

    messagesChannel.subscribe();
    messagesChannelRef.current = messagesChannel;

    const typingKey = [user.id, otherUserId].sort().join('-');
    const typingChannel = supabase
      .channel(`typing-${typingKey}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const p = payload?.payload;
        if (!p || p.userId !== otherUserId) return;
        setOtherTyping(!!p.isTyping);
        if (typingResetRef.current) clearTimeout(typingResetRef.current);
        if (p.isTyping) {
          typingResetRef.current = setTimeout(() => setOtherTyping(false), 2500);
        }
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (typingResetRef.current) {
        clearTimeout(typingResetRef.current);
        typingResetRef.current = null;
      }
      setOtherTyping(false);
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    };
  }, [user, selectedConversation?.threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function checkUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push('/inscription');
      return;
    }
    setUser(user);
  }

  async function loadConversations() {
    try {
      const res = await fetch('/api/messages/conversations');
      const data = await res.json();
      console.log('Conversations API response:', data);
      if (res.ok) {
        setConversations(data.conversations || []);
        console.log('Conversations loaded:', data.conversations?.length || 0);
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(threadId) {
    try {
      const res = await fetch(`/api/messages/thread/${threadId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        loadConversations();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!selectedConversation) return;
    if (!newMessage.trim() && !selectedFile) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (typingChannelRef.current && user?.id && selectedConversation?.threadId) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: false },
      });
    }

    setSending(true);
    try {
      let res;
      if (selectedFile) {
        const form = new FormData();
        form.append('message', newMessage || '');
        form.append('file', selectedFile);
        res = await fetch(`/api/messages/thread/${selectedConversation.threadId}`, {
          method: 'POST',
          body: form,
        });
      } else {
        res = await fetch(`/api/messages/thread/${selectedConversation.threadId}` , {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newMessage })
        });
      }

      if (res.ok) {
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadMessages(selectedConversation.threadId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  function handleSelectFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  }

  function emitTyping() {
    if (!typingChannelRef.current || !user?.id || !selectedConversation?.threadId) return;

    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping: true },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: false },
      });
    }, 1200);
  }

  async function handleDeleteMessage(messageId) {
    if (!messageId) return;
    const ok = window.confirm('Supprimer ce message ?');
    if (!ok) return;

    try {
      const res = await fetch(`/api/messages/message/${messageId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Delete message error:', data?.error);
        return;
      }
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(messageId)));
      loadConversations();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  }

  // Format reservation date robustly (supports Date, 'YYYY-MM-DD', ISO strings)
  function formatReservationDate(value, withYear = false) {
    if (!value) return '';

    // If we already have a Date instance
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return '';
      return value.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        ...(withYear ? { year: 'numeric' } : {})
      });
    }

    // Normalize to string
    const s = String(value);

    // ISO datetime
    if (s.includes('T')) {
      const dt = new Date(s);
      return isNaN(dt.getTime())
        ? ''
        : dt.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            ...(withYear ? { year: 'numeric' } : {})
          });
    }

    // 'YYYY-MM-DD'
    const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(s);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const local = new Date(y, mo - 1, d);
      return isNaN(local.getTime())
        ? ''
        : local.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            ...(withYear ? { year: 'numeric' } : {})
          });
    }

    // Fallback generic parse
    const dt = new Date(s);
    return isNaN(dt.getTime())
      ? ''
      : dt.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          ...(withYear ? { year: 'numeric' } : {})
        });
  }

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ 
          minHeight: '80vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #E2E8F0',
              borderTop: '4px solid #4ECDC4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#718096', fontSize: '1.1rem' }}>Chargement de vos conversations...</p>
          </div>
        </main>
        <Footer />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </>
    );
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
        {/* Hero Section */}
        <section style={{ 
          background: 'linear-gradient(135deg, #77d4d7ff 0%, #4547c9ff 50%, #3323c7ff 100%)', 
          padding: '100px 24px 80px', 
          textAlign: 'center', 
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '15%',
            left: '8%',
            width: '150px',
            height: '150px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite',
            filter: 'blur(1px)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '120px',
            height: '120px',
            background: 'rgba(78, 205, 196, 0.12)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite reverse',
            filter: 'blur(1px)'
          }}></div>

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '70px',
              height: '70px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '20px',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ fontSize: '2rem' }}>💬</span>
            </div>
            
            <h1 style={{ 
              fontSize: 'clamp(2rem, 4vw, 2.75rem)', 
              fontWeight: 800, 
              marginBottom: '12px',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
              Mes Messages
            </h1>
            
            <p style={{ 
              fontSize: '1.1rem',
              opacity: 0.95,
              lineHeight: 1.6,
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              Communiquez facilement avec vos hôtes et voyageurs
            </p>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              33% { transform: translateY(-15px) rotate(3deg); }
              66% { transform: translateY(-8px) rotate(-2deg); }
            }
          `}} />
        </section>

        {/* Messages Section */}
        <section style={{ padding: '0 24px 80px', transform: 'translateY(-40px)' }}>
          <div className="messages-container" style={{ 
            background: 'rgba(255,255,255,0.98)', 
            backdropFilter: 'blur(30px)',
            borderRadius: '28px', 
            boxShadow: '0 30px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.3)',
            maxWidth: '1400px',
            margin: '0 auto',
            overflow: 'hidden',
            height: '700px',
            display: 'flex',
            position: 'relative'
          }}>
            {/* Gradient accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #D79077, #4ECDC4, #FFD700)',
              borderRadius: '28px 28px 0 0',
              zIndex: 1
            }}></div>

            {/* ...existing code... (liste conversations + zone chat) */}
            {/* Liste des conversations */}
            <div className="conversations-list" style={{
              width: '380px',
              borderRight: '1px solid #E2E8F0',
              display: showMobileChat ? 'none' : 'flex',
              flexDirection: 'column',
              background: '#F8FAFC',
              paddingTop: '4px'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #E2E8F0'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#1F2937',
                  marginBottom: '8px'
                }}>
                  Conversations
                </h2>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#64748B' 
                }}>
                  {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
                </p>
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px'
              }}>
                {conversations.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#94A3B8'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>Aucune conversation</p>
                    <p style={{ fontSize: '0.9rem' }}>
                      Les conversations apparaîtront ici quand vous aurez des réservations
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.threadId}
                      onClick={() => {
                        setSelectedConversation(conv);
                        setShowMobileChat(true);
                      }}
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        background: selectedConversation?.threadId === conv.threadId 
                          ? 'linear-gradient(135deg, rgba(78,205,196,0.15), rgba(68,181,168,0.1))' 
                          : 'white',
                        border: selectedConversation?.threadId === conv.threadId 
                          ? '2px solid #4ECDC4' 
                          : '2px solid transparent',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedConversation?.threadId !== conv.threadId) {
                          e.currentTarget.style.background = '#F1F5F9';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedConversation?.threadId !== conv.threadId) {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '14px',
                          background: conv.otherUserPhotoUrl 
                            ? `url(${conv.otherUserPhotoUrl})` 
                            : 'linear-gradient(135deg, #4ECDC4, #44B5A8)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          flexShrink: 0
                        }}>
                          {!conv.otherUserPhotoUrl && (conv.otherUserName?.trim()?.[0]?.toUpperCase() || '👤')}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px'
                          }}>
                            <div style={{
                              fontWeight: 700,
                              color: '#1F2937',
                              fontSize: '0.95rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {conv.otherUserName}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#94A3B8'
                            }}>
                              {formatDate(conv.lastMessageDate)}
                            </div>
                          </div>
                          
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#64748B',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {conv.listingTitle}
                          </div>

                          {conv.lastMessage ? (
                            <div style={{
                              fontSize: '0.85rem',
                              color: '#94A3B8',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: conv.unreadCount > 0 ? 600 : 400
                            }}>
                              {messagePreview(conv.lastMessage)}
                            </div>
                          ) : (
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#4ECDC4',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span>💬</span>
                              <span>Commencer la conversation</span>
                            </div>
                          )}
                        </div>

                        {conv.unreadCount > 0 && (
                          <div style={{
                            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            minWidth: '24px',
                            textAlign: 'center'
                          }}>
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Zone de chat */}
            <div className="chat-area" style={{
              flex: 1,
              display: (!selectedConversation || !showMobileChat) ? 'none' : 'flex',
              flexDirection: 'column',
              background: 'white'
            }}>
              {selectedConversation ? (
                <>
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #E2E8F0',
                    background: 'linear-gradient(135deg, rgba(78,205,196,0.05), rgba(68,181,168,0.02))'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        className="back-button"
                        onClick={() => setShowMobileChat(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          padding: '8px',
                          display: 'none',
                          color: '#4ECDC4'
                        }}
                      >
                        ←
                      </button>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '16px',
                        background: selectedConversation.otherUserPhotoUrl 
                          ? `url(${selectedConversation.otherUserPhotoUrl})` 
                          : 'linear-gradient(135deg, #4ECDC4, #44B5A8)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem'
                      }}>
                        {!selectedConversation.otherUserPhotoUrl && (selectedConversation.otherUserName?.trim()?.[0]?.toUpperCase() || '👤')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          color: '#1F2937',
                          marginBottom: '4px'
                        }}>
                          {selectedConversation.otherUserName}
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#64748B'
                        }}>
                          {selectedConversation.listingTitle} · {selectedConversation.listingCity}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#94A3B8',
                          marginTop: '4px'
                        }}>
                          📅 Séjour : {formatReservationDate(selectedConversation.startDate)} - {formatReservationDate(selectedConversation.endDate, true)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    background: 'linear-gradient(to bottom, #F8FAFC, white)'
                  }}>
                    {messages.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#94A3B8'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
                        <p style={{ fontWeight: 600, marginBottom: '8px', color: '#64748B' }}>
                          Aucun message pour le moment
                        </p>
                        <p style={{ fontSize: '0.9rem' }}>
                          Envoyez votre premier message pour démarrer la conversation
                        </p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, index) => {
                          const isMine = msg.sender_id === user.id;
                          const showDate = index === 0 || 
                            new Date(messages[index - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <div style={{
                                  textAlign: 'center',
                                  margin: '24px 0 16px',
                                  fontSize: '0.85rem',
                                  color: '#94A3B8'
                                }}>
                                  {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                  })}
                                </div>
                              )}
                              <div style={{
                                display: 'flex',
                                justifyContent: isMine ? 'flex-end' : 'flex-start',
                                marginBottom: '12px'
                              }}>
                                <div style={{
                                  maxWidth: '70%',
                                  padding: '12px 18px',
                                  borderRadius: '18px',
                                  background: isMine 
                                    ? 'linear-gradient(135deg, #4ECDC4, #44B5A8)' 
                                    : '#F1F5F9',
                                  color: isMine ? 'white' : '#1F2937',
                                  boxShadow: isMine 
                                    ? '0 4px 12px rgba(78,205,196,0.25)' 
                                    : '0 2px 8px rgba(0,0,0,0.04)',
                                  position: 'relative'
                                }}>
                                  {isMine && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '8px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.9)',
                                        fontSize: '0.95rem',
                                        padding: 0,
                                        lineHeight: 1
                                      }}
                                      title="Supprimer"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                  <div style={{
                                    fontSize: '0.95rem',
                                    lineHeight: 1.5,
                                    wordWrap: 'break-word',
                                    whiteSpace: 'pre-wrap'
                                  }}>
                                    {(() => {
                                      const parsed = parseRichMessage(msg.message);
                                      if (!parsed) return msg.message;

                                      const text = typeof parsed.text === 'string' ? parsed.text : '';
                                      const attachment = parsed.attachment;

                                      return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          {text ? <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div> : null}
                                          {attachment?.url ? (
                                            <a
                                              href={attachment.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              style={{
                                                color: isMine ? 'white' : '#0F172A',
                                                textDecoration: 'underline',
                                                fontWeight: 700,
                                                wordBreak: 'break-word'
                                              }}
                                            >
                                              📎 {attachment.name || 'Fichier'}
                                            </a>
                                          ) : null}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    marginTop: '6px',
                                    opacity: 0.8,
                                    textAlign: 'right'
                                  }}>
                                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {otherTyping && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '12px 18px',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              padding: '12px 18px',
                              borderRadius: '18px',
                              background: '#F1F5F9',
                              display: 'flex',
                              gap: '4px',
                              alignItems: 'center'
                            }}>
                              <div className="typing-dot" style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#94A3B8',
                                animation: 'typingBounce 1.4s infinite ease-in-out'
                              }}></div>
                              <div className="typing-dot" style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#94A3B8',
                                animation: 'typingBounce 1.4s infinite ease-in-out 0.2s'
                              }}></div>
                              <div className="typing-dot" style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#94A3B8',
                                animation: 'typingBounce 1.4s infinite ease-in-out 0.4s'
                              }}></div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #E2E8F0',
                    background: 'white'
                  }}>
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleSelectFile}
                        disabled={sending}
                        style={{ display: 'none' }}
                      />
                      <textarea
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          emitTyping();
                        }}
                        placeholder="Écrivez votre message..."
                        disabled={sending}
                        rows={2}
                        style={{
                          flex: 1,
                          padding: '14px 20px',
                          border: '2px solid #E2E8F0',
                          borderRadius: '16px',
                          fontSize: '1rem',
                          outline: 'none',
                          transition: 'all 0.2s',
                          background: '#F8FAFC',
                          resize: 'none',
                          lineHeight: 1.4,
                          whiteSpace: 'pre-wrap'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#4ECDC4';
                          e.target.style.background = 'white';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#E2E8F0';
                          e.target.style.background = '#F8FAFC';

                          if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = null;
                          }
                          if (typingChannelRef.current && user?.id) {
                            typingChannelRef.current.send({
                              type: 'broadcast',
                              event: 'typing',
                              payload: { userId: user.id, isTyping: false },
                            });
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={(!newMessage.trim() && !selectedFile) || sending}
                        style={{
                          padding: '14px 28px',
                          background: (!newMessage.trim() && !selectedFile) || sending 
                            ? '#CBD5E1' 
                            : 'linear-gradient(135deg, #4ECDC4, #44B5A8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '16px',
                          fontSize: '1rem',
                          fontWeight: 700,
                          cursor: ((!newMessage.trim() && !selectedFile) || sending) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: (!newMessage.trim() && !selectedFile) || sending 
                            ? 'none' 
                            : '0 4px 12px rgba(78,205,196,0.3)'
                        }}
                        onMouseEnter={(e) => {
                          if ((newMessage.trim() || selectedFile) && !sending) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 20px rgba(78,205,196,0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = (newMessage.trim() || selectedFile) && !sending 
                            ? '0 4px 12px rgba(78,205,196,0.3)' 
                            : 'none';
                        }}
                      >
                        {sending ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            Envoi...
                          </>
                        ) : (
                          <>
                            Envoyer
                            <span style={{ fontSize: '1.2rem' }}>📨</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: '14px 16px',
                          background: '#F8FAFC',
                          color: '#334155',
                          border: '2px solid #E2E8F0',
                          borderRadius: '16px',
                          fontSize: '1rem',
                          fontWeight: 700,
                          cursor: sending ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '52px'
                        }}
                        title={selectedFile ? selectedFile.name : 'Joindre un fichier'}
                      >
                        📎
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  textAlign: 'center',
                  padding: '40px'
                }}>
                  <div>
                    <div style={{ fontSize: '4rem', marginBottom: '24px' }}>💬</div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#64748B',
                      marginBottom: '12px'
                    }}>
                      Sélectionnez une conversation
                    </h3>
                    <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                      Choisissez une conversation dans la liste<br />
                      pour commencer à échanger
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .messages-container {
            border-radius: 0 !important;
            height: calc(100vh - 140px) !important;
            max-width: 100% !important;
          }
          
          .conversations-list {
            width: 100% !important;
            border-right: none !important;
          }
          
          .chat-area {
            width: 100% !important;
            display: flex !important;
          }
          
          .back-button {
            display: block !important;
          }
        }

        @media (min-width: 769px) {
          .conversations-list {
            display: flex !important;
          }
          
          .chat-area {
            display: flex !important;
          }
        }
      `}} />
    </>
  );
}
