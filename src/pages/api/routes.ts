import type { NextApiRequest, NextApiResponse } from 'next';
import { transitAPI } from '@/lib/api';
import { transportModes, findOptimalRoutes } from '@/utils/vectorCalculation';
import { subwayRoutes, busRoutes, findClosestPointOnRoute, getRouteSegment, mtaRoutes } from '@/data/mta-routes';

// Mock coordinates for some NYC locations
const locationCoordinates: Record<string, [number, number]> = {
  'Manhattan': [40.7831, -73.9712],
  'Brooklyn': [40.6782, -73.9442],
  'Queens': [40.7282, -73.7949],
  'Bronx': [40.8448, -73.8648],
  'Staten Island': [40.5795, -74.1502],
  'Times Square': [40.7580, -73.9855],
  'Central Park': [40.7829, -73.9654],
  'Prospect Park': [40.6602, -73.9690],
  'Flushing Meadows': [40.7466, -73.8422],
  'Flushing': [40.7654, -73.8318],
  'Bayside': [40.7612, -73.7716],
  'Main St': [40.7590, -73.8300],
  'Yankee Stadium': [40.8296, -73.9262],
};

// Traffic data mock (in a real app this would be real-time data)
const trafficConditions: Record<string, { level: 'low' | 'medium' | 'high', factor: number }> = {
  'Manhattan': { level: 'high', factor: 1.5 },
  'Brooklyn': { level: 'medium', factor: 1.3 },
  'Queens': { level: 'medium', factor: 1.2 },
  'Bronx': { level: 'medium', factor: 1.25 },
  'Staten Island': { level: 'low', factor: 1.1 },
  'Flushing': { level: 'medium', factor: 1.2 },
  'Bayside': { level: 'low', factor: 1.1 },
  'Times Square': { level: 'high', factor: 1.6 },
  'Central Park': { level: 'medium', factor: 1.3 },
};

// Topology data - elevation changes that affect walking/biking comfort
const topologyDifficulty: Record<string, number> = {
  'Manhattan': 0.2, // Some hills
  'Brooklyn': 0.1, // Mostly flat
  'Queens': 0.1, // Mostly flat
  'Bronx': 0.4, // Hilly
  'Staten Island': 0.5, // Very hilly
  'Flushing': 0.1, // Mostly flat
  'Bayside': 0.2, // Some hills
  'Times Square': 0.1, // Flat
  'Central Park': 0.3, // Rolling hills
};

