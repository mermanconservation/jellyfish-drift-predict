import { DriftPrediction } from '@/services/driftService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Waves, Wind, MapPin, Clock, ChevronDown } from 'lucide-react';
import { useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);

  if (!isVisible || predictions.length === 0) return null;

  const maxDistance = Math.max(...predictions.map(p => p.distance));
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

  return (
    <Card className="w-full backdrop-blur-sm bg-card/90 border-border/50 shadow-xl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-ocean" />
              <span className="text-sm font-semibold">Drift Predictions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{maxDistance.toFixed(1)} km · {(avgConfidence * 100).toFixed(0)}%</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            {/* Summary row */}
            <div className="flex gap-3 text-xs">
              <div className="flex-1 bg-muted/30 rounded px-2 py-1.5">
                <div className="text-muted-foreground">Count</div>
                <div className="font-semibold">{observation.jellyfishCount}</div>
              </div>
              <div className="flex-1 bg-muted/30 rounded px-2 py-1.5">
                <div className="text-muted-foreground">Max Dist</div>
                <div className="font-semibold">{maxDistance.toFixed(1)} km</div>
              </div>
              <div className="flex-1 bg-muted/30 rounded px-2 py-1.5">
                <div className="text-muted-foreground">Confidence</div>
                <div className="font-semibold">{(avgConfidence * 100).toFixed(0)}%</div>
              </div>
            </div>

            <Progress value={avgConfidence * 100} className="h-1.5" />

            {/* Daily Predictions */}
            <div className="space-y-2">
              {predictions.map((prediction) => (
                <div 
                  key={prediction.day}
                  className="border border-border/50 rounded p-2 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-ocean" />
                      <span className="font-medium">Day {prediction.day}</span>
                    </div>
                    <Badge 
                      variant={prediction.confidence > 0.7 ? "default" : prediction.confidence > 0.4 ? "secondary" : "outline"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {(prediction.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      {prediction.latitude.toFixed(4)}°N, {prediction.longitude.toFixed(4)}°E
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Wind className="w-2.5 h-2.5" />
                      {prediction.windSpeed.toFixed(1)} m/s · {prediction.distance.toFixed(1)} km
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
              Predictions based on wind patterns & ocean currents. Confidence decreases over time.
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};