// Service to determine if coordinates are on land or sea
export class LandSeaService {
  // Simple heuristic: use reverse geocoding to check if coordinates are over water
  static async isOverWater(latitude: number, longitude: number): Promise<boolean> {
    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
      );
      
      if (!response.ok) {
        // If API fails, assume coordinates are valid (over water)
        return true;
      }
      
      const data = await response.json();
      
      // If no address is found, likely over water
      if (!data.address) {
        return true;
      }
      
      // Check if the response indicates water bodies
      const waterBodies = ['ocean', 'sea', 'bay', 'gulf', 'strait', 'channel', 'sound', 'mediterranean', 'atlantic', 'pacific', 'indian', 'arctic'];
      const displayName = data.display_name?.toLowerCase() || '';
      
      // If display name contains water body terms, it's over water
      if (waterBodies.some(water => displayName.includes(water))) {
        return true;
      }
      
      // Check the address components for water features
      const addressComponents = Object.values(data.address || {}).join(' ').toLowerCase();
      if (waterBodies.some(water => addressComponents.includes(water))) {
        return true;
      }
      
      // Check if the place type indicates water
      const waterPlaceTypes = ['water', 'sea', 'ocean', 'bay', 'gulf', 'strait'];
      const placeType = data.type?.toLowerCase() || '';
      const category = data.category?.toLowerCase() || '';
      
      if (waterPlaceTypes.includes(placeType) || waterPlaceTypes.includes(category)) {
        return true;
      }
      
      // If it has specific land features (road, building, etc), it's likely on land
      if (data.address.road || data.address.house_number || data.address.building) {
        return false;
      }
      
      // Default to water if uncertain
      return true;
      
    } catch (error) {
      console.warn('Land/Sea detection failed:', error);
      // If service fails, assume coordinates are valid (over water)
      return true;
    }
  }
  
  // Get stored sea coordinates from localStorage
  static getLastSeaCoordinates(): { latitude: number; longitude: number } | null {
    try {
      const stored = localStorage.getItem('last_sea_coordinates');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  
  // Store sea coordinates in localStorage
  static storeSeaCoordinates(latitude: number, longitude: number): void {
    try {
      localStorage.setItem('last_sea_coordinates', JSON.stringify({ latitude, longitude }));
    } catch (error) {
      console.warn('Failed to store sea coordinates:', error);
    }
  }
}