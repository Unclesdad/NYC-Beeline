import Image from 'next/image';
import { useState } from 'react';

interface BeeIconProps {
  size: number;
  withHover?: boolean;
  className?: string;
}

const BeeIcon: React.FC<BeeIconProps> = ({ 
  size = 32, 
  withHover = true,
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`relative ${withHover ? 'group cursor-pointer' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Shadow effect */}
      <div 
        className={`absolute rounded-full bg-black/10 blur-sm transition-all duration-300 ${
          isHovered ? 'scale-90 opacity-70' : 'scale-75 opacity-40'
        }`}
        style={{
          width: size,
          height: size,
          bottom: -size/10,
          left: size/20,
        }}
      />
      
      {/* Main bee icon with hover effect */}
      <div 
        className={`relative transition-all duration-300 ${
          isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'
        }`}
      >
        <Image
          src="/images/bee-icon.svg"
          alt="Bee Icon"
          width={size}
          height={size}
          className="object-contain transition-all duration-300"
          priority
        />
        
        {/* Hover flight trail */}
        {withHover && (
          <div 
            className={`absolute inset-0 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-honey-200 animate-ping" />
            <div className="absolute -left-3 -top-2 w-1 h-1 rounded-full bg-honey-300 animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute -left-2 -top-4 w-1.5 h-1.5 rounded-full bg-honey-200 animate-ping" style={{ animationDelay: '0.5s' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BeeIcon; 