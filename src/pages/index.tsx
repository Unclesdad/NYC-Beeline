import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';

export default function Home() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination) {
      router.push(`/routes?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`);
    }
  };

  return (
    <Layout currentPage="home">
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                Find your optimal <span className="text-primary-600">path</span> across NYC
              </h2>
              <p className="mt-5 text-xl text-gray-500">
                NYC Beeline uses real-time data to find the most efficient routes between boroughs, 
                combining multiple transportation modes to save you time, money, and frustration.
              </p>
              
              <div className="mt-8 rounded-lg bg-white shadow-lg p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
                      Starting Point
                    </label>
                    <input
                      type="text"
                      id="origin"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="Enter your starting location"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                      Destination
                    </label>
                    <input
                      type="text"
                      id="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Enter your destination"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-md transition duration-150 ease-in-out"
                  >
                    Find Routes
                  </button>
                </form>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="h-64 bg-gray-300 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">Compare Routes Intelligently</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Our algorithm analyzes multiple factors—time, cost, comfort, and accessibility—to recommend the best routes tailored to your needs.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Real-Time Data</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Get up-to-date information on transit schedules, delays, and congestion.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-secondary-500 text-white mb-4">
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
        
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">Why NYC Beeline?</h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Inter-borough travel in NYC can be challenging. We're here to make it easier.
              </p>
            </div>
            
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white rounded-lg shadow-lg p-6">
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
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-warning text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 01-.75.75h-.75" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Cost Savings</h3>
                <p className="mt-4 text-base text-gray-600">
                  Find the most affordable way to get from point A to point B without compromising on quality or speed.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Comfort Priority</h3>
                <p className="mt-4 text-base text-gray-600">
                  Balance speed with comfort by finding routes that consider crowding, accessibility, and convenience.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
} 