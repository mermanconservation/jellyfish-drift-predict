import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Waves, Fish, AlertTriangle } from 'lucide-react';
import { LandSeaService } from '@/services/landSeaService';

const formSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  jellyfishCount: z.number().min(0).max(10000),
  apiKey: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface JellyfishObservation {
  latitude: number;
  longitude: number;
  jellyfishCount: number;
  timestamp: Date;
}

interface JellyfishFormProps {
  onObservationSubmit: (observation: JellyfishObservation, apiKey?: string) => void;
  isLoading: boolean;
}

export const JellyfishForm = ({ onObservationSubmit, isLoading }: JellyfishFormProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openweather_api_key') || '1d8105100539d60fd8e887dd964e8152');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      latitude: 0,
      longitude: 0,
      jellyfishCount: 1,
      apiKey: apiKey,
    },
  });

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('latitude', Number(position.coords.latitude.toFixed(6)));
          setValue('longitude', Number(position.coords.longitude.toFixed(6)));
          toast({
            title: "Location obtained",
            description: "Current coordinates have been filled in",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not get your current location",
            variant: "destructive",
          });
        }
      );
    }
  };

  const onSubmit = async (data: FormData) => {
    if (data.apiKey) {
      localStorage.setItem('openweather_api_key', data.apiKey);
    }

    // Check if coordinates are over water
    const isOverWater = await LandSeaService.isOverWater(data.latitude, data.longitude);
    
    let finalLatitude = data.latitude;
    let finalLongitude = data.longitude;
    
    if (!isOverWater) {
      // Get last known sea coordinates
      const lastSeaCoords = LandSeaService.getLastSeaCoordinates();
      
      if (lastSeaCoords) {
        finalLatitude = lastSeaCoords.latitude;
        finalLongitude = lastSeaCoords.longitude;
        
        toast({
          title: "Land coordinates detected",
          description: `Using previous sea coordinates: ${finalLatitude.toFixed(6)}, ${finalLongitude.toFixed(6)}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Land coordinates detected",
          description: "No previous sea coordinates found. Please enter coordinates over water.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Store valid sea coordinates for future use
      LandSeaService.storeSeaCoordinates(data.latitude, data.longitude);
    }

    const observation: JellyfishObservation = {
      latitude: finalLatitude,
      longitude: finalLongitude,
      jellyfishCount: data.jellyfishCount,
      timestamp: new Date(),
    };

    onObservationSubmit(observation, data.apiKey || apiKey);
  };

  return (
    <Card className="w-full max-w-md mx-auto backdrop-blur-sm bg-card/90 border-border/50 shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-coral rounded-full flex items-center justify-center">
          <Fish className="w-8 h-8 text-coral-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-ocean to-accent bg-clip-text text-transparent">
          Jellyfish Tracker
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Track Pelagia noctiluca sightings and predict drift patterns
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="w-4 h-4 text-ocean" />
              Location
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-sm">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="0.000000"
                  {...register('latitude', { valueAsNumber: true })}
                  className="text-sm"
                />
                {errors.latitude && (
                  <p className="text-xs text-destructive">{errors.latitude.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-sm">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="0.000000"
                  {...register('longitude', { valueAsNumber: true })}
                  className="text-sm"
                />
                {errors.longitude && (
                  <p className="text-xs text-destructive">{errors.longitude.message}</p>
                )}
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              className="w-full text-sm border-ocean/20 hover:bg-ocean/10"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>
          </div>

          {/* Jellyfish Count */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Waves className="w-4 h-4 text-coral" />
              Jellyfish Count
            </div>
            <Input
              type="number"
              min="0"
              max="10000"
              placeholder="Number of jellyfish observed"
              {...register('jellyfishCount', { valueAsNumber: true })}
            />
            {errors.jellyfishCount && (
              <p className="text-xs text-destructive">{errors.jellyfishCount.message}</p>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-sm font-medium">
              OpenWeatherMap API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key for weather data"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setValue('apiKey', e.target.value);
              }}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Get your free API key from{' '}
              <a 
                href="https://openweathermap.org/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-ocean hover:underline"
              >
                OpenWeatherMap
              </a>
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full ocean-gradient hover:opacity-90 transition-opacity text-primary-foreground font-medium"
          >
            {isLoading ? (
              <>
                <Waves className="w-4 h-4 mr-2 animate-pulse" />
                Analyzing Drift...
              </>
            ) : (
              <>
                <Fish className="w-4 h-4 mr-2" />
                Predict Drift Pattern
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};