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
      return '#3b82f6';  // blue-500 - more vibrant blue for subway
    case 'bus':
      return '#16a34a';  // green-600 - darker green for better visibility
    case 'ebike':
      return '#8b5cf6';  // purple-500
    case 'taxi':
      return '#f59e0b';  // amber-500
    case 'uber':
      return '#f97316';  // orange-500 - distinct from taxi
    case 'walk':
      return '#6b7280';  // gray-500
    case 'ferry':
      return '#0ea5e9';  // sky-500
    case 'shared':
      return '#ec4899';  // pink-500
    default:
      return '#ef4444';  // red-500
  }
};

// NYC subway routes - adding more realistic subway paths
const subwayRoutes: Record<string, Coordinates[]> = {
  // 7 train (Flushing Line) - more detailed path with realistic curves
  '7': [
    [40.7613, -73.8067], // Flushing-Main St
    [40.7608, -73.8114], // Curve after Main St
    [40.7596, -73.8305], // Mets-Willets Point
    [40.7573, -73.8398], // Curve approaching 111 St
    [40.7549, -73.8458], // 111 St
    [40.7532, -73.8544], // Curve approaching 103 St
    [40.7517, -73.8630], // 103 St–Corona Plaza
    [40.7500, -73.8704], // Curve approaching Junction Blvd
    [40.7486, -73.8778], // Junction Blvd
    [40.7473, -73.8846], // Curve approaching 90 St
    [40.7460, -73.8915], // 90 St-Elmhurst Av
    [40.7445, -73.9020], // Curve approaching 82 St
    [40.7431, -73.9126], // 82 St-Jackson Hts
    [40.7424, -73.9164], // Curve approaching 74 St
    [40.7417, -73.9202], // 74 St–Broadway
    [40.7405, -73.9301], // Curve approaching 69 St
    [40.7395, -73.9401], // 69 St
    [40.7383, -73.9443], // Curve approaching 61 St
    [40.7370, -73.9486], // 61 St–Woodside
    [40.7408, -73.9507], // Subway curves north
    [40.7445, -73.9529], // 52 St
    [40.7442, -73.9564], // Curve approaching 46 St
    [40.7439, -73.9601], // 46 St–Bliss St
    [40.7435, -73.9653], // Curve approaching 40 St
    [40.7432, -73.9706], // 40 St–Lowery St
    [40.7431, -73.9772], // Curve approaching 33 St
    [40.7430, -73.9838], // 33 St–Rawson St
    [40.7434, -73.9885], // Curve approaching Queensboro Plaza
    [40.7439, -73.9931], // Queensboro Plaza
    [40.7474, -73.9915], // Curve approaching Court Sq
    [40.7509, -73.9900], // Court Sq
    [40.7528, -73.9807], // Curve approaching Hunter's Point
    [40.7547, -73.9714], // Hunter's Point Av
    [40.7487, -73.9894], // Curve approaching Vernon Blvd
    [40.7426, -74.0074], // Vernon Blvd–Jackson Av
    [40.7467, -74.0049], // Curve approaching Grand Central
    [40.7508, -74.0025], // Grand Central–42 St
    [40.7528, -73.9972], // Curve approaching 5 Av
    [40.7548, -73.9919], // 5 Av
    [40.7569, -73.9879], // Curve approaching Times Sq
    [40.7591, -73.9840], // Times Sq–42 St
    [40.7608, -73.9739], // Curve approaching Hudson Yards
    [40.7626, -73.9639], // 34 St–Hudson Yards
  ],
  
  // A train (more realistic with curves and bends)
  'A': [
    // Manhattan section with better handling of turns/curves
    [40.7046, -74.0133], // Wall St
    [40.7066, -74.0092], // Fulton St
    [40.7105, -74.0094], // Brooklyn Bridge–City Hall
    [40.7146, -74.0064], // Curve
    [40.7176, -74.0037], // Canal St
    [40.7195, -74.0020], // Curve
    [40.7214, -74.0004], // Spring St
    [40.7232, -73.9987], // Curve
    [40.7250, -73.9890], // Bleecker St
    [40.7278, -73.9881], // Curve
    [40.7307, -73.9873], // Astor Pl
    [40.7328, -73.9889], // Curve
    [40.7349, -73.9906], // 14 St–Union Sq
    [40.7387, -73.9887], // Curve
    [40.7425, -73.9869], // 23 St
    [40.7446, -73.9842], // Curve
    [40.7467, -73.9815], // 28 St
    [40.7485, -73.9790], // Curve
    [40.7504, -73.9766], // 33 St
    [40.7511, -73.9732], // Curve
    [40.7518, -73.9698], // Grand Central–42 St
    [40.7603, -73.9660], // Curve
    [40.7687, -73.9622], // 59 St
    [40.7730, -73.9607], // Curve
    [40.7773, -73.9591], // 68 St–Hunter College
    [40.7784, -73.9574], // Curve
    [40.7795, -73.9558], // 77 St
    [40.7821, -73.9566], // Curve
    [40.7847, -73.9574], // 86 St
    [40.7869, -73.9570], // Curve
    [40.7892, -73.9565], // 96 St
    [40.7937, -73.9543], // Curve
    [40.7979, -73.9455], // 110 St
    [40.8012, -73.9402], // Curve
    [40.8044, -73.9317], // 116 St
    [40.8095, -73.9291], // Curve
    [40.8135, -73.9266], // 125 St
    // Many more stations would follow...
  ],
};

