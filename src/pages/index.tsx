import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '@/components/Layout';
import AnimatedBackground from '@/components/AnimatedBackground';
import axios from 'axios';
import EmergencyButton from '@/components/EmergencyButton';

// Custom styles for range sliders across browsers
const sliderStyles = `
  .slider {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 5px;
    background: #e5e7eb;
    outline: none;
    margin: 10px 0;
    position: relative;
  }

  /* Create a filled effect for the track */
  .slider {
    background: linear-gradient(to right, #f59e0b 0%, #f59e0b 50%, #e5e7eb 50%, #e5e7eb 100%);
    background-size: 200% 100%;
    transition: background-position 0.1s ease;
  }

  .slider[data-value="0"] { background-position: 100% 0; }
  .slider[data-value="10"] { background-position: 90% 0; }
  .slider[data-value="20"] { background-position: 80% 0; }
  .slider[data-value="30"] { background-position: 70% 0; }
  .slider[data-value="40"] { background-position: 60% 0; }
  .slider[data-value="50"] { background-position: 50% 0; }
  .slider[data-value="60"] { background-position: 40% 0; }
  .slider[data-value="70"] { background-position: 30% 0; }
  .slider[data-value="80"] { background-position: 20% 0; }
  .slider[data-value="90"] { background-position: 10% 0; }
  .slider[data-value="100"] { background-position: 0% 0; }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f59e0b;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    margin-top: -6px; /* Center the thumb on the track */
    z-index: 2;
    position: relative;
  }

  .slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f59e0b;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    z-index: 2;
    position: relative;
  }

  .slider::-ms-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f59e0b;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    margin-top: 0;
    z-index: 2;
    position: relative;
  }

  .slider::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 5px;
    background: transparent;
  }

  .slider::-moz-range-track {
    height: 6px;
    border-radius: 5px;
    background: transparent;
  }

  .slider::-ms-track {
    height: 6px;
    border-radius: 5px;
    background: transparent;
  }
  
  /* Container styles */
  .slider-container {
    position: relative;
    margin: 0 10px;
    width: 100%;
  }
  
  .preference-label {
    display: inline-block;
    font-size: 0.875rem;
    margin-left: 4px;
    color: #4b5563;
  }
`;

