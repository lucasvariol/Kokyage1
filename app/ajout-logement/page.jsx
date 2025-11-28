'use client';

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import ListingAssistantChatbot from '../_components/ListingAssistantChatbot';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getFeeMultiplier, getPlatformPercent } from '@/lib/commissions';
import { OwnerConsentAgreement } from '@/owner-consent';
import { generateOwnerConsentText } from '@/lib/generateOwnerConsentText';

const MapPreview = dynamic(() => import('../_components/MapPreview'), { ssr: false });

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [number, setNumber] = useState('');
  const [street, setStreet] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [beds, setBeds] = useState(1);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [addressTimeout, setAddressTimeout] = useState(null);
  const [nbVoyageurs, setNbVoyageurs] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [description, setDescription] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [infoAccuracyChecked, setInfoAccuracyChecked] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/inscription');
      }
    };
    checkAuth();
  }, [router]);

  // Functions stay the same
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setStreet(value);

    if (!value.trim()) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    clearTimeout(addressTimeout);
    setIsLoadingSuggestions(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`
        );
        const data = await response.json();
        setAddressSuggestions(data.features || []);
      } catch (error) {
        console.error('Erreur lors de la recherche d\'adresse:', error);
        setAddressSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
    setAddressTimeout(timeout);
  };

  const selectAddress = (suggestion) => {
    const properties = suggestion.properties;
    setStreet(properties.label);
    setCity(properties.city || '');
    setNumber(properties.housenumber || '');
    setLatitude(suggestion.geometry.coordinates[1]);
    setLongitude(suggestion.geometry.coordinates[0]);
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setAddressConfirmed(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Ajouter les nouvelles images aux anciennes au lieu de les remplacer
    setImages(prevImages => [...prevImages, ...files]);

    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prevPreviews => [...prevPreviews, ...previews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviewImages(newPreviews);
  };

  const moveImageUp = (index) => {
    if (index === 0) return; // Déjà en première position
    
    const newImages = [...images];
    const newPreviews = [...previewImages];
    
    // Échanger avec l'image précédente
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    [newPreviews[index - 1], newPreviews[index]] = [newPreviews[index], newPreviews[index - 1]];
    
    setImages(newImages);
    setPreviewImages(newPreviews);
  };

  const moveImageDown = (index) => {
    if (index === images.length - 1) return; // Déjà en dernière position
    
    const newImages = [...images];
    const newPreviews = [...previewImages];
    
    // Échanger avec l'image suivante
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    [newPreviews[index], newPreviews[index + 1]] = [newPreviews[index + 1], newPreviews[index]];
    
    setImages(newImages);
    setPreviewImages(newPreviews);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/html'));
    
    if (dragIndex === dropIndex) return;

    const newImages = [...images];
    const newPreviews = [...previewImages];
    
    // Retirer l'élément de sa position initiale
    const [draggedImage] = newImages.splice(dragIndex, 1);
    const [draggedPreview] = newPreviews.splice(dragIndex, 1);
    
    // Insérer à la nouvelle position
    newImages.splice(dropIndex, 0, draggedImage);
    newPreviews.splice(dropIndex, 0, draggedPreview);
    
    setImages(newImages);
    setPreviewImages(newPreviews);
  };

  const uploadImages = async (files, listingId) => {
    // Upload each image to the 'photos' bucket in a listings/{listingId}/ folder and return public URLs
    const uploadPromises = files.map(async (file) => {
      const safeName = file.name.replace(/[^A-Za-z0-9_.-]/g, '_');
      const path = `listings/${listingId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from('photos')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

      if (error) {
        console.error('Erreur upload:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(path);

      return publicUrlData?.publicUrl || null;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls.filter((url) => url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!title || !street || !city || !price || !description || !ownerEmail) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }

    // Validation email facultative si fourni
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      setError('Veuillez saisir une adresse email valide');
      setLoading(false);
      return;
    }

    if (!addressConfirmed) {
      setError('Veuillez sélectionner une adresse dans les suggestions');
      setLoading(false);
      return;
    }

    // Vérifie que l'utilisateur est connecté (requis pour owner_id)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user || null;
    if (userError || !user) {
      setError("Vous devez être connecté pour publier une annonce");
      setLoading(false);
      return;
    }

    // Règle 1: l'email du propriétaire ne doit pas être le même que celui du compte
    const ownerEmailNorm = ownerEmail.trim().toLowerCase();
    const userEmailNorm = (user.email || '').trim().toLowerCase();
    if (ownerEmailNorm && userEmailNorm && ownerEmailNorm === userEmailNorm) {
      setError("L'email du propriétaire ne peut pas être le même que l'email de votre compte");
      setLoading(false);
      return;
    }

    // Règle 2: au moins 5 photos doivent être ajoutées
    if (!images || images.length < 5) {
      setError('Veuillez ajouter au moins 5 photos du logement');
      setLoading(false);
      return;
    }

    // Génère un id pour la future annonce afin d'organiser les photos par listing
    const listingId = crypto.randomUUID();

    // Upload des images d'abord avec l'id connu
    let imageUrls = [];
    if (images.length > 0) {
      imageUrls = await uploadImages(images, listingId);
      if (imageUrls.length === 0) {
        setError("Erreur lors de l'upload des images");
        setLoading(false);
        return;
      }
      // Vérifie que le minimum de 5 photos a bien été uploadé (par sécurité si certains uploads échouent)
      if (imageUrls.length < 5) {
        setError("Certaines images n'ont pas pu être envoyées. Merci d'ajouter au moins 5 photos et de réessayer.");
        setLoading(false);
        return;
      }
    }

    // Insertion dans la table 'listings'
    const { error: insertError } = await supabase
      .from('listings')
      .insert([
        {
          id: listingId,
          owner_id: user.id,
          id_proprietaire: user.id,
          title,
          city,
          address: street,
          description,
          price_per_night: price ? parseFloat(price) : null,
          images: imageUrls,
          email_proprietaire: ownerEmail,
          latitude,
          longitude,
          nb_voyageurs: nbVoyageurs,
          bedrooms,
          bathrooms,
          beds,
        },
      ]);
    if (insertError) {
      setError(insertError.message || "Erreur lors de la création de l'annonce");
    } else {
      // Met à jour le statut immédiatement après l'insertion
      await supabase
        .from('listings')
        .update({ status: 'en attente validation propriétaire' })
        .eq('id', listingId);

      // Envoie un email au propriétaire avec un lien de validation
      try {
        console.log('📧 Sending notification email with data:', {
          listingId,
          ownerEmail,
          title,
          address: street,
          city
        });
        
        const res = await fetch('/api/emails/notify-owner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            listingId,
            ownerEmail,
            title,
            address: street,
            city
          })
        });
        
        console.log('📬 Email API response status:', res.status);
        
        let body = null;
        try { 
          body = await res.json(); 
          console.log('📬 Email API response:', body);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
        }
        
        if (!res.ok) {
          console.error('❌ Erreur envoi email propriétaire (HTTP):', res.status, body);
          setError(`Logement créé mais impossible d'envoyer l'email au propriétaire: ${body?.error || 'Erreur inconnue'}`);
          setLoading(false);
          return;
        } else if (body && body.skipped) {
          console.warn('⚠️ Envoi email propriétaire ignoré (skipped): variables d\'environnement manquantes');
          setError("Logement créé mais envoi email désactivé (configuration manquante).");
          setLoading(false);
          return;
        } else {
          console.log('✅ Email sent successfully to:', body?.sentTo);
          if (body?.testMode) {
            alert(`Email de test envoyé à ${body.sentTo} (destiné à ${body.originalRecipient})`);
          }
        }
      } catch (e) {
        console.error('💥 Erreur envoi email propriétaire:', e);
        setError("Logement créé mais erreur lors de l'envoi de l'email au propriétaire.");
        setLoading(false);
        return;
      }

      // Enregistrer l'accord de consentement pour valeur juridique
      try {
        const agreementText = generateOwnerConsentText({
          ownerName: ownerEmail,
          tenantName: userFullName || user.email,
          fullAddress: street
        });

        const consentRes = await fetch('/api/owner-consent/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId,
            tenantId: user.id,
            tenantEmail: user.email,
            ownerEmail,
            tenantFullName: userFullName || user.email,
            listingAddress: street,
            infoAccuracyAccepted: infoAccuracyChecked,
            ownerConsentAccepted: consentChecked,
            agreementText,
            signatureType: 'tenant' // Signature du locataire
          })
        });

        const consentData = await consentRes.json();
        if (!consentData.success) {
          console.error('⚠️ Erreur lors de l\'enregistrement de l\'accord:', consentData.error);
          // On ne bloque pas la création de l'annonce si le log échoue
        } else {
          console.log('✅ Accord de consentement signé par le tenant:', consentData.data.id);
        }
      } catch (consentError) {
        console.error('💥 Erreur log accord consentement:', consentError);
        // On ne bloque pas la création de l'annonce
      }

  router.push("/profil-hote");
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main style={{ 
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif', 
        background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)', 
        minHeight: '100vh', 
        paddingBottom: 0 
      }}>
        {/* Hero Section Ultra-Modern */}
        <section className="hero-section" style={{ 
          background: 'linear-gradient(135deg, #77d4d7ff 0%, #4547c9ff 50%, #3323c7ff 100%)', 
          padding: '160px 24px 120px', 
          textAlign: 'center', 
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated Background Elements */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite',
            filter: 'blur(1px)'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '60%',
            right: '8%',
            width: '150px',
            height: '150px',
            background: 'rgba(78, 205, 196, 0.15)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite reverse',
            filter: 'blur(1px)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '15%',
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '50%',
            animation: 'float 10s ease-in-out infinite',
            filter: 'blur(2px)'
          }}></div>

          

          {/* CSS Animations via style tag */}
          <style jsx global>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              33% { transform: translateY(-20px) rotate(5deg); }
              66% { transform: translateY(-10px) rotate(-3deg); }
            }
            
            @media (max-width: 768px) {
              .hero-section {
                padding: 100px 20px 80px !important;
              }
              
              .form-section {
                padding: 0 16px 60px !important;
                transform: translateY(-40px) !important;
              }
              
              .form-container {
                padding: 32px 20px !important;
                border-radius: 24px !important;
              }
              
              .form-header {
                margin-bottom: 32px !important;
              }
              
              .form-title {
                font-size: 1.75rem !important;
              }
              
              .config-grid {
                grid-template-columns: 1fr !important;
                gap: 16px !important;
              }
              
              .images-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 12px !important;
              }
              
              .submit-button {
                width: 100% !important;
                min-width: auto !important;
                padding: 18px 32px !important;
                font-size: 1rem !important;
              }
              
              .price-input-container {
                flex-wrap: wrap !important;
              }
              
              .price-input-container > div:first-child {
                border-radius: 16px 16px 0 0 !important;
                border-right: 2px solid rgba(226, 232, 240, 0.8) !important;
                width: 100% !important;
                min-width: 100% !important;
              }
              
              .price-input-container input {
                border-radius: 0 0 16px 16px !important;
                border-left: 2px solid rgba(226, 232, 240, 0.8) !important;
                border-top: none !important;
                width: 100% !important;
              }
              
              .desktop-arrow {
                display: none !important;
              }
              
              .mobile-arrow {
                display: block !important;
              }
              
              .reorder-buttons {
                flex-direction: column !important;
                top: 50% !important;
                left: auto !important;
                right: -12px !important;
                transform: translateY(-50%) !important;
              }
            }
            
            @media (min-width: 769px) {
              .desktop-arrow {
                display: block !important;
              }
              
              .mobile-arrow {
                display: none !important;
              }
            }
            
            @media (max-width: 480px) {
              .form-title {
                font-size: 1.5rem !important;
              }
              
              .images-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </section>

        {/* Form Section Ultra-Modern */}
        <section className="form-section" style={{ padding: '0 24px 100px', transform: 'translateY(-60px)' }}>
          <div className="form-container" style={{ 
            background: 'rgba(255,255,255,0.98)', 
            backdropFilter: 'blur(30px)',
            borderRadius: '32px', 
            padding: '60px', 
            boxShadow: '0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.3)',
            maxWidth: '900px',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Gradient accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #D79077, #4ECDC4, #FFD700)',
              borderRadius: '32px 32px 0 0'
            }}></div>

            <div className="form-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                borderRadius: '24px',
                marginBottom: '24px',
                boxShadow: '0 8px 32px rgba(201,103,69,0.3)'
              }}>
                <span style={{ fontSize: '2rem' }}>🏡</span>
              </div>
              
              <h2 className="form-title" style={{ 
                fontSize: '2.25rem', 
                fontWeight: 800, 
                background: 'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}>
                Créez votre annonce
              </h2>
              
              <div style={{
                width: '60px',
                height: '4px',
                background: 'linear-gradient(90deg, #4ECDC4, #D79077)',
                borderRadius: '2px',
                margin: '0 auto 16px'
              }}></div>
              
              <p style={{ 
                color: '#718096', 
                fontSize: '1.125rem',
                lineHeight: 1.6,
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                Quelques informations sur votre logement pour créer une annonce irrésistible
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Titre */}
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  color: '#2D3748', 
                  marginBottom: '12px',
                  fontSize: '1rem'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, #4ECDC4, #44B5A8)',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>✏️</span>
                  Titre de l'annonce
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Appartement cosy au centre-ville avec vue panoramique"
                    style={{
                      width: '100%',
                      padding: '18px 24px',
                      border: '2px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '16px',
                      fontSize: '1.1rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      outline: 'none',
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 500,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4ECDC4';
                      e.target.style.boxShadow = '0 8px 30px rgba(78,205,196,0.15), 0 0 0 3px rgba(78,205,196,0.1)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                      e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    right: '16px',
                    fontSize: '0.75rem',
                    color: '#A0AEC0',
                    background: 'white',
                    padding: '2px 8px',
                    borderRadius: '8px'
                  }}>
                    {title.length}/100
                  </div>
                </div>
              </div>

              {/* Descriptif de l'annonce */}
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  color: '#2D3748', 
                  marginBottom: '12px',
                  fontSize: '1rem'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, #9F7AEA, #805AD5)',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>📝</span>
                  Description de votre logement
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre logement en détail : équipements, ambiance, points forts, proximité des transports et attractions..."
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '18px 24px',
                      border: '2px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '16px',
                      fontSize: '1rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      outline: 'none',
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 500,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                      resize: 'vertical',
                      minHeight: '120px',
                      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                      lineHeight: 1.6
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#9F7AEA';
                      e.target.style.boxShadow = '0 8px 30px rgba(159,122,234,0.15), 0 0 0 3px rgba(159,122,234,0.1)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                      e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '16px',
                    fontSize: '0.75rem',
                    color: description.length > 500 ? '#E53E3E' : '#A0AEC0',
                    background: 'rgba(255,255,255,0.9)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    backdropFilter: 'blur(5px)'
                  }}>
                    {description.length}/1000
                  </div>
                </div>
                {description.length < 50 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, rgba(159,122,234,0.1), rgba(128,90,213,0.05))',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    color: '#805AD5',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    💡 Une description détaillée (min. 50 caractères) attire plus de voyageurs
                  </div>
                )}
              </div>

              {/* Email du propriétaire */}
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  color: '#2D3748', 
                  marginBottom: '12px',
                  fontSize: '1rem'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, #4299E1, #3182CE)',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>✉️</span>
                  Email de votre propriétaire
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="email.proprietaire@exemple.com"
                    style={{
                      width: '100%',
                      padding: '18px 24px 18px 50px',
                      border: '2px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '16px',
                      fontSize: '1.1rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      outline: 'none',
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 500,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#636464ff';
                      e.target.style.boxShadow = '0 8px 30px rgba(66,153,225,0.15), 0 0 0 3px rgba(66,153,225,0.1)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                      e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem',
                    color: '#4299E1'
                  }}>
                    📧
                  </div>
                </div>
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, rgba(66,153,225,0.1), rgba(49,130,206,0.05))',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  color: '#3182CE',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  🔒 Nous pourrons ainsi contacter votre propriétaire pour qu'il valide l'annonce.
                </div>
              </div>

              {/* Adresse */}
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  color: '#2D3748', 
                  marginBottom: '12px',
                  fontSize: '1rem'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, #D79077, #C96745)',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>📍</span>
                  Localisation
                  {addressConfirmed && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'linear-gradient(135deg, #48BB78, #38A169)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      ✓ Confirmée
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={street}
                    onChange={handleAddressChange}
                    placeholder="Tapez votre adresse complète..."
                    style={{
                      width: '100%',
                      padding: '18px 24px 18px 50px',
                      border: `2px solid ${addressConfirmed ? '#48BB78' : 'rgba(226, 232, 240, 0.8)'}`,
                      borderRadius: '16px',
                      fontSize: '1.1rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      outline: 'none',
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 500,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = addressConfirmed ? '#48BB78' : '#4ECDC4';
                      e.target.style.boxShadow = addressConfirmed 
                        ? '0 8px 30px rgba(72,187,120,0.15), 0 0 0 3px rgba(72,187,120,0.1)'
                        : '0 8px 30px rgba(78,205,196,0.15), 0 0 0 3px rgba(78,205,196,0.1)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = addressConfirmed ? '#48BB78' : 'rgba(226, 232, 240, 0.8)';
                      e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.2rem',
                    color: addressConfirmed ? '#48BB78' : '#A0AEC0'
                  }}>
                    🌍
                  </div>
                </div>
                {showSuggestions && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5)',
                    zIndex: 20,
                    maxHeight: '280px',
                    overflowY: 'auto',
                    animation: 'slideIn 0.2s ease-out'
                  }}>
                    {isLoadingSuggestions ? (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#718096',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #E2E8F0',
                          borderTop: '2px solid #4ECDC4',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Recherche en cours...
                      </div>
                    ) : addressSuggestions.length > 0 ? (
                      addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => selectAddress(suggestion)}
                          style={{
                            padding: '16px 20px',
                            cursor: 'pointer',
                            borderBottom: index < addressSuggestions.length - 1 ? '1px solid rgba(247,250,252,0.8)' : 'none',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            borderRadius: index === 0 ? '20px 20px 0 0' : 
                                         index === addressSuggestions.length - 1 ? '0 0 20px 20px' : '0'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(78,205,196,0.08)';
                            e.target.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.transform = 'translateX(0)';
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, #4ECDC4, #44B5A8)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem'
                          }}>
                            📍
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#2D3748', fontSize: '1rem' }}>
                              {suggestion.properties.label}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '2px' }}>
                              {suggestion.properties.context}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#718096',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{ fontSize: '1.5rem', opacity: 0.5 }}>🔍</div>
                        <div>Aucune adresse trouvée</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Essayez avec une adresse plus précise</div>
                      </div>
                    )}
                  </div>
                )}

                {/* CSS Animations pour les suggestions */}
                <style jsx>{`
                  @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                  }
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>

              {/* Prix avec design premium */}
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  color: '#2D3748', 
                  marginBottom: '12px',
                  fontSize: '1rem'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>💰</span>
                  Prix par nuit
                </label>
                <div className="price-input-container" style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255,215,0,0.1)',
                    border: '2px solid rgba(226, 232, 240, 0.8)',
                    borderRight: 'none',
                    borderRadius: '16px 0 0 16px',
                    padding: '0 16px',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: '#D69E2E',
                    minWidth: '60px',
                    justifyContent: 'center'
                  }}>
                    €
                  </div>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="80"
                    min="1"
                    style={{
                      flex: 1,
                      padding: '18px 24px 18px 16px',
                      border: '2px solid rgba(226, 232, 240, 0.8)',
                      borderLeft: 'none',
                      borderRadius: '0 16px 16px 0',
                      fontSize: '1.3rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      outline: 'none',
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 600,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                      textAlign: 'center'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FFD700';
                      e.target.previousElementSibling.style.borderColor = '#FFD700';
                      e.target.style.boxShadow = '0 8px 30px rgba(255,215,0,0.15), 0 0 0 3px rgba(255,215,0,0.1)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.previousElementSibling.style.transform = 'translateY(-2px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                      e.target.previousElementSibling.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                      e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.previousElementSibling.style.transform = 'translateY(0)';
                    }}
                  />
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '-6px',
                  right: '16px',
                  fontSize: '0.75rem',
                  color: '#A0AEC0',
                  background: 'white',
                  padding: '2px 8px',
                  borderRadius: '8px'
                }}>
                  /nuit
                </div>
                {price && parseFloat(price) > 0 && (
                  <div style={{
                    marginTop: '12px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(159,122,234,0.1), rgba(128,90,213,0.05))',
                    borderRadius: '16px',
                    border: '2px solid rgba(159,122,234,0.2)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: '#805AD5', fontWeight: 600 }}>
                        💡 Prix vu par les voyageurs :
                      </span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2D3748' }}>
                        {(parseFloat(price) * getFeeMultiplier()).toFixed(2)}€/nuit
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', textAlign: 'center' }}>
                      (Prix hôte +  commission plateforme)
                    </div>
                  </div>
                )}
                {price && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, rgba(159,122,234,0.1), rgba(128,90,213,0.05))',
                    borderRadius: '12px',
                    border: '2px solid rgba(159,122,234,0.2)',
                    fontSize: '0.9rem',
                    color: '#805AD5',
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    💡 Comparez avec les autres plateformes et prévoyez 10-15% moins cher pour attirer plus de voyageurs
                  </div>
                )}
              </div>

              {/* Configuration ultra-moderne des équipements */}
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#2D3748',
                  marginBottom: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🏠</span>
                  Configuration du logement
                </h3>
                
                <div className="config-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '24px' 
                }}>
                  {/* Capacité d'accueil */}
                  <div style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '2px solid rgba(226, 232, 240, 0.5)',
                    borderRadius: '20px',
                    padding: '24px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #9F7AEA, #805AD5)',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      fontSize: '1.5rem'
                    }}>
                      👥
                    </div>
                    <label style={{ 
                      display: 'block',
                      fontWeight: 700, 
                      color: '#2D3748', 
                      marginBottom: '16px',
                      fontSize: '1.1rem'
                    }}>
                      👥 Capacité d'accueil
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setNbVoyageurs(Math.max(1, nbVoyageurs - 1))}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          border: '2px solid rgba(159,122,234,0.3)',
                          background: 'linear-gradient(135deg, rgba(159,122,234,0.1), rgba(159,122,234,0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#9F7AEA',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 8px 25px rgba(159,122,234,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        −
                      </button>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #9F7AEA, #805AD5)',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'white',
                        boxShadow: '0 8px 25px rgba(159,122,234,0.3)'
                      }}>
                        {nbVoyageurs}
                      </div>
                      <button
                        type="button"
                        onClick={() => setNbVoyageurs(nbVoyageurs + 1)}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          border: '2px solid rgba(159,122,234,0.3)',
                          background: 'linear-gradient(135deg, rgba(159,122,234,0.1), rgba(159,122,234,0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#9F7AEA',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 8px 25px rgba(159,122,234,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Chambres */}
                  <div style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '2px solid rgba(226, 232, 240, 0.5)',
                    borderRadius: '20px',
                    padding: '24px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      fontSize: '1.5rem'
                    }}>
                      🚪  
                    </div>
                    <label style={{ 
                      display: 'block',
                      fontWeight: 700, 
                      color: '#2D3748', 
                      marginBottom: '16px',
                      fontSize: '1.1rem'
                    }}>
                      Chambres
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          border: '2px solid rgba(102,126,234,0.3)',
                          background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(102,126,234,0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#667EEA',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 8px 25px rgba(102,126,234,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        −
                      </button>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'white',
                        boxShadow: '0 8px 25px rgba(102,126,234,0.3)'
                      }}>
                        {bedrooms}
                      </div>
                      <button
                        type="button"
                        onClick={() => setBedrooms(bedrooms + 1)}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          border: '2px solid rgba(102,126,234,0.3)',
                          background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(102,126,234,0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#667EEA',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 8px 25px rgba(102,126,234,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Lits */}
                  <div style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '2px solid rgba(226, 232, 240, 0.5)',
                    borderRadius: '20px',
                    padding: '24px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #4ECDC4, #44B5A8)',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      fontSize: '1.5rem'
                    }}>
                      🛌
                    </div>
                    <label style={{ 
                      display: 'block',
                      fontWeight: 700, 
                      color: '#2D3748', 
                      marginBottom: '16px',
                      fontSize: '1.1rem'
                    }}>
                    Lits
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setBeds(Math.max(1, beds - 1))}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          border: '2px solid rgba(78,205,196,0.3)',
                          background: 'linear-gradient(135deg, rgba(78,205,196,0.1), rgba(78,205,196,0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#4ECDC4',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 8px 25px rgba(78,205,196,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        −
                      </button>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #4ECDC4, #44B5A8)',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'white',
                        boxShadow: '0 8px 25px rgba(78,205,196,0.3)'
                      }}>
                        {beds}
                      </div>
                      <button
                        type="button"
                        onClick={() => setBeds(beds + 1)}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          border: '2px solid rgba(78,205,196,0.3)',
                          background: 'linear-gradient(135deg, rgba(78,205,196,0.1), rgba(78,205,196,0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#4ECDC4',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 8px 25px rgba(78,205,196,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Salles de bain */}
                  <div style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '2px solid rgba(226, 232, 240, 0.5)',
                    borderRadius: '20px',
                    padding: '24px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #FF6B6B, #FF5252)',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      fontSize: '1.5rem'
                    }}>
                      🚿
                    </div>
                    <label style={{ 
                      display: 'block',
                      fontWeight: 700, 
                      color: '#2D3748', 
                      marginBottom: '16px',
                      fontSize: '1.1rem'
                    }}>
                    Salles de bain
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setBathrooms(Math.max(1, bathrooms - 1))}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          border: '2px solid rgba(255,107,107,0.3)',
                          background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,107,107,0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#FF6B6B',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 8px 25px rgba(255,107,107,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        −
                      </button>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #FF6B6B, #FF5252)',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'white',
                        boxShadow: '0 8px 25px rgba(255,107,107,0.3)'
                      }}>
                        {bathrooms}
                      </div>
                      <button
                        type="button"
                        onClick={() => setBathrooms(bathrooms + 1)}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          border: '2px solid rgba(255,107,107,0.3)',
                          background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,107,107,0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#FF6B6B',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 8px 25px rgba(255,107,107,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload d'images ultra-moderne */}
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  color: '#2D3748', 
                  marginBottom: '16px',
                  fontSize: '1rem'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, #9F7AEA, #805AD5)',
                    borderRadius: '8px',
                    fontSize: '0.75rem'
                  }}>📸</span>
                  Photos du logement
                  <span style={{
                    background: 'rgba(159,122,234,0.1)',
                    color: '#805AD5',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {previewImages.length}/10
                  </span>
                </label>
                
                <div 
                  style={{
                    position: 'relative',
                    border: '3px dashed rgba(159,122,234,0.3)',
                    borderRadius: '20px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(159,122,234,0.05), rgba(128,90,213,0.02))',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#9F7AEA';
                    e.target.style.background = 'linear-gradient(135deg, rgba(159,122,234,0.1), rgba(128,90,213,0.05))';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(159,122,234,0.3)';
                    e.target.style.background = 'linear-gradient(135deg, rgba(159,122,234,0.05), rgba(128,90,213,0.02))';
                    e.target.style.transform = 'translateY(0)';
                  }}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #9F7AEA, #805AD5)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '2rem',
                    boxShadow: '0 8px 25px rgba(159,122,234,0.3)'
                  }}>
                    📷
                  </div>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#2D3748',
                    marginBottom: '8px'
                  }}>
                    Ajoutez vos photos
                  </h4>
                  <p style={{
                    color: '#718096',
                    fontSize: '1rem',
                    marginBottom: '16px',
                    lineHeight: 1.5
                  }}>
                    Glissez-déposez vos images ou cliquez pour sélectionner<br />
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      Formats supportés: JPG, PNG, WebP • Max 10 photos
                    </span>
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {previewImages.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h5 style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#2D3748',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                      Aperçu de vos photos ({previewImages.length})
                    </h5>
                    <div style={{
                      marginBottom: '16px',
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, rgba(159,122,234,0.1), rgba(128,90,213,0.05))',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      color: '#805AD5',
                      textAlign: 'center',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🔄</span>
                      Utilisez les flèches pour changer l'ordre • La première sera la photo de garde
                    </div>
                    <div className="images-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                      gap: '16px'
                    }}>
                      {previewImages.map((preview, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            position: 'relative',
                            borderRadius: '16px',
                            overflow: 'visible',
                            boxShadow: index === 0 
                              ? '0 8px 25px rgba(159,122,234,0.3), 0 0 0 3px rgba(159,122,234,0.4)' 
                              : '0 8px 25px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{
                            borderRadius: '16px',
                            overflow: 'hidden'
                          }}>
                            <img
                              src={preview}
                              alt={`Photo ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          </div>
                          
                          {/* Boutons de réorganisation */}
                          <div className="reorder-buttons" style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '4px',
                            zIndex: 10
                          }}>
                            <button
                              type="button"
                              onClick={() => moveImageUp(index)}
                              disabled={index === 0}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '16px',
                                background: index === 0 ? '#E2E8F0' : 'linear-gradient(135deg, #4ECDC4, #44B5A8)',
                                color: 'white',
                                border: 'none',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                boxShadow: index === 0 ? 'none' : '0 4px 15px rgba(78,205,196,0.4)',
                                transition: 'all 0.2s ease',
                                opacity: index === 0 ? 0.5 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (index !== 0) {
                                  e.target.style.transform = 'scale(1.1)';
                                  e.target.style.boxShadow = '0 6px 20px rgba(78,205,196,0.6)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                if (index !== 0) {
                                  e.target.style.boxShadow = '0 4px 15px rgba(78,205,196,0.4)';
                                }
                              }}
                            >
                              <span className="desktop-arrow">◀</span>
                              <span className="mobile-arrow">▲</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImageDown(index)}
                              disabled={index === images.length - 1}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '16px',
                                background: index === images.length - 1 ? '#E2E8F0' : 'linear-gradient(135deg, #4ECDC4, #44B5A8)',
                                color: 'white',
                                border: 'none',
                                cursor: index === images.length - 1 ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                boxShadow: index === images.length - 1 ? 'none' : '0 4px 15px rgba(78,205,196,0.4)',
                                transition: 'all 0.2s ease',
                                opacity: index === images.length - 1 ? 0.5 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (index !== images.length - 1) {
                                  e.target.style.transform = 'scale(1.1)';
                                  e.target.style.boxShadow = '0 6px 20px rgba(78,205,196,0.6)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                if (index !== images.length - 1) {
                                  e.target.style.boxShadow = '0 4px 15px rgba(78,205,196,0.4)';
                                }
                              }}
                            >
                              <span className="desktop-arrow">▶</span>
                              <span className="mobile-arrow">▼</span>
                            </button>
                          </div>
                          
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: index === 0 
                              ? 'linear-gradient(135deg, #9F7AEA, #805AD5)' 
                              : 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {index === 0 && <span>⭐</span>}
                            #{index + 1}
                          </div>
                          {index === 0 && (
                            <div style={{
                              position: 'absolute',
                              bottom: '8px',
                              left: '8px',
                              right: '8px',
                              background: 'linear-gradient(135deg, rgba(159,122,234,0.95), rgba(128,90,213,0.95))',
                              color: 'white',
                              padding: '6px 8px',
                              borderRadius: '10px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              backdropFilter: 'blur(5px)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Photo de garde
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '28px',
                              height: '28px',
                              borderRadius: '14px',
                              background: 'linear-gradient(135deg, #E53E3E, #C53030)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              boxShadow: '0 4px 15px rgba(229,62,62,0.4)',
                              transition: 'all 0.2s ease',
                              zIndex: 10
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.1)';
                              e.target.style.boxShadow = '0 6px 20px rgba(229,62,62,0.6)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = '0 4px 15px rgba(229,62,62,0.4)';
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Carte interactive moderne */}
              {latitude && longitude && (
                <div style={{ position: 'relative' }}>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700, 
                    color: '#2D3748', 
                    marginBottom: '16px',
                    fontSize: '1rem'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: 'linear-gradient(135deg, #48BB78, #38A169)',
                      borderRadius: '8px',
                      fontSize: '0.75rem'
                    }}>🗺️</span>
                    Localisation confirmée
                    <span style={{
                      background: 'linear-gradient(135deg, #48BB78, #38A169)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ✓ Validée
                    </span>
                  </label>
                  <div style={{ 
                    borderRadius: '20px', 
                    overflow: 'hidden', 
                    height: '350px',
                    border: '3px solid rgba(72,187,120,0.3)',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
                    position: 'relative',
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <MapPreview latitude={latitude} longitude={longitude} />
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(10px)',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#2D3748',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}>
                      📍 {street}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(229,62,62,0.1), rgba(197,48,48,0.05))',
                  border: '2px solid rgba(229,62,62,0.2)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  textAlign: 'center',
                  marginTop: '20px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <span style={{ 
                      fontWeight: 700, 
                      color: '#C53030',
                      fontSize: '1rem'
                    }}>
                      Erreur de validation
                    </span>
                  </div>
                  <p style={{
                    color: '#C53030',
                    fontSize: '0.95rem',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Attestation exactitude des informations */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(66,153,225,0.08), rgba(49,130,206,0.04))',
                border: '2px solid rgba(66,153,225,0.2)',
                borderRadius: '16px',
                padding: '20px',
                marginTop: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px', 
                  cursor: 'pointer'
                }}>
                  <input 
                    type="checkbox" 
                    checked={infoAccuracyChecked} 
                    onChange={(e) => setInfoAccuracyChecked(e.target.checked)} 
                    style={{ 
                      marginTop: '4px',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }} 
                  />
                  <span style={{ 
                    color: '#2D3748', 
                    fontWeight: 600, 
                    fontSize: '0.95rem',
                    lineHeight: 1.5
                  }}>
                    ✓ J'atteste que les informations fournies dans ce formulaire sont exactes et complètes
                  </span>
                </label>
              </div>

              {/* Bouton de soumission ultra-moderne */}
              <div className="submit-container" style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  className="submit-button"
                  type="submit"
                  disabled={loading || !infoAccuracyChecked}
                  style={{
                    position: 'relative',
                    background: (loading || !consentChecked || !infoAccuracyChecked)
                      ? 'linear-gradient(135deg, #A0AEC0, #718096)' 
                      : 'linear-gradient(135deg, #D79077 0%, #C96745 50%, #B8553C 100%)',
                    color: '#fff',
                    padding: '20px 60px',
                    borderRadius: '25px',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    border: 'none',
                    cursor: (loading || !consentChecked || !infoAccuracyChecked) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: (loading || !consentChecked || !infoAccuracyChecked)
                      ? '0 8px 25px rgba(160,174,192,0.3)' 
                      : '0 15px 35px rgba(201, 103, 69, 0.4)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    overflow: 'hidden',
                    minWidth: '280px'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-4px) scale(1.02)';
                      e.target.style.boxShadow = '0 25px 50px rgba(201, 103, 69, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0) scale(1)';
                      e.target.style.boxShadow = '0 15px 35px rgba(201, 103, 69, 0.4)';
                    }
                  }}
                >
                  {loading && (
                    <div style={{
                      position: 'absolute',
                      left: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  )}
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}>
                    {!loading && <span style={{ fontSize: '1.3rem' }}>🚀</span>}
                    {loading ? 'Envoi au propriétaire en cours...' : !infoAccuracyChecked ? 'Veuillez attester l\'exactitude des informations' : !consentChecked ? 'Veuillez accepter l\'accord de sous location' : 'Soumettre mon annonce'}
                  </span>
                  
                  {/* Effet de brillance */}
                  {!loading && (
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      animation: 'shine 3s infinite'
                    }}></div>
                  )}
                </button>
                
                {/* CSS pour les animations */}
                <style jsx>{`
                  @keyframes shine {
                    0% { left: -100%; }
                    100% { left: 100%; }
                  }
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>

              {/* Informations de validation */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(72,187,120,0.08), rgba(56,161,105,0.04))',
                border: '2px solid rgba(72,187,120,0.2)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                marginTop: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '1.3rem' }}>🛡️</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: '#38A169',
                    fontSize: '1.1rem'
                  }}>
                    Processus de validation
                  </span>
                </div>
                <p style={{
                  color: '#2D5A3D',
                  fontSize: '0.95rem',
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  Une fois la validation de votre propriétaire effectuée, votre annonce sera vérifiée par notre équipe sous <strong>24h</strong> pour garantir la qualité et la sécurité de notre plateforme. 
                  Vous recevrez une notification par email une fois l'annonce approuvée.
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  marginTop: '16px',
                  fontSize: '0.85rem',
                  color: '#38A169'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✓</span> Photos vérifiées
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✓</span> Informations contrôlées
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✓</span> Localisation validée
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
      
      {/* Assistant Chatbot */}
      <ListingAssistantChatbot 
        onPriceGenerated={(suggestedPrice) => setPrice(suggestedPrice)}
        onDescriptionGenerated={(generatedDescription) => setDescription(generatedDescription)}
      />
    </>
  );
}