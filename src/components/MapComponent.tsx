import { useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface MapComponentProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const MapComponent = ({ 
  apiKey, 
  center = { lat: 40.7128, lng: -74.0060 }, // Default to New York City
  zoom = 12 
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      // Set the loader options
      setOptions({
        key: apiKey,
        v: 'weekly',
      });

      try {
        // Import the Maps library
        const { Map } = await importLibrary('maps');
        
        if (mapRef.current) {
          new Map(mapRef.current, {
            center: center,
            zoom: zoom,
          });
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    if (apiKey) {
      initMap();
    }
  }, [apiKey, center, zoom]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '500px',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }} 
    />
  );
};

export default MapComponent;