// NYC bus routes with more points to follow street patterns
const busRoutes: Record<string, Coordinates[]> = {
  // M60 (LaGuardia Airport - Manhattan) - more detailed route following streets
  'M60': [
    [40.7769, -73.8740], // LaGuardia Airport
    [40.7764, -73.8789], // Airport exit
    [40.7760, -73.8848], // 94th St
    [40.7758, -73.8905], // 90th St
    [40.7755, -73.8973], // 82 St & Astoria Blvd
    [40.7752, -73.9032], // 77th St
    [40.7748, -73.9077], // 74th St
    [40.7745, -73.9121], // 31 Ave & 75 St
    [40.7738, -73.9154], // 70th St
    [40.7729, -73.9178], // 65th St
    [40.7722, -73.9204], // 60th St
    [40.7717, -73.9218], // 58th St
    [40.7712, -73.9230], // Astoria Blvd & 49 St
    [40.7709, -73.9245], // 53rd St
    [40.7707, -73.9266], // 50th St
    [40.7705, -73.9287], // Astoria Blvd & Steinway St
    [40.7700, -73.9318], // 42nd St
    [40.7695, -73.9347], // 37th St
    [40.7690, -73.9372], // 33rd St
    [40.7685, -73.9392], // Astoria Blvd & 21 St
    [40.7674, -73.9428], // 27th Ave
    [40.7662, -73.9456], // 23rd Ave
    [40.7645, -73.9489], // Hoyt Ave & 21 St
    [40.7658, -73.9522], // Triborough Bridge approach
    [40.7693, -73.9565], // Triborough Bridge
    [40.7727, -73.9610], // Bridge exit to Manhattan
    [40.7789, -73.9550], // 125 St & 1st Ave  
    [40.7911, -73.9536], // 125 St & 2nd Ave
    [40.8027, -73.9517], // 125 St & 3rd Ave
    [40.8084, -73.9470], // 125 St & Lexington Ave
    [40.8088, -73.9495], // 125 St & Park Ave
    [40.8092, -73.9521], // 125 St & Malcolm X Blvd
    [40.8097, -73.9540], // Madison Ave
    [40.8104, -73.9564], // 125 St & Adam Clayton Powell Blvd
    [40.8109, -73.9587], // St. Nicholas Ave
    [40.8113, -73.9610], // 125 St & Frederick Douglass Blvd
    [40.8118, -73.9635], // Manhattan Ave
    [40.8126, -73.9666], // 125 St & Morningside Ave
    [40.8130, -73.9734], // 125 St & Amsterdam Ave
    [40.8134, -73.9802], // 125 St & Broadway 
  ],
  
  // Q44 with more detailed routing
  'Q44': [
    [40.7046, -73.7968], // Jamaica Center
    [40.7079, -73.7999], // Jamaica Ave & 169 St
    [40.7111, -73.8031], // Hillside Ave & 169 St
    [40.7159, -73.8013], // Hillside Ave & 188 St
    [40.7191, -73.7996], // 73rd Ave & Utopia Pkwy
    [40.7217, -73.7978], // Fresh Meadow Ln & 73rd Ave
    [40.7243, -73.7962], // 188th St & 69th Ave
    [40.7282, -73.7949], // Main St & Kissena Blvd
    [40.7320, -73.8062], // Kissena Blvd & 45th Ave
    [40.7379, -73.8174], // Kissena Blvd & 41st Ave
    [40.7437, -73.8261], // Kissena Blvd & Cherry Ave
    [40.7478, -73.8302], // Kissena Blvd & Blossom Ave
    [40.7528, -73.8300], // Kissena Blvd & Elder Ave
    [40.7566, -73.8302], // Main St & Roosevelt Ave
    [40.7590, -73.8300], // Main St & Roosevelt Ave
    [40.7608, -73.8306], // Main St & 39th Ave
    [40.7626, -73.8312], // Main St & 37th Ave
    [40.7654, -73.8318], // Main St & Northern Blvd
    [40.7689, -73.8318], // Main St & 34th Ave
    [40.7723, -73.8308], // Main St & 32nd Ave
    [40.7750, -73.8290], // Main St & 29th Ave
    [40.7778, -73.8264], // Main St & Sanford Ave
    [40.7801, -73.8246], // Main St & Franklin Ave
    [40.7836, -73.8247], // Main St & Northern Blvd
    [40.7872, -73.8219], // Powell's Cove Blvd
    [40.7905, -73.8175], // 14th Ave & Parsons Blvd
    [40.7937, -73.8169], // 14th Ave & 154th St
    [40.7958, -73.8162], // Main St & Jewel Ave
    [40.7988, -73.8220], // Whitestone Expwy approach
    [40.8017, -73.8279], // Whitestone Expressway
    [40.8082, -73.8366], // Approaching bridge
    [40.8145, -73.8454], // Bronx-Whitestone Bridge
    [40.8194, -73.8357], // Bridge exit
    [40.8222, -73.8307], // Hutchinson River Pkwy
    [40.8247, -73.8284], // East Tremont Ave
    [40.8292, -73.8455], // E Tremont & White Plains Rd
    [40.8316, -73.8534], // E Tremont & Boston Rd
    [40.8327, -73.8622], // E Tremont & Southern Blvd
    [40.8341, -73.8755], // Bronx Zoo
  ]
};

