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
  'Yankee Stadium': [40.8296, -73.9262],
};

// Helper function to get coordinates from a location string
const getCoordinates = (location: string): [number, number] => {
  for (const [name, coords] of Object.entries(locationCoordinates)) {
    if (location.toLowerCase().includes(name.toLowerCase())) {
      return coords;
    }
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: 'Origin and destination are required' });
  }

  try {
    // In a real app, we would use geocoding to get coordinates
    const fromCoords = getCoordinates(from as string);
    const toCoords = getCoordinates(to as string);
    
    // Calculate distance
    const distance = calculateDistance(
      fromCoords[0], fromCoords[1], 
      toCoords[0], toCoords[1]
    );

    // Get real-time transit data
    // In a real app, we would process this data to find optimal routes
    // Here we'll just use mock data
    const subwayStatus = await transitAPI.getSubwayStatus();
    
    // Mock route response - in a real app this would use real data and our algorithm
    const mockRoutes = [
      {
        id: '1',
        name: 'Fastest Route',
        duration: Math.round(distance * 10), // ~6 min per mile for fastest route
        cost: parseFloat((2.75 + (distance > 5 ? 3 : 0)).toFixed(2)), // $2.75 for subway, extra for long distances
        comfort: distance < 8 ? 'medium' : 'low', // Longer routes less comfortable
        vectorScore: 0.89,
        segments: [
          {
            mode: 'walk',
            startLocation: from as string,
            endLocation: `Subway Station near ${from}`,
            duration: 5,
            cost: 0,
          },
          {
            mode: 'subway',
            startLocation: `Subway Station near ${from}`,
            endLocation: `Subway Station near ${to}`,
            duration: Math.round(distance * 8), // Estimate subway time
            cost: 2.75,
            lineInfo: distance < 10 ? 'Express Train' : 'Local Train',
          },
          {
            mode: 'walk',
            startLocation: `Subway Station near ${to}`,
            endLocation: to as string,
            duration: 7,
            cost: 0,
          },
        ],
      },
      {
        id: '2',
        name: 'Most Comfortable Route',
        duration: Math.round(distance * 12), // Bit slower but more comfortable
        cost: parseFloat((distance * 2.5).toFixed(2)), // More expensive
        comfort: 'high',
        vectorScore: 0.78,
        segments: [
          {
            mode: 'walk',
            startLocation: from as string,
            endLocation: `Pickup Point near ${from}`,
            duration: 3,
            cost: 0,
          },
          {
            mode: 'uber',
            startLocation: `Pickup Point near ${from}`,
            endLocation: `Drop-off near ${to}`,
            duration: Math.round(distance * 10),
            cost: parseFloat((distance * 2.5).toFixed(2)),
          },
          {
            mode: 'walk',
            startLocation: `Drop-off near ${to}`,
            endLocation: to as string,
            duration: 4,
            cost: 0,
          },
        ],
      },
      {
        id: '3',
        name: 'Cheapest Route',
        duration: Math.round(distance * 15), // Slower but cheaper
        cost: 2.75, // Just subway fare
        comfort: 'low',
        vectorScore: 0.71,
        segments: [
          {
            mode: 'walk',
            startLocation: from as string,
            endLocation: `Subway Station near ${from}`,
            duration: 10,
            cost: 0,
          },
          {
            mode: 'subway',
            startLocation: `Subway Station near ${from}`,
            endLocation: `Transfer Station`,
            duration: Math.round(distance * 6),
            cost: 2.75,
            lineInfo: 'Local Train',
          },
          {
            mode: 'subway',
            startLocation: 'Transfer Station',
            endLocation: `Subway Station near ${to}`,
            duration: Math.round(distance * 6),
            cost: 0, // Free transfer
            lineInfo: 'Local Train',
          },
          {
            mode: 'walk',
            startLocation: `Subway Station near ${to}`,
            endLocation: to as string,
            duration: 12,
            cost: 0,
          },
        ],
      },
    ];

    return res.status(200).json({ 
      routes: mockRoutes,
      distance,
      fromCoords,
      toCoords,
    });
  } catch (error) {
    console.error('Error calculating routes:', error);
    return res.status(500).json({ message: 'Error calculating routes' });
  }
} 