import { WindData } from './weatherService';

export interface DriftPrediction {
  day: number;
  latitude: number;
  longitude: number;
  confidence: number;
  windSpeed: number;
  windDirection: number;
  distance: number; // Distance from original point in km
}

export interface JellyfishObservation {
  latitude: number;
  longitude: number;
  jellyfishCount: number;
  timestamp: Date;
}

export class DriftService {
  // Jellyfish drift characteristics for Pelagia noctiluca
  private static readonly JELLYFISH_DRIFT_FACTOR = 0.03; // 3% of wind speed
  private static readonly OCEAN_CURRENT_FACTOR = 0.5; // km/day base drift
  private static readonly DAILY_UNCERTAINTY = 0.02; // 2% uncertainty per day
  
  // Earth radius in kilometers
  private static readonly EARTH_RADIUS = 6371;

  static predictDrift(
    observation: JellyfishObservation,
    windData: WindData[],
    days: number = 5
  ): DriftPrediction[] {
    const predictions: DriftPrediction[] = [];
    
    let currentLat = observation.latitude;
    let currentLon = observation.longitude;
    
    // Group wind data by day
    const dailyWindData = this.groupWindDataByDay(windData);
    
    for (let day = 1; day <= days; day++) {
      const dayWindData = dailyWindData[day - 1] || dailyWindData[dailyWindData.length - 1];
      
      if (!dayWindData) continue;
      
      // Calculate average wind for the day
      const avgWind = this.calculateAverageWind(dayWindData);
      
      // Calculate drift based on wind and ocean currents
      const driftDistance = this.calculateDailyDrift(avgWind.speed, day);
      const driftDirection = avgWind.direction;
      
      // Apply drift to current position
      const newPosition = this.applyDrift(
        currentLat,
        currentLon,
        driftDistance,
        driftDirection
      );
      
      currentLat = newPosition.latitude;
      currentLon = newPosition.longitude;
      
      // Calculate distance from original point
      const totalDistance = this.calculateDistance(
        observation.latitude,
        observation.longitude,
        currentLat,
        currentLon
      );
      
      // Calculate confidence (decreases over time)
      const confidence = Math.max(0.1, 1 - (day * this.DAILY_UNCERTAINTY));
      
      predictions.push({
        day,
        latitude: currentLat,
        longitude: currentLon,
        confidence,
        windSpeed: avgWind.speed,
        windDirection: avgWind.direction,
        distance: totalDistance,
      });
    }
    
    return predictions;
  }

  private static groupWindDataByDay(windData: WindData[]): WindData[][] {
    const grouped: WindData[][] = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    
    // Group by day (starting from tomorrow)
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
    if (windData.length === 0) {
      return { speed: 0, direction: 0 };
    }
    
    // Convert wind directions to vectors for averaging
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
    
    // Normalize direction to 0-360
    if (avgDirection < 0) {
      avgDirection += 360;
    }
    
    return { speed: avgSpeed, direction: avgDirection };
  }

  private static calculateDailyDrift(windSpeed: number, day: number): number {
    // Base drift from wind (jellyfish are poor swimmers)
    const windDrift = windSpeed * this.JELLYFISH_DRIFT_FACTOR * 24; // 24 hours
    
    // Add ocean current component (varies by location, simplified here)
    const currentDrift = this.OCEAN_CURRENT_FACTOR;
    
    // Add some randomness for uncertainty (increases over time)
    const uncertainty = Math.random() * day * 0.1;
    
    return windDrift + currentDrift + uncertainty;
  }

  private static applyDrift(
    lat: number,
    lon: number,
    distance: number,
    direction: number
  ): { latitude: number; longitude: number } {
    // Convert direction to radians
    const bearing = (direction * Math.PI) / 180;
    
    // Convert distance to radians
    const distanceRad = distance / this.EARTH_RADIUS;
    
    // Convert latitude to radians
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    
    // Calculate new latitude
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distanceRad) +
      Math.cos(latRad) * Math.sin(distanceRad) * Math.cos(bearing)
    );
    
    // Calculate new longitude
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
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
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
    const path = [
      {
        longitude: observation.longitude,
        latitude: observation.latitude,
        day: 0,
      },
    ];
    
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