// Street network data for driving/walking routes
const streetGrid: Record<string, [Coordinates, Coordinates][]> = {
  'Manhattan': [
    // Major avenues running north-south
    [[40.7024, -74.0167], [40.8155, -73.9478]], // Broadway
    [[40.7003, -73.9940], [40.8134, -73.9365]], // 1st Avenue
    [[40.7024, -73.9908], [40.8150, -73.9332]], // 2nd Avenue
    [[40.7045, -73.9875], [40.8168, -73.9300]], // 3rd Avenue
    [[40.7067, -73.9926], [40.8185, -73.9348]], // Lexington Avenue
    [[40.7088, -73.9978], [40.8204, -73.9402]], // Park Avenue
    [[40.7110, -74.0029], [40.8222, -73.9453]], // Madison Avenue
    [[40.7134, -74.0061], [40.8241, -73.9485]], // 5th Avenue
    [[40.7155, -74.0111], [40.8258, -73.9535]], // 6th Avenue
    [[40.7177, -74.0147], [40.8277, -73.9571]], // 7th Avenue
    [[40.7204, -74.0183], [40.8296, -73.9605]], // 8th Avenue
    [[40.7222, -74.0219], [40.8315, -73.9641]], // 9th Avenue
    [[40.7242, -74.0256], [40.8333, -73.9679]], // 10th Avenue
    
    // Major streets running east-west
    [[40.7091, -74.0154], [40.7153, -73.9779]], // Canal Street
    [[40.7266, -74.0090], [40.7248, -73.9773]], // Houston Street
    [[40.7350, -74.0055], [40.7328, -73.9758]], // 14th Street
    [[40.7428, -74.0062], [40.7409, -73.9723]], // 23rd Street
    [[40.7506, -74.0057], [40.7488, -73.9697]], // 34th Street
    [[40.7590, -73.9937], [40.7543, -73.9624]], // 42nd Street
    [[40.7673, -73.9921], [40.7627, -73.9603]], // 57th Street
    [[40.7689, -73.9820], [40.7659, -73.9587]], // 59th Street
    [[40.7859, -73.9708], [40.7828, -73.9487]], // 79th Street
    [[40.7958, -73.9673], [40.7925, -73.9450]], // 96th Street
    [[40.8043, -73.9646], [40.8010, -73.9423]], // 110th Street
    [[40.8134, -73.9582], [40.8094, -73.9322]], // 125th Street
    [[40.8238, -73.9468], [40.8192, -73.9251]], // 145th Street
  ],
  'Queens': [
    // Major Queens roads
    [[40.7420, -73.9595], [40.7572, -73.9152]], // Queens Blvd
    [[40.7595, -73.9205], [40.7501, -73.8685]], // Roosevelt Avenue
    [[40.7631, -73.8640], [40.7664, -73.7384]], // Northern Blvd
    [[40.7386, -73.8784], [40.7197, -73.8023]], // Jamaica Avenue
    [[40.6898, -73.8495], [40.6720, -73.7662]], // Linden Blvd
    [[40.7502, -73.9002], [40.7583, -73.8310]], // Broadway (Queens)
    [[40.7635, -73.8618], [40.7590, -73.8300]], // Main Street
  ],
  'Brooklyn': [
    // Major Brooklyn roads
    [[40.6924, -73.9896], [40.6576, -73.9490]], // Flatbush Avenue
    [[40.6984, -73.9816], [40.6706, -73.9879]], // Atlantic Avenue
    [[40.6887, -73.9909], [40.6585, -73.9570]], // Eastern Parkway
    [[40.7032, -73.9453], [40.7098, -73.8970]], // Metropolitan Avenue
    [[40.6779, -73.9980], [40.6505, -73.9470]], // Ocean Parkway
  ],
  'Bronx': [
    // Major Bronx roads
    [[40.8135, -73.9266], [40.8704, -73.8846]], // Grand Concourse
    [[40.8263, -73.9199], [40.8599, -73.8291]], // Fordham Road
    [[40.8281, -73.9254], [40.8195, -73.8246]], // East Tremont Avenue
    [[40.8293, -73.9061], [40.8453, -73.8289]], // Pelham Parkway
  ]
};

