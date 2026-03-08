import { WindData } from './weatherService';
import { LandSeaService } from './landSeaService';

export interface DriftPrediction {
  day: number;
  latitude: number;
  longitude: number;
  confidence: number;
  windSpeed: number;
  windDirection: number;
  distance: number;
  hitLand?: boolean;
  originalLatitude?: number;  // where it would have gone if not blocked by land
  originalLongitude?: number;
}

export interface JellyfishObservation {
  latitude: number;
  longitude: number;
  jellyfishCount: number;
  timestamp: Date;
}

export class DriftService {
  private static readonly JELLYFISH_DRIFT_FACTOR = 0.03;
  private static readonly OCEAN_CURRENT_FACTOR = 0.5;
  private static readonly DAILY_UNCERTAINTY = 0.02;
  private static readonly EARTH_RADIUS = 6371;

  static async predictDrift(
    observation: JellyfishObservation,
    windData: WindData[],
    days: number = 5
  ): Promise<DriftPrediction[]> {
    const predictions: DriftPrediction[] = [];
    
    let currentLat = observation.latitude;
    let currentLon = observation.longitude;
    
    const dailyWindData = this.groupWindDataByDay(windData);
    
    for (let day = 1; day <= days; day++) {
      const dayWindData = dailyWindData[day - 1] || dailyWindData[dailyWindData.length - 1];
      if (!dayWindData) continue;
      
      const avgWind = this.calculateAverageWind(dayWindData);
      const driftDistance = this.calculateDailyDrift(avgWind.speed, day);
      const driftDirection = avgWind.direction;
      
      // Try moving in the drift direction
      let newPosition = this.applyDrift(currentLat, currentLon, driftDistance, driftDirection);
      let hitLand = false;
      
      // Check if new position is over water
      const isWater = await LandSeaService.isOverWater(newPosition.latitude, newPosition.longitude);
      
      if (!isWater) {
        hitLand = true;
        
        // Binary search to find the last water point along this path
        const waterEdge = await this.findWaterEdge(currentLat, currentLon, driftDistance, driftDirection);
        
        // Calculate remaining drift distance after hitting land
        const usedDistance = this.calculateDistance(currentLat, currentLon, waterEdge.latitude, waterEdge.longitude);
        const remainingDistance = Math.max(0, driftDistance - usedDistance);
        
        if (remainingDistance > 0) {
          // Try deflecting along the coast: try 90° left, then 90° right, then 45° increments
          const deflectionAngles = [90, -90, 45, -45, 135, -135, 180];
          let deflected = false;
          
          for (const angle of deflectionAngles) {
            const deflectedDir = (driftDirection + angle + 360) % 360;
            const deflectedPos = this.applyDrift(waterEdge.latitude, waterEdge.longitude, remainingDistance, deflectedDir);
            const deflectedIsWater = await LandSeaService.isOverWater(deflectedPos.latitude, deflectedPos.longitude);
            
            if (deflectedIsWater) {
              newPosition = deflectedPos;
              deflected = true;
              break;
            }
          }
          
          if (!deflected) {
            // Stay at the water's edge
            newPosition = waterEdge;
          }
        } else {
          newPosition = waterEdge;
        }
      }
      
      currentLat = newPosition.latitude;
      currentLon = newPosition.longitude;
      
      const totalDistance = this.calculateDistance(
        observation.latitude, observation.longitude,
        currentLat, currentLon
      );
      
      const confidence = Math.max(0.1, 1 - (day * this.DAILY_UNCERTAINTY));
      
      predictions.push({
        day,
        latitude: currentLat,
        longitude: currentLon,
        confidence,
        windSpeed: avgWind.speed,
        windDirection: avgWind.direction,
        distance: totalDistance,
        hitLand,
      });
    }
    
    return predictions;
  }

