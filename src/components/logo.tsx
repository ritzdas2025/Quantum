import React from 'react';

export function Logo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <rect width="100" height="100" rx="12" fill="hsl(var(--primary))" />
        {/* 'Q' shape */}
        <circle cx="50" cy="50" r="25" stroke="hsl(var(--primary-foreground))" strokeWidth="10" />
        <line x1="65" y1="65" x2="80" y2="80" stroke="hsl(var(--primary-foreground))" strokeWidth="10" strokeLinecap="round" />
      </g>
    </svg>
  );
}
