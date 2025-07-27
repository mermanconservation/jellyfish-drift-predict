interface WeatherData {
  wind: {
    speed: number; // m/s
    deg: number; // degrees
  };
  main: {
    temp: number;
    pressure: number;
  };
  coord: {
    lat: number;
    lon: number;
  };
}

interface ForecastData {
  list: Array<{
    dt: number;
    wind: {
      speed: number;
      deg: number;
    };
    main: {
      temp: number;
      pressure: number;
    };
  }>;
}

export interface WindData {
  speed: number;
  direction: number;
  timestamp: number;
}

export class WeatherService {
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';

  static async getCurrentWeather(lat: number, lon: number, apiKey: string): Promise<WeatherData> {
    const response = await fetch(
      `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getForecast(lat: number, lon: number, apiKey: string): Promise<ForecastData> {
    const response = await fetch(
      `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getWindDataForDays(lat: number, lon: number, apiKey: string, days: number = 5): Promise<WindData[]> {
    try {
      // Get current weather
      const currentWeather = await this.getCurrentWeather(lat, lon, apiKey);
      
      // Get 5-day forecast
      const forecast = await this.getForecast(lat, lon, apiKey);
      
      const windData: WindData[] = [];
      
      // Add current weather
      windData.push({
        speed: currentWeather.wind.speed,
        direction: currentWeather.wind.deg,
        timestamp: Date.now(),
      });
      
      // Add forecast data (every 3 hours for 5 days)
      const maxEntries = Math.min(forecast.list.length, days * 8); // 8 entries per day (3-hour intervals)
      
      for (let i = 0; i < maxEntries; i++) {
        const entry = forecast.list[i];
        windData.push({
          speed: entry.wind.speed,
          direction: entry.wind.deg,
          timestamp: entry.dt * 1000, // Convert to milliseconds
        });
      }
      
      return windData;
    } catch (error) {
      console.error('Error fetching wind data:', error);
      throw error;
    }
  }

  static validateApiKey(apiKey: string): boolean {
    return apiKey && apiKey.length > 0;
  }
}