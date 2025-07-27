import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DriftPrediction } from '@/services/driftService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Eye, EyeOff } from 'lucide-react';

interface JellyfishObservation {
  latitude: number;
  longitude: number;
  jellyfishCount: number;
  timestamp: Date;
}

interface DriftMapProps {
  observation: JellyfishObservation | null;
  predictions: DriftPrediction[];
  isVisible: boolean;
}

export const DriftMap = ({ observation, predictions, isVisible }: DriftMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState(localStorage.getItem('mapbox_token') || '');
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    localStorage.setItem('mapbox_token', mapboxToken);

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: observation ? [observation.longitude, observation.latitude] : [0, 0],
        zoom: observation ? 8 : 2,
        projection: 'globe' as any,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('style.load', () => {
        // Add atmosphere for globe view
        map.current?.setFog({
          color: 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
        });

        updateMapData();
      });

      setShowMap(true);
      toast({
        title: "Map loaded",
        description: "Jellyfish drift visualization ready",
      });
    } catch (error) {
      toast({
        title: "Map error",
        description: "Invalid Mapbox token. Please check your token.",
        variant: "destructive",
      });
    }
  };

  const updateMapData = () => {
    if (!map.current || !observation) return;

    // Clear existing layers and sources
    ['drift-path', 'prediction-points', 'observation-point'].forEach(id => {
      if (map.current?.getLayer(id)) {
        map.current.removeLayer(id);
      }
      if (map.current?.getSource(id)) {
        map.current.removeSource(id);
      }
    });

    // Add observation point
    map.current.addSource('observation-point', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [observation.longitude, observation.latitude],
        },
        properties: {
          count: observation.jellyfishCount,
          type: 'observation',
        },
      },
    });

    map.current.addLayer({
      id: 'observation-point',
      type: 'circle',
      source: 'observation-point',
      paint: {
        'circle-radius': 12,
        'circle-color': '#ff6b6b',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8,
      },
    });

    if (predictions.length > 0) {
      // Create drift path
      const coordinates = [
        [observation.longitude, observation.latitude],
        ...predictions.map(p => [p.longitude, p.latitude]),
      ];

      map.current.addSource('drift-path', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: {},
        },
      });

      map.current.addLayer({
        id: 'drift-path',
        type: 'line',
        source: 'drift-path',
        paint: {
          'line-color': '#4ecdc4',
          'line-width': 3,
          'line-opacity': 0.8,
        },
      });

      // Add prediction points
      map.current.addSource('prediction-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: predictions.map(p => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [p.longitude, p.latitude],
            },
            properties: {
              day: p.day,
              confidence: p.confidence,
              distance: p.distance,
              windSpeed: p.windSpeed,
            },
          })),
        },
      });

      map.current.addLayer({
        id: 'prediction-points',
        type: 'circle',
        source: 'prediction-points',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'confidence'],
            0, 6,
            1, 10,
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'day'],
            1, '#4ecdc4',
            5, '#45b7aa',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.7,
        },
      });

      // Fit map to show all points
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([observation.longitude, observation.latitude]);
      predictions.forEach(p => bounds.extend([p.longitude, p.latitude]));
      
      map.current.fitBounds(bounds, { padding: 50 });
    }

    // Add popups
    map.current.on('click', 'observation-point', (e) => {
      new mapboxgl.Popup()
        .setLngLat([observation.longitude, observation.latitude])
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm">Jellyfish Observation</h3>
            <p class="text-xs">Count: ${observation.jellyfishCount}</p>
            <p class="text-xs">Time: ${observation.timestamp.toLocaleString()}</p>
          </div>
        `)
        .addTo(map.current!);
    });

    map.current.on('click', 'prediction-points', (e) => {
      if (e.features && e.features[0]) {
        const props = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-sm">Day ${props?.day} Prediction</h3>
              <p class="text-xs">Confidence: ${(props?.confidence * 100).toFixed(0)}%</p>
              <p class="text-xs">Distance: ${props?.distance.toFixed(1)} km</p>
              <p class="text-xs">Wind: ${props?.windSpeed.toFixed(1)} m/s</p>
            </div>
          `)
          .addTo(map.current!);
      }
    });
  };

  useEffect(() => {
    if (showMap && map.current) {
      updateMapData();
    }
  }, [observation, predictions, showMap]);

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <Card className="w-full backdrop-blur-sm bg-card/90 border-border/50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-ocean" />
          Drift Prediction Map
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!showMap ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">Mapbox Access Token</Label>
              <Input
                id="mapbox-token"
                type="password"
                placeholder="Enter your Mapbox token"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your free token from{' '}
                <a 
                  href="https://account.mapbox.com/access-tokens/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-ocean hover:underline"
                >
                  Mapbox
                </a>
              </p>
            </div>
            
            <Button 
              onClick={initializeMap} 
              disabled={!mapboxToken}
              className="w-full ocean-gradient hover:opacity-90"
            >
              <Eye className="w-4 h-4 mr-2" />
              Load Map
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {observation && `Tracking ${observation.jellyfishCount} jellyfish`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowMap(false);
                  map.current?.remove();
                  map.current = null;
                }}
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Map
              </Button>
            </div>
            
            <div 
              ref={mapContainer} 
              className="w-full h-96 rounded-lg border border-border overflow-hidden"
            />
            
            {predictions.length > 0 && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-coral rounded-full"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span>Predicted</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 bg-accent"></div>
                  <span>Drift Path</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};