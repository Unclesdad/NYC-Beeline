const RouteList = ({ routes }: RouteListProps) => {
  return (
    <div className="space-y-4">
      {routes.map((route, index) => (
        <div 
          key={route.id} 
          className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg
            ${route.name.includes('Best Route') ? 'border-2 border-honey-500' : ''}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {route.name}
                {route.name.includes('Best Route') && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-honey-100 text-honey-800">
                    Best Match
                  </span>
                )}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {route.duration} min • ${route.cost.toFixed(2)} • {route.comfort} comfort
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{route.balancedScore?.score}/10</div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
          </div>
          
          <div className="space-y-3">
            {route.segments.map((segment, segmentIndex) => (
              <div key={segmentIndex} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white`}
                  style={{ backgroundColor: getRouteColor(segment.mode) }}>
                  <TransportIcon mode={segment.mode} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{segment.lineInfo}</div>
                  <div className="text-sm text-gray-500">
                    {segment.duration} min • ${segment.cost.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {route.costBreakdown && route.costBreakdown.additionalFees > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              *Includes ${route.costBreakdown.additionalFees.toFixed(2)} in traffic/peak fees
            </div>
          )}
          
          {route.co2 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span className={route.co2 < 100 ? 'text-green-600' : route.co2 < 200 ? 'text-yellow-600' : 'text-red-600'}>
                CO₂: {route.co2}g
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 