// Realistic waypoint generator based on mode of transport
const generateRealisticWaypoints = (
  start: Coordinates, 
  end: Coordinates, 
  mode: string,
  line?: string
): Coordinates[] => {
  // For subways, use predefined routes when available
  if (mode === 'subway') {
    // First check if we have the specific line data
    if (line && subwayRoutes[line]) {
      const subwayPath = subwayRoutes[line];
      
      // Find closest points on the subway line to start and end
      const startIndex = findClosestPointIndex(subwayPath, start);
      const endIndex = findClosestPointIndex(subwayPath, end);
      
      // Get the appropriate segment of the subway route
      if (startIndex !== -1 && endIndex !== -1) {
        let routeSegment: Coordinates[];
        if (startIndex < endIndex) {
          routeSegment = subwayPath.slice(startIndex, endIndex + 1);
        } else {
          routeSegment = subwayPath.slice(endIndex, startIndex + 1).reverse();
        }
        
        // If there are very few points, interpolate more
        if (routeSegment.length < 3) {
          return generateCurvedPath(start, end, 20);
        }
        
        // Add walking segments to connect to the actual subway line
        const result: Coordinates[] = [];
        
        // Add walking segment from start to subway
        const startSubwayPoint = routeSegment[0];
        const startWalk = generateWalkingPath(start, startSubwayPoint);
        result.push(...startWalk.slice(0, -1)); // Don't include the last point as it would be duplicated
        
        // Add the subway route
        result.push(...routeSegment);
        
        // Add walking segment from subway to end
        const endSubwayPoint = routeSegment[routeSegment.length - 1];
        const endWalk = generateWalkingPath(endSubwayPoint, end);
        result.push(...endWalk.slice(1)); // Skip the first point as it would be duplicated
        
        return result;
      }
    }
    
    // If no specific line data or couldn't find valid points, create a more subway-like path
    // This creates a path with few turns but realistic subway curves
    const distance = calculateDistance(start[0], start[1], end[0], end[1]);
    
    // For subway without specific line info, create a curved path with fewer turns
    const midLat = (start[0] + end[0]) / 2;
    const midLng = (start[1] + end[1]) / 2;
    
    // Create a slight offset for the control point to simulate subway curves
    const offset = distance * 0.2;
    const offsetDirection = Math.random() > 0.5 ? 1 : -1;
    
    const controlPoint1: Coordinates = [
      midLat + offset * offsetDirection * 0.01,
      midLng + offset * offsetDirection * 0.01
    ];
    
    const points: Coordinates[] = [];
    points.push(start);
    
    // Generate more points for a smoother curve
    const numPoints = Math.max(20, Math.floor(distance * 40));
    for (let i = 1; i < numPoints - 1; i++) {
      const t = i / (numPoints - 1);
      
      // Quadratic Bezier formula
      const lat = Math.pow(1-t, 2) * start[0] + 
                  2 * (1-t) * t * controlPoint1[0] + 
                  Math.pow(t, 2) * end[0];
                  
      const lng = Math.pow(1-t, 2) * start[1] + 
                  2 * (1-t) * t * controlPoint1[1] + 
                  Math.pow(t, 2) * end[1];
      
      points.push([lat, lng]);
    }
    
    points.push(end);
    return points;
  }
  
  // For buses, use predefined routes when available
  if (mode === 'bus') {
    if (line && busRoutes[line]) {
      const busPath = busRoutes[line];
      
      // Find closest points on the bus line to start and end
      const startIndex = findClosestPointIndex(busPath, start);
      const endIndex = findClosestPointIndex(busPath, end);
      
      // Get the appropriate segment of the bus route
      if (startIndex !== -1 && endIndex !== -1) {
        let routeSegment: Coordinates[];
        if (startIndex < endIndex) {
          routeSegment = busPath.slice(startIndex, endIndex + 1);
        } else {
          routeSegment = busPath.slice(endIndex, startIndex + 1).reverse();
        }
        
        // Add walking segments to connect to the actual bus route
        const result: Coordinates[] = [];
        
        // Add walking segment from start to bus stop
        const startBusPoint = routeSegment[0];
        const startWalk = generateWalkingPath(start, startBusPoint);
        result.push(...startWalk.slice(0, -1)); // Don't include the last point as it would be duplicated
        
        // Add the bus route
        result.push(...routeSegment);
        
        // Add walking segment from bus stop to end
        const endBusPoint = routeSegment[routeSegment.length - 1];
        const endWalk = generateWalkingPath(endBusPoint, end);
        result.push(...endWalk.slice(1)); // Skip the first point as it would be duplicated
        
        return result;
      }
    }
    
    // For buses without specific line info, follow the street grid more closely
    // This will create a more realistic bus route that follows streets
    return generateStreetPath(start, end, 0.7); // Higher complexity for more zigzags like a bus route
  }
  
  // For walking, create a more realistic path with city blocks
  if (mode === 'walk') {
    return generateWalkingPath(start, end);
  }
  
  // For taxi/uber/car, follow street grid with smoother curves
  if (mode === 'taxi' || mode === 'uber') {
    return generateDrivingPath(start, end);
  }
  
  // For e-bikes, create a path that's more direct than walking but follows some street patterns
  if (mode === 'ebike' || mode === 'bike') {
    // E-bikes can take bike lanes and shortcuts
    const points: Coordinates[] = [];
    points.push(start);
    
    // Calculate distance to determine complexity
    const distance = calculateDistance(start[0], start[1], end[0], end[1]);
    const numSegments = Math.max(3, Math.ceil(distance * 3));
    
    // Create a relatively direct path with some turns for bike lanes
    let currentPoint = start;
    
    for (let i = 1; i < numSegments; i++) {
      const progress = i / numSegments;
      
      // Bikes can take more direct routes than cars but still follow some street patterns
      // Mix of grid following and direct path
      if (i % 2 === 1) {
        // More direct path
        const newPoint: Coordinates = [
          currentPoint[0] + (end[0] - currentPoint[0]) * 0.5,
          currentPoint[1] + (end[1] - currentPoint[1]) * 0.5
        ];
        points.push(newPoint);
        currentPoint = newPoint;
      } else {
        // Follow grid
        const gridPoint: Coordinates = [
          currentPoint[0] + (end[0] - start[0]) * (progress + (Math.random() - 0.5) * 0.1),
          currentPoint[1] + (end[1] - start[1]) * (progress + (Math.random() - 0.5) * 0.1)
        ];
        points.push(gridPoint);
        currentPoint = gridPoint;
      }
    }
    
    points.push(end);
    return points;
  }
  
  // For other modes or fallback, use a curved path
  const distance = calculateDistance(start[0], start[1], end[0], end[1]);
  // Significantly increase the number of points for smoother lines
  const numPoints = Math.max(20, Math.floor(distance * 50)); 
  
  return generateCurvedPath(start, end, numPoints);
};

