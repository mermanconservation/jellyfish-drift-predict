import { useState } from 'react';
import { JellyfishForm } from '@/components/JellyfishForm';
import { DriftMap } from '@/components/DriftMap';
import { DriftResults } from '@/components/DriftResults';
import { WeatherService } from '@/services/weatherService';
import { DriftService, DriftPrediction } from '@/services/driftService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Waves, Fish, Wind, Heart, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface JellyfishObservation {
  latitude: number;
  longitude: number;
  jellyfishCount: number;
  timestamp: Date;
}

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [observation, setObservation] = useState<JellyfishObservation | null>(null);
  const [predictions, setPredictions] = useState<DriftPrediction[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleObservationSubmit = async (newObservation: JellyfishObservation, apiKey?: string) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please provide an OpenWeatherMap API key to get weather data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    setObservation(newObservation);

    try {
      if (!WeatherService.validateApiKey(apiKey)) {
        throw new Error("Invalid API key");
      }

      toast({
        title: "Fetching weather data...",
        description: "Getting wind patterns for drift analysis",
      });

      const windData = await WeatherService.getWindDataForDays(
        newObservation.latitude,
        newObservation.longitude,
        apiKey,
        5
      );

      toast({
        title: "Calculating drift patterns...",
        description: "Analyzing jellyfish movement based on ocean conditions",
      });

      const driftPredictions = await DriftService.predictDrift(newObservation, windData, 5);

      setObservation(newObservation);
      setPredictions(driftPredictions);
      setShowResults(true);

      toast({
        title: "Prediction Complete!",
        description: `Generated 5-day drift forecast for ${newObservation.jellyfishCount} jellyfish`,
      });

    } catch (error) {
      console.error('Error generating predictions:', error);
      toast({
        title: "Prediction Failed",
        description: error instanceof Error ? error.message : "Failed to generate drift predictions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a2540' }}>
      {/* Top bar with icons */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-primary-foreground hover:bg-white/20">
              <Info className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm" side="bottom" align="end">
            <h3 className="font-semibold mb-2">About Pelagia noctiluca</h3>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Physical:</strong> Bell diameter 3-12 cm, distinctive purple/mauve coloration, painful sting.</p>
              <p><strong className="text-foreground">Habitat:</strong> Warm and temperate waters worldwide, including the Mediterranean and Atlantic.</p>
              <p><strong className="text-foreground">Movement:</strong> Drift with ocean currents and wind at ~3% of wind speed plus current velocity.</p>
              <p><strong className="text-foreground">Impact:</strong> Predicting movement helps manage fishing, tourism, and ecosystem interactions.</p>
            </div>
          </PopoverContent>
        </Popover>

        <Button asChild size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-primary-foreground hover:bg-white/20">
          <Link to="/donate">
            <Heart className="w-4 h-4 text-coral" />
          </Link>
        </Button>
      </div>

      {/* Hero Section - compact, same bg as page */}
      <div className="container mx-auto px-4 sm:px-6 pt-8 pb-4 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight">
            Jellyfish
            <span className="block bg-gradient-to-r from-accent to-coral bg-clip-text text-transparent">
              Drift Predictor
            </span>
          </h1>
          
          <p className="text-sm sm:text-base text-primary-foreground/80 max-w-md mx-auto">
            Track <em>Pelagia noctiluca</em> sightings and predict drift using real-time wind & ocean current models
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 text-xs text-primary-foreground">
              <Wind className="w-3 h-3 text-accent" />
              Weather
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 text-xs text-primary-foreground">
              <Waves className="w-3 h-3 text-coral" />
              Drift
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 text-xs text-primary-foreground">
              <Fish className="w-3 h-3 text-wave" />
              Species
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-6xl mx-auto">
          <div className="space-y-4">
            <JellyfishForm 
              onObservationSubmit={handleObservationSubmit}
              isLoading={isLoading}
            />
            <DriftResults 
              observation={observation!}
              predictions={predictions}
              isVisible={showResults}
            />
          </div>

          <div className="space-y-4">
            <DriftMap 
              observation={observation}
              predictions={predictions}
              isVisible={showResults || isLoading}
              isLoading={isLoading}
            />
            
            {!showResults && !isLoading && (
              <Card className="backdrop-blur-sm bg-card/90 border-border/50">
                <CardContent className="p-5 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Fish className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold">Ready for Analysis</h3>
                  <p className="text-xs text-muted-foreground">
                    Enter observation data to generate drift predictions on an interactive map.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;