export default function Home() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [showPreferences, setShowPreferences] = useState(true);
  const [priority, setPriority] = useState('balanced');
  const [noisePreference, setNoisePreference] = useState('moderate');
  const [safetyPreference, setSafetyPreference] = useState('moderate');
  const [noiseValue, setNoiseValue] = useState(50);
  const [safetyValue, setSafetyValue] = useState(50);
  const [bagCount, setBagCount] = useState(0);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [elevationPreference, setElevationPreference] = useState('moderate');
  
  // New state for address suggestions
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  
  // Refs for handling outside clicks
  const originInputRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLDivElement>(null);
  
  // Fetch address suggestions
  const fetchAddressSuggestions = async (input: string, type: 'origin' | 'destination') => {
    if (input.length < 2) {
      type === 'origin' ? setOriginSuggestions([]) : setDestinationSuggestions([]);
      return;
    }
    
    try {
      const response = await axios.get(`/api/address-suggestions?query=${encodeURIComponent(input)}`);
      if (response.data && response.data.suggestions) {
        type === 'origin' ? setOriginSuggestions(response.data.suggestions) : setDestinationSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch address suggestions:', error);
    }
  };
  
  // Handle input changes
  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrigin(value);
    fetchAddressSuggestions(value, 'origin');
    setShowOriginSuggestions(true);
  };
  
  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestination(value);
    fetchAddressSuggestions(value, 'destination');
    setShowDestinationSuggestions(true);
  };
  
  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOrigin(suggestion);
      setShowOriginSuggestions(false);
    } else {
      setDestination(suggestion);
      setShowDestinationSuggestions(false);
    }
  };
  
  // Close suggestion dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originInputRef.current && !originInputRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false);
      }
      if (destinationInputRef.current && !destinationInputRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update string preferences when slider values change
  useEffect(() => {
    if (noiseValue < 33) {
      setNoisePreference('low');
    } else if (noiseValue < 67) {
      setNoisePreference('moderate');
    } else {
      setNoisePreference('high');
    }
  }, [noiseValue]);

  useEffect(() => {
    if (safetyValue < 33) {
      setSafetyPreference('low');
    } else if (safetyValue < 67) {
      setSafetyPreference('moderate');
    } else {
      setSafetyPreference('high');
    }
  }, [safetyValue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination) {
      router.push(`/route-planner?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&priority=${priority}&noise=${noisePreference}&safety=${safetyPreference}&bags=${bagCount}&wheelchair=${wheelchairAccessible}&elevation=${elevationPreference}`);
    }
  };

  return (
    <Layout currentPage="home">
      <style jsx global>{sliderStyles}</style>
      <AnimatedBackground theme="honey" intensity="medium" pattern="hexagon">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                Find your optimal <span className="text-honey-600">path</span> across NYC
              </h2>
              <p className="mt-5 text-xl text-gray-500">
                NYC Beeline uses real-time data to find the most efficient routes between boroughs, 
                combining multiple transportation modes to save you time, money, and frustration.
              </p>
              
              <div className="mt-8 rounded-lg bg-white shadow-lg p-6 backdrop-blur-sm bg-white/90">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
                      Starting Point
                    </label>
                    <div ref={originInputRef} className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="origin"
                        value={origin}
                        onChange={handleOriginChange}
                        onFocus={() => setShowOriginSuggestions(true)}
                        placeholder="Enter your starting location"
                        className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-honey-500 focus:border-honey-500"
                        required
                      />
                      {showOriginSuggestions && originSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                          {originSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                              onClick={() => handleSuggestionSelect(suggestion, 'origin')}
                            >
                              <span className="block truncate">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                      Destination
                    </label>
                    <div ref={destinationInputRef} className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="destination"
                        value={destination}
                        onChange={handleDestinationChange}
                        onFocus={() => setShowDestinationSuggestions(true)}
                        placeholder="Enter your destination"
                        className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-honey-500 focus:border-honey-500"
                        required
                      />
                      {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                          {destinationSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                              onClick={() => handleSuggestionSelect(suggestion, 'destination')}
                            >
                              <span className="block truncate">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {showPreferences ? (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <div className="mb-4">
                        <label htmlFor="priority" className="block text-gray-700 font-medium mb-2">Priority</label>
                        <div className="relative">
                          <select
                            id="priority"
                            name="priority"
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500 bg-white pr-10"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                          >
                            <option value="balanced">Balanced</option>
                            <option value="speed">Speed</option>
                            <option value="cost">Cost</option>
                            <option value="comfort">Comfort</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Sound Sensitivity</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="noise"
                              value="low"
                              checked={noisePreference === 'low'}
                              onChange={() => setNoisePreference('low')}
                              className="h-4 w-4 text-honey-600 focus:ring-honey-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Low</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="noise"
                              value="moderate"
                              checked={noisePreference === 'moderate'}
                              onChange={() => setNoisePreference('moderate')}
                              className="h-4 w-4 text-honey-600 focus:ring-honey-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Moderate</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="noise"
                              value="high"
                              checked={noisePreference === 'high'}
                              onChange={() => setNoisePreference('high')}
                              className="h-4 w-4 text-honey-600 focus:ring-honey-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">High</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Safety Preference</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="safety"
                              value="low"
                              checked={safetyPreference === 'low'}
                              onChange={() => setSafetyPreference('low')}
                              className="h-4 w-4 text-honey-600 focus:ring-honey-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Low</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="safety"
                              value="moderate"
                              checked={safetyPreference === 'moderate'}
                              onChange={() => setSafetyPreference('moderate')}
                              className="h-4 w-4 text-honey-600 focus:ring-honey-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Moderate</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="safety"
                              value="high"
                              checked={safetyPreference === 'high'}
                              onChange={() => setSafetyPreference('high')}
                              className="h-4 w-4 text-honey-600 focus:ring-honey-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">High</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="seatImportance" className="block text-gray-700 font-medium mb-2">How important is having a seat?</label>
                        <div className="relative">
                          <select
                            id="seatImportance"
                            name="seatImportance"
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500 bg-white pr-10"
                            value={bagCount}
                            onChange={(e) => setBagCount(parseInt(e.target.value))}
                          >
                            <option value="0">Not important</option>
                            <option value="1">Somewhat important</option>
                            <option value="2">Very important</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="wheelchair"
                            checked={wheelchairAccessible}
                            onChange={(e) => setWheelchairAccessible(e.target.checked)}
                            className="h-4 w-4 text-honey-600 focus:ring-honey-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-gray-700">Wheelchair accessible route</span>
                        </label>
                      </div>
                      
                      <button
                        type="button"
                        className="text-sm text-honey-600 hover:text-honey-500 font-medium"
                        onClick={() => setShowPreferences(false)}
                      >
                        Hide Preferences
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-sm text-honey-600 hover:text-honey-500 font-medium"
                      onClick={() => setShowPreferences(true)}
                    >
                      Show Travel Preferences
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    className="w-full bg-honey-600 hover:bg-honey-700 text-white font-bold py-3 px-4 rounded-md transition duration-150 ease-in-out"
                  >
                    Find Routes
                  </button>
                  
                  <div className="text-xs text-gray-500 text-center pt-2">
                    Try searching: Manhattan to Brooklyn, Flushing to Times Square, or Bayside to Bronx
                  </div>
                </form>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden">
                <div className="h-72 w-full relative">
                  <Image
                    src="/images/nyc-map.svg"
                    alt="NYC Map with Transit Routes"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">Compare Routes Intelligently</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Our algorithm analyzes multiple factors—time, cost, comfort, and accessibility—to recommend the best routes tailored to your needs.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-honey-500 text-white mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Real-Time Data</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Get up-to-date information on transit schedules, delays, and congestion.
                  </p>
                </div>
                
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-honey-600 text-white mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Multi-Modal</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Combine buses, subway, e-bikes, taxis, and more for optimal journeys.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-white/70 backdrop-blur-sm py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">Optimize your path</h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Inter-borough travel in NYC can be challenging. We're here to make it easier.
              </p>
            </div>
            
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 transition-transform hover:scale-105">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-success text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 01-.75.75h-.75m-6-1.5H4.5m0 0l6.75 1.5m0-1.5l-6.75-1.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Time Efficiency</h3>
                <p className="mt-4 text-base text-gray-600">
                  Reduce your travel time by finding optimized routes that avoid congestion and minimize transfers.
                </p>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 transition-transform hover:scale-105">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-warning text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Cost Savings</h3>
                <p className="mt-4 text-base text-gray-600">
                  Save money with route options that balance cost against time and convenience.
                </p>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 transition-transform hover:scale-105">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-info text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Local Expertise</h3>
                <p className="mt-4 text-base text-gray-600">
                  Benefit from insider knowledge of NYC's transit system, including lesser-known transfer points and shortcuts.
                </p>
              </div>
            </div>
          </div>
        </section>
      </AnimatedBackground>
      
      {/* Emergency Button */}
      <EmergencyButton 
        onRouteToHospital={(hospital) => {
          router.push(`/route-planner?from=${encodeURIComponent(origin || 'Your Location')}&to=${encodeURIComponent(hospital.name)}&priority=speed&noise=moderate&safety=high`);
        }}
      />
    </Layout>
  );
} 