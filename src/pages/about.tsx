import { NextPage } from 'next';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';

const About: NextPage = () => {
  return (
    <Layout currentPage="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">About NYC Beeline</h1>
            
            <div className="prose prose-honey max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                NYC Beeline is a modern transit routing application designed to help New Yorkers and visitors 
                navigate the city's complex transportation system with ease. Our mission is to provide personalized 
                route recommendations that take into account your specific needs and preferences.
              </p>
              
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Features</h2>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-honey-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <strong className="text-gray-900">Personalized Routes</strong>
                    <p className="text-gray-700">
                      Choose your priority (speed, cost, comfort, or balanced) and get routes tailored to your needs.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-honey-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <strong className="text-gray-900">Accessibility Options</strong>
                    <p className="text-gray-700">
                      Find wheelchair accessible routes and options that prioritize seating availability.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-honey-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <strong className="text-gray-900">Interactive Maps</strong>
                    <p className="text-gray-700">
                      Visualize your journey with our detailed maps that show the exact route for each transportation mode.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-honey-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <strong className="text-gray-900">Comfort Ratings</strong>
                    <p className="text-gray-700">
                      See detailed comfort and quality ratings for each route option to help you make an informed decision.
                    </p>
                  </div>
                </li>
              </ul>
              
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How It Works</h2>
              
              <p className="text-gray-700 mb-4">
                NYC Beeline combines real-time transit data with user preferences to create optimal routes that balance 
                your priorities. Our algorithm considers factors like:
              </p>
              
              <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-6">
                <li>Current traffic conditions and transit delays</li>
                <li>Wheelchair accessibility of stations and vehicles</li>
                <li>Expected crowding and seat availability</li>
                <li>Your sensitivity to noise and safety preferences</li>
                <li>The importance of having a seat during your journey</li>
                <li>Environmental impact of different transportation options</li>
              </ul>
              
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Team</h2>
              
              <p className="text-gray-700 mb-6">
                NYC Beeline was created by a team of transit enthusiasts who believe that getting around New York City
                should be easy and enjoyable for everyone. Our diverse team of engineers, designers, and urban planning
                experts are committed to continuously improving the app based on user feedback.
              </p>
              
              <div className="mt-10 border-t border-gray-200 pt-8">
                <Link href="/" className="inline-flex items-center text-honey-600 hover:text-honey-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About; 