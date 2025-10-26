
import { useEffect, useRef } from "react";

export default function WemapMap() {
  const mapRef = useRef(null);

  useEffect(() => {
    // Ajoute le script Wemap dans le <head>
    const script = document.createElement("script");
    script.src = "https://livemap.getwemap.com/js/sdk.min.js";
    script.async = true;
    document.head.appendChild(script);

    let livemapInstance = null;

    script.onload = () => {
      if (window.wemap && mapRef.current) {
        // Prépare les paramètres
        const options = {
          emmid: 1234, // Remplace par ton emmid
          token: 'MY_TOKEN' // Remplace par ton token
        };
        livemapInstance = window.wemap.v1.createLivemap(mapRef.current, options);

        // Listener sur l'ouverture d'un pinpoint
        livemapInstance.addEventListener('pinpointOpen', function(e) {
          console.log('pinpoint open', e.pinpoint.name);
        });

        // Attendre que la map soit prête
        livemapInstance.waitForReady().then(function() {
          // Ouvre un pinpoint
          livemapInstance.openPinpoint(18326397);
          // Zoom sur coordonnées après 1s
          setTimeout(function() {
            livemapInstance.centerTo({latitude: 48.86061799999999, longitude: 2.3376379999999415}, 16);
          }, 1000);
        });
      }
    };

    return () => {
      if (livemapInstance && livemapInstance.destroy) {
        livemapInstance.destroy();
      }
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div
      ref={mapRef}
      id="map-container"
      style={{ width: "100%", height: "400px", borderRadius: 16, overflow: "hidden" }}
    />
  );
}
