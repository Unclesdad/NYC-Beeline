import { useState } from 'react';
import { useRouter } from 'next/router';

interface HospitalLocation {
  name: string;
  location: [number, number];
  address: string;
}

// NYC hospital locations
const NYC_HOSPITALS: HospitalLocation[] = [
  { name: "NYU Langone Medical Center", location: [40.7421, -73.9739], address: "550 1st Ave, New York, NY 10016" },
  { name: "Mount Sinai Hospital", location: [40.7900, -73.9526], address: "1 Gustave L. Levy Pl, New York, NY 10029" },
  { name: "NewYork-Presbyterian Hospital", location: [40.7644, -73.9554], address: "525 E 68th St, New York, NY 10065" },
  { name: "Bellevue Hospital Center", location: [40.7392, -73.9766], address: "462 1st Ave, New York, NY 10016" },
  { name: "NYC Health + Hospitals/Kings County", location: [40.6553, -73.9449], address: "451 Clarkson Ave, Brooklyn, NY 11203" },
  { name: "Maimonides Medical Center", location: [40.6364, -73.9986], address: "4802 10th Ave, Brooklyn, NY 11219" },
  { name: "NYC Health + Hospitals/Elmhurst", location: [40.7444, -73.8803], address: "79-01 Broadway, Elmhurst, NY 11373" },
  { name: "NYC Health + Hospitals/Queens", location: [40.7106, -73.8250], address: "82-68 164th St, Jamaica, NY 11432" },
  { name: "NYC Health + Hospitals/Lincoln", location: [40.8161, -73.9262], address: "234 E 149th St, Bronx, NY 10451" },
  { name: "Montefiore Medical Center", location: [40.8810, -73.8781], address: "111 E 210th St, Bronx, NY 10467" },
  { name: "Staten Island University Hospital", location: [40.5847, -74.0875], address: "475 Seaview Ave, Staten Island, NY 10305" }
];

interface EmergencyButtonProps {
  userLocation?: [number, number]; // Current user location if available
  onRouteToHospital?: (hospital: HospitalLocation) => void; // Optional callback for parent components
}

const EmergencyButton = ({ userLocation, onRouteToHospital }: EmergencyButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nearestHospital, setNearestHospital] = useState<HospitalLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula to calculate distance between two points on Earth
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Find nearest hospital based on user location
  const findNearestHospital = async () => {
    setIsLoading(true);
    
    try {
      // Get user location if not provided
      let userCoords = userLocation;
      
      if (!userCoords) {
        // Try to get current location from browser API
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          
          userCoords = [position.coords.latitude, position.coords.longitude];
        } else {
          // Default to Times Square if geolocation not available
          userCoords = [40.7580, -73.9855];
        }
      }
      
      // Find nearest hospital
      let nearest: HospitalLocation | null = null;
      let minDistance = Number.MAX_VALUE;
      
      NYC_HOSPITALS.forEach(hospital => {
        const distance = calculateDistance(
          userCoords![0], userCoords![1], 
          hospital.location[0], hospital.location[1]
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearest = hospital;
        }
      });
      
      setNearestHospital(nearest);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error finding nearest hospital:", error);
      alert("Unable to determine your location. Please enable location services.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle routing to the hospital
  const handleRouteToHospital = () => {
    if (!nearestHospital) return;
    
    if (onRouteToHospital) {
      // Use callback if provided
      onRouteToHospital(nearestHospital);
    } else {
      // Default behavior: navigate to route planner with destination set to hospital
      let currentLocation = router.query.from || "";
      
      // If no from location in the URL, use the browser's geolocation to generate a location string
      if (!currentLocation) {
        if (userLocation) {
          currentLocation = `${userLocation[0]},${userLocation[1]}`;
        } else {
          currentLocation = "Your Location";
        }
      }
      
      router.push(`/route-planner?from=${encodeURIComponent(String(currentLocation))}&to=${encodeURIComponent(nearestHospital.name)}&priority=speed&noise=moderate&safety=high`);
    }
    
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Emergency Button */}
      <button
        onClick={findNearestHospital}
        className="fixed right-6 bottom-24 z-50 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
        aria-label="Emergency"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mr-3"></div>
            <p className="text-gray-800">Finding nearest hospital...</p>
          </div>
        </div>
      )}
      
      {/* Hospital Info Modal */}
      {isModalOpen && nearestHospital && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Emergency Services</h3>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">{nearestHospital.name}</h4>
              <p className="text-gray-600 mb-2">{nearestHospital.address}</p>
              <div className="flex items-center text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">Emergency Room Available</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRouteToHospital}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition duration-150 ease-in-out"
              >
                Route Me There
              </button>
              
              <a
                href={`tel:911`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-150 ease-in-out text-center"
              >
                Call 911
              </a>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              In case of a life-threatening emergency, please call 911 immediately.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencyButton; 