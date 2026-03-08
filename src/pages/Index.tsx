import { useState } from 'react';
import { JellyfishForm } from '@/components/JellyfishForm';
import { DriftMap } from '@/components/DriftMap';
import { DriftResults } from '@/components/DriftResults';
import { WeatherService } from '@/services/weatherService';
import { DriftService, DriftPrediction } from '@/services/driftService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Waves, Fish, Wind, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import jellyfishHero from '@/assets/jellyfish-hero.jpg';

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
    setObservation(newObservation); // Set observation immediately for map display

    try {
      // Validate API key
      if (!WeatherService.validateApiKey(apiKey)) {
        throw new Error("Invalid API key");
      }

      toast({
        title: "Fetching weather data...",
        description: "Getting wind patterns for drift analysis",
      });

      // Get wind data for 5 days
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

      // Calculate drift predictions
      const driftPredictions = DriftService.predictDrift(newObservation, windData, 5);

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
    <div className="min-h-screen bg-gradient-to-br from-wave via-foam to-background">
      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Form */}
          <div className="space-y-6">
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

          {/* Map and Visualization */}
          <div className="space-y-6">
            <DriftMap 
              observation={observation}
              predictions={predictions}
              isVisible={showResults || isLoading}
              isLoading={isLoading}
            />
            
            {!showResults && !isLoading && (
              <Card className="backdrop-blur-sm bg-card/90 border-border/50">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Fish className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Ready for Analysis</h3>
                  <p className="text-muted-foreground">
                    Enter jellyfish observation data to generate drift predictions and visualize movement patterns on an interactive map.
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