  /**
   * Binary search along the drift path to find the last point still over water.
   */
  private static async findWaterEdge(
    startLat: number,
    startLon: number,
    totalDistance: number,
    direction: number
  ): Promise<{ latitude: number; longitude: number }> {
    let lo = 0;
    let hi = totalDistance;
    let lastWaterPos = { latitude: startLat, longitude: startLon };
    
    // 4 iterations of binary search gives ~6% precision of total distance
    for (let i = 0; i < 4; i++) {
      const mid = (lo + hi) / 2;
      const midPos = this.applyDrift(startLat, startLon, mid, direction);
      const isWater = await LandSeaService.isOverWater(midPos.latitude, midPos.longitude);
      
      if (isWater) {
        lo = mid;
        lastWaterPos = midPos;
      } else {
        hi = mid;
      }
    }
    
    return lastWaterPos;
  }

  private static groupWindDataByDay(windData: WindData[]): WindData[][] {
    const grouped: WindData[][] = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    
    const startOfTomorrow = new Date();
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    
    for (let day = 0; day < 5; day++) {
      const dayStart = startOfTomorrow.getTime() + (day * msPerDay);
      const dayEnd = dayStart + msPerDay;
      
      const dayData = windData.filter(
        wind => wind.timestamp >= dayStart && wind.timestamp < dayEnd
      );
      
      if (dayData.length > 0) {
        grouped.push(dayData);
      }
    }
    
    return grouped;
  }

  private static calculateAverageWind(windData: WindData[]): { speed: number; direction: number } {
    if (windData.length === 0) return { speed: 0, direction: 0 };
    
    let totalSpeedX = 0;
    let totalSpeedY = 0;
    
    windData.forEach(wind => {
      const radians = (wind.direction * Math.PI) / 180;
      totalSpeedX += wind.speed * Math.sin(radians);
      totalSpeedY += wind.speed * Math.cos(radians);
    });
    
    const avgSpeedX = totalSpeedX / windData.length;
    const avgSpeedY = totalSpeedY / windData.length;
    
    const avgSpeed = Math.sqrt(avgSpeedX * avgSpeedX + avgSpeedY * avgSpeedY);
    let avgDirection = Math.atan2(avgSpeedX, avgSpeedY) * (180 / Math.PI);
    if (avgDirection < 0) avgDirection += 360;
    
    return { speed: avgSpeed, direction: avgDirection };
  }

  private static calculateDailyDrift(windSpeed: number, day: number): number {
    const windDrift = windSpeed * this.JELLYFISH_DRIFT_FACTOR * 24;
    const currentDrift = this.OCEAN_CURRENT_FACTOR;
    const uncertainty = Math.random() * day * 0.1;
    return windDrift + currentDrift + uncertainty;
  }

  private static applyDrift(
    lat: number, lon: number,
    distance: number, direction: number
  ): { latitude: number; longitude: number } {
    const bearing = (direction * Math.PI) / 180;
    const distanceRad = distance / this.EARTH_RADIUS;
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distanceRad) +
      Math.cos(latRad) * Math.sin(distanceRad) * Math.cos(bearing)
    );
    
    const newLonRad = lonRad + Math.atan2(
      Math.sin(bearing) * Math.sin(distanceRad) * Math.cos(latRad),
      Math.cos(distanceRad) - Math.sin(latRad) * Math.sin(newLatRad)
    );
    
    return {
      latitude: (newLatRad * 180) / Math.PI,
      longitude: (newLonRad * 180) / Math.PI,
    };
  }

  private static calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = this.EARTH_RADIUS;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static generateDriftPath(predictions: DriftPrediction[], observation: JellyfishObservation): Array<{
    longitude: number;
    latitude: number;
    day: number;
  }> {
    const path = [{
      longitude: observation.longitude,
      latitude: observation.latitude,
      day: 0,
    }];
    
    predictions.forEach(prediction => {
      path.push({
        longitude: prediction.longitude,
        latitude: prediction.latitude,
        day: prediction.day,
      });
    });
    
    return path;
  }
}