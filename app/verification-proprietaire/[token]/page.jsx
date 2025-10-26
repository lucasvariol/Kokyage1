"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import { OwnerConsentAgreement } from "@/owner-consent";

export default function VerificationProprietaire() {
  const { token } = useParams();
  const router = useRouter();

  // Etat page
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [listingInfo, setListingInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Etats formulaires
  const [activeTab, setActiveTab] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const origin = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    []
  );
  const maxBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);
  const minBirthDate = "1900-01-01";

  // Fonctions d'âge (repris de la page inscription)
  function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
  const isAdult = dateNaissance ? calculateAge(dateNaissance) >= 18 : true;

  useEffect(() => {
    verifyToken();
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function verifyToken() {
    try {
      const res = await fetch(`/api/verify-owner-token/${token}`);
      const data = await res.json();
      if (data.valid) {
        setTokenValid(true);
        setListingInfo(data.listing);
        if (data.email) setEmail(data.email);
        if (data.tenant) setTenant(data.tenant);
      } else {
        setTokenValid(false);
      }
    } catch (e) {
      console.error("Erreur vérification token:", e);
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  }

  async function handleGoogleAuth() {
    setError("");
    setAuthLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/verification-proprietaire/${token}` },
      });
      // Redirection par Supabase
    } catch (e) {
      setError(e.message || "Impossible de démarrer la connexion Google");
      setAuthLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setAuthLoading(false);
      return;
    }
    await refreshUser();
  }

  async function handleSignup(e) {
    e.preventDefault();
    setAuthLoading(true);
    setError("");
    if (!acceptCGU) {
      setError("Vous devez accepter les conditions d'utilisation");
      setAuthLoading(false);
      return;
    }
    if (!dateNaissance) {
      setError("La date de naissance est requise");
      setAuthLoading(false);
      return;
    }
    // Vérifier l'âge >= 18 ans
    const birth = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 18) {
      setError("Vous devez avoir au moins 18 ans pour créer un compte");
      setAuthLoading(false);
      return;
    }
    const fullName = `${prenom} ${nom}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: fullName, prenom, nom, dateNaissance, full_name: fullName },
        emailRedirectTo: `${origin}/verification-proprietaire/${token}`
      },
    });
    if (error) {
      setError(error.message);
      setAuthLoading(false);
      return;
    }
    // Email déjà utilisé
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("Cette adresse email est déjà utilisée. Veuillez vous connecter ou réinitialiser votre mot de passe.");
      setAuthLoading(false);
      return;
    }
    if (data?.user) {
      // Insérer un profil minimal si non existant (best-effort)
      const { error: profileInsertError } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, name: fullName });
      if (profileInsertError) {
        console.warn("Insertion profil ignorée:", profileInsertError.message);
      }
    }
    // Si l'email n'est pas confirmé, prévenir l'utilisateur
    if (data?.user && !data.user.email_confirmed_at && !data.session) {
      setSuccess("Compte créé ! Veuillez confirmer votre adresse email, puis revenez via le lien pour lier le logement.");
      setAuthLoading(false);
      return;
    }
    await refreshUser();
    setAuthLoading(false);
  }

  async function assignOwner() {
    if (!user) return;
    if (!consentChecked) {
      setError("Vous devez accepter l'accord de consentement du propriétaire");
      return;
    }
    
    // Vérifier que le propriétaire n'est pas le même que le locataire
    if (tenant && tenant.id === user.id) {
      setError("Vous ne pouvez pas être à la fois locataire et propriétaire du même logement. Veuillez utiliser un compte différent pour le propriétaire.");
      return;
    }
    
    try {
      const resp = await fetch("/api/assign-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId: user.id }),
      });
      const json = await resp.json();
      if (!json.success) {
        setError(json.error || "Impossible de lier le compte");
        return;
      }
      
      // Attendre un peu pour laisser la DB se synchroniser
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Envoyer l'email de confirmation au propriétaire du logement (owner_id)
      const listingId = listingInfo?.id;
      if (listingId) {
        try {
          console.log("📧 Envoi email de confirmation pour listing:", listingId);
          const emailResp = await fetch("/api/emails/owner-verification-confirmed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId }),
          });
          const emailJson = await emailResp.json();
          console.log("✅ Réponse email API:", emailJson);
          
          if (!emailJson.success) {
            console.error("⚠️ Email non envoyé:", emailJson.error);
          }
        } catch (emailError) {
          console.error("❌ Erreur envoi email:", emailError);
          // On ne bloque pas le processus si l'email échoue
        }
      } else {
        console.warn("⚠️ Pas d'id dans listingInfo:", listingInfo);
      }
      
      setSuccess("Compte lié au logement avec succès ! Redirection...");
      setTimeout(() => router.push("/profil-hote"), 1500);
    } catch (e) {
      setError(e.message || "Erreur réseau lors de l'assignation");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setSuccess("");
    setError("");
  }

  // UI états simples
  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" />
          <p style={{ marginTop: 12, color: "#64748B" }}>Vérification en cours...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!tokenValid) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1F2937", marginBottom: 8 }}>Lien invalide</h1>
            <p style={{ color: "#64748B", marginBottom: 16 }}>Ce lien de vérification est invalide ou a expiré.</p>
            <button onClick={() => router.push("/")} style={{ background: "#C96745", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700 }}>Retour à l'accueil</button>
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
          <div style={{ position: 'absolute', top: '18%', left: '10%', width: 150, height: 150, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', animation: 'float 6s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '55%', right: '12%', width: 120, height: 120, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite reverse' }} />
          <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.1rem)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em', textShadow: '0 4px 20px rgba(0, 0, 0, 0.23)' }}>
              Confirmez la propriété de votre logement
            </h1>
            <p style={{ fontSize: '1.05rem', opacity: 0.92, lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
              Connectez-vous ou créez un compte pour lier ce logement à votre profil hôte.
            </p>
          </div>
        </section>

        {/* Carte d'auth moderne */}
        <section style={{ padding: '0 24px 80px', transform: 'translateY(-50px)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '44px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            width: '100%',
            maxWidth: 1000,
            margin: '0 auto'
          }}>
            {/* Listing info */}
            {listingInfo && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 12, marginBottom: 18 }}>
                <div style={{ fontWeight: 700, color: '#1F2937' }}>{listingInfo.title}</div>
                <div style={{ color: '#64748B', fontSize: 14 }}>{listingInfo.address}, {listingInfo.city}</div>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#B91C1C', marginBottom: 16 }}>⚠️ {error}</div>
            )}
            {success && (
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#065F46', marginBottom: 16 }}>✅ {success}</div>
            )}

            {/* Si connecté */}
            {user ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1F2937' }}>Connecté en tant que</div>
                    <div style={{ color: '#64748B', fontSize: 14 }}>{user.email}</div>
                  </div>
                  <button onClick={handleLogout} style={{ border: '1px solid #E2E8F0', background: '#fff', color: '#1F2937', borderRadius: 10, padding: '8px 12px', fontWeight: 600 }}>Se déconnecter</button>
                </div>
                
                {/* Avertissement si le compte connecté est le locataire */}
                {tenant && tenant.id === user.id && (
                  <div style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: 'rgba(239,68,68,0.08)', 
                    border: '2px solid rgba(239,68,68,0.3)', 
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#B91C1C', marginBottom: '6px' }}>
                          Compte non autorisé
                        </div>
                        <div style={{ color: '#7F1D1D', fontSize: '0.95rem', lineHeight: 1.5 }}>
                          Vous êtes connecté avec le compte qui a créé cette annonce (locataire). 
                          Le propriétaire du logement doit utiliser un <strong>compte différent</strong> pour confirmer la propriété.
                          <br /><br />
                          Veuillez vous déconnecter et demander au propriétaire de se connecter ou créer son propre compte.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Consentement propriétaire (visible seulement connecté) */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, marginBottom: 14, background: '#F8FAFC' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} />
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>J'ai lu et j'accepte l'accord de consentement du propriétaire</span>
                  </label>
                  <button type="button" onClick={() => setConsentOpen(v => !v)} style={{ marginTop: 10, background: 'transparent', border: 'none', color: '#C96745', fontWeight: 700, padding: 0 }}>
                    {consentOpen ? 'Masquer le détail' : 'Afficher le détail'}
                  </button>
                  {consentOpen && (
                    <div style={{ marginTop: 10, maxHeight: '70vh', minHeight: '40vh', overflowY: 'auto', padding: 20, background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, lineHeight: 1.6, fontSize: 14 }}>
                      <OwnerConsentAgreement
                        ownerName={(user?.user_metadata?.full_name || user?.user_metadata?.name || `${user?.user_metadata?.prenom || ''} ${user?.user_metadata?.nom || ''}`.trim() || user?.email || 'Le Propriétaire')}
                        tenantName={(tenant?.name || 'Nom du locataire principal')}
                        fullAddress={`${listingInfo?.address || ''}${listingInfo?.city ? ', ' + listingInfo.city : ''}`.trim()}
                      />
                    </div>
                  )}
                </div>

                <button 
                  onClick={assignOwner} 
                  disabled={!consentChecked || (tenant && tenant.id === user.id)} 
                  style={{ 
                    width: '100%', 
                    padding: '14px 18px', 
                    borderRadius: 12, 
                    border: 'none', 
                    background: (consentChecked && !(tenant && tenant.id === user.id)) ? 'linear-gradient(135deg, #D79077 0%, #C96745 100%)' : '#94A3B8', 
                    color: 'white', 
                    fontWeight: 800, 
                    boxShadow: (consentChecked && !(tenant && tenant.id === user.id)) ? '0 10px 20px rgba(201,103,69,0.3)' : 'none', 
                    cursor: (consentChecked && !(tenant && tenant.id === user.id)) ? 'pointer' : 'not-allowed' 
                  }}
                >
                  {tenant && tenant.id === user.id ? 'Compte non autorisé' : 'Valider et lier le logement'}
                </button>
              </div>
            ) : (
              <div>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, background: '#F1F5F9', padding: 6, borderRadius: 999, marginBottom: 20 }}>
                  <button onClick={() => setActiveTab('login')} style={{ flex: 1, padding: '10px 14px', borderRadius: 999, fontWeight: 800, border: 'none', background: activeTab === 'login' ? '#0F172A' : 'transparent', color: activeTab === 'login' ? 'white' : '#0F172A' }}>Se connecter</button>
                  <button onClick={() => setActiveTab('signup')} style={{ flex: 1, padding: '10px 14px', borderRadius: 999, fontWeight: 800, border: 'none', background: activeTab === 'signup' ? '#0F172A' : 'transparent', color: activeTab === 'signup' ? 'white' : '#0F172A' }}>Créer un compte</button>
                </div>

                {/* Google */}
                <button onClick={handleGoogleAuth} disabled={authLoading} style={{ width: '100%', background: 'white', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 700 }}>
                  <img alt="Google" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} />
                  {activeTab === 'login' ? 'Se connecter avec Google' : "S'inscrire avec Google"}
                </button>

                {/* Separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
                  <div style={{ height: 1, background: '#E2E8F0', flex: 1 }} />
                  <span style={{ color: '#64748B', fontWeight: 600 }}>ou</span>
                  <div style={{ height: 1, background: '#E2E8F0', flex: 1 }} />
                </div>

                {activeTab === 'login' ? (
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <input type="email" placeholder="john.doe@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #E2E8F0', background: '#F7FAFC' }} />
                    <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #E2E8F0', background: '#F7FAFC' }} />
                    <button type="submit" disabled={authLoading} style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: 'none', background: authLoading ? '#94A3B8' : 'linear-gradient(135deg, #D79077 0%, #C96745 100%)', color: 'white', fontWeight: 800 }}>{authLoading ? 'Connexion...' : 'Continuer'}</button>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input type="text" placeholder="Votre prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '2px solid #E2E8F0', background: '#F7FAFC' }} />
                      <input type="text" placeholder="Votre nom" value={nom} onChange={(e) => setNom(e.target.value)} required style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '2px solid #E2E8F0', background: '#F7FAFC' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>Date de naissance</label>
                      <input
                        type="date"
                        placeholder="jj/mm/aaaa"
                        value={dateNaissance}
                        onChange={(e) => setDateNaissance(e.target.value)}
                        required
                        min={minBirthDate}
                        max={maxBirthDate}
                        aria-label="Date de naissance"
                        style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #E2E8F0', background: '#F7FAFC' }}
                      />
                      {dateNaissance ? (
                        <span style={{ fontSize: 12, color: isAdult ? '#16A34A' : '#B91C1C' }}>
                          {isAdult ? `✓ Âge: ${calculateAge(dateNaissance)} ans (éligible)` : `⚠️ Âge: ${calculateAge(dateNaissance)} ans (minimum 18 ans requis)`}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#64748B' }}>Vous devez avoir au moins 18 ans</span>
                      )}
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: 14 }}>
                      <input type="checkbox" checked={acceptCGU} onChange={(e) => setAcceptCGU(e.target.checked)} />
                      <span>J'ai lu et j'accepte les <a href="/cgu" style={{ color: '#C96745', fontWeight: 600 }}>Conditions générales d'utilisation</a> et la <a href="/privacy" style={{ color: '#C96745', fontWeight: 600 }}>Politique de confidentialité</a></span>
                    </label>
                    <button type="submit" disabled={authLoading || !acceptCGU || !isAdult} style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: 'none', background: (authLoading || !acceptCGU || !isAdult) ? '#94A3B8' : 'linear-gradient(135deg, #D79077 0%, #C96745 100%)', color: 'white', fontWeight: 800 }}>
                      {authLoading ? "Création..." : !isAdult ? "Minimum 18 ans requis" : !acceptCGU ? "Accepter les CGU" : "S'enregistrer"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}