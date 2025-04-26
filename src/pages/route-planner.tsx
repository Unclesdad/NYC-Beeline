import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import dynamic from 'next/dynamic';
import AnimatedBackground from '@/components/AnimatedBackground';
import EmergencyButton from '@/components/EmergencyButton';

// Import Map component dynamically to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

// Define interfaces for route data
interface RouteSegment {
  id: string;
  mode: 'subway' | 'bus' | 'walk' | 'bike' | 'ferry' | 'taxi' | 'shared';
  line?: string;
  from: string;
  to: string;
  duration: number;
  cost: number;
  steps: {
    instruction: string;
    distance?: number;
    duration?: number;
  }[];
  transfers: number;
  congestion: 'low' | 'medium' | 'high';
  startTime: string;
  endTime: string;
  color?: string;
  accessibility: boolean;
  crowdLevel: 'low' | 'medium' | 'high';
  co2: number;
  path: [number, number][];
}

interface RouteOption {
  id: string;
  totalDuration: number;
  totalCost: number;
  totalDistance: number;
  comfortScore: number;
  segments: RouteSegment[];
  totalCO2: number;
  isWheelchairAccessible: boolean;
}

const Routes = () => {
  const router = useRouter();
  const { from, to, priority, noise, safety, bags, wheelchair, elevation } = router.query;

  // State variables
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [mapData, setMapData] = useState<RouteSegment[]>([]);

  // Add user preference state
  const [userPreferences, setUserPreferences] = useState({
    priority: 'balanced',
    noise: 'moderate',
    safety: 'moderate',
    bags: 0,
    wheelchair: false,
    elevation: 'moderate'
  });

  // Update user preferences when query params change
  useEffect(() => {
    if (router.isReady) {
      setUserPreferences({
        priority: priority as string || 'balanced',
        noise: noise as string || 'moderate',
        safety: safety as string || 'moderate',
        bags: parseInt(bags as string || '0', 10),
        wheelchair: wheelchair === 'true',
        elevation: elevation as string || 'moderate'
      });
    }
  }, [router.isReady, priority, noise, safety, bags, wheelchair, elevation]);

  // Fetch routes when query params are available
  useEffect(() => {
    if (from && to) {
      fetchRoutes();
    }
  }, [from, to, priority, noise, safety, bags, wheelchair]);

  // Function to fetch routes from API
  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/routes?from=${encodeURIComponent(String(from))}&to=${encodeURIComponent(String(to))}&priority=${priority}&noise=${noise}&safety=${safety}&bags=${bags}&wheelchair=${wheelchair}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      
      const data = await response.json();
      
      // API returns an object with a 'routes' property containing the array
      if (data && data.routes && Array.isArray(data.routes)) {
        // Process route data to match expected format
        const processedRoutes = data.routes.map((route: any) => {
          // Process each segment to ensure it has the expected properties
          const processedSegments = route.segments ? route.segments.map((segment: any, idx: number) => {
            return {
              id: segment.id || `segment-${idx}`,
              mode: segment.mode || 'walk',
              line: segment.lineInfo || segment.line || '',
              from: segment.startLocation || segment.from || '',
              to: segment.endLocation || segment.to || '',
              duration: segment.duration || (segment.mode === 'walk' ? 5 : 10), // Ensure minimum duration based on mode
              cost: segment.cost || 0,
              steps: segment.steps || [{ instruction: segment.lineInfo || `Travel via ${segment.mode}` }],
              transfers: segment.transfers || 0,
              congestion: segment.congestion || 'medium',
              startTime: segment.startTime || new Date().toISOString(),
              endTime: segment.endTime || new Date().toISOString(),
              color: segment.color || getRouteColor(segment.mode),
              accessibility: segment.accessibility || true,
              crowdLevel: segment.crowdLevel || 'medium',
              co2: segment.co2 || 0,
              path: segment.path || [],
            };
          }) : [];
          
          // Calculate total duration if it's missing or zero
          let totalDuration = route.duration;
          if (!totalDuration || totalDuration === 0) {
            totalDuration = processedSegments.reduce((total: number, segment: any) => total + segment.duration, 0);
          }
          
          return {
            id: route.id || `route-${Math.random().toString(36).substring(2, 9)}`,
            totalDuration: totalDuration,
            totalCost: route.cost || processedSegments.reduce((total: number, segment: any) => total + segment.cost, 0),
            totalDistance: route.distance || 0,
            comfortScore: route.comfort === 'high' ? 9 : route.comfort === 'medium' ? 6 : 3,
            segments: processedSegments,
            totalCO2: route.co2 || 0,
            isWheelchairAccessible: route.isWheelchairAccessible || false
          };
        });
        
        // Sort and adjust comfort scores
        processedRoutes.sort((a, b) => {
          // Prefer routes that match user priority
          if (userPreferences.priority === 'speed') {
            return a.totalDuration - b.totalDuration;
          } else if (userPreferences.priority === 'cost') {
            return a.totalCost - b.totalCost;
          } else if (userPreferences.priority === 'comfort') {
            return getAdjustedComfortScore(b) - getAdjustedComfortScore(a);
          }
          // Default balanced sorting
          return b.totalDuration - a.totalDuration;
        });
        
        // Update comfort scores with adjusted values
        const routesWithAdjustedScores = processedRoutes.map(route => ({
          ...route,
          comfortScore: getAdjustedComfortScore(route)
        }));
        
        setRoutes(routesWithAdjustedScores);
        
        if (routesWithAdjustedScores.length > 0) {
          setSelectedRoute(routesWithAdjustedScores[0].id);
          setMapData(routesWithAdjustedScores[0].segments);
        }
      } else {
        console.error('Expected object with routes array but got:', data);
        setRoutes([]);
      }
      
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get comfort color
  const getComfortColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-danger';
  };

  // Helper function to get route color for different modes
  const getRouteColor = (mode: string) => {
    switch (mode) {
      case 'subway':
        return '#3b82f6';  // blue-500
      case 'bus':
        return '#22c55e';  // green-500
      case 'ebike':
      case 'bike':
        return '#8b5cf6';  // purple-500
      case 'taxi':
      case 'uber':
        return '#f59e0b';  // amber-500
      case 'walk':
        return '#6b7280';  // gray-500
      case 'ferry':
        return '#06b6d4';  // cyan-500
      default:
        return '#ef4444';  // red-500
    }
  };

  // Helper function to get mode icon
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'subway':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10v6a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm8-1.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      case 'bus':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 7H7v2h6V7z" />
            <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm6 14H7V4h6v12z" clipRule="evenodd" />
          </svg>
        );
      case 'walk':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'bike':
      case 'ebike':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V4z" clipRule="evenodd" />
          </svg>
        );
      case 'ferry':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a2.5 2.5 0 014.9 0H17a1 1 0 001-1V5a1 1 0 00-1-1H3zm0 2.5A1.5 1.5 0 114.5 8 1.5 1.5 0 013 6.5zm0 6a1.5 1.5 0 114.5 0 1.5 1.5 0 01-4.5 0zm12 0a1.5 1.5 0 114.5 0 1.5 1.5 0 01-4.5 0zm-6-5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
          </svg>
        );
      case 'taxi':
      case 'uber':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a2.5 2.5 0 014.9 0H17a1 1 0 001-1V5a1 1 0 00-1-1H3zm0 2.5A1.5 1.5 0 114.5 8 1.5 1.5 0 013 6.5zm0 6a1.5 1.5 0 114.5 0 1.5 1.5 0 01-4.5 0zm12 0a1.5 1.5 0 114.5 0 1.5 1.5 0 01-4.5 0zm-6-5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Helper function to format time (minutes/hours)
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  };

  // Helper function to format cost
  const formatCost = (cost: number | undefined | null) => {
    if (cost === undefined || cost === null) {
      return '$0.00';
    }
    return `$${cost.toFixed(2)}`;
  };

  // Add a function to get star rating display
  const renderStarRating = (rating: number) => {
    const maxRating = 5;
    rating = Math.round(rating * 10) / 10; // Round to 1 decimal
    
    return (
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, i) => {
          const starValue = i + 1;
          const fillPercentage = Math.min(100, Math.max(0, (rating - i) * 100));
          
          return (
            <div key={i} className="relative h-5 w-5 text-gray-300">
              {/* Empty star */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              
              {/* Filled star with clipping for partial stars */}
              <div className="overflow-hidden absolute h-5" style={{ width: `${fillPercentage}%` }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-honey-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          );
        })}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Add a function to adjust comfort scores based on user preferences
  const getAdjustedComfortScore = (route: RouteOption): number => {
    let adjustedScore = route.comfortScore;
    
    // Adjust score based on noise preference
    if (userPreferences.noise === 'low') {
      // Penalize routes with noisy segments (subway, bus)
      const noisySegments = route.segments.filter(s => 
        s.mode === 'subway' || (s.mode === 'bus' && s.crowdLevel === 'high')
      );
      if (noisySegments.length > 0) {
        adjustedScore -= noisySegments.length * 0.5;
      }
    }
    
    // Adjust score based on safety preference
    if (userPreferences.safety === 'high') {
      // Penalize routes with segments in congested areas or late night
      const unsafeSegments = route.segments.filter(s => 
        s.congestion === 'high' || s.crowdLevel === 'low'
      );
      if (unsafeSegments.length > 0) {
        adjustedScore -= unsafeSegments.length * 0.5;
      }
    }
    
    // Adjust score based on bags/seat importance
    if (userPreferences.bags > 0) {
      // Penalize walking and bike routes if carrying bags
      const walkingOrBiking = route.segments.filter(s => s.mode === 'walk' || s.mode === 'bike');
      if (walkingOrBiking.length > 0) {
        adjustedScore -= walkingOrBiking.length * userPreferences.bags * 0.5;
      }
    }
    
    // Adjust score based on elevation preference
    if (userPreferences.elevation === 'low') {
      // Penalize routes with walking segments (might involve stairs/hills)
      const walkingSegments = route.segments.filter(s => s.mode === 'walk');
      if (walkingSegments.length > 0) {
        adjustedScore -= walkingSegments.length * 0.3;
      }
    }
    
    // Ensure score stays within 0-10 range
    return Math.max(0, Math.min(10, adjustedScore));
  };

  // Add a function to get preference-based comfort label
  const getComfortLabel = (score: number): string => {
    // Adjust thresholds based on user priority
    if (userPreferences.priority === 'comfort') {
      // More stringent comfort requirements
      return score >= 7 ? 'Very Comfortable' :
             score >= 4 ? 'Comfortable' : 'Less Comfortable';
    }
    
    // Default thresholds
    return score >= 8 ? 'Very Comfortable' :
           score >= 5 ? 'Comfortable' : 'Less Comfortable';
  };

  return (
    <Layout currentPage="routes">
      <AnimatedBackground theme="honey" intensity="medium" pattern="hexagon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Route Options */}
            <div className="lg:w-1/3">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-6">
                <h2 className="text-xl font-bold mb-2">Routes from {from} to {to}</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Priority: <span className="font-medium capitalize">{priority}</span>
                  {bags && Number(bags) > 0 && ` • ${bags} bag${Number(bags) > 1 ? 's' : ''}`}
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="text-honey-600 hover:text-honey-700 text-sm font-medium inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Modify Search
                </button>
              </div>
              
              {loading ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-honey-600"></div>
                  <span className="ml-3 text-gray-700">Finding the best routes...</span>
                </div>
              ) : !routes || routes.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Routes Found</h3>
                    <p className="text-gray-600">
                      We couldn't find any routes between these locations. Please try different locations or adjust your preferences.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(routes) && routes.map((route) => (
                    <div
                      key={route.id}
                      className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 cursor-pointer transition-all hover:shadow-xl border-l-4 ${
                        selectedRoute === route.id
                          ? 'border-honey-600'
                          : 'border-transparent hover:border-honey-300'
                      }`}
                      onClick={() => {
                        setSelectedRoute(route.id);
                        setMapData(route.segments);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-lg font-bold">{formatTime(route.totalDuration)}</span>
                          <div className="text-sm text-gray-600">
                            {route.segments && Array.isArray(route.segments) && route.segments.map((segment, idx) => (
                              <span key={segment.id || `segment-${idx}`} className="inline-flex items-center mr-2">
                                <span className={`inline-block w-6 h-6 rounded-full flex items-center justify-center ${
                                  segment.mode === 'subway' ? 'bg-blue-600' :
                                  segment.mode === 'bus' ? 'bg-green-600' :
                                  segment.mode === 'walk' ? 'bg-gray-500' :
                                  segment.mode === 'bike' ? 'bg-orange-500' :
                                  segment.mode === 'ferry' ? 'bg-cyan-600' :
                                  segment.mode === 'taxi' ? 'bg-yellow-500' :
                                  'bg-purple-600'
                                } text-white mr-1`}>
                                  {getModeIcon(segment.mode)}
                                </span>
                                {idx < route.segments.length - 1 && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCost(route.totalCost)}</div>
                          <div className={`text-sm ${getComfortColor(route.comfortScore)}`}>
                            {getComfortLabel(route.comfortScore)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rating display */}
                      <div className="mb-2">
                        {renderStarRating(route.comfortScore / 2)}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span key={`time-${route.id}`} className="inline-flex items-center text-gray-600 mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date().toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                          </span>
                          <span key={`transfer-${route.id}`} className="inline-flex items-center text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            {route.segments && Array.isArray(route.segments) ? route.segments.length - 1 : 0} transfer{(!route.segments || !Array.isArray(route.segments) || route.segments.length - 1 !== 1) ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          {route.isWheelchairAccessible && (
                            <span className="inline-flex items-center text-blue-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs">Accessible</span>
                            </span>
                          )}
                          <span key={`co2-${route.id}`} className="text-gray-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            {Math.round(route.totalCO2 || 0)} g CO2
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Map */}
            <div className="lg:w-2/3">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
                {mapData.length > 0 && (
                  <Map segments={mapData} origin={String(from)} destination={String(to)} />
                )}
              </div>
              
              {/* Selected Route Details */}
              {selectedRoute && !loading && (
                <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-bold mb-3">Route Details</h3>
                  <div className="space-y-4">
                    {Array.isArray(routes) && routes.length > 0 && routes.find(r => r.id === selectedRoute)?.segments.map((segment, index) => (
                      <div key={segment.id} className="border-l-2 border-gray-200 pl-4 pb-4 relative">
                        <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center">
                          {getModeIcon(segment.mode)}
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <span className={`inline-block w-6 h-6 rounded-full flex items-center justify-center ${
                                segment.mode === 'subway' ? 'bg-blue-600' :
                                segment.mode === 'bus' ? 'bg-green-600' :
                                segment.mode === 'walk' ? 'bg-gray-500' :
                                segment.mode === 'bike' ? 'bg-orange-500' :
                                segment.mode === 'ferry' ? 'bg-cyan-600' :
                                segment.mode === 'taxi' ? 'bg-yellow-500' :
                                'bg-purple-600'
                              } text-white mr-2`}>
                                {getModeIcon(segment.mode)}
                              </span>
                              <span className="font-medium capitalize">
                                {segment.mode} {segment.line ? `(${segment.line})` : ''}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {segment.from} to {segment.to}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatTime(segment.duration)}</div>
                            <div className="text-sm text-gray-600">{formatCost(segment.cost)}</div>
                          </div>
                        </div>
                        
                        <div className="mt-2 space-y-2">
                          {segment.steps && Array.isArray(segment.steps) ? segment.steps.map((step, stepIdx) => (
                            <div key={stepIdx} className="text-sm text-gray-700 ml-4 flex items-start">
                              <span key={`dot-${segment.id}-${stepIdx}`} className="h-2 w-2 rounded-full bg-gray-300 mt-2 mr-2"></span>
                              <span key={`instruction-${segment.id}-${stepIdx}`}>{step.instruction}</span>
                            </div>
                          )) : (
                            <div className="text-sm text-gray-700 ml-4">
                              No detailed steps available
                            </div>
                          )}
                        </div>
                        
                        {segment.transfers !== undefined && segment.transfers > 0 && (
                          <div className="mt-2 text-sm text-gray-600 ml-4">
                            {segment.transfers} transfer{segment.transfers > 1 ? 's' : ''}
                          </div>
                        )}
                        
                        <div className="mt-2 flex flex-wrap gap-2 ml-4">
                          {segment.congestion && (
                            <span key={`congestion-${segment.id}`} className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                              segment.congestion === 'low' ? 'bg-green-100 text-green-800' :
                              segment.congestion === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {segment.congestion === 'low' ? 'Low Congestion' :
                               segment.congestion === 'medium' ? 'Medium Congestion' :
                               'High Congestion'}
                            </span>
                          )}
                          
                          {segment.crowdLevel && (
                            <span key={`crowd-${segment.id}`} className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                              segment.crowdLevel === 'low' ? 'bg-green-100 text-green-800' :
                              segment.crowdLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {segment.crowdLevel === 'low' ? 'Not Crowded' :
                               segment.crowdLevel === 'medium' ? 'Somewhat Crowded' :
                               'Very Crowded'}
                            </span>
                          )}
                          
                          {segment.accessibility && (
                            <span key={`accessibility-${segment.id}`} className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                              Accessible
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedBackground>
      
      {/* Emergency Button */}
      <EmergencyButton 
        userLocation={mapData.length > 0 ? undefined : undefined} 
        onRouteToHospital={(hospital) => {
          // Get the current starting location
          const currentStart = from || "Your Location";
          // Update route with emergency destination
          router.push({
            pathname: '/route-planner',
            query: {
              from: currentStart,
              to: hospital.name,
              priority: 'speed',
              noise: 'moderate',
              safety: 'high',
              emergency: 'true' // Add flag to indicate this is an emergency route
            }
          });
        }}
      />
    </Layout>
  );
};

export default Routes;

// Add getServerSideProps to ensure the page is recognized by Next.js
export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  };
} 