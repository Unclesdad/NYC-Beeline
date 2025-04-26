# NYC Beeline

NYC Beeline is a web application designed to address the inefficiency and inaccessibility of inter-borough transportation in New York City. While intra-borough travel is relatively manageable, long-distance travel between boroughs often involves longer waiting periods, congested routes, and higher costs. NYC Beeline solves this problem by calculating optimal multi-modal transportation routes across NYC.

## Features

- **Multi-Modal Transit Optimization**: Combines buses, subway, e-bikes, taxis, and Uber to create optimal routes
- **Real-Time Data**: Integrates with transit APIs to pull current schedule, delay, and congestion information
- **Vector-Based Algorithm**: Uses linear algebra to calculate the best possible combinations based on:
  - Time efficiency
  - Cost optimization
  - Comfort factors
  - Safety considerations
  - Accessibility needs
- **Interactive Map**: Visualizes your route with detailed step-by-step navigation
- **Personalized Recommendations**: Top 3 route options calculated for your specific journey

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **UI**: Tailwind CSS
- **Mapping**: Leaflet
- **State Management**: React hooks & context
- **API Integration**: Axios for data fetching
- **Utility Libraries**: SWR for data fetching, Zustand for state management

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/nyc-beeline.git
   cd nyc-beeline
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How It Works

NYC Beeline uses a sophisticated vector-based scoring system to calculate optimal routes:

1. **Data Collection**: Real-time data is pulled from various transit providers (MTA, Citi Bike, Uber, etc.)
2. **Vector Creation**: For each possible route segment, we create a vector with dimensions for time, cost, comfort, safety, and accessibility
3. **Ideal Vector**: We compare each route vector against an "ideal" vector (faster, cheaper, more comfortable, safer, more accessible)
4. **Dot Product Calculation**: Routes are scored using the dot product between their normalized vector and the ideal vector
5. **Optimization**: The algorithm finds the optimal combination of transit modes based on this scoring system
6. **Presentation**: The top 3 routes are presented to the user with detailed information

## Future Enhancements

- User accounts for saving favorite routes
- More detailed accessibility information
- Weather-aware recommendations
- Integration with additional transit providers
- Mobile app versions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- NYC MTA for transit data
- OpenStreetMap and Leaflet for mapping capabilities
- All NYC transit providers for making their data available 