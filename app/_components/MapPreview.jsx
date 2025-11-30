import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix pour les icônes de marker par défaut de Leaflet avec Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapPreview({ latitude, longitude }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const offsetCoordsRef = useRef(null);

  // Génère un offset aléatoire stable pour masquer la localisation exacte
  useEffect(() => {
    if (latitude && longitude && !offsetCoordsRef.current) {
      // Offset aléatoire entre -0.003 et +0.003 degrés (~300m)
      const offsetLat = (Math.random() - 0.5) * 0.006;
      const offsetLng = (Math.random() - 0.5) * 0.006;
      offsetCoordsRef.current = {
        lat: latitude + offsetLat,
        lng: longitude + offsetLng
      };
    }
  }, [latitude, longitude]);

  // Crée la carte une seule fois, seulement si le div ET latitude/longitude sont définis
  useEffect(() => {
    if (!mapRef.current || leafletMap.current || !latitude || !longitude || !offsetCoordsRef.current) return;
    
    const { lat, lng } = offsetCoordsRef.current;
    
    leafletMap.current = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(leafletMap.current);
    
    // Ajoute un cercle semi-transparent au lieu d'un marqueur précis
    circleRef.current = L.circle([lat, lng], {
      color: '#C96745',
      fillColor: '#C96745',
      fillOpacity: 0.15,
      radius: 250, // rayon de ~250m
      weight: 2
    }).addTo(leafletMap.current);
  }, [latitude, longitude]);

  // Met à jour la vue et le cercle sans recréer la carte
  useEffect(() => {
    if (!leafletMap.current || !latitude || !longitude || !offsetCoordsRef.current) return;
    
    const { lat, lng } = offsetCoordsRef.current;
    
    leafletMap.current.setView([lat, lng], 15);
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
    } else {
      circleRef.current = L.circle([lat, lng], {
        color: '#C96745',
        fillColor: '#C96745',
        fillOpacity: 0.15,
        radius: 250,
        weight: 2
      }).addTo(leafletMap.current);
    }
  }, [latitude, longitude]);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '220px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', margin: '0 auto' }}
    />
  );
}