// Helper function to generate paths that follow street patterns with variable complexity
const generateStreetPath = (start: Coordinates, end: Coordinates, complexity: number): Coordinates[] => {
  const points: Coordinates[] = [];
  points.push(start);
  
  // Determine how many street segments to create based on distance and complexity
  const distance = calculateDistance(start[0], start[1], end[0], end[1]);
  const numSegments = Math.max(2, Math.floor(distance * 5 * complexity));
  
  // Create a zigzag path simulating city streets
  let currentPoint = start;
  let currentDirection = Math.random() > 0.5 ? 'horizontal' : 'vertical';
  
  for (let i = 0; i < numSegments; i++) {
    // Calculate progress toward destination
    const progress = (i + 1) / (numSegments + 1);
    
    // Alternate between horizontal and vertical movement
    let nextPoint: Coordinates;
    if (currentDirection === 'horizontal') {
      // Move horizontally toward target longitude
      nextPoint = [
        currentPoint[0],
        currentPoint[1] + (end[1] - start[1]) * progress * (1 + (Math.random() - 0.5) * 0.4)
      ];
      currentDirection = 'vertical';
    } else {
      // Move vertically toward target latitude
      nextPoint = [
        currentPoint[0] + (end[0] - start[0]) * progress * (1 + (Math.random() - 0.5) * 0.4),
        currentPoint[1]
      ];
      currentDirection = 'horizontal';
    }
    
    // Add several points between current and next for smooth lines
    const segmentPoints = 10;
    for (let j = 1; j < segmentPoints; j++) {
      const t = j / segmentPoints;
      points.push([
        currentPoint[0] + (nextPoint[0] - currentPoint[0]) * t,
        currentPoint[1] + (nextPoint[1] - currentPoint[1]) * t
      ]);
    }
    
    points.push(nextPoint);
    currentPoint = nextPoint;
  }
  
  // Add more points between the last turn and the end
  const finalSegmentPoints = 10;
  for (let j = 1; j < finalSegmentPoints; j++) {
    const t = j / finalSegmentPoints;
    points.push([
      currentPoint[0] + (end[0] - currentPoint[0]) * t,
      currentPoint[1] + (end[1] - currentPoint[1]) * t
    ]);
  }
  
  points.push(end);
  return points;
};

