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

  // Crée la carte une seule fois, seulement si le div ET latitude/longitude sont définis
  useEffect(() => {
    if (!mapRef.current || leafletMap.current || !latitude || !longitude) return;
    leafletMap.current = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(leafletMap.current);
    markerRef.current = L.marker([latitude, longitude]).addTo(leafletMap.current);
  }, [latitude, longitude]);

  // Met à jour la vue et le marqueur sans recréer la carte
  useEffect(() => {
    if (!leafletMap.current || !latitude || !longitude) return;
    leafletMap.current.setView([latitude, longitude], 16);
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude]).addTo(leafletMap.current);
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
