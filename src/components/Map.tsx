import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issue in Next.js
const fixLeafletIcon = () => {
  // Fix the default icon paths
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Custom icon for different transport modes
const getTransportIcon = (mode: string) => {
  let color;
  switch (mode) {
    case 'subway':
      color = 'blue';
      break;
    case 'bus':
      color = 'green';
      break;
    case 'ebike':
      color = 'purple';
      break;
    case 'taxi':
    case 'uber':
      color = 'orange';
      break;
    case 'walk':
      color = 'gray';
      break;
    default:
      color = 'red';
  }
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
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

// Mock function to generate random waypoints between two locations
const generateWaypoints = (start: [number, number], end: [number, number], numPoints: number) => {
  const waypoints = [];
  
  for (let i = 0; i < numPoints; i++) {
    const ratio = (i + 1) / (numPoints + 1);
    const lat = start[0] + ratio * (end[0] - start[0]) + (Math.random() - 0.5) * 0.01;
    const lng = start[1] + ratio * (end[1] - start[1]) + (Math.random() - 0.5) * 0.01;
    waypoints.push([lat, lng]);
  }
  
  return waypoints;
};

// Component props
interface MapProps {
  from: string;
  to: string;
  route?: any;
}

// Coordinates type
type Coordinates = [number, number];

const Map = ({ from, to, route }: MapProps) => {
  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [endCoords, setEndCoords] = useState<Coordinates | null>(null);
  const [waypoints, setWaypoints] = useState<Record<string, Coordinates[]>>({});
  
  // Mock coordinates for NYC boroughs (in a real app, would use geocoding API)
  const mockCoordinates: Record<string, Coordinates> = {
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
    'Coney Island': [40.5755, -73.9707],
    'JFK Airport': [40.6413, -73.7781],
    'LaGuardia Airport': [40.7769, -73.8740],
    'World Trade Center': [40.7127, -74.0134],
    'Empire State Building': [40.7484, -73.9857],
    'Barclays Center': [40.6826, -73.9754],
    'Columbia University': [40.8075, -73.9626],
    'NYU': [40.7295, -73.9965],
  };
  
  // Get coordinates from location string or use mock data
  const getCoordinates = (location: string): Coordinates => {
    // Normalize the location string for better matching
    const normalizedLocation = location.toLowerCase();
    
    // Try to find in our mock data - first with exact matches
    for (const [name, coords] of Object.entries(mockCoordinates)) {
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
      return mockCoordinates['Queens'];
    }
    
    if (normalizedLocation.includes('brooklyn') ||
        normalizedLocation.includes('williamsburg') ||
        normalizedLocation.includes('park slope')) {
      return mockCoordinates['Brooklyn'];
    }
    
    if (normalizedLocation.includes('bronx')) {
      return mockCoordinates['Bronx'];
    }
    
    if (normalizedLocation.includes('staten')) {
      return mockCoordinates['Staten Island'];
    }
    
    // Default to Manhattan if not found
    return mockCoordinates['Manhattan'];
  };
  
  useEffect(() => {
    // Fix Leaflet icons
    fixLeafletIcon();
    
    // Set start and end coordinates
    if (from && to) {
      const fromCoords = getCoordinates(from);
      const toCoords = getCoordinates(to);
      
      // Log coordinates for debugging
      console.log(`Map - From location: "${from}" → coordinates: [${fromCoords[0]}, ${fromCoords[1]}]`);
      console.log(`Map - To location: "${to}" → coordinates: [${toCoords[0]}, ${toCoords[1]}]`);
      
      setStartCoords(fromCoords);
      setEndCoords(toCoords);
      
      // Generate mock waypoints for each segment
      if (route && route.segments) {
        const segmentWaypoints: Record<string, Coordinates[]> = {};
        
        let lastEndpoint = fromCoords;
        
        route.segments.forEach((segment: any, index: number) => {
          const endpointCoords = index === route.segments.length - 1 
            ? toCoords 
            : getCoordinates(segment.endLocation);
          
          // Generate some random waypoints between the two endpoints
          const numPoints = Math.floor(Math.random() * 3) + 1; // 1-3 random points
          const segmentPoints = generateWaypoints(lastEndpoint, endpointCoords, numPoints);
          
          segmentWaypoints[`segment-${index}`] = [
            lastEndpoint,
            ...segmentPoints,
            endpointCoords
          ];
          
          lastEndpoint = endpointCoords;
        });
        
        setWaypoints(segmentWaypoints);
      }
    }
  }, [from, to, route]);
  
  if (!startCoords || !endCoords) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }
  
  // Calculate map center and bounds
  const calculateCenter = (): Coordinates => {
    return [
      (startCoords[0] + endCoords[0]) / 2,
      (startCoords[1] + endCoords[1]) / 2
    ];
  };
  
  return (
    <MapContainer 
      center={calculateCenter()} 
      zoom={12} 
      style={{ height: '100%', width: '100%' }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Start Marker */}
      <Marker position={startCoords}>
        <Popup>
          <strong>Start:</strong> {from}
        </Popup>
      </Marker>
      
      {/* End Marker */}
      <Marker position={endCoords}>
        <Popup>
          <strong>Destination:</strong> {to}
        </Popup>
      </Marker>
      
      {/* Route Segments */}
      {route && route.segments && route.segments.map((segment: any, index: number) => {
        const segmentPoints = waypoints[`segment-${index}`];
        
        if (!segmentPoints) return null;
        
        return (
          <div key={`route-segment-${index}`}>
            <Polyline
              positions={segmentPoints}
              color={getRouteColor(segment.mode)}
              weight={4}
              dashArray={segment.mode === 'walk' ? '5, 5' : ''}
            />
            
            {/* Add markers for intermediate points */}
            {segmentPoints.slice(1, -1).map((point, pointIndex) => (
              <Marker 
                key={`waypoint-${index}-${pointIndex}`}
                position={point}
                icon={getTransportIcon(segment.mode)}
              >
                <Popup>
                  <strong>{segment.mode.charAt(0).toUpperCase() + segment.mode.slice(1)}</strong>
                  {segment.lineInfo && <div><small>{segment.lineInfo}</small></div>}
                </Popup>
              </Marker>
            ))}
          </div>
        );
      })}
    </MapContainer>
  );
};

export default Map; 