// Find the closest point on a route to a given coordinate
const findClosestPointIndex = (route: Coordinates[], point: Coordinates): number => {
  let minDistance = Infinity;
  let closestIndex = -1;
  
  route.forEach((routePoint, index) => {
    const distance = calculateDistance(
      routePoint[0], routePoint[1], 
      point[0], point[1]
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });
  
  return closestIndex;
};

// Calculate distance between points in km using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Generate a realistic walking path following the street grid
const generateWalkingPath = (start: Coordinates, end: Coordinates): Coordinates[] => {
  // Create a path that follows streets more realistically
  const points: Coordinates[] = [];
  points.push(start);
  
  // Determine which borough the route is in
  const boroughKeys = Object.keys(streetGrid);
  let routeBorough = 'Manhattan'; // Default
  
  // Try to determine the borough based on start coordinates
  const avgLat = (start[0] + end[0]) / 2;
  const avgLng = (start[1] + end[1]) / 2;
  
  if (avgLat > 40.77 && avgLng > -74.02 && avgLng < -73.91) {
    routeBorough = 'Manhattan';
  } else if (avgLat > 40.65 && avgLng > -73.96 && avgLng < -73.7) {
    routeBorough = 'Queens';
  } else if (avgLat < 40.71 && avgLng > -74.04 && avgLng < -73.83) {
    routeBorough = 'Brooklyn';
  } else if (avgLat > 40.79 && avgLng > -73.94 && avgLng < -73.82) {
    routeBorough = 'Bronx';
  }
  
  const streets = streetGrid[routeBorough] || streetGrid['Manhattan'];
  
  // Find nearest streets to start and end points
  const findNearestStreet = (point: Coordinates) => {
    let nearestDistance = Infinity;
    let nearestStreet = streets[0];
    
    for (const street of streets) {
      const streetStart = street[0];
      const streetEnd = street[1];
      
      // Calculate distance to street (simplified)
      const d1 = calculateDistance(point[0], point[1], streetStart[0], streetStart[1]);
      const d2 = calculateDistance(point[0], point[1], streetEnd[0], streetEnd[1]);
      const minDist = Math.min(d1, d2);
      
      if (minDist < nearestDistance) {
        nearestDistance = minDist;
        nearestStreet = street;
      }
    }
    
    return nearestStreet;
  };
  
  const startStreet = findNearestStreet(start);
  const endStreet = findNearestStreet(end);
  
  // Create path: start -> nearest point on start street -> nearest point on end street -> end
  // Add intermediate points for the first street segment
  const startStreetVector = [
    startStreet[1][0] - startStreet[0][0],
    startStreet[1][1] - startStreet[0][1]
  ];
  const startStreetLength = Math.sqrt(
    startStreetVector[0] * startStreetVector[0] + 
    startStreetVector[1] * startStreetVector[1]
  );
  const startStreetNormalized = [
    startStreetVector[0] / startStreetLength,
    startStreetVector[1] / startStreetLength
  ];
  
  // Project start point onto start street
  const startDotProduct = 
    (start[0] - startStreet[0][0]) * startStreetNormalized[0] + 
    (start[1] - startStreet[0][1]) * startStreetNormalized[1];
  const startProjection = [
    startStreet[0][0] + startDotProduct * startStreetNormalized[0],
    startStreet[0][1] + startDotProduct * startStreetNormalized[1]
  ];
  
  // Add points from start to the nearest point on the start street
  const numSteps1 = 5;
  for (let i = 1; i <= numSteps1; i++) {
    const t = i / numSteps1;
    points.push([
      start[0] + (startProjection[0] - start[0]) * t,
      start[1] + (startProjection[1] - start[1]) * t
    ]);
  }
  
  // Add points along the street
  const endStreetVector = [
    endStreet[1][0] - endStreet[0][0],
    endStreet[1][1] - endStreet[0][1]
  ];
  const endStreetLength = Math.sqrt(
    endStreetVector[0] * endStreetVector[0] + 
    endStreetVector[1] * endStreetVector[1]
  );
  const endStreetNormalized = [
    endStreetVector[0] / endStreetLength,
    endStreetVector[1] / endStreetLength
  ];
  
  // Project end point onto end street
  const endDotProduct = 
    (end[0] - endStreet[0][0]) * endStreetNormalized[0] + 
    (end[1] - endStreet[0][1]) * endStreetNormalized[1];
  const endProjection = [
    endStreet[0][0] + endDotProduct * endStreetNormalized[0],
    endStreet[0][1] + endDotProduct * endStreetNormalized[1]
  ];
  
  // If the streets are different, create a path between the projections
  if (startStreet !== endStreet) {
    // Add points along the connecting path
    const numSteps2 = 10;
    for (let i = 1; i <= numSteps2; i++) {
      const t = i / numSteps2;
      points.push([
        startProjection[0] + (endProjection[0] - startProjection[0]) * t,
        startProjection[1] + (endProjection[1] - startProjection[1]) * t
      ]);
    }
  }
  
  // Add points from the nearest point on the end street to the end
  const numSteps3 = 5;
  for (let i = 1; i <= numSteps3; i++) {
    const t = i / numSteps3;
    points.push([
      endProjection[0] + (end[0] - endProjection[0]) * t,
      endProjection[1] + (end[1] - endProjection[1]) * t
    ]);
  }
  
  points.push(end);
  return points;
};

// Generate a realistic driving path following the street grid
const generateDrivingPath = (start: Coordinates, end: Coordinates): Coordinates[] => {
  // For driving, use a similar approach to walking but with more points and smoother turns
  // This will create a path that follows the street grid more realistically
  return generateWalkingPath(start, end);
};

// Generate a smooth curved path between two points using quadratic Bezier curve
const generateCurvedPath = (start: Coordinates, end: Coordinates, numPoints: number): Coordinates[] => {
  // Increase the minimum number of points for smoother curves
  numPoints = Math.max(20, numPoints); // Ensure at least 20 points
  
  const points: Coordinates[] = [];
  
  // Add start point
  points.push(start);
  
  // Calculate control point (perpendicular to midpoint)
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  
  // Create perpendicular offset for control point (creates a curve)
  const dx = end[1] - start[1];
  const dy = end[0] - start[0];
  const length = Math.sqrt(dx * dx + dy * dy);
  const offsetFactor = 0.3; // Controls curve amount
  
  const controlPoint: Coordinates = [
    midLat + (offsetFactor * dx) / length,
    midLng - (offsetFactor * dy) / length
  ];
  
  // Generate more points along the quadratic Bezier curve
  for (let i = 1; i < numPoints - 1; i++) {
    const t = i / (numPoints - 1);
    
    // Quadratic Bezier formula
    const lat = Math.pow(1-t, 2) * start[0] + 
                2 * (1-t) * t * controlPoint[0] + 
                Math.pow(t, 2) * end[0];
                
    const lng = Math.pow(1-t, 2) * start[1] + 
                2 * (1-t) * t * controlPoint[1] + 
                Math.pow(t, 2) * end[1];
    
    points.push([lat, lng]);
  }
  
  // Add end point
  points.push(end);
  
  return points;
};

// Generate a random location within NYC boundaries
const generateRandomNYCLocation = (): Coordinates => {
  // NYC boundaries (approximate)
  const nycBounds = {
    north: 40.915, // Bronx
    south: 40.495, // Staten Island
    east: -73.700, // Queens
    west: -74.255  // Staten Island
  };
  
  // Generate a random point within Manhattan for more realistic locations
  const manhattanBounds = {
    north: 40.880, // Upper Manhattan
    south: 40.700, // Lower Manhattan
    east: -73.920, // East side
    west: -74.020  // West side
  };
  
  // 80% chance to be in Manhattan for more central locations
  if (Math.random() < 0.8) {
    return [
      manhattanBounds.south + Math.random() * (manhattanBounds.north - manhattanBounds.south),
      manhattanBounds.west + Math.random() * (manhattanBounds.east - manhattanBounds.west)
    ];
  }
  
  // 20% chance to be elsewhere in NYC
  return [
    nycBounds.south + Math.random() * (nycBounds.north - nycBounds.south),
    nycBounds.west + Math.random() * (nycBounds.east - nycBounds.west)
  ];
};

// Default NYC location (Times Square)
const defaultLocation: Coordinates = [40.7580, -73.9855];

// Component props
interface MapProps {
  segments: any[];
  origin: string;
  destination: string;
}

// Coordinates type
type Coordinates = [number, number];

const Map = ({ origin, destination, segments }: MapProps) => {
  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [endCoords, setEndCoords] = useState<Coordinates | null>(null);
  const [waypoints, setWaypoints] = useState<Record<string, Coordinates[]>>({});
  
  // Mock coordinates for NYC boroughs (in a real app, would use geocoding API)
  const mockCoordinates: Record<string, Coordinates> = {
    // Boroughs
    'Manhattan': [40.7831, -73.9712],
    'Brooklyn': [40.6782, -73.9442],
    'Queens': [40.7282, -73.7949],
    'Bronx': [40.8448, -73.8648],
    'Staten Island': [40.5795, -74.1502],
    
    // Popular locations
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
    'Penn Station': [40.7497, -73.9939],
    'SoHo': [40.7233, -74.0030],
    'Great Kills': [40.5457, -74.1508],
    'Bronx High School of Science': [40.8776, -73.8931],
    
    // Hospitals
    'NYU Langone Medical Center': [40.7421, -73.9739],
    'Mount Sinai Hospital': [40.7900, -73.9526],
    'NewYork-Presbyterian Hospital': [40.7644, -73.9554],
    'Bellevue Hospital Center': [40.7392, -73.9766],
    'NYC Health + Hospitals/Kings County': [40.6553, -73.9449],
    'Maimonides Medical Center': [40.6364, -73.9986],
    'NYC Health + Hospitals/Elmhurst': [40.7444, -73.8803],
    'NYC Health + Hospitals/Queens': [40.7106, -73.8250],
    'NYC Health + Hospitals/Lincoln': [40.8161, -73.9262],
    'Montefiore Medical Center': [40.8810, -73.8781],
    'Staten Island University Hospital': [40.5847, -74.0875]
  };
  
  // Get coordinates from location string or use mock data
  const getCoordinates = (location: string): Coordinates => {
    if (!location) {
      console.warn("Location is undefined or null");
      return mockCoordinates['Times Square']; // Return a default location like Times Square
    }

    // Normalize the location string
    const normalizedLocation = location.toLowerCase().trim();
    
    // First, check for exact matches with hospitals and specific locations
    for (const [locationName, coords] of Object.entries(mockCoordinates)) {
      if (normalizedLocation === locationName.toLowerCase()) {
        return coords;
      }
    }
    
    // Then check for partial matches
    for (const [locationName, coords] of Object.entries(mockCoordinates)) {
      if (normalizedLocation.includes(locationName.toLowerCase())) {
        return coords;
      }
    }

    // Check for specific NYC neighborhoods and areas
    if (normalizedLocation.includes('manhattan')) {
      return mockCoordinates.Manhattan;
    } else if (normalizedLocation.includes('brooklyn')) {
      return mockCoordinates.Brooklyn;
    } else if (normalizedLocation.includes('queens')) {
      return mockCoordinates.Queens;
    } else if (normalizedLocation.includes('bronx')) {
      return mockCoordinates.Bronx;
    } else if (normalizedLocation.includes('staten island') || normalizedLocation.includes('great kills')) {
      return mockCoordinates['Staten Island'];
    } else if (normalizedLocation.includes('hospital') || normalizedLocation.includes('medical center')) {
      // Default hospital coordinates if not found by name
      return mockCoordinates['Bellevue Hospital Center'];
    }

    // Common streets in NYC - provide approximate locations
    if (normalizedLocation.includes('broadway')) {
      return [40.7512, -73.9886]; // Mid Broadway
    } else if (normalizedLocation.includes('5th avenue') || normalizedLocation.includes('fifth avenue')) {
      return [40.7540, -73.9800]; // Mid 5th Ave
    } else if (normalizedLocation.includes('times square')) {
      return mockCoordinates['Times Square'];
    }
    
    // Handle addresses with numbers - extract borough if possible
    if (/\d+/.test(normalizedLocation)) {
      if (normalizedLocation.includes('manhattan')) {
        return [40.7831 + Math.random() * 0.04 - 0.02, -73.9712 + Math.random() * 0.04 - 0.02];
      } else if (normalizedLocation.includes('brooklyn')) {
        return [40.6782 + Math.random() * 0.04 - 0.02, -73.9442 + Math.random() * 0.04 - 0.02];
      } else if (normalizedLocation.includes('queens')) {
        return [40.7282 + Math.random() * 0.04 - 0.02, -73.7949 + Math.random() * 0.04 - 0.02];
      } else if (normalizedLocation.includes('bronx')) {
        return [40.8448 + Math.random() * 0.04 - 0.02, -73.8648 + Math.random() * 0.04 - 0.02];
      } else if (normalizedLocation.includes('staten')) {
        return [40.5795 + Math.random() * 0.04 - 0.02, -74.1502 + Math.random() * 0.04 - 0.02];
      }
    }

    // If still not found, generate a random location near the center of NYC
    console.warn("Location not found in database, generating coordinates for:", location);
    return generateRandomNYCLocation();
  };
  
  useEffect(() => {
    // Fix Leaflet icons
    fixLeafletIcon();
    
    // Set start and end coordinates
    if (origin && destination) {
      const fromCoords = getCoordinates(origin);
      const toCoords = getCoordinates(destination);
      
      // Log coordinates for debugging
      console.log(`Map - From location: "${origin}" → coordinates: [${fromCoords[0]}, ${fromCoords[1]}]`);
      console.log(`Map - To location: "${destination}" → coordinates: [${toCoords[0]}, ${toCoords[1]}]`);
      
      setStartCoords(fromCoords);
      setEndCoords(toCoords);
      
      // Generate realistic waypoints for each segment
      if (segments && segments.length > 0) {
        const segmentWaypoints: Record<string, Coordinates[]> = {};
        
        let lastEndpoint = fromCoords;
        
        segments.forEach((segment: any, index: number) => {
          const endpointCoords = index === segments.length - 1 
            ? toCoords 
            : getCoordinates(segment.endLocation || segment.to);
          
          // Generate realistic waypoints based on mode of transport
          let segmentLine = segment.line || '';
          // Extract line number from text like "7 Train" or "Q44 Bus"
          if (segment.lineInfo) {
            const lineMatch = segment.lineInfo.match(/^([A-Z0-9]+)/i);
            if (lineMatch) segmentLine = lineMatch[1];
          }
          
          const segmentPoints = generateRealisticWaypoints(
            lastEndpoint, 
            endpointCoords,
            segment.mode,
            segmentLine
          );
          
          segmentWaypoints[`segment-${index}`] = segmentPoints;
          lastEndpoint = endpointCoords;
        });
        
        setWaypoints(segmentWaypoints);
      }
    }
  }, [origin, destination, segments]);
  
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
          <strong>Start:</strong> {origin}
        </Popup>
      </Marker>
      
      {/* End Marker */}
      <Marker position={endCoords}>
        <Popup>
          <strong>Destination:</strong> {destination}
        </Popup>
      </Marker>
      
      {/* Route Segments */}
      {segments && segments.length > 0 && segments.map((segment: any, index: number) => {
        const segmentPoints = waypoints[`segment-${index}`];
        
        if (!segmentPoints) return null;
        
        return (
          <div key={`route-segment-${index}`}>
            <Polyline
              positions={segmentPoints}
              color={getRouteColor(segment.mode)}
              weight={segment.mode === 'walk' ? 3 : segment.mode === 'subway' ? 5 : 4}
              dashArray={segment.mode === 'walk' ? '5, 5' : segment.mode === 'bus' ? '1, 10' : ''}
              smoothFactor={segment.mode === 'subway' ? 0.5 : 1}
              lineJoin="round"
              lineCap="round"
              opacity={segment.mode === 'subway' ? 0.9 : 0.85}
              className={`route-line route-line-${segment.mode}`}
            />
            
            {/* Add markers for intermediate points - filtered to reduce visual clutter */}
            {segmentPoints
              .slice(1, -1)
              .filter((_, i, arr) => {
                const showEvery = Math.max(1, Math.floor(arr.length / (segment.mode === 'subway' ? 4 : 8)));
                return i % showEvery === 0;
              })
              .map((point, pointIndex) => (
                <Marker 
                  key={`waypoint-${index}-${pointIndex}`}
                  position={point}
                  icon={getTransportIcon(segment.mode)}
                >
                  <Popup>
                    <strong>{segment.mode.charAt(0).toUpperCase() + segment.mode.slice(1)}</strong>
                    {segment.lineInfo && <div><small>{segment.lineInfo}</small></div>}
                    {segment.line && <div><small>{segment.line}</small></div>}
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