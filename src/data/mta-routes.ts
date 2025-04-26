// MTA Subway route shapes from GTFS data
export const subwayRoutes = {
  "1": [
    [-73.99, 40.70], // South Ferry
    [-73.988, 40.707], // Rector St
    [-73.987, 40.711], // Cortlandt
    [-73.984, 40.715], // Chambers St
    [-73.98, 40.72], // Canal St
    [-73.977, 40.732], // Houston St
    [-73.975, 40.741], // 14th St
    [-73.973, 40.75], // 23rd St
    [-73.971, 40.761], // 34th St
    [-73.968, 40.771], // 42nd St
    [-73.966, 40.781], // 59th St
    [-73.962, 40.793], // 72nd St
    [-73.959, 40.799], // 79th St
    [-73.955, 40.807], // 86th St
    [-73.952, 40.815], // 96th St
    [-73.949, 40.824], // 103rd St
    [-73.947, 40.831], // 110th St
    [-73.945, 40.838], // 116th St
    [-73.943, 40.845], // 125th St
    [-73.941, 40.853], // 137th St
    [-73.939, 40.862] // 145th St
  ],
  "7": [
    [-73.976, 40.75], // Times Sq
    [-73.967, 40.751], // 5th Ave
    [-73.959, 40.752], // Grand Central
    [-73.944, 40.753], // Court Sq
    [-73.932, 40.754], // Hunters Point
    [-73.921, 40.755], // 33rd St
    [-73.913, 40.756], // 40th St
    [-73.902, 40.757], // 46th St
    [-73.891, 40.758], // 52nd St
    [-73.879, 40.759], // 61st St
    [-73.869, 40.76], // 69th St
    [-73.858, 40.761], // 74th St
    [-73.845, 40.762], // 82nd St
    [-73.831, 40.763] // Main St
  ],
  "A": [
    [-73.994, 40.71], // Fulton St
    [-73.989, 40.713], // Chambers St
    [-73.987, 40.719], // Canal St
    [-73.982, 40.726], // W 4th St
    [-73.977, 40.733], // 14th St
    [-73.972, 40.746], // 23rd St
    [-73.969, 40.755], // 34th St
    [-73.967, 40.762], // 42nd St
    [-73.962, 40.775], // 59th St
    [-73.958, 40.786], // 72nd St
    [-73.955, 40.797], // 81st St
    [-73.952, 40.805], // 86th St
    [-73.947, 40.811], // 96th St
    [-73.944, 40.817], // 103rd St
    [-73.942, 40.824], // 110th St
    [-73.939, 40.831], // 116th St
    [-73.937, 40.838], // 125th St
    [-73.934, 40.847], // 135th St
    [-73.932, 40.856] // 145th St
  ]
};

// Major bus routes
export const busRoutes = {
  "M15": [
    [-73.975, 40.701], // South Ferry
    [-73.973, 40.711], // City Hall
    [-73.971, 40.721], // Grand St
    [-73.969, 40.731], // Houston St
    [-73.967, 40.741], // 14th St
    [-73.965, 40.751], // 23rd St
    [-73.963, 40.761], // 34th St
    [-73.961, 40.771], // 42nd St
    [-73.959, 40.781], // 59th St
    [-73.957, 40.791] // 79th St
  ],
  "Q58": [
    [-73.919, 40.708], // Ridgewood
    [-73.908, 40.712], // Fresh Pond
    [-73.896, 40.716], // Middle Village
    [-73.884, 40.72], // Elmhurst
    [-73.872, 40.724], // Queens Blvd
    [-73.861, 40.728], // Broadway
    [-73.849, 40.732], // Northern Blvd
    [-73.837, 40.736], // Main St
    [-73.825, 40.74] // Flushing
  ],
  "B41": [
    [-73.989, 40.692], // Downtown Brooklyn
    [-73.978, 40.682], // Atlantic Ave
    [-73.967, 40.672], // Grand Army Plaza
    [-73.956, 40.662], // Eastern Parkway
    [-73.945, 40.652], // Church Ave
    [-73.934, 40.642], // Avenue H
    [-73.923, 40.632], // Kings Highway
    [-73.912, 40.622] // Avenue U
  ]
};

// Helper function to find closest point on a route
export const findClosestPointOnRoute = (
  point: [number, number],
  route: [number, number][]
): [number, number] => {
  let closestPoint = route[0];
  let minDistance = Infinity;
  
  route.forEach(routePoint => {
    const distance = Math.sqrt(
      Math.pow(point[0] - routePoint[0], 2) + 
      Math.pow(point[1] - routePoint[1], 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = routePoint;
    }
  });
  
  return closestPoint;
};

// Helper function to get route segment between two points
export const getRouteSegment = (
  start: [number, number],
  end: [number, number],
  route: [number, number][]
): [number, number][] => {
  const startIdx = route.findIndex(point => 
    point[0] === start[0] && point[1] === start[1]
  );
  const endIdx = route.findIndex(point => 
    point[0] === end[0] && point[1] === end[1]
  );
  
  if (startIdx === -1 || endIdx === -1) return [start, end];
  
  return route.slice(
    Math.min(startIdx, endIdx),
    Math.max(startIdx, endIdx) + 1
  );
}; 