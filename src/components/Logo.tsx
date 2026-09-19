import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
}

export default function Logo({ className = "w-full h-full", light = false }: LogoProps) {
  const colorClass = light ? "text-white" : "text-slate-900";
  
  return (
    <svg 
      viewBox="0 0 430 150" 
      className={`${className} ${colorClass}`}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Left Gear Segment */}
      <g>
        {/* Teeth */}
        <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-15, 110, 60)" />
        <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-35, 110, 60)" />
        <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-55, 110, 60)" />
        <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-75, 110, 60)" />
        <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-95, 110, 60)" />
        
        {/* Main curved ring */}
        <path d="M 62,60 A 48,48 0 0,1 110,12" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        {/* Inner thin accent ring */}
        <path d="M 72,60 A 38,38 0 0,1 110,22" fill="none" stroke="currentColor" strokeWidth="3" />
      </g>

      {/* Brand Text */}
      <g>
        <text 
          x="215" 
          y="75" 
          textAnchor="middle" 
          style={{ 
            fontSize: '44px', 
            fontWeight: 900, 
            fontFamily: 'Plus Jakarta Sans, sans-serif', 
            letterSpacing: '-0.02em', 
            fill: 'currentColor' 
          }}
        >
          HITACHI
        </text>
        <text 
          x="215" 
          y="105" 
          textAnchor="middle" 
          style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            fontFamily: 'Plus Jakarta Sans, sans-serif', 
            letterSpacing: '0.18em', 
            fill: 'currentColor' 
          }}
        >
          AIR SOLUTION CENTER
        </text>
      </g>

      {/* Bottom Right Gear Segment */}
      <g>
        {/* Teeth */}
        <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(15, 320, 90)" />
        <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(35, 320, 90)" />
        <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(55, 320, 90)" />
        <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(75, 320, 90)" />
        <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(95, 320, 90)" />
        
        {/* Main curved ring */}
        <path d="M 320,138 A 48,48 0 0,0 368,90" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        {/* Inner thin accent ring */}
        <path d="M 320,128 A 38,38 0 0,0 358,90" fill="none" stroke="currentColor" strokeWidth="3" />
      </g>
    </svg>
  );
}
