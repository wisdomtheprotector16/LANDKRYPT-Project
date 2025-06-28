// NFT Placeholder Component
// SVG-based placeholder for when NFT images fail to load

import React from 'react';

const NftPlaceholder = ({ 
  width = 400, 
  height = 300, 
  className = '',
  title = 'NFT'
}) => {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 400 300"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        
        {/* Background */}
        <rect width="400" height="300" fill="url(#bgGradient)" />
        
        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#4B5563" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#grid)" />
        
        {/* Image icon */}
        <g transform="translate(200, 150)">
          <circle cx="0" cy="0" r="40" fill="url(#iconGradient)" opacity="0.8" />
          <path
            d="M-20 -10 L-20 10 L20 10 L20 -10 Z M-15 -5 L-10 5 L-5 0 L0 5 L15 -8 L15 5 L-15 5 Z"
            fill="white"
            opacity="0.9"
          />
          <circle cx="-8" cy="-5" r="2" fill="white" opacity="0.9" />
        </g>
        
        {/* Text */}
        <text
          x="200"
          y="220"
          textAnchor="middle"
          className="fill-gray-400 text-sm font-medium"
          fontSize="14"
        >
          {title}
        </text>
        
        <text
          x="200"
          y="240"
          textAnchor="middle"
          className="fill-gray-500 text-xs"
          fontSize="12"
        >
          Image not available
        </text>
        
        {/* Decorative elements */}
        <circle cx="50" cy="50" r="2" fill="#F97316" opacity="0.4" />
        <circle cx="350" cy="80" r="1.5" fill="#EA580C" opacity="0.3" />
        <circle cx="80" cy="250" r="1" fill="#F97316" opacity="0.5" />
        <circle cx="320" cy="220" r="2.5" fill="#EA580C" opacity="0.2" />
      </svg>
    </div>
  );
};

export default NftPlaceholder;
