import React from 'react';

const FaceCodeLogo = ({ size = 40, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Head Outline with Split and Gradient */}
      <defs>
        <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" /> {/* Blue */}
          <stop offset="100%" stopColor="#C084FC" /> {/* Purple */}
        </linearGradient>
      </defs>
      
      {/* Left Hemiface */}
      <path 
        d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85" 
        stroke="url(#headGradient)" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      {/* Right Hemiface */}
      <path 
        d="M50 15C69.33 15 85 30.67 85 50C85 69.33 69.33 85 50 85" 
        stroke="#FDBA74" 
        strokeWidth="4" 
        strokeLinecap="round" 
        style={{ stroke: 'linear-gradient(to bottom, #F472B6, #FB923C)' }}
      />
      {/* Fixing Right side gradient/color to match image */}
      <path 
        d="M50 15C69.33 15 85 30.67 85 50C85 69.33 69.33 85 50 85" 
        stroke="#FB923C" 
        strokeWidth="4" 
        strokeLinecap="round" 
        opacity="0.8"
      />
      
      {/* Eyes Section: < O > O > style but simplified for the logo icon */}
      {/* Green Left Eye O */}
      <circle cx="35" cy="50" r="6" stroke="#22C55E" strokeWidth="3" />
      
      {/* Brackets < > */}
      <path d="M45 45L40 50L45 55" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55 45L60 50L55 55" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Orange/Coral Right Eye O */}
      <circle cx="65" cy="50" r="6" stroke="#FB923C" strokeWidth="3" />
      
      {/* Ears */}
      <path d="M15 45C13 45 11 47 11 50C11 53 13 55 15 55" stroke="url(#headGradient)" strokeWidth="3" />
      <path d="M85 45C87 45 89 47 89 50C89 53 87 55 85 55" stroke="#FB923C" strokeWidth="3" />
    </svg>
  );
};

export default FaceCodeLogo;
