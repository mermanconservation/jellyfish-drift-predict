import { DriftPrediction } from '@/services/driftService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Waves, Wind, MapPin, Clock } from 'lucide-react';

interface JellyfishObservation {
  latitude: number;
  longitude: number;
  jellyfishCount: number;
  timestamp: Date;
}

interface DriftResultsProps {
  observation: JellyfishObservation;
  predictions: DriftPrediction[];
  isVisible: boolean;
}

export const DriftResults = ({ observation, predictions, isVisible }: DriftResultsProps) => {
  if (!isVisible || predictions.length === 0) return null;

  const maxDistance = Math.max(...predictions.map(p => p.distance));
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  return (
    <Card className="w-full backdrop-blur-sm bg-card/90 border-border/50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-ocean" />
          Drift Predictions
        </CardTitle>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Initial Count</div>
            <div className="font-semibold">{observation.jellyfishCount} jellyfish</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Max Distance</div>
            <div className="font-semibold">{maxDistance.toFixed(1)} km</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Confidence */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Prediction Confidence</span>
            <span className="font-medium">{(avgConfidence * 100).toFixed(0)}%</span>
          </div>
          <Progress value={avgConfidence * 100} className="h-2" />
        </div>

        {/* Daily Predictions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Daily Predictions</h3>
          
          {predictions.map((prediction, index) => (
            <div 
              key={prediction.day}
              className="border border-border/50 rounded-lg p-3 space-y-2 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-ocean" />
                  <span className="font-medium">Day {prediction.day}</span>
                </div>
                <Badge 
                  variant={prediction.confidence > 0.7 ? "default" : prediction.confidence > 0.4 ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {(prediction.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    Position
                  </div>
                  <div className="font-mono">
                    {prediction.latitude.toFixed(4)}°N<br />
                    {prediction.longitude.toFixed(4)}°E
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Wind className="w-3 h-3" />
                    Conditions
                  </div>
                  <div>
                    {prediction.windSpeed.toFixed(1)} m/s<br />
                    {prediction.windDirection.toFixed(0)}° wind
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-1 border-t border-border/30">
                <span className="text-xs text-muted-foreground">
                  Distance from origin
                </span>
                <span className="text-xs font-medium">
                  {prediction.distance.toFixed(1)} km
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Environmental Factors Notice */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium text-foreground">Environmental Factors</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Predictions based on wind patterns and ocean surface currents</p>
            <p>• Pelagia noctiluca drift at ~3% of wind speed</p>
            <p>• Confidence decreases over time due to environmental uncertainty</p>
            <p>• Actual movement may vary due to local currents and depth changes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};