// Helper function to get coordinates from a location string
const getCoordinates = (location: string): [number, number] => {
  // Normalize the location string for better matching
  const normalizedLocation = location.toLowerCase();
  
  // First try exact matches for specific neighborhoods/locations
  for (const [name, coords] of Object.entries(locationCoordinates)) {
    if (normalizedLocation.includes(name.toLowerCase())) {
      return coords;
    }
  }
  
  // If no specific match, try to determine which borough it's in
  if (normalizedLocation.includes('queens') || 
      normalizedLocation.includes('flushing') || 
      normalizedLocation.includes('bayside') ||
      normalizedLocation.includes('jamaica') ||
      normalizedLocation.includes('astoria')) {
    return locationCoordinates['Queens'];
  }
  
  if (normalizedLocation.includes('brooklyn') ||
      normalizedLocation.includes('williamsburg') ||
      normalizedLocation.includes('park slope')) {
    return locationCoordinates['Brooklyn'];
  }
  
  if (normalizedLocation.includes('bronx')) {
    return locationCoordinates['Bronx'];
  }
  
  if (normalizedLocation.includes('staten')) {
    return locationCoordinates['Staten Island'];
  }
  
  // Default to Manhattan if not found
  return locationCoordinates['Manhattan'];
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

// Define the route colors for different modes
const getRouteColor = (mode: string) => {
  switch (mode) {
    case 'subway':
      return '#3b82f6';  // blue-500
    case 'bus':
      return '#22c55e';  // green-500
    case 'walk':
      return '#6b7280';  // gray-500
    case 'bike':
    case 'ebike':
      return '#8b5cf6';  // purple-500
    case 'ferry':
      return '#06b6d4';  // cyan-500
    case 'taxi':
    case 'uber':
      return '#f59e0b';  // amber-500
    default:
      return '#ef4444';  // red-500
  }
};

// Add this after getRouteColor function and before interface RouteItem
const calculateCO2Emissions = (mode: string, distanceKm: number): number => {
  // CO2 emissions in grams per kilometer
  const emissionsFactors: Record<string, number> = {
    'subway': 30,     // Electric subway
    'bus': 70,        // Bus (diesel)
    'walk': 0,        // Walking - no emissions
    'bike': 0,        // Biking - no emissions
    'ebike': 5,       // E-bike - minimal emissions from electricity
    'ferry': 120,     // Ferry
    'taxi': 150,      // Taxi
    'uber': 150,      // Uber
    'shared': 90,     // Shared ride (per passenger)
    'default': 100    // Default value
  };

  // If mode is walking or biking, return 0 regardless of distance
  if (mode === 'walk' || mode === 'bike') {
    return 0;
  }

  const emissionFactor = emissionsFactors[mode] || emissionsFactors.default;
  return Math.round(emissionFactor * distanceKm);
};

// Define the route type
interface RouteItem {
  id: string;
  name: string;
  duration: number;
  cost: number;
  comfort: string;
  vectorScore: number;
  segments: any[];
  balancedScore?: {
    raw: number;
    score: number;
    timeScore: number;
    costScore: number;
    comfortScore: number;
    transferScore: number;
  };
  // Additional properties
  hasTopologyImpact?: boolean;
  numTransfers?: number;
  traffic?: { level: string; impact: number };
  eta?: string;
  co2?: number;
  isWheelchairAccessible?: boolean;
  scores?: any;
  routeColor?: string;
  pathData?: any[];
  costBreakdown?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { from, to, priority, noise, safety, bags, wheelchair } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: 'Origin and destination are required' });
  }

  try {
    // In a real app, we would use geocoding to get coordinates
    const fromCoords = getCoordinates(from as string);
    const toCoords = getCoordinates(to as string);
    
    // Log the coordinates for debugging
    console.log(`From location: "${from}" → coordinates: [${fromCoords[0]}, ${fromCoords[1]}]`);
    console.log(`To location: "${to}" → coordinates: [${toCoords[0]}, ${toCoords[1]}]`);
    
    // Get user preferences
    const userPriority = priority as string || 'balanced';
    const userNoise = noise as string || 'moderate';
    const userSafety = safety as string || 'moderate';
    const userBags = parseInt(bags as string || '0', 10);
    const requireWheelchair = wheelchair === 'true';
    
    // Calculate distance
    const distance = calculateDistance(
      fromCoords[0], fromCoords[1], 
      toCoords[0], toCoords[1]
    );

    // Get real-time transit data
    const subwayStatus = await transitAPI.getSubwayStatus();
    
    // Determine available subway lines based on location
    const subwayLinesByLocation: Record<string, string[]> = {
      'Manhattan': ['1', '2', '3', '4', '5', '6', 'A', 'C', 'E', 'B', 'D', 'F', 'M', 'N', 'Q', 'R', 'W', 'L'],
      'Brooklyn': ['A', 'C', 'G', 'J', 'Z', 'L', 'M', 'N', 'Q', 'R', '2', '3', '4', '5'],
      'Queens': ['E', 'F', 'M', 'R', 'N', 'W', 'G', '7'],
      'Bronx': ['1', '2', '4', '5', '6', 'B', 'D'],
      'Staten Island': ['SIR'],
      'Flushing': ['7'],
      'Main St': ['7'],
      'Times Square': ['1', '2', '3', 'N', 'Q', 'R', 'W', '7', 'S'],
      'Central Park': ['A', 'B', 'C', 'D', '1'],
      'Yankee Stadium': ['4', 'B', 'D'],
      'JFK Airport': ['A', 'E'],
      'LaGuardia Airport': [],
      'Prospect Park': ['B', 'Q', 'S'],
    };
    
    // Determine from and to areas to check subway availability
    const fromArea = Object.keys(locationCoordinates).find(area => 
      (from as string).toLowerCase().includes(area.toLowerCase())
    ) || 'Manhattan';
    
    const toArea = Object.keys(locationCoordinates).find(area => 
      (to as string).toLowerCase().includes(area.toLowerCase())
    ) || 'Manhattan';
    
    // Check available subway lines for the route
    const fromSubwayLines = subwayLinesByLocation[fromArea] || [];
    const toSubwayLines = subwayLinesByLocation[toArea] || [];
    
    // Find common subway lines or lines that can get you there with a transfer
    let availableSubwayLines = fromSubwayLines.filter(line => toSubwayLines.includes(line));
    
    // If no direct lines, consider options with transfers
    const hasTransferOptions = fromSubwayLines.length > 0 && toSubwayLines.length > 0;
    
    // Check subway status to see if the lines are operating normally
    const operatingSubwayLines = availableSubwayLines.filter(line => {
      const lineStatus = subwayStatus.find(s => s.line === line);
      return lineStatus && lineStatus.status === 'normal';
    });
    
    // Filter to just get one operating line if available
    const bestSubwayLine = operatingSubwayLines.length > 0 ? operatingSubwayLines[0] : null;
    
    // Get all the bus routes for both areas
    const fromBoroughPrefix = fromArea.charAt(0).toUpperCase();
    const toBoroughPrefix = toArea.charAt(0).toUpperCase();
    const busRoutesFrom = await transitAPI.getBusRoutes(fromArea);
    
    // Map specific neighborhoods to appropriate bus routes
    const busRoutesByArea: Record<string, string[]> = {
      'Manhattan': ['M1', 'M2', 'M3', 'M4', 'M5', 'M15', 'M31', 'M42', 'M60'],
      'Brooklyn': ['B41', 'B42', 'B44', 'B46', 'B67', 'B68', 'B69'],
      'Queens': ['Q58', 'Q59', 'Q60', 'Q65', 'Q66', 'Q44', 'Q46'],
      'Bronx': ['BX1', 'BX2', 'BX9', 'BX10', 'BX12', 'BX22'],
      'Staten Island': ['S40', 'S44', 'S46', 'S48', 'S51', 'S53'],
      'Flushing': ['Q65', 'Q66', 'Q17', 'Q27', 'Q44'],
      'Bayside': ['Q27', 'Q31', 'Q76', 'Q13'],
      'Times Square': ['M42', 'M104', 'Q104'],
      'JFK Airport': ['Q3', 'Q10', 'B15'],
      'LaGuardia Airport': ['Q70', 'M60'],
    };
    
    // Get specific bus routes for origin and destination
    const specificFromBuses = busRoutesByArea[fromArea] || [];
    const specificToBuses = busRoutesByArea[toArea] || [];
    
    // Find bus routes that might connect the two areas
    let connectingBuses = specificFromBuses.filter(bus => specificToBuses.includes(bus));
    
    // Check if origin and destination are in different boroughs
    const originBorough = 
      fromArea === 'Manhattan' || fromArea === 'Times Square' || fromArea === 'Central Park' ? 'Manhattan' :
      fromArea === 'Brooklyn' || fromArea === 'Prospect Park' ? 'Brooklyn' :
      fromArea === 'Queens' || fromArea === 'Flushing' || fromArea === 'Bayside' || fromArea === 'JFK Airport' ? 'Queens' :
      fromArea === 'Bronx' || fromArea === 'Yankee Stadium' ? 'Bronx' :
      fromArea === 'Staten Island' ? 'Staten Island' : 'Manhattan';
    
    const destinationBorough = 
      toArea === 'Manhattan' || toArea === 'Times Square' || toArea === 'Central Park' ? 'Manhattan' :
      toArea === 'Brooklyn' || toArea === 'Prospect Park' ? 'Brooklyn' :
      toArea === 'Queens' || toArea === 'Flushing' || toArea === 'Bayside' || toArea === 'JFK Airport' ? 'Queens' :
      toArea === 'Bronx' || toArea === 'Yankee Stadium' ? 'Bronx' :
      toArea === 'Staten Island' ? 'Staten Island' : 'Manhattan';
    
    // Check if this is a cross-borough trip requiring transfers
    const isCrossBoroughTrip = originBorough !== destinationBorough;
    
    // Express Bus routes for cross-borough travel
    const expressBusRoutes: Record<string, string[]> = {
      'Queens-Manhattan': ['QM1', 'QM5', 'QM7', 'QM8'],
      'Brooklyn-Manhattan': ['BM1', 'BM2', 'BM3', 'BM4'],
      'Bronx-Manhattan': ['BxM1', 'BxM2', 'BxM3', 'BxM4'],
      'Staten Island-Manhattan': ['SIM1', 'SIM3', 'SIM4', 'SIM5'],
    };
    
    // Get appropriate express bus if this is cross-borough
    let expressBusRoute = '';
    if (isCrossBoroughTrip) {
      const routeKey = `${originBorough}-${destinationBorough}`;
      const reverseRouteKey = `${destinationBorough}-${originBorough}`;
      
      if (expressBusRoutes[routeKey]) {
        expressBusRoute = expressBusRoutes[routeKey][0];
      } else if (expressBusRoutes[reverseRouteKey]) {
        expressBusRoute = expressBusRoutes[reverseRouteKey][0];
      }
    }
    
    // If no direct connection, pick a bus from origin for local trips only
    // For cross-borough trips without express buses, we'll rely on subway instead
    if (connectingBuses.length === 0 && specificFromBuses.length > 0 && !isCrossBoroughTrip) {
      connectingBuses = [specificFromBuses[0]];
    }
    
    // Default to a borough-specific bus if nothing else is available
    const busRoute = connectingBuses.length > 0 
      ? connectingBuses[0] 
      : (expressBusRoute || `${fromBoroughPrefix}${Math.floor(Math.random() * 50) + 1}`);
    
    // Get traffic conditions for origin and destination areas
    const originTraffic = trafficConditions[originBorough] || { level: 'medium', factor: 1.25 };
    const destinationTraffic = trafficConditions[destinationBorough] || { level: 'medium', factor: 1.25 };
    
    // Get topology difficulty for each area
    const originTopology = topologyDifficulty[originBorough] || 0.2;
    const destinationTopology = topologyDifficulty[destinationBorough] || 0.2;
    
    // Calculate average traffic and topology difficulty
    const avgTrafficFactor = (originTraffic.factor + destinationTraffic.factor) / 2;
    const avgTopologyDifficulty = (originTopology + destinationTopology) / 2;
    
    const generateRoutes = () => {
      const routes: RouteItem[] = [];
      
      // Helper function to calculate balanced score
      const calculateBalancedScore = (
        duration: number, 
        cost: number, 
        comfort: string, 
        numTransfers: number
      ) => {
        // Simple scoring system
        const timeScore = Math.max(0, 1 - (duration / 120)); // Normalize to 0-1 (2 hours max)
        const costScore = Math.max(0, 1 - (cost / 30));      // Normalize to 0-1 ($30 max)
        const comfortScore = comfort === 'high' ? 1 : comfort === 'medium' ? 0.6 : 0.3;
        const transferScore = Math.max(0, 1 - (numTransfers * 0.2));

        // Weighted average
        const score = (
          timeScore * 0.4 +
          costScore * 0.3 +
          comfortScore * 0.2 +
          transferScore * 0.1
        );

        return {
          raw: score,
          score: Math.round(score * 10),
          timeScore: Math.round(timeScore * 10),
          costScore: Math.round(costScore * 10),
          comfortScore: Math.round(comfortScore * 10),
          transferScore: Math.round(transferScore * 10)
        };
      };

      // Always add a walking route as a baseline option
      const walkingRoute: RouteItem = {
        id: '0',
        name: 'Walking Route',
        duration: Math.round(distance * 20),
        cost: 0,
        comfort: 'medium',
        vectorScore: 0.5,
        segments: [
          {
            mode: 'walk',
            startLocation: from as string,
            endLocation: to as string,
            duration: Math.round(distance * 20),
            cost: 0,
            lineInfo: 'Walk to destination',
          }
        ],
      };
      walkingRoute.balancedScore = calculateBalancedScore(walkingRoute.duration, walkingRoute.cost, walkingRoute.comfort, 0);
      // Calculate CO2 for walking (0 emissions)
      walkingRoute.co2 = calculateCO2Emissions('walk', distance * 1.60934); // Convert miles to km
      routes.push(walkingRoute);

      // Add a bike route if distance is reasonable (less than 10 miles)
      if (distance < 10) {
        const bikeRoute: RouteItem = {
          id: '1',
          name: 'Bike Route',
          duration: Math.round(distance * 12), // ~5mph average speed
          cost: 3.50, // Citi Bike single ride
          comfort: 'medium',
          vectorScore: 0.65,
          segments: [
            {
              mode: 'bike',
              startLocation: from as string,
              endLocation: to as string,
              duration: Math.round(distance * 12),
              cost: 3.50,
              lineInfo: 'Citi Bike',
            }
          ],
        };
        bikeRoute.balancedScore = calculateBalancedScore(bikeRoute.duration, bikeRoute.cost, bikeRoute.comfort, 0);
        // Calculate CO2 for biking (0 emissions)
        bikeRoute.co2 = calculateCO2Emissions('bike', distance * 1.60934);
        routes.push(bikeRoute);
      }

      // Add subway routes if available
      if (bestSubwayLine || hasTransferOptions) {
        const subwayRoute: RouteItem = {
          id: '2',
          name: 'Subway Route',
          duration: Math.round(distance * 8) + 10, // Transit time + walking
          cost: 2.90,
          comfort: 'high',
          vectorScore: 0.8,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: 'Subway Station',
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to station',
            },
            {
              mode: 'subway',
              startLocation: 'Subway Station',
              endLocation: 'Subway Station',
              duration: Math.round(distance * 8),
              cost: 2.90,
              lineInfo: bestSubwayLine ? `${bestSubwayLine} Train` : 'Subway',
            },
            {
              mode: 'walk',
              startLocation: 'Subway Station',
              endLocation: to as string,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to destination',
            }
          ],
        };
        subwayRoute.balancedScore = calculateBalancedScore(subwayRoute.duration, subwayRoute.cost, subwayRoute.comfort, 0);
        // Calculate CO2 for subway route (walking + subway segments)
        subwayRoute.co2 = 
          calculateCO2Emissions('walk', 0.4) + // Assuming 0.4 km walking total
          calculateCO2Emissions('subway', distance * 1.60934); // Main subway journey
        routes.push(subwayRoute);
      }

      // Add bus route
      const busRoute: RouteItem = {
        id: '3',
        name: 'Bus Route',
        duration: Math.round(distance * 15) + 10, // Bus time + walking
        cost: 2.90,
        comfort: 'medium',
        vectorScore: 0.6,
        segments: [
          {
            mode: 'walk',
            startLocation: from as string,
            endLocation: 'Bus Stop',
            duration: 5,
            cost: 0,
            lineInfo: 'Walk to bus stop',
          },
          {
            mode: 'bus',
            startLocation: 'Bus Stop',
            endLocation: 'Bus Stop',
            duration: Math.round(distance * 15),
            cost: 2.90,
            lineInfo: `Local Bus`,
          },
          {
            mode: 'walk',
            startLocation: 'Bus Stop',
            endLocation: to as string,
            duration: 5,
            cost: 0,
            lineInfo: 'Walk to destination',
          }
        ],
      };
      busRoute.balancedScore = calculateBalancedScore(busRoute.duration, busRoute.cost, busRoute.comfort, 0);
      // Calculate CO2 for bus route (walking + bus segments)
      busRoute.co2 = 
        calculateCO2Emissions('walk', 0.4) + // Assuming 0.4 km walking total
        calculateCO2Emissions('bus', distance * 1.60934); // Main bus journey
      routes.push(busRoute);

      // Add express bus for longer distances
      if (distance > 5) {
        const expressBusRoute: RouteItem = {
          id: '4',
          name: 'Express Bus Route',
          duration: Math.round(distance * 10) + 10, // Express bus time + walking
          cost: 7.00,
          comfort: 'high',
          vectorScore: 0.75,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: 'Express Bus Stop',
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to bus stop',
            },
            {
              mode: 'bus',
              startLocation: 'Express Bus Stop',
              endLocation: 'Express Bus Stop',
              duration: Math.round(distance * 10),
              cost: 7.00,
              lineInfo: 'Express Bus',
            },
            {
              mode: 'walk',
              startLocation: 'Express Bus Stop',
              endLocation: to as string,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to destination',
            }
          ],
        };
        expressBusRoute.balancedScore = calculateBalancedScore(expressBusRoute.duration, expressBusRoute.cost, expressBusRoute.comfort, 0);
        // Calculate CO2 for express bus route (walking + bus segments)
        expressBusRoute.co2 = 
          calculateCO2Emissions('walk', 0.4) + // Assuming 0.4 km walking total
          calculateCO2Emissions('bus', distance * 1.60934); // Main bus journey
        routes.push(expressBusRoute);
      }

      // Add a ride-sharing route as another option
      const uberRoute: RouteItem = {
        id: '5',
        name: 'Ride-Share Route',
        duration: Math.round(distance * 3),
        cost: parseFloat((distance * 2.5).toFixed(2)),
        comfort: 'high',
        vectorScore: 0.78,
        segments: [
          {
            mode: 'uber',
            startLocation: from as string,
            endLocation: to as string,
            duration: Math.round(distance * 3),
            cost: parseFloat((distance * 2.5).toFixed(2)),
            lineInfo: 'UberX',
          }
        ],
      };
      uberRoute.balancedScore = calculateBalancedScore(uberRoute.duration, uberRoute.cost, uberRoute.comfort, 0);
      // Calculate CO2 for ride-share route
      uberRoute.co2 = calculateCO2Emissions('uber', distance * 1.60934);
      routes.push(uberRoute);

      // Add a combined subway + bus route for longer distances
      if (distance > 3 && (bestSubwayLine || hasTransferOptions)) {
        const subwayBusRoute: RouteItem = {
          id: '6',
          name: 'Subway + Bus Route',
          duration: Math.round(distance * 10) + 15, // Transit time + transfers
          cost: 2.90, // Single fare covers both
          comfort: 'medium',
          vectorScore: 0.7,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: 'Subway Station',
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to station',
            },
            {
              mode: 'subway',
              startLocation: 'Subway Station',
              endLocation: 'Transfer Station',
              duration: Math.round(distance * 6),
              cost: 2.90,
              lineInfo: bestSubwayLine ? `${bestSubwayLine} Train` : 'Subway',
            },
            {
              mode: 'bus',
              startLocation: 'Transfer Station',
              endLocation: 'Bus Stop',
              duration: Math.round(distance * 4),
              cost: 0,
              lineInfo: 'Local Bus',
            },
            {
              mode: 'walk',
              startLocation: 'Bus Stop',
              endLocation: to as string,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to destination',
            }
          ],
        };
        subwayBusRoute.balancedScore = calculateBalancedScore(subwayBusRoute.duration, subwayBusRoute.cost, subwayBusRoute.comfort, 2);
        subwayBusRoute.co2 = calculateCO2Emissions('subway', distance * 0.6 * 1.60934) + 
                            calculateCO2Emissions('bus', distance * 0.4 * 1.60934);
        routes.push(subwayBusRoute);
      }

      // Add an e-bike route if distance is reasonable
      if (distance < 12) {
        const ebikeRoute: RouteItem = {
          id: '7',
          name: 'E-Bike Route',
          duration: Math.round(distance * 10), // ~6mph average speed
          cost: 5.00, // E-bike rental
          comfort: 'medium',
          vectorScore: 0.7,
          segments: [
            {
              mode: 'ebike',
              startLocation: from as string,
              endLocation: to as string,
              duration: Math.round(distance * 10),
              cost: 5.00,
              lineInfo: 'E-Bike Share',
            }
          ],
        };
        ebikeRoute.balancedScore = calculateBalancedScore(ebikeRoute.duration, ebikeRoute.cost, ebikeRoute.comfort, 0);
        ebikeRoute.co2 = calculateCO2Emissions('ebike', distance * 1.60934);
        routes.push(ebikeRoute);
      }

      // Add a shared ride route
      const sharedRoute: RouteItem = {
        id: '8',
        name: 'Shared Ride Route',
        duration: Math.round(distance * 4), // Slightly longer than private ride
        cost: parseFloat((distance * 1.8).toFixed(2)), // Cheaper than private
        comfort: 'medium',
        vectorScore: 0.75,
        segments: [
          {
            mode: 'shared',
            startLocation: from as string,
            endLocation: to as string,
            duration: Math.round(distance * 4),
            cost: parseFloat((distance * 1.8).toFixed(2)),
            lineInfo: 'UberPool/Shared',
          }
        ],
      };
      sharedRoute.balancedScore = calculateBalancedScore(sharedRoute.duration, sharedRoute.cost, sharedRoute.comfort, 0);
      sharedRoute.co2 = calculateCO2Emissions('shared', distance * 1.60934);
      routes.push(sharedRoute);

      // Add a subway + walk route for medium distances
      if (bestSubwayLine || hasTransferOptions) {
        const subwayWalkRoute: RouteItem = {
          id: '9',
          name: 'Subway + Walk Route',
          duration: Math.round(distance * 9) + 15,
          cost: 2.90,
          comfort: 'medium',
          vectorScore: 0.7,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: 'Subway Station',
              duration: 7,
              cost: 0,
              lineInfo: 'Walk to station',
            },
            {
              mode: 'subway',
              startLocation: 'Subway Station',
              endLocation: 'Subway Station',
              duration: Math.round(distance * 6),
              cost: 2.90,
              lineInfo: bestSubwayLine ? `${bestSubwayLine} Train` : 'Subway',
            },
            {
              mode: 'walk',
              startLocation: 'Subway Station',
              endLocation: to as string,
              duration: 8,
              cost: 0,
              lineInfo: 'Walk to destination',
            }
          ],
        };
        subwayWalkRoute.balancedScore = calculateBalancedScore(subwayWalkRoute.duration, subwayWalkRoute.cost, subwayWalkRoute.comfort, 1);
        subwayWalkRoute.co2 = calculateCO2Emissions('subway', distance * 1.60934);
        routes.push(subwayWalkRoute);
      }

      // Add a bike + subway combination for longer distances
      if (distance > 2 && (bestSubwayLine || hasTransferOptions)) {
        const bikeSubwayRoute: RouteItem = {
          id: '10',
          name: 'Bike + Subway Route',
          duration: Math.round(distance * 7) + 10,
          cost: 5.40, // Bike share + subway fare
          comfort: 'medium',
          vectorScore: 0.75,
          segments: [
            {
              mode: 'bike',
              startLocation: from as string,
              endLocation: 'Subway Station',
              duration: Math.round(distance * 0.3 * 12),
              cost: 2.50,
              lineInfo: 'Bike to station',
            },
            {
              mode: 'subway',
              startLocation: 'Subway Station',
              endLocation: 'Subway Station',
              duration: Math.round(distance * 0.5 * 8),
              cost: 2.90,
              lineInfo: bestSubwayLine ? `${bestSubwayLine} Train` : 'Subway',
            },
            {
              mode: 'walk',
              startLocation: 'Subway Station',
              endLocation: to as string,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to destination',
            }
          ],
        };
        bikeSubwayRoute.balancedScore = calculateBalancedScore(bikeSubwayRoute.duration, bikeSubwayRoute.cost, bikeSubwayRoute.comfort, 1);
        bikeSubwayRoute.co2 = calculateCO2Emissions('subway', distance * 0.5 * 1.60934);
        routes.push(bikeSubwayRoute);
      }

      // Add an express bus + local bus combination for cross-borough trips
      if (isCrossBoroughTrip && distance > 5) {
        const expressBusComboRoute: RouteItem = {
          id: '11',
          name: 'Express + Local Bus Route',
          duration: Math.round(distance * 12) + 15,
          cost: 7.00, // Express bus fare covers local transfer
          comfort: 'medium',
          vectorScore: 0.65,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: 'Express Bus Stop',
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to express bus',
            },
            {
              mode: 'bus',
              startLocation: 'Express Bus Stop',
              endLocation: 'Transfer Point',
              duration: Math.round(distance * 0.7 * 10),
              cost: 7.00,
              lineInfo: 'Express Bus',
            },
            {
              mode: 'bus',
              startLocation: 'Transfer Point',
              endLocation: 'Bus Stop',
              duration: Math.round(distance * 0.3 * 15),
              cost: 0,
              lineInfo: 'Local Bus',
            },
            {
              mode: 'walk',
              startLocation: 'Bus Stop',
              endLocation: to as string,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to destination',
            }
          ],
        };
        expressBusComboRoute.balancedScore = calculateBalancedScore(expressBusComboRoute.duration, expressBusComboRoute.cost, expressBusComboRoute.comfort, 2);
        expressBusComboRoute.co2 = calculateCO2Emissions('bus', distance * 1.60934);
        routes.push(expressBusComboRoute);
      }

      // Add a ferry route if available between boroughs
      if (isCrossBoroughTrip && (originBorough === 'Manhattan' || destinationBorough === 'Manhattan')) {
        const ferryRoute: RouteItem = {
          id: '12',
          name: 'Ferry Route',
          duration: Math.round(distance * 8) + 20,
          cost: 2.90,
          comfort: 'high',
          vectorScore: 0.8,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: 'Ferry Terminal',
              duration: 10,
              cost: 0,
              lineInfo: 'Walk to ferry',
            },
            {
              mode: 'ferry',
              startLocation: 'Ferry Terminal',
              endLocation: 'Ferry Terminal',
              duration: Math.round(distance * 8),
              cost: 2.90,
              lineInfo: 'NYC Ferry',
            },
            {
              mode: 'walk',
              startLocation: 'Ferry Terminal',
              endLocation: to as string,
              duration: 10,
              cost: 0,
              lineInfo: 'Walk to destination',
            }
          ],
        };
        ferryRoute.balancedScore = calculateBalancedScore(ferryRoute.duration, ferryRoute.cost, ferryRoute.comfort, 1);
        ferryRoute.co2 = calculateCO2Emissions('ferry', distance * 1.60934);
        routes.push(ferryRoute);
      }

      // Add a bike + bus combination for medium distances
      if (distance > 2 && distance < 10) {
        const bikeBusRoute: RouteItem = {
          id: '13',
          name: 'Bike + Bus Route',
          duration: Math.round(distance * 11) + 10,
          cost: 5.40, // Bike share + bus fare
          comfort: 'medium',
          vectorScore: 0.7,
          segments: [
            {
              mode: 'bike',
              startLocation: from as string,
              endLocation: 'Bus Stop',
              duration: Math.round(distance * 0.4 * 12),
              cost: 2.50,
              lineInfo: 'Bike to bus stop',
            },
            {
              mode: 'bus',
              startLocation: 'Bus Stop',
              endLocation: 'Bus Stop',
              duration: Math.round(distance * 0.6 * 15),
              cost: 2.90,
              lineInfo: 'Local Bus',
            },
            {
              mode: 'walk',
              startLocation: 'Bus Stop',
              endLocation: to as string,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to destination',
            }
          ],
        };
        bikeBusRoute.balancedScore = calculateBalancedScore(bikeBusRoute.duration, bikeBusRoute.cost, bikeBusRoute.comfort, 1);
        bikeBusRoute.co2 = calculateCO2Emissions('bus', distance * 0.6 * 1.60934);
        routes.push(bikeBusRoute);
      }

      // Add a subway + shared ride combination for late night or areas with limited service
      const subwaySharedRoute: RouteItem = {
        id: '14',
        name: 'Subway + Shared Ride Route',
        duration: Math.round(distance * 6) + 15,
        cost: parseFloat((2.90 + distance * 1.2).toFixed(2)),
        comfort: 'high',
        vectorScore: 0.75,
        segments: [
          {
            mode: 'walk',
            startLocation: from as string,
            endLocation: 'Subway Station',
            duration: 5,
            cost: 0,
            lineInfo: 'Walk to station',
          },
          {
            mode: 'subway',
            startLocation: 'Subway Station',
            endLocation: 'Subway Station',
            duration: Math.round(distance * 0.6 * 8),
            cost: 2.90,
            lineInfo: bestSubwayLine ? `${bestSubwayLine} Train` : 'Subway',
          },
          {
            mode: 'shared',
            startLocation: 'Subway Station',
            endLocation: to as string,
            duration: Math.round(distance * 0.4 * 4),
            cost: parseFloat((distance * 1.2).toFixed(2)),
            lineInfo: 'Shared Ride',
          }
        ],
      };
      subwaySharedRoute.balancedScore = calculateBalancedScore(subwaySharedRoute.duration, subwaySharedRoute.cost, subwaySharedRoute.comfort, 1);
      subwaySharedRoute.co2 = 
        calculateCO2Emissions('subway', distance * 0.6 * 1.60934) +
        calculateCO2Emissions('shared', distance * 0.4 * 1.60934);
      routes.push(subwaySharedRoute);

      // Add an express subway route if available (limited stops)
      if (bestSubwayLine && distance > 3) {
        const expressSubwayRoute: RouteItem = {
          id: '15',
          name: 'Express Subway Route',
          duration: Math.round(distance * 6) + 10,
          cost: 2.90,
          comfort: 'high',
          vectorScore: 0.85,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: 'Express Station',
              duration: 7,
              cost: 0,
              lineInfo: 'Walk to express station',
            },
            {
              mode: 'subway',
              startLocation: 'Express Station',
              endLocation: 'Express Station',
              duration: Math.round(distance * 6),
              cost: 2.90,
              lineInfo: `${bestSubwayLine} Express Train`,
            },
            {
              mode: 'walk',
              startLocation: 'Express Station',
              endLocation: to as string,
              duration: 7,
              cost: 0,
              lineInfo: 'Walk to destination',
            }
          ],
        };
        expressSubwayRoute.balancedScore = calculateBalancedScore(expressSubwayRoute.duration, expressSubwayRoute.cost, expressSubwayRoute.comfort, 1);
        expressSubwayRoute.co2 = calculateCO2Emissions('subway', distance * 1.60934);
        routes.push(expressSubwayRoute);
      }

      // Sort routes primarily by duration
      routes.sort((a, b) => a.duration - b.duration);

      return routes;
    };
    
    const routes = generateRoutes();

    // Helper function to finalize route details
    const finalizeRoute = (route: RouteItem): RouteItem => {
      // Calculate number of transfers
      const numTransfers = route.segments.length > 0 ? route.segments.length - 1 : 0;
      
      // Check if route has walking/biking components
      const hasTopologyImpact = route.segments.some(segment => 
        segment.mode === 'walk' || segment.mode === 'ebike'
      );
      
      // Calculate traffic impact for road-based segments
      const roadBasedSegments = route.segments.filter(segment => 
        segment.mode === 'bus' || segment.mode === 'uber' || segment.mode === 'taxi' || segment.mode === 'shared'
      );
      const trafficImpact = roadBasedSegments.length > 0 ? avgTrafficFactor : 1.0;
      
      // Calculate ETA
      const now = new Date();
      const eta = new Date(now.getTime() + route.duration * 60000);
      
      // Add route color based on mode
      const routeColor = getRouteColor(route.segments[0]?.mode || 'walk');
      
      // Return enhanced route
      return {
        ...route,
        numTransfers,
        hasTopologyImpact,
        traffic: { 
          level: trafficImpact > 1.3 ? 'high' : trafficImpact > 1.1 ? 'medium' : 'low',
          impact: trafficImpact
        },
        eta: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        routeColor,
        isWheelchairAccessible: true, // Simplified - in real app would check actual accessibility
      };
    };

    const mockRoutes = routes.map(finalizeRoute);

    // Only sort if we have routes
    if (mockRoutes.length > 0) {
      // Sort routes by duration (fastest first)
      mockRoutes.sort((a, b) => {
        // Primary sort by duration
        if (a.duration !== b.duration) {
          return a.duration - b.duration;
        }
        
        // Secondary sort by balanced score if durations are equal
        const scoreA = a.balancedScore?.score || 0;
        const scoreB = b.balancedScore?.score || 0;
        return scoreB - scoreA;
      });

      // Add "best" indicator to the fastest route
      mockRoutes[0].name = `${mockRoutes[0].name} (Fastest Route)`;
    }

    // Return error if no routes found
    if (mockRoutes.length === 0) {
      return res.status(404).json({ 
        error: "No routes found",
        message: "We couldn't find any routes between these locations. Please try different locations or adjust your preferences."
      });
    }

    // Return the sorted routes
    return res.status(200).json({ 
      routes: mockRoutes.slice(0, 6), // Return first 6 routes, now sorted from worst to best
      distance,
      fromCoords,
      toCoords,
      subwayAvailable: bestSubwayLine !== null || hasTransferOptions,
      transferRequired: !bestSubwayLine && hasTransferOptions,
      traffic: {
        origin: originTraffic,
        destination: destinationTraffic,
        average: avgTrafficFactor
      },
      topology: {
        origin: originTopology,
        destination: destinationTopology,
        average: avgTopologyDifficulty
      }
    });
  } catch (error) {
    console.error('Error calculating routes:', error);
    return res.status(500).json({ message: 'Error calculating routes' });
  }
} 