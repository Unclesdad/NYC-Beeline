import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';

// Import these components dynamically to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import('@/components/Map'), { ssr: false });

// Types for our route options
interface RouteOption {
  id: string;
  name: string;
  duration: number; // in minutes
  cost: number; // in dollars
  comfort: 'high' | 'medium' | 'low';
  segments: RouteSegment[];
  vectorScore: number; // dot product with ideal vector
}

interface RouteSegment {
  mode: 'bus' | 'subway' | 'ebike' | 'taxi' | 'uber' | 'walk';
  startLocation: string;
  endLocation: string;
  duration: number; // in minutes
  cost: number; // in dollars
  lineInfo?: string; // e.g., "Q58", "F Train"
}

export default function Routes() {
  const router = useRouter();
  const { from, to } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [mapData, setMapData] = useState<any>(null);

  // Fetch routes from our API
  useEffect(() => {
    if (from && to) {
      setLoading(true);
      
      // Fetch from our API endpoint
      fetch(`/api/routes?from=${encodeURIComponent(from as string)}&to=${encodeURIComponent(to as string)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          setRoutes(data.routes);
          setMapData({
            fromCoords: data.fromCoords,
            toCoords: data.toCoords,
            distance: data.distance
          });
          setSelectedRoute(data.routes[0].id);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching routes:", error);
          setLoading(false);
        });
    }
  }, [from, to]);

  // Helper function to get comfort color class
  const getComfortColorClass = (comfort: 'high' | 'medium' | 'low') => {
    switch (comfort) {
      case 'high':
        return 'bg-success text-white';
      case 'medium':
        return 'bg-warning text-white';
      case 'low':
        return 'bg-danger text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Helper function to get comfort label
  const getComfortLabel = (comfort: 'high' | 'medium' | 'low') => {
    switch (comfort) {
      case 'high':
        return 'Comfortable';
      case 'medium':
        return 'Moderate';
      case 'low':
        return 'Crowded';
      default:
        return 'Unknown';
    }
  };

  // Helper function to get mode icon
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'bus':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4 5v3m-4-3v3M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        );
      case 'subway':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'ebike':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'taxi':
      case 'uber':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-6 0h6m-6 4v10m6-10v10m-6-10v.01M14 7v.01M5.3 15h13.4a1 1 0 011 1v3a1 1 0 01-1 1H5.3a1 1 0 01-1-1v-3a1 1 0 011-1z" />
          </svg>
        );
      case 'walk':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14h.01M16 11v.01M19 11v.01M16 14v.01M19 14v.01" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
    }
  };

  return (
    <Layout
      title={`Route Options | NYC Beeline${from && to ? `: ${from} to ${to}` : ''}`}
      description={`Best routes from ${from || ''} to ${to || ''} - NYC Beeline`}
      currentPage="routes"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Route Options: <span className="text-primary-600">{from}</span> to <span className="text-primary-600">{to}</span>
          </h1>
          <p className="text-gray-500 mt-2">
            Showing the best routes based on time, cost, and comfort factors.
          </p>
        </div>

        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-lg text-gray-600">Calculating optimal routes...</p>
            <p className="text-sm text-gray-500 mt-2">
              Analyzing real-time transit data to find the best combinations of transportation modes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              {routes.map((route) => (
                <div 
                  key={route.id}
                  className={`bg-white shadow rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${selectedRoute === route.id ? 'ring-2 ring-primary-600' : ''}`}
                  onClick={() => setSelectedRoute(route.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComfortColorClass(route.comfort)}`}>
                      {getComfortLabel(route.comfort)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">{route.duration} min</span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">${route.cost.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {route.segments.map((segment, idx) => (
                      <div key={idx} className="flex items-center">
                        <div className={`
                          p-1 rounded-full 
                          ${segment.mode === 'subway' ? 'bg-blue-500' : ''}
                          ${segment.mode === 'bus' ? 'bg-green-500' : ''}
                          ${segment.mode === 'ebike' ? 'bg-purple-500' : ''}
                          ${['taxi', 'uber'].includes(segment.mode) ? 'bg-yellow-500' : ''}
                          ${segment.mode === 'walk' ? 'bg-gray-400' : ''}
                          text-white
                        `}>
                          {getModeIcon(segment.mode)}
                        </div>
                        {idx < route.segments.length - 1 && (
                          <div className="h-px w-3 bg-gray-300 mx-1"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="md:col-span-2">
              <div className="bg-white shadow rounded-lg overflow-hidden h-full">
                {selectedRoute && (
                  <div>
                    <div className="h-64 md:h-96 bg-gray-200 relative">
                      <MapWithNoSSR 
                        from={from as string} 
                        to={to as string} 
                        route={routes.find(r => r.id === selectedRoute)}
                      />
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {routes.find(r => r.id === selectedRoute)?.name}
                      </h3>
                      
                      <div className="space-y-4">
                        {routes.find(r => r.id === selectedRoute)?.segments.map((segment, idx) => (
                          <div key={idx} className="flex">
                            <div className="mr-4 flex flex-col items-center">
                              <div className={`
                                p-2 rounded-full 
                                ${segment.mode === 'subway' ? 'bg-blue-500' : ''}
                                ${segment.mode === 'bus' ? 'bg-green-500' : ''}
                                ${segment.mode === 'ebike' ? 'bg-purple-500' : ''}
                                ${['taxi', 'uber'].includes(segment.mode) ? 'bg-yellow-500' : ''}
                                ${segment.mode === 'walk' ? 'bg-gray-400' : ''}
                                text-white
                              `}>
                                {getModeIcon(segment.mode)}
                              </div>
                              {idx < (routes.find(r => r.id === selectedRoute)?.segments.length || 0) - 1 && (
                                <div className="h-full w-0.5 bg-gray-300 my-1"></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900 capitalize">{segment.mode}</h4>
                                  {segment.lineInfo && (
                                    <p className="text-sm text-primary-600">{segment.lineInfo}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-700">{segment.duration} min</p>
                                  <p className="text-sm text-gray-700">${segment.cost.toFixed(2)}</p>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mt-1">
                                From: {segment.startLocation}
                              </p>
                              <p className="text-sm text-gray-600">
                                To: {segment.endLocation}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Route Analysis</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          This route was selected using our vector optimization algorithm that considers multiple factors:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Time Optimization</p>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${(routes.find(r => r.id === selectedRoute)?.vectorScore || 0) * 100}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Cost Efficiency</p>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${(routes.find(r => r.id === selectedRoute)?.vectorScore || 0) * 85}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Comfort Rating</p>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${routes.find(r => r.id === selectedRoute)?.comfort === 'high' ? 90 : routes.find(r => r.id === selectedRoute)?.comfort === 'medium' ? 60 : 30}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Route Directness</p>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${(routes.find(r => r.id === selectedRoute)?.vectorScore || 0) * 95}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 