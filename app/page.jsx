"use client";

import { useRef, useState, createRef, useEffect } from "react";
import Header from './_components/Header';
import Footer from './_components/Footer';
import Chatbot from './_components/Chatbot';
import MobileSearchWorkflow from './_components/MobileSearchWorkflow';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Page() {
  const [lieu, setLieu] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const suggestionsMenuRef = useRef(null);
  
  // État pour le modal mobile
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [arrivee, setArrivee] = useState("");
  const [depart, setDepart] = useState("");
  const arriveeRef = useRef(null);
  const departPickerRef = createRef();
  const departInputRef = useRef(null);

  const [arriveeOpen, setArriveeOpen] = useState(false);
  const [departOpen, setDepartOpen] = useState(false);

  const [voyageurs, setVoyageurs] = useState(2);
  const [voyageursOpen, setVoyageursOpen] = useState(false);
  const [voyageurIndex, setVoyageurIndex] = useState(-1);

  // Ajout des états de focus
  const [lieuFocused, setLieuFocused] = useState(false);
  const [arriveeFocused, setArriveeFocused] = useState(false);
  const [departFocused, setDepartFocused] = useState(false);
  const [voyageursFocused, setVoyageursFocused] = useState(false);

  const [hasTypedLieu, setHasTypedLieu] = useState(false);

  // Slider: nombre de nuits et revenus estimés
  const [nbNuits, setNbNuits] = useState(23);
  // Prix par nuit éditable par l'utilisateur (en euros)
  const [pricePerNight, setPricePerNight] = useState(130);

  // Valeur numérique sûre pour les calculs (gère chaîne vide)
  const priceNum = Number(pricePerNight) || 0;

  const voyageursBtnRef = useRef(null);
  const voyageursMenuRef = useRef(null);

  // État pour gérer l'onglet actif et l'écran de choix initial
  const [activeTab, setActiveTab] = useState(null); // null, 'voyageur' ou 'hote'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [isPageReady, setIsPageReady] = useState(false);

  // Fonction pour choisir le mode initial
  const handleModeSelection = (mode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(mode);
      setShowModeSelection(false);
    }, 800);
    setTimeout(() => {
      setIsTransitioning(false);
      setIsPageReady(true);
    }, 1000);
  };

  // Fonction pour changer d'onglet avec animation moderne
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150); // Changement rapide après le début du fondu
  };

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fermer le menu voyageurs si clic en dehors
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        voyageursOpen &&
        voyageursBtnRef.current &&
        !voyageursBtnRef.current.contains(e.target) &&
        voyageursMenuRef.current &&
        !voyageursMenuRef.current.contains(e.target)
      ) {
        setVoyageursOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [voyageursOpen]);

  // Fermer le menu de suggestions si clic en dehors
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        suggestions.length > 0 &&
        suggestionsMenuRef.current &&
        !suggestionsMenuRef.current.contains(e.target) &&
        !document.querySelector('input[name="destination"]').contains(e.target)
      ) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [suggestions]);

  // Conversion string <-> Date pour react-datepicker
  const arriveeDate = arrivee ? new Date(arrivee) : null;
  const departDate = depart ? new Date(depart) : null;

  // Gestion clavier pour suggestions
  function handleLieuKeyDown(e) {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setSuggestionIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setSuggestionIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault(); // Empêche la soumission du formulaire
      if (suggestions.length > 0 && suggestionIndex >= 0 && suggestionIndex < suggestions.length) {
        // Sélectionne la suggestion et passe au bouton arrivée
        setLieu(suggestions[suggestionIndex].display_name);
        setSuggestions([]);
        setSuggestionIndex(-1);
        setTimeout(() => {
          if (arriveeRef.current) arriveeRef.current.focus();
        }, 0);
      } else {
        // Passe le focus au bouton "Arrivée"
        setTimeout(() => {
          if (arriveeRef.current) {
            arriveeRef.current.focus();
          }
        }, 0);
      }
    }
  }

  // Gestion clavier pour DatePicker arrivée
  function handleArriveeKeyDown(e) {
    if (e.key === "Enter") {
      if (departPickerRef.current) {
        departPickerRef.current.setOpen(true);
        setTimeout(() => {
          if (departPickerRef.current.input) departPickerRef.current.input.focus();
        }, 0);
      }
    }
  }

  // Gestion clavier pour DatePicker départ
  function handleDepartKeyDown(e) {
    if (e.key === "Enter") {
      setVoyageursOpen(true);
      setVoyageurIndex(voyageurs - 1);
      setTimeout(() => {
        if (voyageursMenuRef.current) voyageursMenuRef.current.focus();
      }, 0);
    }
  }

  // Gestion clavier pour liste voyageurs
  function handleVoyageursKeyDown(e) {
    if (voyageursOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setVoyageurIndex(i => Math.min(i + 1, 9));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setVoyageurIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        setVoyageurs(voyageurIndex + 1);
        setVoyageursOpen(false);
        document.querySelector('.btn.btn-primary[type="submit"]')?.focus();
      }
    }
  }

  // Ajouter la fonction handleSuggestionSelect
  function handleSuggestionSelect(suggestion) {
    setLieu(suggestion.properties?.label || suggestion.display_name);
    setSuggestions([]);
    setSuggestionIndex(-1);
    setTimeout(() => {
      if (arriveeRef.current) arriveeRef.current.focus();
    }, 0);
  }

  // Ajouter la logique de fetch pour suggestions d'adresse
  useEffect(() => {
    if (!lieu || !hasTypedLieu) return;
    setIsLoadingSuggestions(true);
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(lieu)}&limit=5`)
      .then(res => res.json())
      .then(data => {
        setSuggestions(data.features || []);
        setIsLoadingSuggestions(false);
      })
      .catch(() => {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
      });
  }, [lieu, hasTypedLieu]);

  // Si showModeSelection est true, afficher l'écran de sélection du mode
  if (showModeSelection) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #995741ff 0%, #D68E74 50%, #C96745  100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        opacity: isTransitioning ? 0 : 1,
        transition: 'opacity 0.8s ease-out'
      }}>
        {/* Animated background particles */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0
        }}>
          {[...Array(20)].map((_, i) => {
            const size = Math.random() * 300 + 50;
            return (
              <div
                key={i}
                className="floating-bubble"
                style={{
                  position: 'absolute',
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, rgba(245,230,211,0.6) 0%, transparent 50%)`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${Math.random() * 20 + 10}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            );
          })}
        </div>

        {/* Main content */}
        <div className="mode-selection-container" style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '20px 20px 40px',
          maxWidth: '1100px',
          width: '100%',
          opacity: isTransitioning ? 0 : 1,
          filter: isTransitioning ? 'blur(20px)' : 'blur(0px)',
          transform: isTransitioning ? 'scale(0.9)' : 'scale(1)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '50px', animation: 'fadeInDown 1s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img 
              src="/logo.png" 
              alt="Kokyage" 
              style={{ 
                height: 'clamp(120px, 15vw, 150px)', 
                filter: 'brightness(0) invert(1)',
                marginBottom: '20px',
                display: 'block'
              }} 
            />
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: 'white',
              marginBottom: '0',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 30px rgba(0,0,0,0.3)'
            }}>
              Bienvenue sur Kokyage
            </h1>
          </div>

          {/* Cards de sélection modernes */}
          <div className="mode-selection-cards" style={{
            display: 'flex',
            gap: '24px',
            maxWidth: '800px',
            margin: '0 auto',
            animation: 'fadeInUp 1s ease-out 0.3s both',
            justifyContent: 'center',
            alignItems: 'stretch',
            flexWrap: 'wrap'
          }}>
            {/* Card Voyageur */}
            <div
              onClick={() => handleModeSelection('voyageur')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '24px',
                padding: '40px 32px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '18px',
                minHeight: '220px',
                flex: '1 1 360px',
                minWidth: '280px',
                maxWidth: '400px',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{
                fontSize: '4rem',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}>
                🏖️
              </div>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 1.8rem)',
                fontWeight: 600,
                color: 'white',
                letterSpacing: '-0.02em',
                textAlign: 'center',
                margin: 0,
                textShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                Je cherche un séjour
              </h2>
            </div>

            {/* Card Hôte */}
            <div
              onClick={() => handleModeSelection('hote')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '24px',
                padding: '40px 32px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '18px',
                minHeight: '220px',
                flex: '1 1 360px',
                minWidth: '280px',
                maxWidth: '400px',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{
                fontSize: '4rem',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}>
                🏠
              </div>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 1.8rem)',
                fontWeight: 600,
                color: 'white',
                letterSpacing: '-0.02em',
                textAlign: 'center',
                margin: 0,
                textShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                Je sous-loue mon logement
              </h2>
            </div>
          </div>
        </div>

        {/* Animations CSS */}
        <style jsx>{`
          @keyframes float {
            0% {
              transform: translate(0, 0) scale(1) rotate(0deg);
            }
            20% {
              transform: translate(40px, -60px) scale(1.08) rotate(8deg);
            }
            40% {
              transform: translate(-50px, -30px) scale(0.95) rotate(-6deg);
            }
            60% {
              transform: translate(30px, 45px) scale(1.06) rotate(5deg);
            }
            80% {
              transform: translate(-35px, 20px) scale(0.98) rotate(-4deg);
            }
            100% {
              transform: translate(0, 0) scale(1) rotate(0deg);
            }
          }

          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 768px) {
            .floating-bubble {
              width: 120px !important;
              height: 120px !important;
              max-width: 120px !important;
              max-height: 120px !important;
            }
            
            .mode-selection-container {
              padding: 28px 16px !important;
            }

            .mode-selection-container > div:first-child {
              margin-bottom: 28px !important;
            }

            .mode-selection-container > div:first-child img {
              height: clamp(90px, 20vw, 120px) !important;
              margin-bottom: 16px !important;
            }

            .mode-selection-container h1 {
              font-size: clamp(1.9rem, 5.5vw, 2.5rem) !important;
              margin-bottom: 4px !important;
            }

            .mode-selection-cards {
              flex-wrap: wrap !important;
              justify-content: center !important;
              gap: 12px !important;
              padding: 0 12px !important;
              max-width: 100% !important;
            }
            
            .mode-selection-cards > div {
              flex: 1 1 calc(50% - 12px) !important;
              min-width: calc(50% - 12px) !important;
              max-width: calc(50% - 12px) !important;
              padding: clamp(22px, 5.5vw, 28px) clamp(16px, 4.5vw, 22px) !important;
              gap: clamp(12px, 3.6vw, 16px) !important;
              min-height: auto !important;
              height: auto !important;
            }
            
            .mode-selection-cards > div > div:first-child {
              font-size: 2.8rem !important;
            }
            
            .mode-selection-cards h2 {
              font-size: clamp(1.25rem, 3.8vw, 1.6rem) !important;
              line-height: 1.28 !important;
            }
          }

          @media (max-width: 480px) {
            .mode-selection-container {
              padding: 24px 12px !important;
            }

            .mode-selection-container > div:first-child img {
              height: clamp(80px, 24vw, 110px) !important;
            }

            .mode-selection-container h1 {
              font-size: clamp(1.75rem, 6.3vw, 2.2rem) !important;
            }

            .mode-selection-cards {
              gap: 10px !important;
              padding: 0 8px !important;
            }
            
            .mode-selection-cards > div {
              flex: 1 1 calc(50% - 10px) !important;
              min-width: calc(50% - 10px) !important;
              max-width: calc(50% - 10px) !important;
              padding: clamp(20px, 6vw, 24px) clamp(14px, 5vw, 18px) !important;
              gap: clamp(10px, 4vw, 14px) !important;
              min-height: auto !important;
              height: auto !important;
            }
            
            .mode-selection-cards > div > div:first-child {
              font-size: 2.4rem !important;
            }
            
            .mode-selection-cards h2 {
              font-size: clamp(1.1rem, 4.2vw, 1.35rem) !important;
            }
          }

          @media (max-width: 380px) {
            .mode-selection-container {
              padding: 20px 10px !important;
            }

            .mode-selection-container h1 {
              font-size: clamp(1.6rem, 6.8vw, 2rem) !important;
            }

            .mode-selection-cards {
              gap: 8px !important;
            }

            .mode-selection-cards > div {
              flex: 1 1 calc(50% - 8px) !important;
              min-width: calc(50% - 8px) !important;
              max-width: calc(50% - 8px) !important;
              padding: clamp(18px, 7vw, 22px) clamp(12px, 5.5vw, 16px) !important;
              border-radius: 18px !important;
              gap: clamp(8px, 4.5vw, 12px) !important;
              min-height: auto !important;
              height: auto !important;
            }

            .mode-selection-cards > div > div:first-child {
              font-size: 2.2rem !important;
            }

            .mode-selection-cards h2 {
              font-size: clamp(1.05rem, 5.2vw, 1.3rem) !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return <>
    <Header activeTab={activeTab} setActiveTab={setActiveTab} />
    <main style={{ 
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif', 
      background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)', 
      minHeight: '100vh', 
      paddingBottom: 0,
      opacity: isPageReady ? 1 : 0,
      transform: isPageReady ? 'scale(1)' : 'scale(1.05)',
      filter: isPageReady ? 'blur(0px)' : 'blur(10px)',
      transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      
      {/* Hero Section with Modern Design */}
      <section className="hero-section" style={{ 
        background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)', 
  padding: '80px 24px 140px',
        textAlign: 'center', 
        color: 'white',
        position: 'relative',
        overflow: 'visible',
        zIndex: 1
      }}>
        {/* Background Animation Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
        
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Conteneur avec animation fluide pour tout le contenu */}
          <div style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'opacity, transform'
          }}>
            <h1 style={{ 
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
              fontWeight: 800, 
              marginBottom: '48px', 
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.23)'
            }}>
              {activeTab === 'voyageur' ? (
                <> Chez l'habitant, <br /><span style={{ color: '#ffffffff' }}> vraiment. </span></>
              ) : (
                <>Sous-louez enfin<br /><span style={{ color: '#ffffffff' }}>en partageant les revenus</span></>
              )}
            </h1>
            
            {/* Cartes 60/40 pour hôte - dans la zone orange */}
            {activeTab === 'hote' && (
              <div className="revenue-split-cards" style={{ 
                display: 'flex', 
                justifyContent: 'center',
                gap: '24px',
                maxWidth: '900px',
                margin: '0 auto',
                flexWrap: 'wrap'
              }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  padding: '32px 28px',
                  borderRadius: '24px',
                  textAlign: 'center',
                  border: '2px solid rgba(255,255,255,0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  flex: '1',
                  minWidth: '260px',
                  maxWidth: '320px',
                  aspectRatio: '1.2',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{ 
                    fontSize: 'clamp(0.75rem, 1.5vw, 1.1rem)', 
                    fontWeight: 600, 
                    marginBottom: 'clamp(8px, 2vw, 16px)',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    opacity: 0.95,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    Gains Locataire
                  </div>
                  <div style={{ 
                    fontSize: 'clamp(2.5rem, 7vw, 5rem)', 
                    fontWeight: 900, 
                    marginBottom: 'clamp(8px, 2vw, 16px)',
                    color: '#FFE66D',
                    textShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    lineHeight: 1,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    60<span style={{ fontSize: 'clamp(1.5rem, 4.2vw, 3rem)' }}>%</span>
                  </div>
                  <p style={{ 
                    fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)', 
                    opacity: 0.95,
                    lineHeight: 1.5,
                    color: 'white',
                    position: 'relative',
                    zIndex: 1,
                    margin: 0
                  }}>
                  En complément de revenus
                  </p>
                </div>

                <div style={{ 
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  padding: '32px 28px',
                  borderRadius: '24px',
                  textAlign: 'center',
                  border: '2px solid rgba(255,255,255,0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  flex: '1',
                  minWidth: '260px',
                  maxWidth: '320px',
                  aspectRatio: '1.2',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{ 
                    fontSize: 'clamp(0.75rem, 1.5vw, 1.1rem)', 
                    fontWeight: 600, 
                    marginBottom: 'clamp(8px, 2vw, 16px)',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    opacity: 0.95,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    Gains Propriétaire
                  </div>
                  <div style={{ 
                    fontSize: 'clamp(2.5rem, 7vw, 5rem)', 
                    fontWeight: 900, 
                    marginBottom: 'clamp(8px, 2vw, 16px)',
                    color: '#FFE66D',
                    textShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    lineHeight: 1,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    40<span style={{ fontSize: 'clamp(1.5rem, 4.2vw, 3rem)' }}>%</span>
                  </div>
                  <p style={{ 
                    fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)', 
                    opacity: 0.95,
                    lineHeight: 1.5,
                    color: 'white',
                    position: 'relative',
                    zIndex: 1,
                    margin: 0
                  }}>
                    Revenus passifs sans effort de gestion
                  </p>
                </div>
              </div>
            )}
            
            {/* Modern Search Card - Visible uniquement pour voyageur */}
            {activeTab === 'voyageur' && (
            <div className="search-card-modern" style={{ 
            background: 'rgba(255,255,255,0.95)', 
            backdropFilter: 'blur(10px)',
            borderRadius: '24px', 
            padding: '24px', 
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <h2 className="search-title" style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              color: '#2D3748', 
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              Trouvez votre logement idéal
            </h2>
            <form className="search-form-modern" action="/logements" style={{ 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'stretch', 
              flexWrap: 'nowrap', 
              justifyContent: 'center',
              background: 'white',
              borderRadius: '16px',
              padding: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflowX: 'auto'
            }}>
            <div className="search-input-container" style={{ position: 'relative', flex: '1 1 320px', minWidth: '240px', maxWidth: '420px', flexShrink: 1, zIndex: 10000 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <input
                    name="destination"
                    placeholder="On va où ?"
                    value={lieu}
                    onChange={e => {
                      setLieu(e.target.value);
                      setSuggestionIndex(-1);
                      setHasTypedLieu(true);
                    }}
                    autoComplete="off"
                    onFocus={(e) => {
                      setLieuFocused(true);
                      if (isMobile) {
                        e.target.blur();
                        setMobileSearchOpen(true);
                      }
                    }}
                    onBlur={() => setLieuFocused(false)}
                    onKeyDown={handleLieuKeyDown}
                    readOnly={isMobile}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      border: lieuFocused ? '2px solid #60A29D' : '2px solid transparent',
                      fontSize: '16px',
                      background: '#F5F1ED',
                      color: '#2D3748',
                      boxShadow: lieuFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                      height: '56px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      fontWeight: '500',
                      cursor: isMobile ? 'pointer' : 'text'
                    }}
                  />
                  {/* Champs cachés pour transmettre les dates et voyageurs en query params */}
                  <input type="hidden" name="arrivee" value={arrivee} />
                  <input type="hidden" name="depart" value={depart} />
                  <input type="hidden" name="voyageurs" value={voyageurs} />
              {suggestions.length > 0 && hasTypedLieu && (
                <ul
                  ref={suggestionsMenuRef}
                  style={{
                    position: 'absolute',
                    top: '60px',
                    left: 0,
                    width: '100%',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    margin: 0,
                    padding: '8px 0',
                    listStyle: 'none',
                    zIndex: 10001,
                    maxHeight: '250px',
                    overflowY: 'auto',
                    backdropFilter: 'blur(8px)'
                  }}>
                    {isLoadingSuggestions && (
                      <li style={{ padding: '16px 0', textAlign: 'center' }}>
                        <span className="spinner" style={{ 
                          display: 'inline-block', 
                          width: '24px', 
                          height: '24px', 
                          border: '3px solid #f3f4f6', 
                          borderTop: '3px solid #60A29D', 
                          borderRadius: '50%', 
                          animation: 'spin 1s linear infinite' 
                        }}></span>
                      </li>
                    )}
                    {!isLoadingSuggestions && suggestions.length === 0 && (
                      <li style={{ padding: '16px', color: '#718096', textAlign: 'center', fontSize: '14px' }}>
                        Aucune suggestion trouvée
                      </li>
                    )}
                    {!isLoadingSuggestions && suggestions.map((s, idx) => (
                      <li
                        key={s.properties?.id || idx}
                        onClick={() => handleSuggestionSelect(s)}
                        style={{
                          padding: '12px 20px',
                          cursor: 'pointer',
                          borderBottom: idx < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                          background: suggestionIndex === idx ? '#F5F1ED' : 'white',
                          color: '#2D3748',
                          fontSize: '14px',
                          transition: 'background-color 0.2s ease',
                          minHeight: '44px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onMouseEnter={e => {
                          if (suggestionIndex !== idx) {
                            e.target.style.background = '#F5F1ED';
                          }
                        }}
                        onMouseLeave={e => {
                          if (suggestionIndex !== idx) {
                            e.target.style.background = 'white';
                          }
                        }}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <span style={{ marginRight: '8px', opacity: 0.5 }}>📍</span>
                        {s.properties?.label || s.display_name}
                      </li>
                    ))}
                </ul>
              )}
              {isLoadingSuggestions && (
                <div style={{
                  position: 'absolute',
                  top: 70,
                  left: 0,
                  width: '100%',
                  background: 'rgba(255,255,255,0.97)',
                  border: '1px solid #e0e3e7',
                  borderRadius: 12,
                  zIndex: 10001,
                  padding: '8px 18px',
                  fontSize: 14,
                  color: '#A0AEC0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
                }}>
                  Recherche...
                </div>
              )}
            </div>
          </div>

            {/* Arrivée */}
            <div className="date-field desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1', minWidth: '140px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <DatePicker
                  key={`arr-${arrivee || 'none'}`}
                  selected={arriveeDate}
                  onChange={date => {
                    setArrivee(date ? date.toISOString().slice(0, 10) : "");
                    // Reset départ pour effacer toute sélection précédente dans le calendrier
                    setDepart("");
                    if (date && departPickerRef.current) {
                      departPickerRef.current.setOpen(true);
                      setTimeout(() => {
                        if (departInputRef.current) departInputRef.current.focus();
                      }, 0);
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  placeholderText="Sélectionner"
                  onCalendarOpen={() => setArriveeFocused(true)}
                  onCalendarClose={() => setArriveeFocused(false)}
                  customInput={
                    <button
                      type="button"
                      ref={arriveeRef}
                      onFocus={() => setArriveeFocused(true)}
                      onBlur={() => setArriveeFocused(false)}
                      onKeyDown={handleArriveeKeyDown}
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        border: arriveeFocused ? '2px solid #60A29D' : '2px solid transparent',
                        fontSize: '14px',
                        background: '#F5F1ED',
                        color: arrivee ? '#2D3748' : '#718096',
                        boxShadow: arriveeFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        height: '56px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        fontWeight: '500'
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Arrivée</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>
                        {arrivee
                          ? new Date(arrivee).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short'
                            }).replace(/\.$/, '')
                          : "Date"}
                      </span>
                    </button>
                  }
                />
              </div>
            </div>
            {/* Départ */}
            <div className="date-field desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1', minWidth: '140px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <DatePicker
                  key={`dep-${arrivee || 'none'}-${depart || 'none'}`}
                  selected={departDate}
                  onChange={date => setDepart(date ? date.toISOString().slice(0, 10) : "")}
                  dateFormat="yyyy-MM-dd"
                  minDate={arriveeDate || new Date()}
                  placeholderText="Sélectionner"
                  ref={departPickerRef}
                  onCalendarOpen={() => setDepartFocused(true)}
                  onCalendarClose={() => setDepartFocused(false)}
                  customInput={
                    <button
                      type="button"
                      ref={departInputRef}
                      onFocus={() => setDepartFocused(true)}
                      onBlur={() => setDepartFocused(false)}
                      onKeyDown={handleDepartKeyDown}
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        border: departFocused ? '2px solid #60A29D' : '2px solid transparent',
                        fontSize: '14px',
                        background: '#F5F1ED',
                        color: depart ? '#2D3748' : '#718096',
                        boxShadow: departFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        height: '56px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        fontWeight: '500'
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Départ</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>
                        {depart
                          ? new Date(depart).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short'
                            }).replace(/\.$/, '')
                          : "Date"}
                      </span>
                    </button>
                  }
                />
              </div>
            </div>

            {/* Voyageurs */}
            <div className="travelers-field desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1', minWidth: '120px', zIndex: 10000 }}>
              {/* Masqué */}
              <select
                name="voyageurs"
                id="voyageurs"
                value={voyageurs}
                style={{ display: 'none' }}
                readOnly
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <div style={{ position: 'relative', width: '100%' }}>
                <button
                  type="button"
                  ref={voyageursBtnRef}
                  onClick={() => {
                    setVoyageursOpen(v => !v);
                    setVoyageurIndex(voyageurs - 1);
                  }}
                  onFocus={() => setVoyageursFocused(true)}
                  onBlur={() => setVoyageursFocused(false)}
                  onKeyDown={handleVoyageursKeyDown}
                  style={{
                    position: 'relative',
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: voyageursFocused ? '2px solid #60A29D' : '2px solid transparent',
                    fontSize: '14px',
                    background: '#F5F1ED',
                    color: '#2D3748',
                    boxShadow: voyageursFocused ? '0 4px 20px rgba(96,162,157,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    height: '56px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voyageurs</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{voyageurs} {voyageurs > 1 ? 'personnes' : 'personne'}</span>
                </button>
              {voyageursOpen && (
                <ul
                  ref={voyageursMenuRef}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    top: '60px',
                    left: 0,
                    width: '100%',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    margin: 0,
                    padding: '8px 0',
                    listStyle: 'none',
                    zIndex: 10001,
                    backdropFilter: 'blur(8px)'
                  }}>
                  {[...Array(10)].map((_, i) => (
                    <li
                      key={i + 1}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        background: voyageurIndex === i ? '#60A29D' : (voyageurs === i + 1 ? '#F5F1ED' : 'white'),
                        color: voyageurIndex === i ? 'white' : (voyageurs === i + 1 ? '#60A29D' : '#2D3748'),
                        transition: 'all 0.2s ease',
                        fontWeight: voyageurs === i + 1 ? '600' : '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={e => {
                        if (voyageurIndex !== i && voyageurs !== i + 1) {
                          e.target.style.background = '#F5F1ED';
                        }
                      }}
                      onMouseLeave={e => {
                        if (voyageurIndex !== i && voyageurs !== i + 1) {
                          e.target.style.background = 'white';
                        }
                      }}
                      onMouseDown={() => {
                        setVoyageurs(i + 1);
                        setVoyageursOpen(false);
                        document.querySelector('.btn-search-modern')?.focus();
                      }}
                    >
                      <span>{i + 1} {i + 1 > 1 ? 'personnes' : 'personne'}</span>
                      {voyageurs === i + 1 && <span style={{ color: '#60A29D' }}>✓</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
            </form>
          </div>
          )}
          </div>
        </div>
      </section>

      {/* Carrousel 3D + Arguments - Visible uniquement pour voyageur */}
      {activeTab === 'voyageur' && (
      <section style={{ 
        background: 'white',
        padding: '60px 24px 80px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Carrousel 3D de logements */}
          <div style={{
            perspective: '1000px',
            height: 'clamp(200px, 50vw, 350px)',
            position: 'relative',
            marginBottom: 'clamp(32px, 8vw, 80px)',
            overflow: 'visible'
          }}>
            <div className="carousel-3d" style={{
              display: 'flex',
              gap: 'clamp(16px, 4vw, 24px)',
              animation: 'scroll3d 40s linear infinite',
              transformStyle: 'preserve-3d',
              position: 'absolute',
              left: 0
            }}>
              {[
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop'
              ].map((imageUrl, i) => (
                <div key={i} style={{
                  minWidth: 'clamp(220px, 55vw, 400px)',
                  height: 'clamp(150px, 40vw, 300px)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  transform: 'rotateY(15deg) rotateX(5deg)',
                  transition: 'transform 0.3s ease',
                  cursor: 'pointer',
                  background: '#f0f0f0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1.05)';
                  e.currentTarget.style.zIndex = '10';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'rotateY(15deg) rotateX(5deg)';
                  e.currentTarget.style.zIndex = '1';
                }}
                >
                  <img 
                    src={imageUrl}
                    alt={`Logement ${i + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    loading="lazy"
                  />
                </div>
              ))}
              {/* Duplicate pour boucle infinie */}
              {[
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop'
              ].map((imageUrl, i) => (
                <div key={`dup-${i}`} style={{
                  minWidth: 'clamp(220px, 55vw, 400px)',
                  height: 'clamp(150px, 40vw, 300px)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  transform: 'rotateY(15deg) rotateX(5deg)',
                  transition: 'transform 0.3s ease',
                  cursor: 'pointer',
                  background: '#f0f0f0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1.05)';
                  e.currentTarget.style.zIndex = '10';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'rotateY(15deg) rotateX(5deg)';
                  e.currentTarget.style.zIndex = '1';
                }}
                >
                  <img 
                    src={imageUrl}
                    alt={`Logement ${i + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Arguments pour le modèle équitable */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ 
              fontSize: 'clamp(2rem, 4vw, 3rem)', 
              fontWeight: 800, 
              color: '#2D3748', 
              marginBottom: '20px',
              letterSpacing: '-0.01em'
            }}>
              Voyagez <span style={{ color: '#D79077' }}>autrement</span>
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              color: '#718096', 
              maxWidth: '900px',
              margin: '0 auto 60px',
              lineHeight: 1.6
            }}>
              Des hébergements authentiques qui profitent à ceux qui habitent vraiment les lieux
            </p>
          </div>

          <div
            style={{
              maxWidth: '1100px',
              margin: '0 auto',
              width: '100%'
            }}
          >
            <div
              className="arguments-container"
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                gap: '24px',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(96,162,157,0.3) transparent',
                padding: '0 8px 16px',
                justifyContent: 'center',
                alignItems: 'stretch',
                touchAction: 'pan-x'
              }}
            >
              {/* Argument 1 - Contre la spéculation */}
              <div
                style={{
                  background: 'white',
                  padding: '28px',
                  borderRadius: '20px',
                  border: '2px solid #E2E8F0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  minWidth: '260px',
                  width: '260px',
                  flex: '0 0 260px',
                  scrollSnapAlign: 'start'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(96,162,157,0.15)';
                  e.currentTarget.style.borderColor = '#60A29D';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌍</div>
                <h3 style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#2D3748',
                  marginBottom: '16px'
                }}>
                  Contre la spéculation
                </h3>
                <p style={{
                  color: '#4A5568',
                  lineHeight: 1.7,
                  fontSize: '1rem'
                }}>
                  Pour préserver nos villes, Kokyage met fin à la concurrence entre habitants et touristes qui agrave la crise du logement. Voyagez enfin sans le sentiment de nuire aux locaux.
                </p>
              </div>

              {/* Argument 2 - Modèle juste */}
              <div
                style={{
                  background: 'white',
                  padding: '28px',
                  borderRadius: '20px',
                  border: '2px solid #E2E8F0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  minWidth: '260px',
                  width: '260px',
                  flex: '0 0 260px',
                  scrollSnapAlign: 'start'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(202,173,120,0.15)';
                  e.currentTarget.style.borderColor = '#CAAD78';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤝</div>
                <h3 style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#2D3748',
                  marginBottom: '16px'
                }}>
                  Un modèle juste
                </h3>
                <p style={{
                  color: '#4A5568',
                  lineHeight: 1.7,
                  fontSize: '1rem'
                }}>
                  Kokyage permet enfin la sous location en partageant les revenus entre le locataire principal (60%) et le propriétaire (40%). 
                </p>
              </div>

              {/* Argument 3 - Authentique */}
              <div
                style={{
                  background: 'white',
                  padding: '28px',
                  borderRadius: '20px',
                  border: '2px solid #E2E8F0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  minWidth: '260px',
                  width: '260px',
                  flex: '0 0 260px',
                  scrollSnapAlign: 'start'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(215,144,119,0.15)';
                  e.currentTarget.style.borderColor = '#D79077';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏡</div>
                <h3 style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#2D3748',
                  marginBottom: '16px'
                }}>
                  Hébergements authentiques
                </h3>
                <p style={{
                  color: '#4A5568',
                  lineHeight: 1.7,
                  fontSize: '1rem'
                }}>
                  Des logements habités, entretenus avec soin par leurs locataires. Vivez l'expérience d'un vrai chez-soi, loin des logements standardisés.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
      
      {/* Contenu avec animation fluide */}
      <div style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'opacity, transform',
        position: 'relative',
        zIndex: 10
      }}>
      


      {/* Estimation revenus moderne - Visible uniquement pour hôte */}
      {activeTab === 'hote' && (
      <section className="estimator-section" style={{ 
        background: '#FFFFFF',
        padding: '40px 24px 80px',
        margin: '0',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
        <div className="estimator-card" style={{ 
          background: 'white',
          borderRadius: '28px', 
          boxShadow: '0 18px 50px rgba(0,0,0,0.18)', 
          padding: '52px 40px', 
          border: '1px solid rgba(0,0,0,0.05)',
          position: 'relative',
          zIndex: 30,
          maxWidth: '1040px',
          margin: '-120px auto 0' // seul le bloc carte chevauche la zone orange
        }}>
          <div className="estimator-heading" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', 
              fontWeight: 800, 
              color: '#2D3748', 
              margin: '0 0 12px 0',
              letterSpacing: '-0.01em'
            }}>
              Calculez vos revenus potentiels
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

            {/* Revenus calculés */}
            <div className="revenue-cards" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '24px', 
              width: '100%', 
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <a href="/fonctionnement" style={{ 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, #60A29D 0%, #4A9B94 100%)',
                borderRadius: '20px',
                padding: 'clamp(16px, 2.5vw, 24px) clamp(12px, 2vw, 20px)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(96,162,157,0.3)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                aspectRatio: '1',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 14px 40px rgba(96,162,157,0.35)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(96,162,157,0.3)';
              }}
              role="button"
              aria-label="Voir comment ça marche pour les locataires"
              >
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '100px',
                  height: '100px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }}></div>
                <div className="revenue-card-label" style={{ fontSize: 'clamp(11px, 2vw, 16px)', fontWeight: '600', marginBottom: 'clamp(4px, 1vw, 8px)', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Locataire</div>
                <div className="revenue-amount" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: '800', marginBottom: 'clamp(2px, 0.5vw, 4px)' }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(priceNum * nbNuits * 0.97 * 0.6))}
                </div>
                <img src="/images/locataire_evaluation.png" alt="Locataire" style={{ 
                  margin: '0',
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  flexGrow: 1,
                  minHeight: 0
                }} loading="lazy" />
              </a>
              
              <a href="/fonctionnement" style={{ 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, #CAAD78 0%, #B5935F 100%)',
                borderRadius: '20px',
                padding: 'clamp(16px, 2.5vw, 24px) clamp(12px, 2vw, 20px)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(202,173,120,0.3)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                aspectRatio: '1',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 14px 40px rgba(202,173,120,0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(202,173,120,0.3)';
              }}
              role="button"
              aria-label="Voir comment ça marche pour les propriétaires"
              >
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '100px',
                  height: '100px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }}></div>
                <div className="revenue-card-label" style={{ fontSize: 'clamp(11px, 2vw, 16px)', fontWeight: '600', marginBottom: 'clamp(4px, 1vw, 8px)', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Propriétaire</div>
                <div className="revenue-amount" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: '800', marginBottom: 'clamp(2px, 0.5vw, 4px)' }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(priceNum * nbNuits * 0.97 * 0.4))}
                </div>
                <img src="/images/proprietaire_evaluation.png" alt="Propriétaire" style={{ 
                  margin: '0',
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  flexGrow: 1,
                  minHeight: 0
                }} loading="lazy" />
              </a>
            </div>

            {/* Barre de prix déplacée en dessous */}
            <div style={{ width: '100%', maxWidth: '700px' }}>
              <div className="price-input-section" style={{ 
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '2px solid #E2E8F0',
                marginBottom: '16px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>
                <div className="price-input-text" style={{ textAlign: 'center', marginBottom: '16px', fontSize: '18px', color: '#4A5568' }}>
                  <strong style={{ fontWeight: 700, color: '#60A29D' }}>{nbNuits}</strong> nuits à&nbsp;
                  <input
                    aria-label="Prix par nuit"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pricePerNight}
                    onChange={e => {
                      const raw = e.target.value;
                      const numeric = raw.replace(/[^0-9]/g, '');
                      setPricePerNight(numeric === '' ? '' : Number(numeric));
                    }}
                    style={{ 
                      display: 'inline-block', 
                      width: '60px', 
                      border: 'none', 
                      borderBottom: '3px solid #60A29D', 
                      textAlign: 'center', 
                      fontSize: '18px', 
                      fontWeight: 700, 
                      background: 'transparent',
                      color: '#60A29D',
                      outline: 'none',
                      padding: '4px 0'
                    }}
                  />
                  <span style={{ fontWeight: 600, color: '#374151' }}>€/nuit</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={nbNuits}
                  onChange={e => setNbNuits(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: '#e2e8f0',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                  onTouchStart={e => e.preventDefault()}
                  onTouchMove={e => e.stopPropagation()}
                />
              </div>
            </div>

            {/* CTA modernes */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginTop: '20px'
            }}>
              <a href="/fonctionnement" style={{
                background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(215,144,119,0.4)',
                height: '56px',
                minWidth: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none'
              }}
              onMouseOver={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(215,144,119,0.6)';
              }}
              onMouseOut={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(215,144,119,0.4)';
              }}>
                Comment ça marche ?
              </a>
            </div>
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
            </div>
          </div>
        </div>
        </div>
      </section>
      )}

      {/* Section Concept moderne - Visible uniquement pour hôte */}
      {activeTab === 'hote' && (
      <section className="concept-section" style={{ 
        background: 'white', 
        padding: '80px 24px', 
        textAlign: 'center',
        borderTop: '1px solid #f1f5f9'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 4vw, 3rem)', 
            fontWeight: 800, 
            color: '#2D3748', 
            marginBottom: '24px',
            letterSpacing: '-0.01em'
          }}>
            Le concept <span style={{ color: '#D79077' }}>Kokyage</span>
          </h2>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#718096', 
            lineHeight: 1.7, 
            marginBottom: '48px',
            maxWidth: '600px',
            margin: '0 auto 48px'
          }}>
            Une plateforme de sous-location <strong>simplifiée</strong>, <strong>légale</strong> et <strong>sécurisée</strong>.
          </p>
          
          {/* Features Grid */}
          <div style={{ 
            display: 'grid', 
            gap: '24px', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            marginTop: '48px'
          }}>
            <div style={{
              background: 'white',
              padding: 'clamp(20px, 4vw, 32px) clamp(16px, 3vw, 24px)',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,162,157,0.15)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 'clamp(10px, 2vw, 16px)' }}>✅</div>
              <h4 style={{
                fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                fontWeight: 700,
                color: '#2D3748',
                marginBottom: 'clamp(8px, 1.5vw, 12px)'
              }}>
                100% légal
              </h4>
              <p style={{
                fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                lineHeight: 1.6,
                color: '#4A5568',
                margin: 0
              }}>
                Accord électronique validé par des juristes, conforme à la loi.
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: 'clamp(20px, 4vw, 32px) clamp(16px, 3vw, 24px)',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,162,157,0.15)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 'clamp(10px, 2vw, 16px)' }}>🛡️</div>
              <h4 style={{
                fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                fontWeight: 700,
                color: '#2D3748',
                marginBottom: 'clamp(8px, 1.5vw, 12px)'
              }}>
                100% sécurisé
              </h4>
              <p style={{
                fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                lineHeight: 1.6,
                color: '#4A5568',
                margin: 0
              }}>
                Caution, modération et système de notation.
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: 'clamp(20px, 4vw, 32px) clamp(16px, 3vw, 24px)',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,162,157,0.15)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 'clamp(10px, 2vw, 16px)' }}>🤝</div>
              <h4 style={{
                fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                fontWeight: 700,
                color: '#2D3748',
                marginBottom: 'clamp(8px, 1.5vw, 12px)'
              }}>
                100% équitable
              </h4>
              <p style={{
                fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                lineHeight: 1.6,
                color: '#4A5568',
                margin: 0
              }}>
                Chaque acteur est gagnant : locataire, propriétaire et voyageur.
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: 'clamp(20px, 4vw, 32px) clamp(16px, 3vw, 24px)',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(96,162,157,0.15)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 'clamp(10px, 2vw, 16px)' }}>🌍</div>
              <h4 style={{
                fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                fontWeight: 700,
                color: '#2D3748',
                marginBottom: 'clamp(8px, 1.5vw, 12px)'
              }}>
                100% responsable
              </h4>
              <p style={{
                fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                lineHeight: 1.6,
                color: '#4A5568',
                margin: 0
              }}>
                Contre la spéculation immobilière, pour un usage raisonné du logement.
              </p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Section Garanties en cas de dégradations - Visible uniquement pour hôte */}
      {activeTab === 'hote' && (
      <section style={{ 
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)', 
        padding: '80px 24px',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ 
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', 
              fontWeight: 800, 
              color: '#2D3748',
              marginBottom: '16px',
              letterSpacing: '-0.01em'
            }}>
              🛡️ Garanties et protection
            </h2>
            <p style={{ 
              fontSize: '1.15rem', 
              color: '#718096', 
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Vous et votre logement sont protégés à plusieurs niveaux
            </p>
          </div>

          <div className="guarantees-container" style={{ 
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(96,162,157,0.3) transparent',
            paddingBottom: '16px',
            justifyContent: 'flex-start'
          }}>
            {/* Empreinte bancaire */}
            <div style={{
              background: 'white',
              padding: 'clamp(24px, 4vw, 32px) clamp(16px, 3vw, 20px)',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #E2E8F0',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              textAlign: 'center',
              minWidth: '220px',
              width: '220px',
              flex: '0 0 220px',
              minHeight: '400px',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(96,162,157,0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            }}>
              <h3 style={{
                fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
                fontWeight: 700,
                color: '#2D3748',
                marginBottom: 'clamp(12px, 2.5vw, 20px)'
              }}>
                Caution de 300€
              </h3>
              <p style={{
                color: '#718096',
                lineHeight: 1.7,
                fontSize: 'clamp(0.9rem, 1.6vw, 1.05rem)'
              }}>
                Une empreinte bancaire est enregistrée auprès de chaque voyageur avant le séjour. Dans les rares cas de dégradations et après validation par nos modérateurs, jusqu'à 300€ peuvent être prélevés pour couvrir les réparations.
              </p>
            </div>

            {/* Assurance RC */}
            <div style={{
              background: 'white',
              padding: 'clamp(24px, 4vw, 32px) clamp(16px, 3vw, 20px)',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #E2E8F0',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              textAlign: 'center',
              minWidth: '220px',
              width: '220px',
              flex: '0 0 220px',
              minHeight: '400px',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(202,173,120,0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            }}>
              <h3 style={{
                fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
                fontWeight: 700,
                color: '#2D3748',
                marginBottom: 'clamp(12px, 2.5vw, 20px)'
              }}>
              Assurance du voyageur
              </h3>
              <p style={{
                color: '#718096',
                lineHeight: 1.7,
                fontSize: 'clamp(0.9rem, 1.6vw, 1.05rem)'
              }}>
                Pour les dommages plus importants, l'assurance responsabilité civile du voyageur est sollicitée en priorité. Il est fortement recommandé de demander une attestation de villégiature avant le séjour.
              </p>
            </div>

            {/* Responsabilité locataire */}
            <div style={{
              background: 'white',
              padding: 'clamp(24px, 4vw, 32px) clamp(16px, 3vw, 20px)',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #E2E8F0',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              textAlign: 'center',
              minWidth: '220px',
              width: '220px',
              flex: '0 0 220px',
              minHeight: '400px',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(215,144,119,0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            }}>
              <h3 style={{
                fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
                fontWeight: 700,
                color: '#2D3748',
                marginBottom: 'clamp(12px, 2.5vw, 20px)'
              }}>
              Locataire garant
              </h3>
              <p style={{
                color: '#718096',
                lineHeight: 1.7,
                fontSize: 'clamp(0.9rem, 1.6vw, 1.05rem)'
              }}>
                Le locataire principal reste juridiquement responsable du logement si les deux garanties précédentes ne couvrent pas l'intégralité des réparations.
              </p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Section Call to Action - Fonctionnement - Visible uniquement pour hôte */}
      {activeTab === 'hote' && (
      <section className="cta-fonctionnement" style={{ 
        background: 'white', 
        padding: '100px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '50%',
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          background: 'rgba(118, 75, 162, 0.05)',
          borderRadius: '50%',
        }}></div>
        
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 3rem)', 
            fontWeight: 800, 
            color: '#1f2937', 
            marginBottom: '48px',
            letterSpacing: '-0.01em',
            textShadow: 'none',
            whiteSpace: 'nowrap'
          }}>
            Découvrez comment ça marche
          </h2>
          
          <a 
            href="/fonctionnement"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #60A29D 0%, #4A9B94 100%)',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 700,
              padding: '20px 48px',
              borderRadius: '50px',
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(96,162,157,0.3)',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px) scale(1.05)';
              e.target.style.boxShadow = '0 15px 40px rgba(96,162,157,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 10px 30px rgba(96,162,157,0.3)';
            }}
          >
            Tous les détails ici →
          </a>
          
          <div style={{ 
            marginTop: '48px',
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            flexWrap: 'wrap',
            color: '#4b5563',
            fontSize: '0.95rem',
            opacity: 0.9
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Simple et rapide
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              100% légal
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Gagnez de l'argent
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Section CTA finale moderne - Visible uniquement pour hôte */}
      {activeTab === 'hote' && (
      <section style={{ 
        background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)', 
        padding: '80px 24px',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '5%',
          width: '100px',
          height: '100px',
          background: 'rgba(102,126,234,0.1)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '80px',
          height: '80px',
          background: 'rgba(245,158,11,0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite reverse'
        }}></div>
        
        <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
            fontWeight: 800, 
            marginBottom: '24px',
            letterSpacing: '-0.02em'
          }}>
            Prêt à commencer ?
          </h2>
          <p style={{ 
            fontSize: '1.2rem', 
            opacity: 0.9, 
            marginBottom: '40px', 
            lineHeight: 1.6 
          }}>
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginTop: '40px'
          }}>
            <a href="/inscription" style={{
              background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1.1rem',
              boxShadow: '0 8px 25px rgba(215,144,119,0.4)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={e => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 35px rgba(102,126,234,0.6)';
            }}
            onMouseOut={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(102,126,234,0.4)';
            }}>
              🚀 Créer mon compte
            </a>
            
            <a href="/logements" style={{
              background: 'transparent',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1.1rem',
              border: '2px solid rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={e => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.borderColor = 'rgba(255,255,255,0.6)';
              e.target.style.transform = 'translateY(-3px)';
            }}
            onMouseOut={e => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateY(0)';
            }}>
              🔍 Explorer les logements
            </a>
          </div>
          
          {/* Stats ou témoignages */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '32px',
            marginTop: '60px',
            maxWidth: '600px',
            margin: '60px auto 0'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#60A29D' }}>XX</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Logements disponibles</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#CAAD78' }}>98%</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Satisfaction client</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#C96745' }}>100%</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>De logements authentiques</div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Section Propulsé par - Visible pour hôte et voyageur */}
      {(activeTab === 'hote' || activeTab === 'voyageur') && (
      <section style={{ 
        background: 'white', 
        padding: '60px 24px',
        borderTop: '1px solid #E5E7EB'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ 
            fontSize: '1rem', 
            color: '#9CA3AF', 
            marginBottom: '32px',
            fontWeight: 500,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Propulsé par
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '60px',
            flexWrap: 'wrap'
          }}>
            <img 
              src="/BGE.png" 
              alt="BGE" 
              style={{ 
                height: '60px', 
                width: 'auto',
                objectFit: 'contain',
                opacity: 0.7,
                transition: 'opacity 0.3s ease',
                filter: 'grayscale(100%)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.filter = 'grayscale(0%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.filter = 'grayscale(100%)';
              }}
            />
            <img 
              src="/CSE.jpeg" 
              alt="CSE" 
              style={{ 
                height: '60px', 
                width: 'auto',
                objectFit: 'contain',
                opacity: 0.7,
                transition: 'opacity 0.3s ease',
                filter: 'grayscale(100%)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.filter = 'grayscale(0%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.filter = 'grayscale(100%)';
              }}
            />
            <img 
              src="/POLD.png" 
              alt="POLD" 
              style={{ 
                height: '60px', 
                width: 'auto',
                objectFit: 'contain',
                opacity: 0.7,
                transition: 'opacity 0.3s ease',
                filter: 'grayscale(100%)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.filter = 'grayscale(0%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.filter = 'grayscale(100%)';
              }}
            />
          </div>
        </div>
      </section>
      )}
      
      </div>
      
    </main>
    <Footer />
    <Chatbot />
    <MobileSearchWorkflow 
      isOpen={mobileSearchOpen} 
      onClose={() => setMobileSearchOpen(false)} 
    />

    {/* CSS Responsive + Animations */}
    <style jsx>{`
      @keyframes scroll3d {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }

      .carousel-3d:hover {
        animation-play-state: paused;
      }

      .guarantees-container::-webkit-scrollbar {
        height: 8px;
      }
      
      .guarantees-container::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
      }
      
      .guarantees-container::-webkit-scrollbar-thumb {
        background: rgba(96, 162, 157, 0.3);
        border-radius: 4px;
      }
      
      .guarantees-container::-webkit-scrollbar-thumb:hover {
        background: rgba(96, 162, 157, 0.5);
      }

      @media (min-width: 900px) {
        .guarantees-container {
          justify-content: center !important;
          flex-wrap: wrap !important;
        }
        
        .guarantees-container > div {
          flex: 0 0 280px !important;
          width: 280px !important;
          min-width: 280px !important;
        }
      }

      @media (max-width: 768px) {
        .floating-bubble {
          width: 100px !important;
          height: 100px !important;
          max-width: 100px !important;
          max-height: 100px !important;
        }
        
        .desktop-only {
          display: none !important;
        }
        
        .search-card-modern {
          padding: 28px 20px !important;
          border-radius: 24px !important;
        }
        
        .search-form-modern {
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          gap: 12px !important;
          padding: 16px !important;
          overflow-x: auto !important;
          justify-content: space-between !important;
        }

        .arguments-container {
          justify-content: flex-start !important;
        }
        
        .search-input-container {
          min-width: 0 !important;
          max-width: none !important;
          flex: 1 1 auto !important;
        }
        
        .btn-search-modern {
          min-width: 60px !important;
          width: 60px !important;
          padding: 20px !important;
          border-radius: 14px !important;
        }
        
        .search-text {
          display: none !important;
        }
        
        .search-icon {
          font-size: 20px !important;
        }
        
        .hero-section {
          padding: 42px 18px 42px !important;
        }
        
        .hero-section > div > div:nth-of-type(2) {
          height: 220px !important;
          margin-bottom: 36px !important;
        }
        
        .hero-section > div > div:nth-of-type(2) > div > div {
          min-width: 150px !important;
          height: 180px !important;
        }

        .estimator-section {
          padding: 0 20px 50px !important;
          margin-top: 0 !important;
        }
        
        .estimator-card {
          padding: 40px 28px !important;
          border-radius: 24px !important;
          margin-top: -150px !important;
        }

        .concept-section {
          padding: 50px 20px 40px !important;
        }

        .concept-section + section {
          padding: 40px 20px 50px !important;
        }

        .estimator-heading {
          margin-bottom: 28px !important;
        }

        .search-title {
          font-size: 1.4rem !important;
          white-space: nowrap !important;
          margin-bottom: 28px !important;
        }

        .estimator-heading h3 {
          font-size: 1.8rem !important;
          margin-bottom: 12px !important;
        }

        .estimator-subtitle {
          font-size: 1.05rem !important;
        }

        .price-input-section {
          padding: 24px !important;
          margin-bottom: 16px !important;
        }

        .price-input-text {
          font-size: 17px !important;
          margin-bottom: 14px !important;
        }
        
        .revenue-cards {
          grid-template-columns: 1fr 1fr !important;
          gap: 16px !important;
        }
        
        .revenue-cards > a {
          padding: clamp(12px, 2vw, 16px) clamp(8px, 1.5vw, 10px) !important;
          border-radius: 18px !important;
        }
        
        .revenue-cards img {
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          flex-grow: 1 !important;
          min-height: 0 !important;
          object-fit: contain !important;
        }
        
        .cta-buttons {
          flex-direction: row !important;
          gap: 14px !important;
        }
        
        .cta-buttons > a {
          min-width: unset !important;
          max-width: unset !important;
          flex: 1 !important;
          padding: 18px 14px !important;
          font-size: 15px !important;
        }
        
        .date-field {
          min-width: unset !important;
          flex: none !important;
        }
        
        .travelers-field {
          min-width: unset !important;
          flex: none !important;
        }
        
        /* Onglets responsive - ne débordent pas */
        .hero-section > div > div:first-of-type {
          max-width: calc(100vw - 40px) !important;
          margin: 0 auto 48px !important;
          padding: 8px !important;
        }
        
        .hero-section > div > div:first-of-type button {
          padding: 14px 20px !important;
          font-size: 0.95rem !important;
          white-space: nowrap !important;
        }
        
        /* Titre principal - ajuste taille pour garder même nombre de lignes */
        h1 {
          font-size: clamp(2rem, 8.5vw, 4rem) !important;
          line-height: 1.25 !important;
          padding: 0 12px !important;
        }
        
        /* Cases 60% et 40% côte à côte sur mobile */
        .revenue-split-cards {
          display: flex !important;
          flex-wrap: nowrap !important;
          gap: 16px !important;
          justify-content: center !important;
          padding: 0 12px !important;
          margin-bottom: 28px !important;
        }
        
        .revenue-split-cards > div {
          padding: clamp(12px, 2.5vw, 16px) clamp(16px, 3vw, 20px) !important;
          min-width: 0 !important;
          flex: 1 1 48% !important;
          max-width: none !important;
          aspect-ratio: 1 !important;
          min-height: 210px !important;
        }

      }
      
      @media (max-width: 480px) {
        .floating-bubble {
          width: 80px !important;
          height: 80px !important;
          max-width: 80px !important;
          max-height: 80px !important;
        }
        .search-card-modern {
          padding: 20px 16px !important;
          margin: 0 20px !important;
        }
        
        .search-form-modern {
          padding: 12px !important;
        }
        
        .estimator-section {
          padding: 0 16px !important;
        }
        
        .estimator-card {
          padding: 32px 20px !important;
        }

        .estimator-heading {
          margin-bottom: 20px !important;
        }

        .estimator-heading h3 {
          font-size: 1.5rem !important;
          margin-bottom: 10px !important;
        }

        .estimator-subtitle {
          font-size: 1rem !important;
        }

        .price-input-section {
          padding: 20px !important;
          margin-bottom: 16px !important;
          border-radius: 14px !important;
        }

        .price-input-text {
          font-size: 15px !important;
          margin-bottom: 12px !important;
        }

        .price-input-text input {
          width: 60px !important;
          font-size: 17px !important;
        }

        .search-title {
          font-size: 1.2rem !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        
        .btn-search-modern {
          padding: 18px 22px !important;
          font-size: 16px !important;
        }
        
        /* Hero section mobile */
        section:first-of-type {
          padding: 50px 16px 50px !important;
        }
        
        .hero-section > div > div:nth-of-type(2) {
          height: 200px !important;
          margin-bottom: 40px !important;
        }
        
        .hero-section > div > div:nth-of-type(2) > div > div {
          min-width: 240px !important;
          height: 160px !important;
        }
        
        /* Stats grid mobile */
        section:last-of-type > div > div:nth-of-type(2) {
          grid-template-columns: 1fr 1fr !important;
          gap: 24px !important;
          text-align: center !important;
        }
        
        section:last-of-type > div > div:nth-of-type(2) > div:last-child {
          grid-column: 1 / -1 !important;
        }
        
        /* CTA buttons mobile */
        section:last-of-type > div > div:last-of-type {
          flex-direction: column !important;
          gap: 16px !important;
        }
        
        section:last-of-type > div > div:last-of-type > a {
          width: 100% !important;
          text-align: center !important;
          justify-content: center !important;
        }
        
        .revenue-cards > a {
          padding: clamp(10px, 2vw, 14px) clamp(6px, 1.5vw, 10px) !important;
          aspect-ratio: 1 !important;
        }

        .revenue-cards img {
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          flex-grow: 1 !important;
          min-height: 0 !important;
          object-fit: contain !important;
        }
        
        .revenue-card-label {
          font-size: 10px !important;
          margin-bottom: 3px !important;
        }
        
        .revenue-amount {
          font-size: clamp(1.1rem, 3.5vw, 1.6rem) !important;
          margin-bottom: 2px !important;
        }
        
        .cta-buttons > a {
          padding: 16px 10px !important;
          font-size: 14px !important;
        }
        
        .cta-buttons > a > div:last-child {
          font-size: 17px !important;
        }
        
        /* Cases 60% et 40% encore plus compactes sur petits écrans */
        .revenue-split-cards {
          gap: clamp(12px, 2.5vw, 16px) !important;
        }
        
        .revenue-split-cards > div {
          padding: clamp(10px, 2.2vw, 13px) clamp(14px, 2.8vw, 18px) !important;
          aspect-ratio: 1 !important;
          min-height: 220px !important;
        }

      }
    `}</style>
  </>;
}
