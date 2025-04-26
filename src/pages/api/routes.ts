import type { NextApiRequest, NextApiResponse } from 'next';
import { transitAPI } from '@/lib/api';
import { transportModes, findOptimalRoutes } from '@/utils/vectorCalculation';

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
    case 'ebike':
      return '#8b5cf6';  // purple-500
    case 'taxi':
    case 'uber':
      return '#f59e0b';  // amber-500
    case 'walk':
      return '#6b7280';  // gray-500
    default:
      return '#ef4444';  // red-500
  }
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
    
    // Routes generation logic
    const generateRoutes = () => {
      const routes: RouteItem[] = [];
      
      // Calculate a balanced score to determine which route should be "Best Overall"
      const calculateBalancedScore = (duration: number, cost: number, comfort: string, numTransfers: number, hasBags: boolean, isHilly: boolean, trafficImpact: number, isWheelchairAccessible: boolean) => {
        // Base comfort score from comfort level
        let comfortScore = comfort === 'high' ? 0.9 : comfort === 'medium' ? 0.6 : 0.3;
        
        // Adjust comfort for number of bags
        if (userBags > 0) {
          // Each bag reduces comfort, especially for walking/biking
          comfortScore = Math.max(0.1, comfortScore - (userBags * 0.1));
        }
        
        // Adjust comfort for topology if route involves walking or biking
        if (isHilly) {
          comfortScore = Math.max(0.1, comfortScore - avgTopologyDifficulty);
        }
        
        // Normalize time and cost on a scale where lower is better
        // Traffic factor increases duration for road-based transport
        const adjustedDuration = duration * trafficImpact;
        const timeScore = Math.max(0, 1 - (adjustedDuration / 120)); // Assume 120 mins is worst case
        const costScore = Math.max(0, 1 - (cost / 30));      // Assume $30 is worst case
        
        // Transfer penalty
        const transferScore = Math.max(0, 1 - (numTransfers * 0.15));
        
        // Adjust weights based on user priority
        let timeWeight = 0.40;
        let costWeight = 0.35;
        let comfortWeight = 0.15;
        let transferWeight = 0.10;
        
        switch (userPriority) {
          case 'speed':
            timeWeight = 0.60;
            costWeight = 0.20;
            comfortWeight = 0.10;
            transferWeight = 0.10;
            break;
          case 'cost':
            timeWeight = 0.20;
            costWeight = 0.60;
            comfortWeight = 0.10;
            transferWeight = 0.10;
            break;
          case 'comfort':
            timeWeight = 0.20;
            costWeight = 0.20;
            comfortWeight = 0.45;
            transferWeight = 0.15;
            break;
          default: // 'balanced'
            // Keep the default weights
            break;
        }
        
        // Further adjust comfort weight based on noise sensitivity
        if (userNoise === 'high') {
          // If user is highly sensitive to noise, increase comfort weight slightly
          comfortWeight += 0.1;
          // And reduce other weights proportionally
          timeWeight -= 0.04;
          costWeight -= 0.03;
          transferWeight -= 0.03;
        }
        
        // Adjust for safety preference
        if (userSafety === 'high') {
          // For high safety preference, fewer transfers and higher comfort are preferred
          transferWeight += 0.05;
          comfortWeight += 0.05;
          timeWeight -= 0.05;
          costWeight -= 0.05;
        }
        
        // Add wheelchair accessibility factor if needed
        let accessibilityPenalty = 0;
        if (requireWheelchair && !isWheelchairAccessible) {
          // Significantly penalize non-accessible routes when wheelchair is required
          accessibilityPenalty = 0.5;
        }
        
        const rawScore = ((timeScore * timeWeight) + 
                          (costScore * costWeight) + 
                          (comfortScore * comfortWeight) + 
                          (transferScore * transferWeight)) * 
                          (1 - accessibilityPenalty);
        
        // Convert to 1-10 scale
        return {
          raw: rawScore,
          score: Math.round(rawScore * 10),
          timeScore: Math.round(timeScore * 10),
          costScore: Math.round(costScore * 10),
          comfortScore: Math.round(comfortScore * 10),
          transferScore: Math.round(transferScore * 10)
        };
      };
      
      // Function to generate route color based on score
      const getRouteColorFromScore = (score: number) => {
        // Color gradient from red (1) to yellow (5) to green (10)
        if (score <= 3) return '#ef4444'; // red-500
        if (score <= 5) return '#f59e0b'; // amber-500
        if (score <= 7) return '#facc15'; // yellow-400
        if (score <= 9) return '#65a30d'; // lime-600
        return '#16a34a'; // green-600
      };
      
      // Reference the outer getRouteColor function or redefine it here
      const getRouteColorForMode = (mode: string) => {
        return getRouteColor(mode);
      };
      
      // 0. Best Overall route
      const bestOverallRoute: RouteItem = {
        id: '0',
        name: 'Best Overall Route',
        duration: 0,
        cost: 0,
        comfort: 'medium' as 'high' | 'medium' | 'low',
        vectorScore: 0.95,
        segments: [],
        // Additional detailed information
        hasTopologyImpact: false,
        numTransfers: 0,
        traffic: { level: 'medium', impact: 1.0 },
        eta: '',
        costBreakdown: { 
          fare: 0, 
          additionalFees: 0,
          totalCost: 0 
        },
        scores: {
          overall: 0,
          time: 0,
          cost: 0,
          comfort: 0,
          transfers: 0
        },
        routeColor: '',
        pathData: []
      };
      
      // Helper to calculate ETA
      const calculateETA = (durationMinutes: number) => {
        const now = new Date();
        const eta = new Date(now.getTime() + durationMinutes * 60000);
        return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };
      
      // Generate path data for map visualization
      const generatePathData = (route: any) => {
        const pathData: any[] = [];
        
        let lastCoords = fromCoords;
        route.segments.forEach((segment: any, index: number) => {
          const isLastSegment = index === route.segments.length - 1;
          const endCoords = isLastSegment ? toCoords : getCoordinates(segment.endLocation);
          
          // For different transport modes, generate different path types
          switch(segment.mode) {
            case 'subway':
              // Subway routes should follow mostly straight lines with slight curves
              pathData.push({
                type: 'subway',
                color: getRouteColorForMode(segment.mode),
                points: [
                  lastCoords,
                  // Add a midpoint with slight offset for a natural curve
                  [
                    lastCoords[0] + (endCoords[0] - lastCoords[0]) * 0.5 + (Math.random() - 0.5) * 0.01,
                    lastCoords[1] + (endCoords[1] - lastCoords[1]) * 0.5 + (Math.random() - 0.5) * 0.01
                  ],
                  endCoords
                ]
              });
              break;
            case 'bus':
              // Bus routes should follow a more zigzag street-like pattern
              const numPoints = Math.ceil(calculateDistance(lastCoords[0], lastCoords[1], endCoords[0], endCoords[1]) * 2);
              const points: [number, number][] = [lastCoords];
              
              // Generate points that zigzag like city streets
              let currentPoint: [number, number] = [...lastCoords] as [number, number];
              for (let i = 0; i < numPoints; i++) {
                // Alternate between horizontal and vertical movement
                if (i % 2 === 0) {
                  currentPoint = [
                    currentPoint[0],
                    currentPoint[1] + (endCoords[1] - currentPoint[1]) * 0.3
                  ] as [number, number];
                } else {
                  currentPoint = [
                    currentPoint[0] + (endCoords[0] - currentPoint[0]) * 0.3,
                    currentPoint[1]
                  ] as [number, number];
                }
                points.push(currentPoint);
              }
              points.push(endCoords);
              
              pathData.push({
                type: 'bus',
                color: getRouteColorForMode(segment.mode),
                points
              });
              break;
            case 'walk':
              // Walking should be a relatively direct path
              pathData.push({
                type: 'walk',
                color: getRouteColorForMode(segment.mode),
                dashArray: '4,4',
                points: [
                  lastCoords,
                  endCoords
                ]
              });
              break;
            case 'uber':
            case 'taxi':
              // Car routes follow streets but more direct than buses
              pathData.push({
                type: segment.mode,
                color: getRouteColorForMode(segment.mode),
                points: [
                  lastCoords,
                  [
                    lastCoords[0] + (endCoords[0] - lastCoords[0]) * 0.33,
                    lastCoords[1] + (endCoords[1] - lastCoords[1]) * 0.66
                  ],
                  [
                    lastCoords[0] + (endCoords[0] - lastCoords[0]) * 0.66,
                    lastCoords[1] + (endCoords[1] - lastCoords[1]) * 0.33
                  ],
                  endCoords
                ]
              });
              break;
            case 'ebike':
              // Bike routes should follow streets but might take shortcuts
              pathData.push({
                type: 'ebike',
                color: getRouteColorForMode(segment.mode),
                points: [
                  lastCoords,
                  [
                    lastCoords[0] + (endCoords[0] - lastCoords[0]) * 0.5 + (Math.random() - 0.5) * 0.005,
                    lastCoords[1] + (endCoords[1] - lastCoords[1]) * 0.5 + (Math.random() - 0.5) * 0.005
                  ],
                  endCoords
                ]
              });
              break;
            default:
              // Default direct line
              pathData.push({
                type: segment.mode,
                color: getRouteColorForMode(segment.mode),
                points: [lastCoords, endCoords]
              });
          }
          
          lastCoords = endCoords;
        });
        
        return pathData;
      };
      
      // Process a completed route with all detailed information
      const finalizeRoute = (route: any) => {
        // Count transfers (segments that change mode of transportation)
        const numTransfers = route.segments.length > 0 ? route.segments.length - 1 : 0;
        
        // Check if route has walking/biking components to consider topology
        const hasTopologyImpact = route.segments.some((segment: any) => 
          segment.mode === 'walk' || segment.mode === 'ebike'
        );
        
        // Calculate traffic impact for road-based segments
        const roadBasedSegments = route.segments.filter((segment: any) => 
          segment.mode === 'bus' || segment.mode === 'uber' || segment.mode === 'taxi'
        );
        
        const trafficImpact = roadBasedSegments.length > 0 ? avgTrafficFactor : 1.0;
        
        // Determine wheelchair accessibility
        const isWheelchairAccessible = route.segments.every((segment: any) => {
          if (segment.mode === 'walk') return true; // Walking is always accessible
          if (segment.mode === 'subway') {
            // Check if the specific station is accessible - in a real app this would check actual station data
            // For now we'll estimate that 40% of subway segments are wheelchair accessible
            return segment.hasOwnProperty('wheelchairAccessible') ? segment.wheelchairAccessible : Math.random() > 0.6;
          }
          if (segment.mode === 'bus') {
            // Most buses are accessible
            return segment.hasOwnProperty('wheelchairAccessible') ? segment.wheelchairAccessible : Math.random() > 0.2;
          }
          if (segment.mode === 'uber' || segment.mode === 'taxi') {
            // Some taxis/ubers are wheelchair accessible
            return segment.hasOwnProperty('wheelchairAccessible') ? segment.wheelchairAccessible : Math.random() > 0.7;
          }
          return false;
        });
        
        // Calculate cost breakdown
        const costBreakdown = {
          fare: route.segments.reduce((total: number, segment: any) => {
            // Only count positive costs (e.g., exclude free transfers)
            return total + (segment.cost > 0 ? segment.cost : 0);
          }, 0),
          additionalFees: 0,
          totalCost: route.cost
        };
        
        // Add fees for Uber/Taxi during high traffic
        if (roadBasedSegments.length > 0 && trafficImpact > 1.2) {
          costBreakdown.additionalFees = parseFloat((costBreakdown.fare * 0.15).toFixed(2));
          costBreakdown.totalCost = parseFloat((costBreakdown.fare + costBreakdown.additionalFees).toFixed(2));
        }
        
        // Calculate route scores
        const scores = calculateBalancedScore(
          route.duration, 
          costBreakdown.totalCost, 
          route.comfort, 
          numTransfers,
          userBags > 0,
          hasTopologyImpact,
          trafficImpact,
          isWheelchairAccessible
        );
        
        // Calculate ETA
        const eta = calculateETA(Math.round(route.duration * trafficImpact));
        
        // Generate route color based on overall score
        const routeColor = getRouteColorFromScore(scores.score);
        
        // Generate path data for map
        const pathData = generatePathData(route);
        
        // Add detailed information to route
        route.numTransfers = numTransfers;
        route.hasTopologyImpact = hasTopologyImpact;
        route.traffic = { 
          level: trafficImpact > 1.3 ? 'high' : trafficImpact > 1.1 ? 'medium' : 'low',
          impact: trafficImpact
        };
        route.eta = eta;
        route.costBreakdown = costBreakdown;
        route.scores = scores;
        route.routeColor = routeColor;
        route.pathData = pathData;
        route.isWheelchairAccessible = isWheelchairAccessible;
        
        // Enhance segments with scores
        route.segments.forEach((segment: any) => {
          // Score each segment based on mode and conditions
          const segmentScore = segment.mode === 'walk' && hasTopologyImpact ? 
            Math.max(3, 7 - Math.floor(avgTopologyDifficulty * 10)) : // Walking score affected by hills
            segment.mode === 'ebike' && hasTopologyImpact ?
            Math.max(2, 6 - Math.floor(avgTopologyDifficulty * 10)) : // E-bike score affected by hills
            segment.mode === 'bus' || segment.mode === 'uber' || segment.mode === 'taxi' ?
            Math.max(2, 9 - Math.floor((trafficImpact - 1) * 10)) : // Road transport affected by traffic
            7; // Default reasonable score
            
          segment.score = segmentScore;
          segment.adjustedDuration = segment.mode === 'walk' && hasTopologyImpact ? 
            Math.round(segment.duration * (1 + avgTopologyDifficulty)) : // Walking is slower in hilly areas
            (segment.mode === 'bus' || segment.mode === 'uber' || segment.mode === 'taxi') ?
            Math.round(segment.duration * trafficImpact) : // Traffic affects road transport
            segment.duration; // No adjustment for subway
        });
        
        return route;
      };
      
      // Decide on the best overall route based on distance
      if (distance < 1) {
        // Very short distance - walking might be best
        bestOverallRoute.segments.push({
          mode: 'walk',
          startLocation: from as string,
          endLocation: to as string,
          duration: Math.round(distance * 20), // 20 min per mile walking
          cost: 0,
          lineInfo: 'Walk to destination',
        });
        bestOverallRoute.duration = Math.round(distance * 20);
        bestOverallRoute.comfort = 'high';
      } else if (distance < 5 && (bestSubwayLine || connectingBuses.length > 0)) {
        // Medium distance with transit options
        // First segment - walk to station
        bestOverallRoute.segments.push({
          mode: 'walk',
          startLocation: from as string,
          endLocation: bestSubwayLine ? `Subway Station near ${from}` : `Bus Stop near ${from}`,
          duration: 5,
          cost: 0,
          lineInfo: `Walk to ${bestSubwayLine ? 'station' : 'bus stop'}`,
        });
        
        // Second segment - transit
        if (bestSubwayLine) {
          bestOverallRoute.segments.push({
            mode: 'subway',
            startLocation: `Subway Station near ${from}`,
            endLocation: `Subway Station near ${to}`,
            duration: Math.round(distance * 8),
            cost: 2.75,
            lineInfo: `${bestSubwayLine} Train${bestSubwayLine === '7' ? ' (Flushing Line)' : ''}`,
          });
        } else {
          bestOverallRoute.segments.push({
            mode: 'bus',
            startLocation: `Bus Stop near ${from}`,
            endLocation: `Bus Stop near ${to}`,
            duration: Math.round(distance * 10),
            cost: 2.75,
            lineInfo: `${busRoute} Bus`,
          });
        }
        
        // Last segment - walk to destination
        bestOverallRoute.segments.push({
          mode: 'walk',
          startLocation: bestSubwayLine ? `Subway Station near ${to}` : `Bus Stop near ${to}`,
          endLocation: to as string,
          duration: 5,
          cost: 0,
          lineInfo: 'Walk to destination',
        });
        
        bestOverallRoute.duration = bestSubwayLine 
          ? Math.round(distance * 8) + 10 // Subway time + walking
          : Math.round(distance * 10) + 10; // Bus time + walking
        bestOverallRoute.cost = 2.75;
        bestOverallRoute.comfort = bestSubwayLine ? 'medium' : 'low';
      } else {
        // Longer distance or no good transit - mixed mode might be best
        // Start with transit if available for most of the route
        if (bestSubwayLine || hasTransferOptions) {
          bestOverallRoute.segments.push({
            mode: 'walk',
            startLocation: from as string,
            endLocation: `Subway Station near ${from}`,
            duration: 5,
            cost: 0,
            lineInfo: 'Walk to station',
          });
          
          if (bestSubwayLine) {
            bestOverallRoute.segments.push({
              mode: 'subway',
              startLocation: `Subway Station near ${from}`,
              endLocation: `Subway Station near ${to}`,
              duration: Math.round(distance * 7),
              cost: 2.75,
              lineInfo: `${bestSubwayLine} Train${bestSubwayLine === '7' ? ' (Flushing Line)' : ''}`,
            });
          } else {
            // Use transfer if needed
            const fromLine = fromSubwayLines[0];
            const toLine = toSubwayLines[0];
            
            bestOverallRoute.segments.push({
              mode: 'subway',
              startLocation: `Subway Station near ${from}`,
              endLocation: 'Transfer Station',
              duration: Math.round(distance * 4),
              cost: 2.75,
              lineInfo: `${fromLine} Train`,
            });
            
            bestOverallRoute.segments.push({
              mode: 'subway',
              startLocation: 'Transfer Station',
              endLocation: `Subway Station near ${to}`,
              duration: Math.round(distance * 4),
              cost: 0,
              lineInfo: `${toLine} Train`,
            });
          }
          
          // For longer distances, use Uber for the last mile
          if (distance > 8) {
            bestOverallRoute.segments.push({
              mode: 'uber',
              startLocation: `Subway Station near ${to}`,
              endLocation: to as string,
              duration: 8,
              cost: 7.50,
              lineInfo: 'UberX (last mile)',
            });
            
            bestOverallRoute.duration = Math.round(distance * 6) + 13; // Transit + uber + initial walk
            bestOverallRoute.cost = 10.25; // Subway + uber
            bestOverallRoute.comfort = 'high';
          } else {
            bestOverallRoute.segments.push({
              mode: 'walk',
              startLocation: `Subway Station near ${to}`,
              endLocation: to as string,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to destination',
            });
            
            bestOverallRoute.duration = bestSubwayLine 
              ? Math.round(distance * 7) + 10 // Subway time + walking
              : Math.round(distance * 8) + 10; // Transfer subway time + walking
            bestOverallRoute.cost = 2.75;
            bestOverallRoute.comfort = 'medium';
          }
        } else {
          // No good transit option - use Uber for efficiency
          bestOverallRoute.segments.push({
            mode: 'walk',
            startLocation: from as string,
            endLocation: `Pickup Point near ${from}`,
            duration: 3,
            cost: 0,
            lineInfo: 'Walk to pickup point',
          });
          
          bestOverallRoute.segments.push({
            mode: 'uber',
            startLocation: `Pickup Point near ${from}`,
            endLocation: to as string,
            duration: Math.round(distance * 8),
            cost: parseFloat((distance * 2.25).toFixed(2)),
            lineInfo: 'UberX',
          });
          
          bestOverallRoute.duration = Math.round(distance * 8) + 3;
          bestOverallRoute.cost = parseFloat((distance * 2.25).toFixed(2));
          bestOverallRoute.comfort = 'high';
        }
      }
      
      routes.push(bestOverallRoute);
      
      // 1. If subway is available, create a subway route
      if (bestSubwayLine || hasTransferOptions) {
        const subwayRoute: RouteItem = {
          id: routes.length + '',
          name: 'Fastest Route',
          duration: Math.round(distance * 10),
          cost: parseFloat((2.75 + (distance > 5 ? 3 : 0)).toFixed(2)),
          comfort: distance < 8 ? 'medium' : 'low',
          vectorScore: 0.89,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: `Subway Station near ${from}`,
              duration: 5,
              cost: 0,
              lineInfo: `Walk to station`,
            }
          ],
        };
        
        // Add the subway segment(s)
        if (bestSubwayLine) {
          // Direct subway line
          subwayRoute.segments.push({
            mode: 'subway',
            startLocation: `Subway Station near ${from}`,
            endLocation: `Subway Station near ${to}`,
            duration: Math.round(distance * 8),
            cost: 2.75,
            lineInfo: `${bestSubwayLine} Train${bestSubwayLine === '7' ? ' (Flushing Line)' : ''}`,
          });
        } else if (hasTransferOptions) {
          // Need a transfer
          const fromLine = fromSubwayLines[0];
          const toLine = toSubwayLines[0];
          
          subwayRoute.segments.push({
            mode: 'subway',
            startLocation: `Subway Station near ${from}`,
            endLocation: `Transfer Station`,
            duration: Math.round(distance * 4),
            cost: 2.75,
            lineInfo: `${fromLine} Train`,
          });
          
          subwayRoute.segments.push({
            mode: 'subway',
            startLocation: `Transfer Station`,
            endLocation: `Subway Station near ${to}`,
            duration: Math.round(distance * 4),
            cost: 0, // Free transfer
            lineInfo: `${toLine} Train`,
          });
        }
        
        // Add the final walking segment
        subwayRoute.segments.push({
          mode: 'walk',
          startLocation: `Subway Station near ${to}`,
          endLocation: to as string,
          duration: 7,
          cost: 0,
          lineInfo: `Walk to destination`,
        });
        
        routes.push(subwayRoute);
      }
      
      // 2. Always create a ride-sharing route as an option
      const uberRoute: RouteItem = {
        id: routes.length + '',
        name: 'Most Comfortable Route',
        duration: Math.round(distance * 12),
        cost: parseFloat((distance * 2.5).toFixed(2)),
        comfort: 'high',
        vectorScore: 0.78,
        segments: [
          {
            mode: 'walk',
            startLocation: from as string,
            endLocation: `Pickup Point near ${from}`,
            duration: 3,
            cost: 0,
            lineInfo: 'Walk to pickup point',
          },
          {
            mode: 'uber',
            startLocation: `Pickup Point near ${from}`,
            endLocation: `Drop-off near ${to}`,
            duration: Math.round(distance * 10),
            cost: parseFloat((distance * 2.5).toFixed(2)),
            lineInfo: 'UberX',
          },
          {
            mode: 'walk',
            startLocation: `Drop-off near ${to}`,
            endLocation: to as string,
            duration: 4,
            cost: 0,
            lineInfo: 'Walk to destination',
          },
        ],
      };
      routes.push(uberRoute);

      // Add a taxi route option
      const taxiRoute: RouteItem = {
        id: routes.length + '',
        name: 'Taxi Route',
        duration: Math.round(distance * 11),
        cost: parseFloat((distance * 2.8).toFixed(2)),
        comfort: 'high',
        vectorScore: 0.77,
        segments: [
          {
            mode: 'walk',
            startLocation: from as string,
            endLocation: `Taxi Stand near ${from}`,
            duration: 4,
            cost: 0,
            lineInfo: 'Walk to taxi stand',
          },
          {
            mode: 'taxi',
            startLocation: `Taxi Stand near ${from}`,
            endLocation: to as string,
            duration: Math.round(distance * 9),
            cost: parseFloat((distance * 2.8).toFixed(2)),
            lineInfo: 'NYC Taxi',
          }
        ],
      };
      routes.push(taxiRoute);

      // Add an E-bike route option if the distance is under 10 miles
      if (distance < 10) {
        const ebikeRoute: RouteItem = {
          id: routes.length + '',
          name: 'E-Bike Route',
          duration: Math.round(distance * 15),
          cost: 5.00,
          comfort: 'medium',
          vectorScore: 0.72,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: `E-Bike Station near ${from}`,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to e-bike station',
            },
            {
              mode: 'ebike',
              startLocation: `E-Bike Station near ${from}`,
              endLocation: `E-Bike Station near ${to}`,
              duration: Math.round(distance * 12),
              cost: 5.00,
              lineInfo: 'Citi Bike E-Bike',
            },
            {
              mode: 'walk',
              startLocation: `E-Bike Station near ${to}`,
              endLocation: to as string,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to destination',
            },
          ],
        };
        routes.push(ebikeRoute);
      }
      
      // 3. Try to create a bus route if available
      if (busRoutesFrom.length > 0) {
        // Use the connecting bus or an area-specific bus route
        const busOption: RouteItem = {
          id: routes.length + '',
          name: 'Cheapest Route',
          duration: Math.round(distance * 15),
          cost: 2.75,
          comfort: 'low',
          vectorScore: 0.71,
          segments: [] as any[],
        };
        
        // First walk segment
        busOption.segments.push({
          mode: 'walk',
          startLocation: from as string,
          endLocation: `Bus Stop near ${from}`,
          duration: 7,
          cost: 0,
          lineInfo: 'Walk to bus stop',
        });
        
        // Cross-borough trips generally need subway or express bus
        if (isCrossBoroughTrip) {
          if (expressBusRoute) {
            // Express bus option for cross-borough
            busOption.segments.push({
              mode: 'bus',
              startLocation: `Bus Stop near ${from}`,
              endLocation: `Bus Stop near ${to}`,
              duration: Math.round(distance * 10), // Express buses are faster than local
              cost: 6.75, // Express buses cost more
              lineInfo: `${expressBusRoute} Express Bus`,
            });
            
            busOption.cost = 6.75;
            busOption.name = 'Express Bus Route';
            busOption.comfort = 'medium';
          } else if (fromSubwayLines.length > 0 && toSubwayLines.length > 0) {
            // Use a combination of local bus and subway for cross-borough
            busOption.segments.push({
              mode: 'bus',
              startLocation: `Bus Stop near ${from}`,
              endLocation: `${originBorough} Subway Station`,
              duration: 10,
              cost: 2.75,
              lineInfo: `${specificFromBuses[0]} Bus to subway`,
            });
            
            // Add subway transfer
            busOption.segments.push({
              mode: 'subway',
              startLocation: `${originBorough} Subway Station`,
              endLocation: `${destinationBorough} Subway Station`,
              duration: Math.round(distance * 7),
              cost: 0, // Free transfer
              lineInfo: `${fromSubwayLines[0]} Train`,
            });
            
            busOption.name = 'Bus + Subway Route';
          } else {
            // Fallback to just showing subway if it exists
            return routes;
          }
        } else {
          // Local bus for same-borough trips
          busOption.segments.push({
            mode: 'bus',
            startLocation: `Bus Stop near ${from}`,
            endLocation: `Bus Stop near ${to}`,
            duration: Math.round(distance * 12),
            cost: 2.75,
            lineInfo: `${busRoute} Bus`,
          });
        }
        
        // Final walk segment
        busOption.segments.push({
          mode: 'walk',
          startLocation: `Bus Stop near ${to}`,
          endLocation: to as string,
          duration: 8,
          cost: 0,
          lineInfo: 'Walk to destination',
        });
        
        // Update duration based on segments
        busOption.duration = busOption.segments.reduce((total, segment) => total + segment.duration, 0);
        
        routes.push(busOption);
      } else if (!bestSubwayLine && !hasTransferOptions) {
        // 4. If no subway or bus is available, add a bike option
        const bikeOption: RouteItem = {
          id: routes.length + '',
          name: 'Eco-Friendly Route',
          duration: Math.round(distance * 18),
          cost: 3.50,
          comfort: 'medium',
          vectorScore: 0.65,
          segments: [
            {
              mode: 'walk',
              startLocation: from as string,
              endLocation: `Citi Bike Station near ${from}`,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to bike station',
            },
            {
              mode: 'ebike',
              startLocation: `Citi Bike Station near ${from}`,
              endLocation: `Citi Bike Station near ${to}`,
              duration: Math.round(distance * 15),
              cost: 3.50,
              lineInfo: 'Citi Bike',
            },
            {
              mode: 'walk',
              startLocation: `Citi Bike Station near ${to}`,
              endLocation: to as string,
              duration: 5,
              cost: 0,
              lineInfo: 'Walk to destination',
            },
          ],
        };
        routes.push(bikeOption);
      }
      
      // Sort routes by balanced score
      routes.forEach(route => {
        route.balancedScore = calculateBalancedScore(route.duration, route.cost, route.comfort, 0, false, false, 1, true);
      });
      
      const mockRoutes = routes.map(finalizeRoute);
      
      // Always ensure we have at least 3 routes
      if (mockRoutes.length < 3) {
        // Generate more diverse route options if needed
        if (mockRoutes.length === 1) {
          // Add a slower but cheaper option
          const cheapestRoute: RouteItem = {
            id: '98',
            name: 'Economy Option',
            duration: Math.round(distance * 18),
            cost: 2.75,
            comfort: 'low',
            vectorScore: 0.65,
            segments: [
              {
                mode: 'walk',
                startLocation: from as string,
                endLocation: `Bus Stop near ${from}`,
                duration: 10,
                cost: 0,
                lineInfo: 'Walk to bus stop',
              },
              {
                mode: 'bus',
                startLocation: `Bus Stop near ${from}`,
                endLocation: `Bus Stop near ${to}`,
                duration: Math.round(distance * 14),
                cost: 2.75,
                lineInfo: `Local Bus Route`,
              },
              {
                mode: 'walk',
                startLocation: `Bus Stop near ${to}`,
                endLocation: to as string,
                duration: 10,
                cost: 0,
                lineInfo: 'Walk to destination',
              },
            ],
          };
          mockRoutes.push(finalizeRoute(cheapestRoute));
          
          // Add a faster but expensive option
          const fastestRoute: RouteItem = {
            id: '99',
            name: 'Premium Express',
            duration: Math.round(distance * 8),
            cost: parseFloat((distance * 2.5).toFixed(2)),
            comfort: 'high',
            vectorScore: 0.75,
            segments: [
              {
                mode: 'walk',
                startLocation: from as string,
                endLocation: `Pickup near ${from}`,
                duration: 3,
                cost: 0,
                lineInfo: 'Walk to pickup point',
              },
              {
                mode: 'uber',
                startLocation: `Pickup near ${from}`,
                endLocation: to as string,
                duration: Math.round(distance * 7),
                cost: parseFloat((distance * 2.5).toFixed(2)),
                lineInfo: 'UberX Direct',
              },
            ],
          };
          mockRoutes.push(finalizeRoute(fastestRoute));
        }
      }
      
      // Filter routes based on wheelchair accessibility if required
      let filteredRoutes = mockRoutes;
      if (requireWheelchair) {
        filteredRoutes = mockRoutes.filter(route => route.isWheelchairAccessible);
        
        // If no accessible routes are found, generate at least one
        if (filteredRoutes.length === 0) {
          const accessibleRoute: RouteItem = {
            id: '99',
            name: 'Wheelchair Accessible Route',
            duration: Math.round(distance * 10),
            cost: parseFloat((distance * 2.8).toFixed(2)), // Slightly more expensive for accessible vehicles
            comfort: 'high',
            vectorScore: 0.7,
            segments: [
              {
                mode: 'walk',
                startLocation: from as string,
                endLocation: `Accessible Pickup near ${from}`,
                duration: 5,
                cost: 0,
                lineInfo: 'Short accessible walk to pickup',
                wheelchairAccessible: true
              },
              {
                mode: 'taxi',
                startLocation: `Pickup near ${from}`,
                endLocation: to as string,
                duration: Math.round(distance * 9),
                cost: parseFloat((distance * 2.8).toFixed(2)),
                lineInfo: 'Wheelchair accessible taxi',
                wheelchairAccessible: true
              }
            ],
            isWheelchairAccessible: true
          };
          filteredRoutes.push(finalizeRoute(accessibleRoute));
        }
      }
      
      return filteredRoutes;
    };
    
    const routes = generateRoutes();

    return res.status(200).json({ 
      routes: routes,
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