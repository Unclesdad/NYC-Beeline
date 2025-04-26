import axios from 'axios';

// API configuration
const API_CONFIG = {
  MTA_BASE_URL: 'https://api.mta.info/api',
  CITIBIKE_BASE_URL: 'https://gbfs.citibikenyc.com/gbfs/en',
  UBER_BASE_URL: 'https://api.uber.com/v1',
  GOOGLE_MAPS_BASE_URL: 'https://maps.googleapis.com/maps/api',
};

// Transit data interfaces
export interface SubwayData {
  line: string;
  status: string;
  delay: number; // in minutes
  crowd_level: 'low' | 'medium' | 'high';
}

export interface BusData {
  route: string;
  location: {
    lat: number;
    lng: number;
  };
  next_stop: string;
  estimated_arrival: string;
  crowd_level: 'low' | 'medium' | 'high';
}

export interface BikeData {
  station_id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  available_bikes: number;
  available_docks: number;
}

export interface UberData {
  product_id: string;
  display_name: string;
  estimate: {
    duration: number; // in seconds
    fare: number; // in dollars
  };
}

// Mock data (in a real app, these would be API calls)
const mockSubwayData: SubwayData[] = [
  { line: 'A', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: 'C', status: 'normal', delay: 0, crowd_level: 'low' },
  { line: 'E', status: 'delayed', delay: 10, crowd_level: 'high' },
  { line: 'B', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: 'D', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: 'F', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: 'M', status: 'normal', delay: 0, crowd_level: 'low' },
  { line: 'G', status: 'delayed', delay: 5, crowd_level: 'low' },
  { line: 'L', status: 'normal', delay: 0, crowd_level: 'high' },
  { line: 'N', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: 'Q', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: 'R', status: 'normal', delay: 0, crowd_level: 'low' },
  { line: 'W', status: 'normal', delay: 0, crowd_level: 'low' },
  { line: '1', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: '2', status: 'delayed', delay: 8, crowd_level: 'high' },
  { line: '3', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: '4', status: 'normal', delay: 0, crowd_level: 'high' },
  { line: '5', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: '6', status: 'normal', delay: 0, crowd_level: 'high' },
  { line: '7', status: 'normal', delay: 0, crowd_level: 'medium' },
  { line: 'J', status: 'normal', delay: 0, crowd_level: 'low' },
  { line: 'Z', status: 'normal', delay: 0, crowd_level: 'low' },
  { line: 'S', status: 'normal', delay: 0, crowd_level: 'low' },
];

const mockBusRoutes: string[] = ['Q58', 'Q59', 'Q60', 'B41', 'B42', 'B44', 'B45', 'B46', 'M1', 'M2', 'M3', 'M4', 'M5', 'BX1', 'BX2', 'BX9', 'BX10', 'S40', 'S44', 'S46', 'S48'];

const generateMockBusData = (): BusData[] => {
  return mockBusRoutes.map(route => ({
    route,
    location: {
      lat: 40.7128 + (Math.random() - 0.5) * 0.2,
      lng: -74.0060 + (Math.random() - 0.5) * 0.2,
    },
    next_stop: `${route} Stop ${Math.floor(Math.random() * 20) + 1}`,
    estimated_arrival: new Date(Date.now() + Math.floor(Math.random() * 20) * 60000).toISOString(),
    crowd_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
  }));
};

// API service functions
class TransitAPI {
  // Subway data
  async getSubwayStatus(): Promise<SubwayData[]> {
    // In a real app, this would be an API call to MTA
    // return axios.get(`${API_CONFIG.MTA_BASE_URL}/subway/status`).then(res => res.data);
    
    // Using mock data for now
    return Promise.resolve(mockSubwayData);
  }

  async getSubwayLine(line: string): Promise<SubwayData | null> {
    // In a real app, this would be an API call to MTA
    // return axios.get(`${API_CONFIG.MTA_BASE_URL}/subway/line/${line}`).then(res => res.data);
    
    // Using mock data for now
    const lineData = mockSubwayData.find(subway => subway.line === line);
    return Promise.resolve(lineData || null);
  }

