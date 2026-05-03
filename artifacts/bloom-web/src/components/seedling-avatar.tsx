import { useState, useEffect } from "react";

interface SeedlingAvatarProps {
  coins: number;
  avatarData?: string | null;
  className?: string;
}

export function SeedlingAvatar({ coins, avatarData, className = "" }: SeedlingAvatarProps) {
  let stage = 0;
  if (coins >= 1500) stage = 3;
  else if (coins >= 500) stage = 2;
  else if (coins >= 100) stage = 1;

  let expression = "happy";
  let petalColor = "#FF6B6B";
  let potColor = "#E07A5F";

  if (avatarData) {
    try {
      const parsed = JSON.parse(avatarData);
      if (parsed.expression) expression = parsed.expression;
      if (parsed.petalColor) petalColor = parsed.petalColor;
      if (parsed.potColor) potColor = parsed.potColor;
    } catch (e) {
      // ignore parse errors
    }
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Pot */}
        <path d="M25 70 L35 95 L65 95 L75 70 Z" fill={potColor} />
        <rect x="20" y="60" width="60" height="10" rx="2" fill={potColor} filter="brightness(0.9)" />
        
        {/* Dirt */}
        <ellipse cx="50" cy="60" rx="28" ry="4" fill="#5C4033" />

        {/* Stem */}
        {stage >= 0 && (
          <path d="M50 60 Q 45 40 50 30" fill="none" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Leaves */}
        {stage >= 1 && (
          <>
            <path d="M50 45 Q 35 40 40 55 Q 45 50 50 45" fill="#4ADE80" />
            <path d="M50 35 Q 65 30 60 45 Q 55 40 50 35" fill="#4ADE80" />
          </>
        )}

        {/* Flower / Head */}
        {stage >= 2 && (
          <g transform="translate(50, 30)">
            {/* Petals */}
            {stage >= 3 && (
              <>
                <circle cx="0" cy="-15" r="10" fill={petalColor} />
                <circle cx="15" cy="-5" r="10" fill={petalColor} />
                <circle cx="10" cy="12" r="10" fill={petalColor} />
                <circle cx="-10" cy="12" r="10" fill={petalColor} />
                <circle cx="-15" cy="-5" r="10" fill={petalColor} />
              </>
            )}
            
            {/* Center face */}
            <circle cx="0" cy="0" r="12" fill="#FDE047" />
            
            {/* Face expression */}
            {expression === "happy" && (
              <>
                <circle cx="-4" cy="-2" r="1.5" fill="#1F2937" />
                <circle cx="4" cy="-2" r="1.5" fill="#1F2937" />
                <path d="M-4 3 Q 0 7 4 3" fill="none" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
            {expression === "cool" && (
              <>
                <rect x="-7" y="-4" width="14" height="4" rx="1" fill="#1F2937" />
                <path d="M-3 4 L 3 4" fill="none" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
            {expression === "surprised" && (
              <>
                <circle cx="-4" cy="-3" r="1.5" fill="#1F2937" />
                <circle cx="4" cy="-3" r="1.5" fill="#1F2937" />
                <circle cx="0" cy="4" r="2.5" fill="none" stroke="#1F2937" strokeWidth="1.5" />
              </>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
