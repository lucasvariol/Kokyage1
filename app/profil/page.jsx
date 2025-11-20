"use client";

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ProfilPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef(null);

  // Formulaire
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    phone: '',
    dateNaissance: '',
    photoUrl: ''
  });

  useEffect(() => {
    fetchProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user);
      } else {
        setUser(null);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await loadUserData(session.user);
    } else {
      router.push('/inscription');
    }
    setLoading(false);
  }

  async function loadUserData(authUser) {
    console.log('📥 Chargement profil pour user:', authUser.id);
    
    // Charger depuis la table profiles
    const { data: userData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('❌ Erreur chargement profil:', error);
    } else {
      console.log('✅ Profil chargé:', userData);
    }

    setFormData({
      prenom: userData?.prenom || authUser.user_metadata?.prenom || authUser.user_metadata?.first_name || '',
      nom: userData?.nom || authUser.user_metadata?.nom || authUser.user_metadata?.last_name || '',
      email: authUser.email || '',
      phone: userData?.phone || authUser.user_metadata?.phone || '',
      dateNaissance: userData?.date_naissance || authUser.user_metadata?.date_naissance || '',
      photoUrl: userData?.photo_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || ''
    });
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type et la taille
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5 MB');
      return;
    }

    setUploadingPhoto(true);
    console.log('📸 Début upload photo:', file.name, file.size, 'bytes');
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('📤 Upload vers:', filePath);
      
      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('❌ Erreur upload:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ Upload réussi');

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Mettre à jour le formulaire
      setFormData(prev => ({ ...prev, photoUrl: publicUrl }));

      console.log('💾 Sauvegarde URL photo dans DB:', publicUrl);
      
      // Sauvegarder immédiatement dans la DB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('❌ Erreur sauvegarde photo URL:', updateError);
      } else {
        console.log('✅ Photo URL sauvegardée');
      }

    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    console.log('💾 Sauvegarde profil pour user:', user.id);
    console.log('📝 Données à sauvegarder:', formData);
    
    try {
      // Mettre à jour la table profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          prenom: formData.prenom,
          nom: formData.nom,
          phone: formData.phone,
          date_naissance: formData.dateNaissance,
          photo_url: formData.photoUrl,
          full_name: `${formData.prenom} ${formData.nom}`.trim(),
          email: formData.email
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Erreur sauvegarde profil:', error);
        throw error;
      }
      
      console.log('✅ Profil sauvegardé avec succès');

      console.log('🔄 Mise à jour métadonnées auth...');
      
      // Mettre à jour les métadonnées auth si possible
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          prenom: formData.prenom,
          nom: formData.nom,
          phone: formData.phone,
          date_naissance: formData.dateNaissance,
          avatar_url: formData.photoUrl
        }
      });
      
      if (authError) {
        console.warn('⚠️ Erreur mise à jour auth metadata:', authError);
      } else {
        console.log('✅ Métadonnées auth mises à jour');
      }

      setEditing(false);
      console.log('🎉 Sauvegarde terminée avec succès');
      alert('Profil mis à jour avec succès !');
      await fetchProfile();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Header />
      <main style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: '#F8F9FA',
        minHeight: '100vh',
        paddingTop: '40px',
        paddingBottom: '60px'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          {/* En-tête avec photo */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: formData.photoUrl ? 'transparent' : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 700,
                color: 'white',
                border: '4px solid #F1F5F9'
              }}>
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Photo de profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (formData.prenom?.[0] || formData.email?.[0] || '?').toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#0F172A',
                  color: 'white',
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                {uploadingPhoto ? '⏳' : '📷'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '8px'
              }}>
                {formData.prenom || formData.nom ? `${formData.prenom} ${formData.nom}`.trim() : 'Mon Profil'}
              </h1>
              <p style={{ color: '#64748B', fontSize: '1rem' }}>{formData.email}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      background: '#0F172A',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.95rem'
                    }}
                  >
                    ✏️ Modifier le profil
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      {saving ? '💾 Enregistrement...' : '✓ Sauvegarder'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        loadUserData(user);
                      }}
                      disabled={saving}
                      style={{
                        background: '#E2E8F0',
                        color: '#475569',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      ✕ Annuler
                    </button>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#EF4444',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  🚪 Déconnexion
                </button>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0F172A',
              marginBottom: '24px'
            }}>
              Informations personnelles
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {/* Prénom */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '8px'
                }}>
                  Prénom
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #E2E8F0',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <p style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 600 }}>
                    {formData.prenom || '—'}
                  </p>
                )}
              </div>

              {/* Nom */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '8px'
                }}>
                  Nom
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #E2E8F0',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <p style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 600 }}>
                    {formData.nom || '—'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '8px'
                }}>
                  Email
                </label>
                <p style={{ fontSize: '1rem', color: '#64748B', fontWeight: 600 }}>
                  {formData.email}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Non modifiable
                </span>
              </div>

              {/* Téléphone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '8px'
                }}>
                  Téléphone
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+33 6 12 34 56 78"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #E2E8F0',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <p style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 600 }}>
                    {formData.phone || '—'}
                  </p>
                )}
              </div>

              {/* Date de naissance */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '8px'
                }}>
                  Date de naissance
                </label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.dateNaissance}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateNaissance: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #E2E8F0',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <p style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 600 }}>
                    {formData.dateNaissance ? new Date(formData.dateNaissance).toLocaleDateString('fr-FR') : '—'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
