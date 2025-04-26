import type { NextApiRequest, NextApiResponse } from 'next';

// NYC neighborhood and landmark data
const nycLocations = [
  // Manhattan
  'Manhattan', 'Times Square', 'Central Park', 'Empire State Building', 'Rockefeller Center',
  'Greenwich Village', 'SoHo', 'Chinatown', 'Little Italy', 'Tribeca', 'Financial District',
  'Lower East Side', 'Upper East Side', 'Upper West Side', 'Harlem', 'Washington Heights',
  'Inwood', 'Battery Park', 'Chelsea', 'Hell\'s Kitchen', 'Midtown', 'Columbus Circle',
  'Grand Central Terminal', 'Penn Station', 'Union Square', 'Madison Square Garden',
  'World Trade Center', '5th Avenue', 'Museum Mile', 'Lincoln Center',
  
  // Brooklyn
  'Brooklyn', 'Williamsburg', 'Park Slope', 'DUMBO', 'Bushwick', 'Greenpoint', 'Bedford-Stuyvesant',
  'Crown Heights', 'Prospect Park', 'Brooklyn Heights', 'Coney Island', 'Bay Ridge',
  'Flatbush', 'Bensonhurst', 'Brighton Beach', 'Canarsie', 'Sunset Park', 'Dyker Heights',
  'Boerum Hill', 'Fort Greene', 'Barclays Center', 'Brooklyn Museum', 'Brooklyn Botanic Garden',
  
  // Queens
  'Queens', 'Flushing', 'Astoria', 'Long Island City', 'Jackson Heights', 'Forest Hills',
  'Jamaica', 'Bayside', 'Elmhurst', 'Woodside', 'Sunnyside', 'Rego Park', 'Corona',
  'Kew Gardens', 'Far Rockaway', 'JFK Airport', 'LaGuardia Airport', 'Flushing Meadows',
  'Main Street', 'Queens Center Mall', 'Citi Field', 'USTA Billie Jean King National Tennis Center',
  
  // Bronx
  'Bronx', 'Riverdale', 'Fordham', 'Pelham Bay', 'Morris Heights', 'Parkchester',
  'Throgs Neck', 'Yankee Stadium', 'Bronx Zoo', 'New York Botanical Garden',
  'Arthur Avenue', 'Co-op City', 'City Island', 'Pelham Bay Park', 'Wave Hill',
  
  // Staten Island
  'Staten Island', 'St. George', 'Tompkinsville', 'Stapleton', 'New Dorp',
  'Great Kills', 'Tottenville', 'Staten Island Ferry', 'Staten Island Mall',
  'Snug Harbor Cultural Center', 'Historic Richmond Town'
];

// Common NYC street names and patterns
const streetPatterns = [
  'Broadway', 'Avenue', 'Street', 'Road', 'Lane', 'Drive', 'Boulevard', 'Parkway',
  'Plaza', 'Place', 'Court', 'Terrace', 'Way', 'Walk'
];

// Function to generate full addresses from partial input
const generateAddressSuggestions = (input: string, limit: number = 5): string[] => {
  if (!input || input.trim().length < 2) return [];
  
  const normalizedInput = input.toLowerCase().trim();
  
  // First check for exact neighborhood/landmark matches
  const exactMatches = nycLocations.filter(location => 
    location.toLowerCase().includes(normalizedInput)
  );
  
  // Generate address suggestions for numeric inputs (likely street addresses)
  let streetAddresses: string[] = [];
  if (/\d/.test(normalizedInput)) {
    // Extract number patterns if they exist
    const numberMatch = normalizedInput.match(/\d+/);
    if (numberMatch) {
      const number = numberMatch[0];
      // Generate some plausible street addresses with that number
      for (const pattern of streetPatterns) {
        // If the input includes the pattern, prioritize those
        if (normalizedInput.includes(pattern.toLowerCase())) {
          // Extract what might be a street name
          const parts = normalizedInput.split(' ');
          let streetName = '';
          for (let i = 0; i < parts.length; i++) {
            if (parts[i].toLowerCase().includes(pattern.toLowerCase()) && i > 0) {
              streetName = parts[i-1] + ' ' + parts[i];
              break;
            }
          }
          
          if (streetName) {
            // Add specific match first
            streetAddresses.push(`${number} ${streetName}, New York, NY`);
            continue;
          }
        }
        
        // Add some common streets with patterns from the input
        const randomLocation = nycLocations[Math.floor(Math.random() * nycLocations.length)];
        streetAddresses.push(`${number} ${pattern}, ${randomLocation}, New York, NY`);
      }
    }
  }
  
  // If we have neighborhood/landmark matches, mix them with some street addresses
  if (exactMatches.length > 0) {
    const combinedResults = [
      ...exactMatches.map(match => `${match}, New York, NY`),
      ...streetAddresses
    ];
    
    // Remove duplicates and limit results
    return [...new Set(combinedResults)].slice(0, limit);
  }
  
  // If no exact matches, return potential street addresses
  return streetAddresses.slice(0, limit);
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Query parameter is required' });
  }
  
  const suggestions = generateAddressSuggestions(query);
  
  res.status(200).json({ suggestions });
} 