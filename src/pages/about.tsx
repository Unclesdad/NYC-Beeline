import Layout from '@/components/Layout';

export default function About() {
  return (
    <Layout 
      title="About NYC Beeline | Smart Inter-Borough Transit"
      description="Learn about NYC Beeline and our mission to improve long-distance transit between New York City boroughs."
      currentPage="about"
    >
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8 md:p-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">About NYC Beeline</h1>
            
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-700 mb-4">
                NYC Beeline was created to address the common challenges of inter-borough travel in New York City. 
                While intra-borough trips are relatively convenient, traveling longer distances between boroughs 
                often presents significant obstacles:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Longer waiting periods between buses and subway trains</li>
                <li>Routes often congested due to traffic and overcrowding</li>
                <li>Higher costs for taxi/rideshare options for longer distances</li>
                <li>Limited information about multi-modal options</li>
              </ul>
              <p className="text-gray-700">
                Our mission is to make inter-borough travel faster, cheaper, and more comfortable by 
                providing intelligent route recommendations that combine multiple transportation modes.
              </p>
            </section>
            
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
              <p className="text-gray-700 mb-4">
                NYC Beeline uses a sophisticated linear algebra approach to calculate the optimal combination 
                of transportation modes for your journey:
              </p>
              
              <div className="space-y-6 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-500 text-white font-medium">
                      1
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Real-Time Data Collection</h3>
                    <p className="mt-1 text-gray-700">
                      We pull real-time information from NYC transportation providers, including the MTA, 
                      Citi Bike, Uber, Lyft, and taxi services.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-500 text-white font-medium">
                      2
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Vector-Based Optimization</h3>
                    <p className="mt-1 text-gray-700">
                      Each transportation option is represented as a vector with dimensions for time, cost, 
                      comfort, safety, and accessibility. We compare these against an "ideal vector" to 
                      calculate the best routes.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-500 text-white font-medium">
                      3
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Multimodal Combinations</h3>
                    <p className="mt-1 text-gray-700">
                      Rather than only considering a single mode of transportation, we calculate the optimal 
                      combinations (e.g., subway to bus, or e-bike to subway) to create the best end-to-end journey.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-500 text-white font-medium">
                      4
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Personalized Recommendations</h3>
                    <p className="mt-1 text-gray-700">
                      The top 3 route options are presented to you with detailed information about timing, 
                      cost, and comfort levels, allowing you to choose the option that best fits your needs.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Math Behind It</h3>
                <p className="text-gray-700">
                  At its core, our algorithm calculates a dot product between normalized transportation vectors 
                  and an ideal vector. This approach allows us to consider multiple factors simultaneously and 
                  find the optimal linear combination of transportation modes that minimizes time and cost while 
                  maximizing comfort, safety, and accessibility.
                </p>
              </div>
            </section>
            
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Transportation Modes</h2>
              <p className="text-gray-700 mb-4">
                NYC Beeline currently integrates the following modes of transportation:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full bg-blue-500 text-white mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Subway</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    We track all MTA subway lines, including real-time arrival information, delays, 
                    and crowding data when available.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full bg-green-500 text-white mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4 5v3m-4-3v3M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Bus</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Our platform includes all MTA bus routes across the five boroughs, with particular 
                    attention to express and Select Bus Service routes.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full bg-purple-500 text-white mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">E-Bike</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    We integrate with Citi Bike and other e-bike providers to include bike station locations 
                    and availability in our route calculations.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full bg-yellow-500 text-white mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-6 0h6m-6 4v10m6-10v10m-6-10v.01M14 7v.01M5.3 15h13.4a1 1 0 011 1v3a1 1 0 01-1 1H5.3a1 1 0 01-1-1v-3a1 1 0 011-1z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Taxi & Rideshare</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    For longer distances or when other options are limited, we include taxi and rideshare 
                    options (Uber, Lyft) with estimated wait times and costs.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Team</h2>
              <p className="text-gray-700 mb-6">
                NYC Beeline was created by a team of New Yorkers who were frustrated with the challenges 
                of inter-borough travel. With backgrounds in technology, transportation engineering, and 
                urban planning, we're committed to making NYC more accessible for everyone.
              </p>
              
              <div className="text-center">
                <a href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  Try NYC Beeline Now
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
    </Layout>
  );
} 