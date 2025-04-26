import React from 'react';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  intensity?: 'light' | 'medium' | 'strong';
  theme?: 'primary' | 'secondary' | 'honey';
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  children, 
  intensity = 'medium',
  theme = 'primary'
}) => {
  // Determine opacity based on intensity
  const bgOpacity = {
    light: 'bg-opacity-5',
    medium: 'bg-opacity-10',
    strong: 'bg-opacity-20',
  }[intensity];
  
  // Determine color based on theme
  const bgColor = {
    primary: `bg-primary-500 ${bgOpacity}`,
    secondary: `bg-secondary-500 ${bgOpacity}`,
    honey: `bg-honey-500 ${bgOpacity}`,
  }[theme];
  
  const gradientDirection = {
    primary: 'from-primary-50 to-white',
    secondary: 'from-secondary-50 to-white',
    honey: 'from-honey-100 to-white',
  }[theme];

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Base gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientDirection}`}></div>
      
      {/* Honeycomb pattern overlay */}
      <div className="absolute inset-0 bg-honeycomb-pattern opacity-30"></div>
      
      {/* Floating elements */}
      <div className="absolute h-full w-full">
        {/* Large floating hexagon */}
        <div className="absolute top-1/4 left-1/3 animate-float">
          <svg width="120" height="104" viewBox="0 0 120 104" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-20">
            <path d="M60 0L120 30V74L60 104L0 74V30L60 0Z" className={`fill-current ${theme === 'primary' ? 'text-primary-300' : theme === 'secondary' ? 'text-secondary-300' : 'text-honey-300'}`} />
          </svg>
        </div>
        
        {/* Medium floating hexagon */}
        <div className="absolute top-2/3 right-1/4 animate-float-delayed">
          <svg width="80" height="69" viewBox="0 0 120 104" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-20">
            <path d="M60 0L120 30V74L60 104L0 74V30L60 0Z" className={`fill-current ${theme === 'primary' ? 'text-primary-400' : theme === 'secondary' ? 'text-secondary-400' : 'text-honey-400'}`} />
          </svg>
        </div>
        
        {/* Small floating hexagon */}
        <div className="absolute bottom-1/4 left-1/5 animate-float">
          <svg width="60" height="52" viewBox="0 0 120 104" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-15">
            <path d="M60 0L120 30V74L60 104L0 74V30L60 0Z" className={`fill-current ${theme === 'primary' ? 'text-primary-500' : theme === 'secondary' ? 'text-secondary-500' : 'text-honey-500'}`} />
          </svg>
        </div>
        
        {/* Small rotating hexagon */}
        <div className="absolute top-1/3 right-1/6 animate-rotate-slow">
          <svg width="40" height="35" viewBox="0 0 120 104" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-20">
            <path d="M60 0L120 30V74L60 104L0 74V30L60 0Z" className={`fill-current ${theme === 'primary' ? 'text-primary-600' : theme === 'secondary' ? 'text-secondary-600' : 'text-honey-600'}`} />
          </svg>
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground; 