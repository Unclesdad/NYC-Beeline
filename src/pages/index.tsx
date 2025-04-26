import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '@/components/Layout';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function Home() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [priority, setPriority] = useState('balanced');
  const [noisePreference, setNoisePreference] = useState('moderate');
  const [safetyPreference, setSafetyPreference] = useState('moderate');
  const [bagCount, setBagCount] = useState(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination) {
      router.push(`/routes?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&priority=${priority}&noise=${noisePreference}&safety=${safetyPreference}&bags=${bagCount}`);
    }
  };

  return (
    <Layout currentPage="home">
      <AnimatedBackground theme="honey" intensity="medium">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
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
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="origin"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Enter your starting location"
                        className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-honey-500 focus:border-honey-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                      Destination
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Enter your destination"
                        className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-honey-500 focus:border-honey-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {showPreferences ? (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          What is your priority?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            className={`border rounded-md px-3 py-2 cursor-pointer text-center text-sm ${priority === 'speed' ? 'bg-honey-50 border-honey-500 text-honey-700' : 'border-gray-300 hover:bg-gray-50'}`}
                            onClick={() => setPriority('speed')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Speed
                          </div>
                          <div 
                            className={`border rounded-md px-3 py-2 cursor-pointer text-center text-sm ${priority === 'cost' ? 'bg-honey-50 border-honey-500 text-honey-700' : 'border-gray-300 hover:bg-gray-50'}`}
                            onClick={() => setPriority('cost')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Cost
                          </div>
                          <div 
                            className={`border rounded-md px-3 py-2 cursor-pointer text-center text-sm ${priority === 'comfort' ? 'bg-honey-50 border-honey-500 text-honey-700' : 'border-gray-300 hover:bg-gray-50'}`}
                            onClick={() => setPriority('comfort')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            Comfort
                          </div>
                          <div 
                            className={`border rounded-md px-3 py-2 cursor-pointer text-center text-sm ${priority === 'balanced' ? 'bg-honey-50 border-honey-500 text-honey-700' : 'border-gray-300 hover:bg-gray-50'}`}
                            onClick={() => setPriority('balanced')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                            Balanced
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          How sensitive are you to noise?
                        </label>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Low</span>
                          <div className="relative w-full mx-3">
                            <div className="h-1 bg-gray-200 rounded-full">
                              <div className="absolute h-5 w-5 rounded-full bg-honey-500 -mt-2 transform -translate-x-1/2 cursor-pointer"
                                  style={{ left: noisePreference === 'low' ? '20%' : noisePreference === 'moderate' ? '50%' : '80%' }}
                                  onClick={() => {
                                    const nextPreference = noisePreference === 'low' ? 'moderate' : 
                                                          noisePreference === 'moderate' ? 'high' : 'low';
                                    setNoisePreference(nextPreference);
                                  }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">High</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          How important is area safety?
                        </label>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Low</span>
                          <div className="relative w-full mx-3">
                            <div className="h-1 bg-gray-200 rounded-full">
                              <div className="absolute h-5 w-5 rounded-full bg-honey-500 -mt-2 transform -translate-x-1/2 cursor-pointer"
                                  style={{ left: safetyPreference === 'low' ? '20%' : safetyPreference === 'moderate' ? '50%' : '80%' }}
                                  onClick={() => {
                                    const nextPreference = safetyPreference === 'low' ? 'moderate' : 
                                                          safetyPreference === 'moderate' ? 'high' : 'low';
                                    setSafetyPreference(nextPreference);
                                  }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">High</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          How many bags are you carrying?
                        </label>
                        <div className="flex items-center">
                          <button 
                            type="button"
                            className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-honey-50 hover:border-honey-300"
                            onClick={() => setBagCount(Math.max(0, bagCount - 1))}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <div className="mx-4 font-medium w-8 text-center">{bagCount}</div>
                          <button 
                            type="button"
                            className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-honey-50 hover:border-honey-300"
                            onClick={() => setBagCount(Math.min(5, bagCount + 1))}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
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
              <h2 className="text-3xl font-extrabold text-gray-900">Why NYC Beeline?</h2>
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
    </Layout>
  );
} 