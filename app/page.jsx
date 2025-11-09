"use client";

import { useRef, useState, createRef, useEffect } from "react";
import Header from './_components/Header';
import Footer from './_components/Footer';
import Chatbot from './_components/Chatbot';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Page() {
  const [lieu, setLieu] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const suggestionsMenuRef = useRef(null);

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

  // État pour gérer l'onglet actif
  const [activeTab, setActiveTab] = useState('voyageur'); // 'voyageur' ou 'hote'
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fonction pour changer d'onglet avec animation moderne
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150); // Changement rapide après le début du fondu
  };

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

  return <>
    <Header />
    <main style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', background: 'linear-gradient(135deg, #F5F1ED 0%, #E8E3DC 100%)', minHeight: '100vh', paddingBottom: 0 }}>
      
      {/* Hero Section with Modern Design */}
      <section className="hero-section" style={{ 
        background: 'linear-gradient(135deg, #D79077 0%, #C96745 100%)', 
        padding: '80px 24px 120px',
        textAlign: 'center', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
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
          
          {/* Onglets modernes intégrés */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '40px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            padding: '8px',
            borderRadius: '100px',
            maxWidth: '600px',
            margin: '0 auto 40px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <button
              onClick={() => handleTabChange('voyageur')}
              style={{
                flex: 1,
                background: activeTab === 'voyageur' 
                  ? 'white' 
                  : 'transparent',
                color: activeTab === 'voyageur' ? '#D79077' : 'white',
                border: 'none',
                borderRadius: '100px',
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'voyageur' 
                  ? '0 4px 20px rgba(0,0,0,0.15)' 
                  : 'none',
                transform: activeTab === 'voyageur' ? 'scale(1.02)' : 'scale(1)',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={e => {
                if (activeTab !== 'voyageur') {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseOut={e => {
                if (activeTab !== 'voyageur') {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              Je cherche un séjour
            </button>
            <button
              onClick={() => handleTabChange('hote')}
              style={{
                flex: 1,
                background: activeTab === 'hote' 
                  ? 'white' 
                  : 'transparent',
                color: activeTab === 'hote' ? '#D79077' : 'white',
                border: 'none',
                borderRadius: '100px',
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'hote' 
                  ? '0 4px 20px rgba(0,0,0,0.15)' 
                  : 'none',
                transform: activeTab === 'hote' ? 'scale(1.02)' : 'scale(1)',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={e => {
                if (activeTab !== 'hote') {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseOut={e => {
                if (activeTab !== 'hote') {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              Je sous-loue mon logement
            </button>
          </div>

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
              marginBottom: '24px', 
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.23)'
            }}>
              {activeTab === 'voyageur' ? (
                <>Des hébergements <br /><span style={{ color: '#4ECDC4' }}> équitables et authentiques </span></>
              ) : (
                <>La sous-location<br /><span style={{ color: '#4ECDC4' }}>enfin possible</span></>
              )}
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              opacity: 0.9, 
              marginBottom: '48px', 
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto 48px'
            }}>
              {activeTab === 'hote' && 'Partagez les revenus avec votre propriétaire et offrez-vous enfin des vacances !'}
            </p>
            
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
              flexWrap: 'wrap', 
              justifyContent: 'center',
              background: 'white',
              borderRadius: '16px',
              padding: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
            <div className="search-input-container" style={{ position: 'relative', flex: '2', minWidth: '200px', zIndex: 10000 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <input
                    name="destination"
                    placeholder="Où souhaitez-vous aller ?"
                    value={lieu}
                    onChange={e => {
                      setLieu(e.target.value);
                      setSuggestionIndex(-1);
                      setHasTypedLieu(true);
                    }}
                    autoComplete="off"
                    onFocus={() => setLieuFocused(true)}
                    onBlur={() => setLieuFocused(false)}
                    onKeyDown={handleLieuKeyDown}
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
                      fontWeight: '500'
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

            <button 
              className="btn-search-modern" 
              type="submit" 
              style={{ 
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
                gap: '8px'
              }}
              onMouseOver={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(102,126,234,0.6)';
              }}
              onMouseOut={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102,126,234,0.4)';
              }}
            >
              <span className="search-icon">🔍</span>
              <span className="search-text">Rechercher</span>
            </button>
            </form>
          </div>
          )}
          </div>
        </div>
      </section>
      
      {/* Contenu avec animation fluide */}
      <div style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'opacity, transform'
      }}>
      
      {/* Section Partage des revenus - Visible uniquement pour hôte - DÉPLACÉE EN PREMIER */}
      {activeTab === 'hote' && (
      <section style={{ 
        background: 'linear-gradient(135deg, #60A29D 0%, #4A8985 100%)',
        padding: '80px 24px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 4vw, 2.8rem)', 
            fontWeight: 800, 
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            💰 Partage des revenus
          </h2>
          <p style={{ 
            textAlign: 'center', 
            fontSize: '1.15rem', 
            marginBottom: '48px',
            opacity: 0.95
          }}>
            Un modèle équitable qui profite à tous
          </p>

          <div className="revenue-split-cards" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            marginBottom: '32px'
          }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              padding: '40px 32px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '2px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}>
              <div style={{ 
                fontSize: '4.5rem', 
                fontWeight: 900, 
                marginBottom: '12px',
                color: '#FFE66D',
                textShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                60%
              </div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                marginBottom: '12px'
              }}>
                Pour le locataire
              </h3>
              <p style={{ 
                fontSize: '1rem', 
                opacity: 0.9,
                lineHeight: 1.6
              }}>
                Celui qui gère les réservations et accueille les voyageurs
              </p>
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              padding: '40px 32px',
              borderRadius: '20px',
              textAlign: 'center',
              border: '2px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}>
              <div style={{ 
                fontSize: '4.5rem', 
                fontWeight: 900, 
                marginBottom: '12px',
                color: '#FFE66D',
                textShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                40%
              </div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                marginBottom: '12px'
              }}>
                Pour le propriétaire
              </h3>
              <p style={{ 
                fontSize: '1rem', 
                opacity: 0.9,
                lineHeight: 1.6
              }}>
                Revenus passifs sans aucun effort de gestion
              </p>
            </div>
          </div>


        </div>
      </section>
      )}

      {/* Estimation revenus moderne - Visible uniquement pour hôte */}
      {activeTab === 'hote' && (
      <section className="estimator-section" style={{ 
        maxWidth: '1100px', 
        margin: '-60px auto 60px', 
        padding: '0 24px',
        position: 'relative',
        zIndex: 0
      }}>
        <div className="estimator-card" style={{ 
          background: 'white',
          borderRadius: '24px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)', 
          padding: '48px 32px', 
          border: '1px solid rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)'
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
                padding: '32px 24px',
                color: 'white',
                boxShadow: '0 10px 30px rgba(96,162,157,0.3)',
                position: 'relative',
                overflow: 'hidden',
                display: 'block',
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
                <div className="revenue-card-label" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Locataire</div>
                <div className="revenue-amount" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: '800', marginBottom: '16px' }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(priceNum * nbNuits * 0.97 * 0.6))}
                </div>
                <img src="/images/locataire_evaluation.png" alt="Locataire" style={{ 
                  margin: '20px auto 0', 
                  width: '100%', 
                  maxWidth: '320px',
                  height: '220px', 
                  objectFit: 'contain', 
                  borderRadius: '12px',
                  border: '3px solid rgba(255, 255, 255, 0)'
                }} loading="lazy" />
              </a>
              
              <a href="/fonctionnement" style={{ 
                textAlign: 'center', 
                background: 'linear-gradient(135deg, #CAAD78 0%, #B5935F 100%)',
                borderRadius: '20px',
                padding: '32px 24px',
                color: 'white',
                boxShadow: '0 10px 30px rgba(202,173,120,0.3)',
                position: 'relative',
                overflow: 'hidden',
                display: 'block',
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
                <div className="revenue-card-label" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Propriétaire</div>
                <div className="revenue-amount" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: '800', marginBottom: '16px' }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(priceNum * nbNuits * 0.97 * 0.4))}
                </div>
                <img src="/images/proprietaire_evaluation.png" alt="Propriétaire" style={{ 
                  margin: '20px auto 0', 
                  width: '100%', 
                  maxWidth: '320px',
                  height: '220px', 
                  objectFit: 'contain', 
                  borderRadius: '12px',
                  border: '3px solid rgba(255, 255, 255, 0)'
                }} loading="lazy" />
              </a>
            </div>

            {/* Barre de prix déplacée en dessous */}
            <div style={{ width: '100%', maxWidth: '700px' }}>
              <div className="price-input-section" style={{ 
                background: '#F5F1ED',
                borderRadius: '16px',
                padding: '24px',
                border: '2px solid #E8E3DC',
                marginBottom: '16px',
                overflow: 'hidden',
                position: 'relative'
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
          <div className="features-badges" style={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            marginTop: '48px'
          }}>
            <div className="feature-badge" style={{ textAlign: 'center', flex: '0 1 auto' }}>
              <div style={{ 
                width: '70px', 
                height: '70px', 
                background: 'linear-gradient(135deg, #60A29D 0%, #4A9B94 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '1.8rem'
              }}>
                ⚖️
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#2D3748', marginBottom: '6px' }}>100% Légal</h4>
              <p style={{ color: '#718096', fontSize: '0.85rem', margin: 0 }}>Cadre juridique sécurisé</p>
            </div>
            
            <div className="feature-badge" style={{ textAlign: 'center', flex: '0 1 auto' }}>
              <div style={{ 
                width: '70px', 
                height: '70px', 
                background: 'linear-gradient(135deg, #CAAD78 0%, #B5935F 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '1.8rem'
              }}>
                🛡️
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#2D3748', marginBottom: '6px' }}>Sécurisé</h4>
              <p style={{ color: '#718096', fontSize: '0.85rem', margin: 0 }}>enregistrement empreinte bancaire</p>
            </div>
            
            <div className="feature-badge" style={{ textAlign: 'center', flex: '0 1 auto' }}>
              <div style={{ 
                width: '70px', 
                height: '70px', 
                background: 'linear-gradient(135deg, #e28060ff 0%, #741b05ff 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '1.8rem'
              }}>
                👌
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#2D3748', marginBottom: '6px' }}>Simple</h4>
              <p style={{ color: '#718096', fontSize: '0.85rem', margin: 0 }}>Processus automatisé</p>
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
      
      </div>
      
    </main>
    <Footer />
    <Chatbot />

    {/* CSS Responsive + Animations */}
    <style jsx>{`
      @media (max-width: 768px) {
        .desktop-only {
          display: none !important;
        }
        
        .search-card-modern {
          padding: 20px 16px !important;
          border-radius: 20px !important;
        }
        
        .search-form-modern {
          flex-direction: row !important;
          gap: 12px !important;
          padding: 12px !important;
        }
        
        .search-input-container {
          min-width: unset !important;
          flex: 1 !important;
        }
        
        .btn-search-modern {
          min-width: 56px !important;
          width: 56px !important;
          padding: 18px !important;
          border-radius: 12px !important;
        }
        
        .search-text {
          display: none !important;
        }
        
        .search-icon {
          font-size: 18px !important;
        }
        
        .estimator-section {
          margin: -40px auto 40px !important;
          padding: 0 16px !important;
        }
        
        .estimator-card {
          padding: 32px 24px !important;
          border-radius: 20px !important;
        }

        .estimator-heading {
          margin-bottom: 24px !important;
        }

        .search-title {
          font-size: 1.3rem !important;
          white-space: nowrap !important;
          margin-bottom: 24px !important;
        }

        .estimator-heading h3 {
          font-size: 1.6rem !important;
          margin-bottom: 10px !important;
        }

        .estimator-subtitle {
          font-size: 1rem !important;
        }

        .price-input-section {
          padding: 20px !important;
          margin-bottom: 12px !important;
        }

        .price-input-text {
          font-size: 16px !important;
          margin-bottom: 12px !important;
        }
        
        .revenue-cards {
          grid-template-columns: 1fr 1fr !important;
          gap: 12px !important;
        }
        
        .revenue-cards > a {
          padding: 20px 12px !important;
          border-radius: 16px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        
        .revenue-card-label {
          font-size: 12px !important;
          margin-bottom: 6px !important;
        }

        .revenue-amount {
          font-size: 1.3rem !important;
          margin-bottom: 8px !important;
        }
        
        .revenue-cards img {
          max-width: 240px !important;
          height: 165px !important;
          margin: 8px auto 0 !important;
        }
        
        .cta-buttons {
          flex-direction: row !important;
          gap: 10px !important;
        }
        
        .cta-buttons > a {
          min-width: unset !important;
          max-width: unset !important;
          flex: 1 !important;
          padding: 16px 12px !important;
          font-size: 14px !important;
        }
        
        .date-field {
          min-width: unset !important;
          flex: none !important;
        }
        
        .travelers-field {
          min-width: unset !important;
          flex: none !important;
        }
        
        /* Cases 60% et 40% côte à côte sur mobile */
        .revenue-split-cards {
          grid-template-columns: 1fr 1fr !important;
          gap: 16px !important;
        }
        
        .revenue-split-cards > div {
          padding: 24px 16px !important;
        }
        
        .revenue-split-cards > div > div:first-child {
          font-size: 3rem !important;
        }
        
        .revenue-split-cards > div > h3 {
          font-size: 1.1rem !important;
        }
        
        .revenue-split-cards > div > p {
          font-size: 0.85rem !important;
        }
        
        /* Badges features toujours en ligne mais plus compacts */
        .features-badges {
          gap: 16px !important;
        }
        
        .feature-badge > div:first-child {
          width: 60px !important;
          height: 60px !important;
          font-size: 1.5rem !important;
          margin-bottom: 10px !important;
        }
        
        .feature-badge h4 {
          font-size: 0.9rem !important;
        }
        
        .feature-badge p {
          font-size: 0.75rem !important;
        }
      }
      
      @media (max-width: 480px) {
        .search-card-modern {
          padding: 16px 12px !important;
          margin: 0 16px !important;
        }
        
        .search-form-modern {
          padding: 8px !important;
        }
        
        .estimator-section {
          padding: 0 12px !important;
        }
        
        .estimator-card {
          padding: 24px 16px !important;
        }

        .estimator-heading {
          margin-bottom: 16px !important;
        }

        .estimator-heading h3 {
          font-size: 1.3rem !important;
          margin-bottom: 8px !important;
        }

        .estimator-subtitle {
          font-size: 0.95rem !important;
        }

        .price-input-section {
          padding: 16px !important;
          margin-bottom: 12px !important;
          border-radius: 12px !important;
        }

        .price-input-text {
          font-size: 14px !important;
          margin-bottom: 10px !important;
        }

        .price-input-text input {
          width: 50px !important;
          font-size: 16px !important;
        }

        .search-title {
          font-size: 1.1rem !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        
        .btn-search-modern {
          padding: 16px 20px !important;
          font-size: 15px !important;
        }
        
        /* Hero section mobile */
        section:first-of-type {
          padding: 60px 16px 80px !important;
        }
        
        /* Stats grid mobile */
        section:last-of-type > div > div:nth-of-type(2) {
          grid-template-columns: 1fr 1fr !important;
          gap: 20px !important;
          text-align: center !important;
        }
        
        section:last-of-type > div > div:nth-of-type(2) > div:last-child {
          grid-column: 1 / -1 !important;
        }
        
        /* CTA buttons mobile */
        section:last-of-type > div > div:last-of-type {
          flex-direction: column !important;
          gap: 12px !important;
        }
        
        section:last-of-type > div > div:last-of-type > a {
          width: 100% !important;
          text-align: center !important;
          justify-content: center !important;
        }
        
        .revenue-cards > a {
          padding: 16px 8px !important;
        }

        .revenue-card-label {
          font-size: 11px !important;
          margin-bottom: 4px !important;
        }

        .revenue-amount {
          font-size: 1.1rem !important;
          margin-bottom: 6px !important;
        }
        
        .revenue-cards img {
          max-width: 200px !important;
          height: 135px !important;
          margin: 6px auto 0 !important;
        }
        
        .cta-buttons > a {
          padding: 14px 8px !important;
          font-size: 13px !important;
        }
        
        .cta-buttons > a > div:last-child {
          font-size: 16px !important;
        }
        
        /* Cases 60% et 40% encore plus compactes sur petits écrans */
        .revenue-split-cards {
          gap: 12px !important;
        }
        
        .revenue-split-cards > div {
          padding: 20px 12px !important;
        }
        
        .revenue-split-cards > div > div:first-child {
          font-size: 2.5rem !important;
        }
        
        .revenue-split-cards > div > h3 {
          font-size: 1rem !important;
        }
        
        .revenue-split-cards > div > p {
          font-size: 0.8rem !important;
        }
        
        /* Badges features encore plus compacts sur petits écrans */
        .features-badges {
          gap: 12px !important;
        }
        
        .feature-badge > div:first-child {
          width: 50px !important;
          height: 50px !important;
          font-size: 1.3rem !important;
          margin-bottom: 8px !important;
        }
        
        .feature-badge h4 {
          font-size: 0.85rem !important;
        }
        
        .feature-badge p {
          font-size: 0.7rem !important;
        }
      }
    `}</style>
  </>
  ;
            }
