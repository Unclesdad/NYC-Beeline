// Types for route optimization
export interface RouteVector {
  time: number;      // time in minutes
  cost: number;      // cost in dollars
  comfort: number;   // comfort score from 0-1
  safety: number;    // safety score from 0-1
  accessibility: number; // accessibility score from 0-1
}

export interface TransportMode {
  id: string;
  name: string;
  vector: RouteVector;
}

export interface RouteSegment {
  mode: TransportMode;
  distance: number; // in miles
  startLocation: string;
  endLocation: string;
  estimatedTime: number; // in minutes
  estimatedCost: number; // in dollars
}

export interface Route {
  segments: RouteSegment[];
  totalVector: RouteVector;
  score: number; // dot product with ideal vector
}

// Ideal vector represents the perfect route (minimum time, cost, maximum comfort, safety, etc.)
export const idealVector: RouteVector = {
  time: 0,      // ideally 0 minutes
  cost: 0,      // ideally $0
  comfort: 1,   // ideally maximum comfort
  safety: 1,    // ideally maximum safety
  accessibility: 1, // ideally maximum accessibility
};

/**
 * Normalize a vector to have values between 0 and 1
 * @param vector The vector to normalize
 * @param maxValues Maximum values for each dimension
 */
export const normalizeVector = (
  vector: RouteVector,
  maxValues: {
    maxTime: number;
    maxCost: number;
  }
): RouteVector => {
  return {
    time: 1 - Math.min(vector.time / maxValues.maxTime, 1), // Invert so 0 time = 1 (best)
    cost: 1 - Math.min(vector.cost / maxValues.maxCost, 1), // Invert so 0 cost = 1 (best)
    comfort: vector.comfort,
    safety: vector.safety,
    accessibility: vector.accessibility,
  };
};

/**
 * Calculate the dot product of two vectors
 * @param vectorA First vector
 * @param vectorB Second vector
 * @param weights Optional weights for each dimension
 */
export const dotProduct = (
  vectorA: RouteVector,
  vectorB: RouteVector,
  weights: RouteVector = {
    time: 1,
    cost: 1,
    comfort: 1,
    safety: 1,
    accessibility: 1,
  }
): number => {
  return (
    vectorA.time * vectorB.time * weights.time +
    vectorA.cost * vectorB.cost * weights.cost +
    vectorA.comfort * vectorB.comfort * weights.comfort +
    vectorA.safety * vectorB.safety * weights.safety +
    vectorA.accessibility * vectorB.accessibility * weights.accessibility
  );
};

/**
 * Calculate the combined vector for a route with multiple segments
 * @param segments Array of route segments
 */
export const calculateRouteVector = (segments: RouteSegment[]): RouteVector => {
  const totalVector: RouteVector = {
    time: 0,
    cost: 0,
    comfort: 0,
    safety: 0,
    accessibility: 0,
  };

  let totalDistance = 0;

  // Sum up the values from each segment
  segments.forEach((segment) => {
    totalVector.time += segment.estimatedTime;
    totalVector.cost += segment.estimatedCost;
    
    // Weighted average based on distance for these factors
    totalDistance += segment.distance;
  });

  // Calculate weighted averages for subjective metrics
  segments.forEach((segment) => {
    const weight = segment.distance / totalDistance;
    totalVector.comfort += segment.mode.vector.comfort * weight;
    totalVector.safety += segment.mode.vector.safety * weight;
    totalVector.accessibility += segment.mode.vector.accessibility * weight;
  });

  return totalVector;
};

/**
 * Score a route against the ideal vector
 * @param route The route to score
 * @param userPreferences User preferences for weighting different factors
 */
export const scoreRoute = (
  route: Route,
  userPreferences: RouteVector = {
    time: 1,
    cost: 1,
    comfort: 1,
    safety: 1,
    accessibility: 1,
  },
  maxValues: {
    maxTime: number;
    maxCost: number;
  } = { maxTime: 120, maxCost: 50 }
): number => {
  // Normalize the route's vector
  const normalizedVector = normalizeVector(route.totalVector, maxValues);
  
  // Calculate dot product with ideal vector using user preferences as weights
  return dotProduct(normalizedVector, idealVector, userPreferences);
};

/**
 * Find optimal routes by combining different modes of transportation
 * @param availableModes Available transportation modes
 * @param segments Route segments to optimize
 * @param userPreferences User preferences for different factors
 */
export const findOptimalRoutes = (
  availableModes: TransportMode[],
  segments: {
    startLocation: string;
    endLocation: string;
    distance: number;
  }[],
  userPreferences: RouteVector = {
    time: 1,
    cost: 1,
    comfort: 1,
    safety: 1,
    accessibility: 1,
  }
): Route[] => {
  // This would be a complex algorithm in a real application
  // Here's a simplified version:
  
  // 1. Generate possible combinations of transport modes for each segment
  // 2. Calculate vectors for each combination
  // 3. Score each combination
  // 4. Return top N options
  
  // For this demo, we'll return mock data
  const mockRoutes: Route[] = [
    {
      segments: [
        {
          mode: availableModes[0], // e.g., subway
          distance: segments[0].distance,
          startLocation: segments[0].startLocation,
          endLocation: segments[0].endLocation,
          estimatedTime: segments[0].distance * 5, // Mocked calculation
          estimatedCost: 2.75, // Standard subway fare
        },
      ],
      totalVector: {
        time: segments[0].distance * 5,
        cost: 2.75,
        comfort: 0.7,
        safety: 0.8,
        accessibility: 0.9,
      },
      score: 0.85,
    },
    // Add more mock routes as needed
  ];
  
  return mockRoutes;
};

// Example transport modes with their characteristic vectors
export const transportModes: Record<string, TransportMode> = {
  subway: {
    id: 'subway',
    name: 'Subway',
    vector: {
      time: 0.7, // Relatively fast
      cost: 0.9, // Low cost
      comfort: 0.5, // Medium comfort
      safety: 0.8, // Relatively safe
      accessibility: 0.7, // Medium accessibility
    },
  },
  bus: {
    id: 'bus',
    name: 'Bus',
    vector: {
      time: 0.5, // Medium speed
      cost: 0.9, // Low cost
      comfort: 0.6, // Medium comfort
      safety: 0.8, // Relatively safe
      accessibility: 0.8, // Good accessibility
    },
  },
  ebike: {
    id: 'ebike',
    name: 'E-Bike',
    vector: {
      time: 0.6, // Decent speed
      cost: 0.7, // Medium cost
      comfort: 0.7, // Decent comfort
      safety: 0.6, // Medium safety
      accessibility: 0.5, // Medium accessibility
    },
  },
  taxi: {
    id: 'taxi',
    name: 'Taxi',
    vector: {
      time: 0.8, // Fast
      cost: 0.3, // Expensive
      comfort: 0.9, // Very comfortable
      safety: 0.9, // Very safe
      accessibility: 0.8, // Good accessibility
    },
  },
  uber: {
    id: 'uber',
    name: 'Uber',
    vector: {
      time: 0.8, // Fast
      cost: 0.3, // Expensive
      comfort: 0.9, // Very comfortable
      safety: 0.8, // Safe
      accessibility: 0.8, // Good accessibility
    },
  },
  walk: {
    id: 'walk',
    name: 'Walk',
    vector: {
      time: 0.2, // Slow
      cost: 1.0, // Free
      comfort: 0.7, // Decent comfort (weather dependent)
      safety: 0.7, // Relatively safe (area dependent)
      accessibility: 0.6, // Medium accessibility
    },
  },
}; 