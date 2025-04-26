import { useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

// FAQ item type
interface FAQItem {
  question: string;
  answer: string;
}

// FAQ sections
interface FAQSection {
  title: string;
  items: FAQItem[];
}

export default function FAQs() {
  // Track which FAQ items are open
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Toggle FAQ item
  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // FAQ data organized by sections
  const faqSections: FAQSection[] = [
    {
      title: "About NYC Beeline",
      items: [
        {
          question: "What is NYC Beeline?",
          answer: "NYC Beeline is a web application that helps users find the most efficient routes for inter-borough travel in New York City. It analyzes real-time data from multiple transit modes (subway, bus, e-bike, taxi, Uber) and recommends optimal combinations to save you time, money, and frustration."
        },
        {
          question: "How is NYC Beeline different from other transit apps?",
          answer: "Unlike most transit apps that focus on a single mode of transportation, NYC Beeline analyzes and combines multiple transit modes to create optimal routes. Our unique vector-based algorithm considers time, cost, comfort, safety, and accessibility simultaneously to recommend the best options for your specific journey."
        },
        {
          question: "Is NYC Beeline free to use?",
          answer: "Yes, NYC Beeline is completely free to use. We believe in making transit information accessible to everyone."
        }
      ]
    },
    {
      title: "Using the Service",
      items: [
        {
          question: "How do I use NYC Beeline?",
          answer: "Simply enter your starting location and destination on our homepage. NYC Beeline will calculate and display the top route options, showing you the estimated time, cost, and comfort level for each. You can then select a route to view detailed step-by-step directions and a map visualization."
        },
        {
          question: "Does NYC Beeline work for all locations in NYC?",
          answer: "NYC Beeline works for all five boroughs of New York City: Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. It's specifically designed to optimize inter-borough travel, but it also works for intra-borough trips."
        },
        {
          question: "Can I specify preferences for my trip?",
          answer: "Currently, we automatically show you a range of options optimized for different factors (fastest route, most comfortable route, cheapest route). In future updates, we plan to add more customization options so you can prioritize specific factors based on your preferences."
        }
      ]
    },
    {
      title: "Transit Data",
      items: [
        {
          question: "Where does NYC Beeline get its transit data?",
          answer: "NYC Beeline uses data from various sources, including the MTA (for subway and bus information), Citi Bike (for e-bike availability), and rideshare companies like Uber. We combine these data sources with our proprietary routing algorithm to create optimal multi-modal routes."
        },
        {
          question: "How accurate is the transit information?",
          answer: "We strive to provide the most accurate information possible by using real-time data from transit providers. However, transit conditions can change rapidly, especially during disruptions or bad weather. We recommend checking service alerts for any major disruptions."
        },
        {
          question: "Does NYC Beeline account for transit disruptions and delays?",
          answer: "Yes, when real-time delay information is available from transit providers, we incorporate it into our route calculations. This includes subway delays, bus service changes, and estimated wait times for rideshare services."
        }
      ]
    },
    {
      title: "Technical Questions",
      items: [
        {
          question: "How does the route optimization algorithm work?",
          answer: "NYC Beeline uses a vector-based optimization approach. Each transportation option is represented as a vector with dimensions for time, cost, comfort, safety, and accessibility. We calculate the dot product between these vectors and an ideal vector to score different route combinations, then present the best options to you."
        },
        {
          question: "Does NYC Beeline work on mobile devices?",
          answer: "Yes, NYC Beeline is fully responsive and works on smartphones, tablets, and desktop computers. Simply visit our website from any device with a web browser."
        },
        {
          question: "Is there a mobile app available?",
          answer: "Currently, NYC Beeline is available as a web application that works on all devices. We're considering developing native mobile apps in the future based on user demand."
        }
      ]
    },
    {
      title: "Privacy and Data",
      items: [
        {
          question: "Does NYC Beeline collect my personal information?",
          answer: "NYC Beeline only collects the information necessary to provide you with route recommendations, such as your starting location and destination. We do not track your movements or store your search history persistently. See our Privacy Policy for more details."
        },
        {
          question: "Do I need to create an account to use NYC Beeline?",
          answer: "No, you can use NYC Beeline without creating an account. In the future, we may offer optional accounts that allow you to save favorite routes and preferences."
        }
      ]
    }
  ];

  return (
    <Layout
      title="Frequently Asked Questions | NYC Beeline"
      description="Find answers to common questions about using NYC Beeline for inter-borough transit in New York City."
      currentPage="faqs"
    >
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8 md:p-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>

            <div className="space-y-12">
              {faqSections.map((section, sectionIndex) => (
                <div key={`section-${sectionIndex}`}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {section.title}
                  </h2>
                  
                  <div className="space-y-4">
                    {section.items.map((item, itemIndex) => {
                      const id = `faq-${sectionIndex}-${itemIndex}`;
                      return (
                        <div key={id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            className="flex justify-between items-center w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            onClick={() => toggleItem(id)}
                          >
                            <span className="text-lg font-medium text-gray-900">{item.question}</span>
                            <span className="ml-6 flex-shrink-0">
                              {openItems[id] ? (
                                <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </span>
                          </button>
                          {openItems[id] && (
                            <div className="px-6 pb-6">
                              <p className="text-gray-700">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Still Have Questions?</h2>
              <p className="text-gray-700 mb-6">
                If you couldn't find the answer you were looking for, please feel free to contact us. 
                We're here to help!
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
} 