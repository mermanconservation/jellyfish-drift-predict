// Service to determine if coordinates are on land or sea using Mapbox Tilequery API
export class LandSeaService {
  private static cache = new Map<string, boolean>();

  private static getCacheKey(lat: number, lon: number): string {
    // Round to ~100m precision for caching
    return `${lat.toFixed(3)},${lon.toFixed(3)}`;
  }

  static async isOverWater(latitude: number, longitude: number): Promise<boolean> {
    const key = this.getCacheKey(latitude, longitude);
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    try {
      const token = localStorage.getItem('mapbox_token');
      if (!token) {
        console.warn('No Mapbox token for land/sea detection');
        return true;
      }

      // Use Mapbox Tilequery API to check the water layer in mapbox-streets-v8
      const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json?layers=water&radius=0&access_token=${token}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('Mapbox Tilequery failed:', response.status);
        return true;
      }

      const data = await response.json();
      
      // If features are returned from the water layer, the point is over water
      const isWater = data.features && data.features.length > 0;
      
      console.log(`Land/Sea check: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} → ${isWater ? 'WATER' : 'LAND'}`);
      
      this.cache.set(key, isWater);
      return isWater;
    } catch (error) {
      console.warn('Land/Sea detection failed:', error);
      return true;
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}