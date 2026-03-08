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
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${jellyfishHero})` }}
        />
        <div className="absolute inset-0 ocean-gradient opacity-60" />
        
        <div className="relative z-10 container mx-auto px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-primary-foreground">
              <Fish className="w-4 h-4" />
              Marine Biology Research Tool
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-primary-foreground leading-tight">
              Jellyfish
              <span className="block bg-gradient-to-r from-accent to-coral bg-clip-text text-transparent">
                Drift Predictor
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
              Track <em>Pelagia noctiluca</em> sightings and predict their movement patterns using real-time wind data and ocean current models
            </p>

            <div className="flex justify-center mt-8">
              <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-primary-foreground hover:bg-white/20">
                <Link to="/donate" className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-coral" />
                  Support Our Research
                </Link>
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-primary-foreground">
                <CardContent className="p-6 text-center">
                  <Wind className="w-8 h-8 mx-auto mb-3 text-accent" />
                  <h3 className="font-semibold mb-2">Real-time Weather</h3>
                  <p className="text-sm opacity-90">Live wind data from OpenWeatherMap API</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-primary-foreground">
                <CardContent className="p-6 text-center">
                  <Waves className="w-8 h-8 mx-auto mb-3 text-coral" />
                  <h3 className="font-semibold mb-2">Drift Modeling</h3>
                  <p className="text-sm opacity-90">Advanced ocean current predictions</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-primary-foreground">
                <CardContent className="p-6 text-center">
                  <Fish className="w-8 h-8 mx-auto mb-3 text-wave" />
                  <h3 className="font-semibold mb-2">Species-Specific</h3>
                  <p className="text-sm opacity-90">Calibrated for Pelagia noctiluca behavior</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

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

        {/* Scientific Information */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="backdrop-blur-sm bg-card/90 border-border/50">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-ocean to-accent bg-clip-text text-transparent">
                About Pelagia noctiluca
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <h3 className="font-semibold text-ocean">Physical Characteristics</h3>
                  <p className="text-muted-foreground">
                    The mauve stinger is a small jellyfish with a bell diameter of 3-12 cm. 
                    It has a distinctive purple or mauve coloration and is known for its painful sting.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-ocean">Distribution & Habitat</h3>
                  <p className="text-muted-foreground">
                    Found in warm and temperate waters worldwide, including the Mediterranean Sea, 
                    Atlantic Ocean, and other marine environments.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-ocean">Movement Patterns</h3>
                  <p className="text-muted-foreground">
                    Jellyfish are weak swimmers and drift primarily with ocean currents and wind patterns. 
                    They move at approximately 3% of wind speed plus underlying current velocity.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-ocean">Ecological Impact</h3>
                  <p className="text-muted-foreground">
                    Understanding their movement helps predict interactions with fishing activities, 
                    tourism, and marine ecosystems.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;