  // Bus data
  async getBusRoutes(borough: string): Promise<string[]> {
    // In a real app, this would be an API call
    // return axios.get(`${API_CONFIG.MTA_BASE_URL}/bus/routes?borough=${borough}`).then(res => res.data);
    
    // Using mock data filtered by borough prefix
    const boroughPrefix = borough.charAt(0).toUpperCase();
    const routes = mockBusRoutes.filter(route => route.startsWith(boroughPrefix));
    return Promise.resolve(routes);
  }

  async getBusLocations(route: string): Promise<BusData[]> {
    // In a real app, this would be an API call
    // return axios.get(`${API_CONFIG.MTA_BASE_URL}/bus/route/${route}/locations`).then(res => res.data);
    
    // Using mock data
    const busData = generateMockBusData().filter(bus => bus.route === route);
    return Promise.resolve(busData);
  }

  // Bike data
  async getBikeStations(lat: number, lng: number, radius: number = 1): Promise<BikeData[]> {
    // In a real app, this would be an API call to Citi Bike
    // return axios.get(`${API_CONFIG.CITIBIKE_BASE_URL}/station_information.json`).then(res => res.data.data.stations);
    
    // Generate mock bike stations around the provided coordinates
    const stations: BikeData[] = [];
    const stationCount = Math.floor(Math.random() * 5) + 3; // 3-7 stations
    
    for (let i = 0; i < stationCount; i++) {
      const stationLat = lat + (Math.random() - 0.5) * 0.02 * radius;
      const stationLng = lng + (Math.random() - 0.5) * 0.02 * radius;
      
      stations.push({
        station_id: `station-${i}`,
        name: `Bike Station ${i + 1}`,
        location: {
          lat: stationLat,
          lng: stationLng,
        },
        available_bikes: Math.floor(Math.random() * 15),
        available_docks: Math.floor(Math.random() * 10),
      });
    }
    
    return Promise.resolve(stations);
  }

  // Uber/Taxi data
  async getUberEstimate(startLat: number, startLng: number, endLat: number, endLng: number): Promise<UberData[]> {
    // In a real app, this would be an API call to Uber
    // return axios.get(`${API_CONFIG.UBER_BASE_URL}/estimates/price?start_latitude=${startLat}&start_longitude=${startLng}&end_latitude=${endLat}&end_longitude=${endLng}`).then(res => res.data.prices);
    
    // Generate mock Uber options
    const options = [
      { product_id: 'uberx', display_name: 'UberX' },
      { product_id: 'uberxl', display_name: 'UberXL' },
      { product_id: 'uberblack', display_name: 'Uber Black' },
      { product_id: 'uberpool', display_name: 'Uber Pool' },
    ];
    
    // Calculate mock duration and fare based on distance
    const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
    
    return Promise.resolve(options.map(option => ({
      ...option,
      estimate: {
        duration: Math.floor(distance * 120), // 120 seconds per mile
        fare: Math.floor((option.product_id === 'uberpool' ? 2.0 : 2.5) * distance * 100) / 100,
      },
    })));
  }

  async getTaxiEstimate(startLat: number, startLng: number, endLat: number, endLng: number): Promise<number> {
    // In a real app, this would be an API call or calculation
    // return axios.get(`${API_CONFIG.TAXI_BASE_URL}/estimate?start_latitude=${startLat}&start_longitude=${startLng}&end_latitude=${endLat}&end_longitude=${endLng}`).then(res => res.data.fare);
    
    // Calculate mock taxi fare based on distance
    const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
    const baseFare = 2.50;
    const perMileFare = 2.50;
    
    return Promise.resolve(Math.floor((baseFare + distance * perMileFare) * 100) / 100);
  }

  // Helper functions
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }
}

// Export a singleton instance
export const transitAPI = new TransitAPI(); 