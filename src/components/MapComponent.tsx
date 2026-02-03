import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

const MapComponent = ({
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 12,
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [addPinMode, setAddPinMode] = useState(false);
  const addPinModeRef = useRef(addPinMode);
  const [removePinMode, setRemovePinMode] = useState(false);
  const removePinModeRef = useRef(removePinMode);
  // center marker moved into GeoJSON features so it's controllable and removable
  const makeId = (suffix = '') => `p-${Date.now()}-${Math.floor(Math.random() * 100000)}${suffix}`;
  const pointsRef = useRef<any>({
    type: 'FeatureCollection',
    features: [
      // center feature now part of the GeoJSON so it behaves like other pins
      {
        type: 'Feature',
        properties: { id: 'center', title: 'Center marker', description: 'Center' },
        geometry: { type: 'Point', coordinates: [center.lng, center.lat] },
      },
      {
        type: 'Feature',
        properties: { id: makeId('-0'), title: 'Point A', description: 'Downtown' },
        geometry: { type: 'Point', coordinates: [center.lng + 0.01, center.lat + 0.01] },
      },
      {
        type: 'Feature',
        properties: { id: makeId('-1'), title: 'Point B', description: 'Park' },
        geometry: { type: 'Point', coordinates: [center.lng - 0.01, center.lat - 0.01] },
      },
      {
        type: 'Feature',
        properties: { id: makeId('-2'), title: 'Point C', description: 'Museum' },
        geometry: { type: 'Point', coordinates: [center.lng + 0.02, center.lat - 0.01] },
      },
    ],
  });

  useEffect(() => {
    if (!mapRef.current) return;

    const rasterStyle = {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          // Use tile.openstreetmap.org which tends to work in browsers for many dev setups.
          // If you still see CORS problems, consider a paid CORS-enabled provider or a proxy during development.
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          maxzoom: 19,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm-tiles',
        },
      ],
    } as any;

    const map = new maplibregl.Map({
      container: mapRef.current!,
      style: rasterStyle,
      center: [center.lng, center.lat],
      zoom: zoom,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl({}), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }));
    map.on('error', (e) => console.error('maplibre error', e));
    map.on('sourcedata', (e) => {
      if ((e as any).isSourceLoaded === false) console.warn('sourcedata load failed', e);
    });

    // --- Sample clustered GeoJSON points ---
    const points = pointsRef.current;

    // Wait for the style to load before adding sources/layers
    const onLoad = () => {
      try {
        map.addSource('points', {
          type: 'geojson',
          data: points,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'points',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#f28a25',
            'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 30, 25],
          },
        });

        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'points',
          filter: ['has', 'point_count'],
          layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 },
          paint: { 'text-color': '#ffffff' },
        });

        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'points',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#11b4da',
            'circle-radius': 7,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        });

        // Cluster click: zoom in on cluster
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          if (!features.length) return;
          const clusterCoords = (features[0].geometry as any).coordinates;
          map.easeTo({ center: clusterCoords as [number, number], zoom: Math.min(map.getZoom() + 2, 18) });
        });

        // change cursor when hovering clusters/points so it indicates actionable state
        map.on('mouseenter', 'clusters', () => {
          const c = map.getCanvas();
          if (c) c.style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
          const c = map.getCanvas();
          if (!c) return;
          // restore based on current modes
          if (removePinModeRef.current) c.style.cursor = 'not-allowed';
          else if (addPinModeRef.current) c.style.cursor = 'crosshair';
          else c.style.cursor = '';
        });

        // Popup on unclustered point click (or remove when in remove mode)
        map.on('click', 'unclustered-point', (e) => {
          const feature = e.features && e.features[0];
          if (!feature) return;
          const coords = (feature.geometry as any).coordinates.slice();
          const props = feature.properties || {};
          if (removePinModeRef.current) {
            // remove matching feature by id (more reliable than comparing coordinates)
            const id = props?.id ?? props?.ID ?? props?.Id;
            if (id) {
              const idx = pointsRef.current.features.findIndex((f: any) => f.properties && (f.properties.id === id || String(f.properties.id) === String(id)));
              console.debug('remove-pin by id', id, 'found index', idx);
              if (idx !== -1) {
                pointsRef.current.features.splice(idx, 1);
                (map.getSource('points') as any).setData(pointsRef.current);
              }
            } else {
              // fallback: remove by tolerant coordinate match (larger tolerance to account for float differences)
              const idx = pointsRef.current.features.findIndex((f: any) => {
                const c = (f.geometry as any).coordinates;
                return Math.abs(c[0] - coords[0]) < 1e-4 && Math.abs(c[1] - coords[1]) < 1e-4;
              });
              console.debug('remove-pin by coords fallback', coords, 'found index', idx);
              if (idx !== -1) {
                pointsRef.current.features.splice(idx, 1);
                (map.getSource('points') as any).setData(pointsRef.current);
              }
            }
            return;
          }
          new maplibregl.Popup()
            .setLngLat(coords as [number, number])
            .setHTML(`<strong>${props.title ?? 'Point'}</strong><p>${props.description ?? ''}</p>`)
            .addTo(map);
        });

        // pointer cursor when hovering an unclustered point (indicates actionable)
        map.on('mouseenter', 'unclustered-point', () => {
          const c = map.getCanvas();
          if (!c) return;
          // If in remove mode, show pointer to indicate this is removable
          if (removePinModeRef.current) c.style.cursor = 'pointer';
          else if (addPinModeRef.current) c.style.cursor = 'crosshair';
          else c.style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point', () => {
          const c = map.getCanvas();
          if (!c) return;
          if (removePinModeRef.current) c.style.cursor = 'not-allowed';
          else if (addPinModeRef.current) c.style.cursor = 'crosshair';
          else c.style.cursor = '';
        });

        // Click on map to add a new pin when addPinMode is enabled (or Ctrl+click preserves old behavior)
        map.on('click', (e) => {
          const original = (e as any).originalEvent as MouseEvent | undefined;
          const wantAdd = addPinModeRef.current || (original && original.ctrlKey);
          if (wantAdd) {
            const coords = [e.lngLat.lng, e.lngLat.lat];
            const newFeature = {
              type: 'Feature',
              properties: { id: makeId(), title: 'New pin', description: 'Added interactively' },
              geometry: { type: 'Point', coordinates: coords },
            };
            pointsRef.current.features.push(newFeature);
            (map.getSource('points') as any).setData(pointsRef.current);
            new maplibregl.Popup().setLngLat(coords as [number, number]).setText('New pin').addTo(map);
          }
        });
      } catch (err) {
        console.error('Error adding sources/layers after load', err);
      }
    };

    map.on('load', onLoad);

    // no DOM center marker anymore (center is part of GeoJSON features)
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom]);

  // keep ref in sync and update cursor when toggling addPinMode
  useEffect(() => {
    addPinModeRef.current = addPinMode;
    removePinModeRef.current = removePinMode;
    const map = mapInstanceRef.current;
    if (map && map.getCanvas) {
      // remove mode takes precedence
      if (removePinMode) map.getCanvas().style.cursor = 'not-allowed';
      else if (addPinMode) map.getCanvas().style.cursor = 'crosshair';
      else map.getCanvas().style.cursor = '';
    }
  }, [addPinMode, removePinMode]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            setAddPinMode((s) => {
              const next = !s;
              if (next) setRemovePinMode(false);
              return next;
            });
          }}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: addPinMode ? '#e6ffef' : '#fff' }}
        >
          {addPinMode ? 'Add Pin: ON' : 'Add Pin'}
        </button>
        <button
          onClick={() => {
            setRemovePinMode((s) => {
              const next = !s;
              if (next) setAddPinMode(false);
              return next;
            });
          }}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: removePinMode ? '#ffeef0' : '#fff' }}
        >
          {removePinMode ? 'Remove Pin: ON' : 'Remove Pin'}
        </button>
        <button
          onClick={() => {
            const map = mapInstanceRef.current;
            if (!map) return;
            pointsRef.current.features = [];
            const src = map.getSource('points') as any;
            if (src) src.setData(pointsRef.current);
            // center is part of GeoJSON; clearing features already removes it
          }}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
        >
          Clear Pins
        </button>
      </div>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '500px',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}
      />
    </div>
  );
};

export default MapComponent;
