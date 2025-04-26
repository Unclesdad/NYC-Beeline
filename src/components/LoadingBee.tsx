import React from 'react';
import Image from 'next/image';

interface LoadingBeeProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingBee: React.FC<LoadingBeeProps> = ({ size = 'md' }) => {
  const dimensions = {
    sm: { width: 40, height: 40 },
    md: { width: 60, height: 60 },
    lg: { width: 80, height: 80 },
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="animate-bounce-slow relative">
        <div className="absolute inset-0 animate-pulse-wings opacity-70">
          <Image
            src="/images/bee-icon.svg"
            alt="Loading..."
            width={dimensions.width}
            height={dimensions.height}
            className="transform rotate-12 origin-center"
          />
        </div>
        <Image
          src="/images/bee-icon.svg"
          alt="Loading..."
          width={dimensions.width}
          height={dimensions.height}
          className="animate-wiggle"
        />
      </div>
      <p className="mt-4 text-primary-600 font-medium animate-pulse">
        Buzzing around...
      </p>
    </div>
  );
};

export default LoadingBee; 