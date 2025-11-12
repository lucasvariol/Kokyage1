'use client';

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Page(){
  // État de l'onglet actif
  const [activeTab, setActiveTab] = useState('inscription');
  
  // États pour l'inscription
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [acceptCGU, setAcceptCGU] = useState(false);
  
  // États communs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // États pour les focus des champs
  const [nomFocused, setNomFocused] = useState(false);
  const [prenomFocused, setPrenomFocused] = useState(false);
  const [dateNaissanceFocused, setDateNaissanceFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Fonction pour calculer l'âge
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Vérifier si l'utilisateur a au moins 18 ans
  const isAdult = dateNaissance ? calculateAge(dateNaissance) >= 18 : true;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Vérifier que les CGU sont acceptées
    if (!acceptCGU) {
      setError('Vous devez accepter les conditions générales d\'utilisation pour continuer');
      setLoading(false);
      return;
    }

    // Vérifier que l'utilisateur a au moins 18 ans
    if (!isAdult) {
      setError('Vous devez avoir au moins 18 ans pour vous inscrire sur Kokyage');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Tentative de création de compte pour:', email);
      
      // Création du compte via Supabase Auth SANS confirmation automatique
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            nom, 
            prenom, 
            dateNaissance,
            full_name: `${prenom} ${nom}`.trim()
          },
          emailRedirectTo: `${window.location.origin}/connexion`,
          // Désactiver l'email de confirmation automatique de Supabase
          shouldCreateUser: true
        }
      });
      
      console.log('Résultat signUp:', { data, signUpError });

      if (signUpError) {
        console.error('Erreur SignUp:', signUpError);
        setError(signUpError.message || 'Erreur lors de la création du compte');
        setLoading(false);
        return;
      }

      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        console.warn('Email déjà enregistré, aucune identité retournée.');
        setError('Cette adresse email est déjà utilisée. Veuillez vous connecter ou réinitialiser votre mot de passe.');
        setLoading(false);
        return;
      }
      
      // Vérifier si l'utilisateur a été créé
      const user = data?.user;
      console.log('Utilisateur créé:', user);
      
      if (user) {
        console.log('Insertion dans la table profiles avec ID:', user.id);
        
        // Optionnel: Tentative d'insertion mais sans faire échouer l'inscription si ça ne marche pas
        try {
          const fullName = `${prenom} ${nom}`.trim();
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({ 
              id: user.id, 
              name: fullName
            });
            
          if (profileError) {
            console.warn('Profil ne peut pas être créé maintenant, sera créé à la connexion:', profileError.message);
          } else {
            console.log('Profil créé avec succès:', profileData);
          }
        } catch (profileErr) {
          console.warn('Erreur profil (non bloquante):', profileErr);
        }

        // Envoyer notre email de vérification personnalisé via Resend
        try {
          console.log('Envoi de l\'email de vérification personnalisé...');
          const emailResponse = await fetch('/api/emails/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              userId: user.id,
              nom: nom,
              prenom: prenom
            })
          });

          const emailResult = await emailResponse.json();
          
          if (!emailResponse.ok) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailResult);
            // Ne pas bloquer l'inscription même si l'email échoue
          } else {
            console.log('Email de vérification envoyé avec succès');
          }
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email:', emailError);
          // Ne pas bloquer l'inscription
        }
      } else {
        console.warn('Aucun utilisateur retourné par signUp');
        setError('Erreur: Aucun utilisateur créé');
        setLoading(false);
        return;
      }
      
      // Message de succès
      setSuccess('Compte créé ! Veuillez vérifier votre email pour confirmer votre inscription.');
      
      // Basculer vers l'onglet connexion après 3 secondes
      setTimeout(() => {
        setActiveTab('connexion');
        setSuccess('');
        setError('');
      }, 3000);
    } catch (err) {
      console.error('Erreur inattendue:', err);
      setError('Une erreur inattendue s\'est produite: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fonction pour la connexion
  async function onLoginSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError('Erreur de connexion');
      setLoading(false);
      return;
    }

    const user = data.user;
    
    // Vérifier si l'email est confirmé
    if (user && !user.email_confirmed_at) {
      setError('Veuillez confirmer votre adresse email avant de vous connecter. Consultez votre boîte mail.');
      setLoading(false);
      
      // Déconnecter l'utilisateur
      await supabase.auth.signOut();
      return;
    }

    if (user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        const fullName = user.user_metadata?.full_name ||
          `${user.user_metadata?.prenom || ''} ${user.user_metadata?.nom || ''}`.trim() ||
          user.email.split('@')[0];

        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          name: fullName
        });
        if (insertError) {
          console.warn('Impossible de créer le profil immédiatement:', insertError.message);
        }
      }
    }

    setSuccess('Connexion réussie ! Redirection en cours...');
    setLoading(false);
    setTimeout(() => router.push('/profil'), 1200);
  }

  return (<>
    <Header />
    <main style={{ 
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif', 
      background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)', 
      minHeight: '100vh', 
      paddingBottom: 0 
    }}>
      {/* Hero Section avec Design Moderne */}
      <section className="auth-hero-section" style={{ 
        background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)', 
        padding: '60px 24px 80px', 
        textAlign: 'center', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Éléments d'animation en arrière-plan */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
        
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Onglets Connexion / Inscription */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '36px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            padding: '8px',
            borderRadius: '16px',
            maxWidth: '400px',
            margin: '0 auto 36px'
          }}>
            <button
              onClick={() => {
                setActiveTab('connexion');
                setError('');
                setSuccess('');
              }}
              style={{
                flex: 1,
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'connexion' 
                  ? 'rgba(255,255,255,0.95)' 
                  : 'transparent',
                color: activeTab === 'connexion' ? '#C96745' : 'white',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === 'connexion' 
                  ? '0 4px 12px rgba(0,0,0,0.1)' 
                  : 'none'
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setActiveTab('inscription');
                setError('');
                setSuccess('');
              }}
              style={{
                flex: 1,
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'inscription' 
                  ? 'rgba(255,255,255,0.95)' 
                  : 'transparent',
                color: activeTab === 'inscription' ? '#C96745' : 'white',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === 'inscription' 
                  ? '0 4px 12px rgba(0,0,0,0.1)' 
                  : 'none'
              }}
            >
              Inscription
            </button>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(2rem, 4vw, 3.5rem)', 
            fontWeight: 800, 
            marginBottom: '16px', 
            letterSpacing: '-0.02em',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.23)'
          }}>
            {activeTab === 'connexion' ? 'Bon retour' : 'Bienvenue'}
          </h1>
        </div>
      </section>

      {/* Formulaire d'inscription moderne */}
      <section style={{ padding: '0 24px 80px', transform: 'translateY(-40px)' }}>
        <div className="auth-card-modern" style={{ 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(20px)',
          borderRadius: '24px', 
          padding: '48px', 
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 700, 
              color: '#2D3748'
            }}>
              {activeTab === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
            </h2>
          </div>

          {/* Formulaire de connexion */}
          {activeTab === 'connexion' && (
            <form onSubmit={onLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#2D3748',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: emailFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                    fontSize: '16px',
                    background: '#F7FAFC',
                    color: '#2D3748',
                    boxShadow: emailFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  placeholder="vous@exemple.com"
                />
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#2D3748',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: passwordFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                    fontSize: '16px',
                    background: '#F7FAFC',
                    color: '#2D3748',
                    boxShadow: passwordFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  placeholder="Votre mot de passe"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: (loading || !email || !password)
                    ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                    : 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: (loading || !email || !password)
                    ? 'none'
                    : '0 4px 20px rgba(201,103,69,0.3)',
                  opacity: (loading || !email || !password) ? 0.7 : 1
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <span className="spinner" style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Connexion en cours...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>

              {error && (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#DC2626',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#16A34A',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  ✅ {success}
                </div>
              )}
            </form>
          )}

          {/* Formulaire d'inscription */}
          {activeTab === 'inscription' && (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Champ Nom */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#2D3748', 
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Nom
              </label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                onFocus={() => setNomFocused(true)}
                onBlur={() => setNomFocused(false)}
                required
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: nomFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                  fontSize: '16px',
                  background: '#F7FAFC',
                  color: '#2D3748',
                  boxShadow: nomFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontWeight: '500'
                }}
                placeholder="Votre nom de famille"
              />
            </div>

            {/* Champ Prénom */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#2D3748', 
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Prénom
              </label>
              <input
                type="text"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                onFocus={() => setPrenomFocused(true)}
                onBlur={() => setPrenomFocused(false)}
                required
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: prenomFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                  fontSize: '16px',
                  background: '#F7FAFC',
                  color: '#2D3748',
                  boxShadow: prenomFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontWeight: '500'
                }}
                placeholder="Votre prénom"
              />
            </div>

            {/* Champ Date de naissance */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#2D3748', 
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Date de naissance
              </label>
              <input
                type="date"
                value={dateNaissance}
                onChange={e => setDateNaissance(e.target.value)}
                onFocus={() => setDateNaissanceFocused(true)}
                onBlur={() => setDateNaissanceFocused(false)}
                required
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: dateNaissanceFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                  fontSize: '16px',
                  background: '#F7FAFC',
                  color: '#2D3748',
                  boxShadow: dateNaissanceFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontWeight: '500'
                }}
              />
              {dateNaissance && (
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: isAdult ? '#16A34A' : '#DC2626', 
                  marginTop: '4px',
                  lineHeight: 1.4,
                  fontWeight: '500'
                }}>
                  {isAdult 
                    ? `✓ Âge: ${calculateAge(dateNaissance)} ans (éligible)` 
                    : `⚠️ Âge: ${calculateAge(dateNaissance)} ans (minimum 18 ans requis)`
                  }
                </p>
              )}
              {!dateNaissance && (
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#718096', 
                  marginTop: '4px',
                  lineHeight: 1.4
                }}>
                  Vous devez avoir au moins 18 ans pour vous inscrire
                </p>
              )}
            </div>

            {/* Champ Email */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#2D3748', 
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: emailFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                  fontSize: '16px',
                  background: '#F7FAFC',
                  color: '#2D3748',
                  boxShadow: emailFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontWeight: '500'
                }}
                placeholder="votre@email.com"
              />
            </div>

            {/* Champ Mot de passe */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#2D3748', 
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: passwordFocused ? '2px solid #60A29D' : '2px solid #E2E8F0',
                  fontSize: '16px',
                  background: '#F7FAFC',
                  color: '#2D3748',
                  boxShadow: passwordFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontWeight: '500'
                }}
                placeholder="Votre mot de passe sécurisé"
              />
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#718096', 
                marginTop: '4px',
                lineHeight: 1.4
              }}>
                Minimum 6 caractères
              </p>
            </div>

            {/* Case à cocher CGU */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px',
              padding: '20px',
              borderRadius: '12px',
              background: '#F7FAFC',
              border: '1px solid #E2E8F0'
            }}>
              <input
                type="checkbox"
                id="acceptCGU"
                checked={acceptCGU}
                onChange={e => setAcceptCGU(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  accentColor: '#C96745',
                  cursor: 'pointer'
                }}
              />
              <label 
                htmlFor="acceptCGU" 
                style={{ 
                  fontSize: '14px', 
                  color: '#4A5568', 
                  lineHeight: 1.5,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                J'accepte les{' '}
                <a 
                  href="/cgu" 
                  target="_blank"
                  style={{ 
                    color: '#C96745', 
                    textDecoration: 'underline',
                    fontWeight: '600'
                  }}
                  onMouseEnter={e => e.target.style.color = '#D79077'}
                  onMouseLeave={e => e.target.style.color = '#C96745'}
                >
                  conditions générales d'utilisation
                </a>
                {' '}et confirme avoir lu la{' '}
                <a 
                  href="/privacy" 
                  target="_blank"
                  style={{ 
                    color: '#C96745', 
                    textDecoration: 'underline',
                    fontWeight: '600'
                  }}
                  onMouseEnter={e => e.target.style.color = '#D79077'}
                  onMouseLeave={e => e.target.style.color = '#C96745'}
                >
                  politique de confidentialité
                </a>
              </label>
            </div>

            {/* Bouton de soumission */}
            <button 
              type="submit" 
              disabled={loading || !acceptCGU || !isAdult}
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: '12px',
                border: 'none',
                background: (loading || !acceptCGU || !isAdult)
                  ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                  : 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700',
                cursor: (loading || !acceptCGU || !isAdult) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: (loading || !acceptCGU || !isAdult)
                  ? 'none'
                  : '0 4px 20px rgba(201,103,69,0.3)',
                transform: (loading || !acceptCGU || !isAdult) ? 'none' : 'translateY(0)',
                opacity: (loading || !acceptCGU || !isAdult) ? 0.7 : 1
              }}
              onMouseEnter={e => {
                if (!loading && acceptCGU && isAdult) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 30px rgba(201,103,69,0.4)';
                }
              }}
              onMouseLeave={e => {
                if (!loading && acceptCGU && isAdult) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 20px rgba(201,103,69,0.3)';
                }
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span className="spinner" style={{ 
                    display: 'inline-block', 
                    width: '20px', 
                    height: '20px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTop: '2px solid white', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></span>
                  Création en cours...
                </div>
              ) : !isAdult ? (
                "Minimum 18 ans requis"
              ) : !acceptCGU ? (
                "Accepter les CGU pour continuer"
              ) : (
                "Créer mon compte"
              )}
            </button>

            {/* Messages d'erreur et de succès */}
            {error && (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#DC2626',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#16A34A',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                ✅ {success}
              </div>
            )}

          </form>
          )}
        </div>
      </section>
    </main>
    <Footer />
  </>);
}
