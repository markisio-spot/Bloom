import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect, Line, G } from "react-native-svg";

export interface AvatarData {
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  clothing: string;
  expression: string;
  accessory?: string;
}

const CLOTHING_COLORS: Record<string, string> = {
  casual: "#4F46E5",
  uniform: "#1B3A6B",
  sporty: "#0891B2",
  formal: "#374151",
  creative: "#7C3AED",
};

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function Hair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "long":
      return (
        <G>
          <Path
            d="M 22 47 Q 22 16 50 14 Q 78 16 78 47 Q 70 28 50 26 Q 30 28 22 47 Z"
            fill={color}
          />
          <Rect x="18" y="38" width="9" height="46" rx="4" fill={color} />
          <Rect x="73" y="38" width="9" height="46" rx="4" fill={color} />
        </G>
      );
    case "curly":
      return (
        <G>
          <Path
            d="M 22 47 Q 22 20 50 14 Q 78 20 78 47 Q 70 30 50 28 Q 30 30 22 47 Z"
            fill={color}
          />
          <Circle cx="28" cy="25" r="9" fill={color} />
          <Circle cx="40" cy="15" r="9" fill={color} />
          <Circle cx="50" cy="12" r="9" fill={color} />
          <Circle cx="60" cy="15" r="9" fill={color} />
          <Circle cx="72" cy="25" r="9" fill={color} />
        </G>
      );
    case "bun":
      return (
        <G>
          <Path
            d="M 22 47 Q 22 16 50 14 Q 78 16 78 47 Q 70 28 50 26 Q 30 28 22 47 Z"
            fill={color}
          />
          <Circle cx="50" cy="11" r="10" fill={color} />
          <Circle cx="50" cy="11" r="6" fill={darkenColor(color, 0.1)} />
        </G>
      );
    case "spiky":
      return (
        <Path
          d="M 22 47 L 26 30 L 32 18 L 37 30 L 43 10 L 47 28 L 50 8 L 53 28 L 57 10 L 63 30 L 68 18 L 74 30 L 78 47 Q 70 28 50 26 Q 30 28 22 47 Z"
          fill={color}
        />
      );
    default:
      return (
        <Path
          d="M 22 47 Q 22 16 50 14 Q 78 16 78 47 Q 70 28 50 26 Q 30 28 22 47 Z"
          fill={color}
        />
      );
  }
}

function Mouth({ expression, skin }: { expression: string; skin: string }) {
  switch (expression) {
    case "cool":
      return (
        <G>
          <Rect x="33" y="37" width="14" height="8" rx="3" fill="#1A1A2E" />
          <Rect x="53" y="37" width="14" height="8" rx="3" fill="#1A1A2E" />
          <Line x1="47" y1="41" x2="53" y2="41" stroke="#1A1A2E" strokeWidth="2" />
          <Path
            d="M 43 59 Q 50 63 57 59"
            stroke="#C0392B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </G>
      );
    case "studious":
      return (
        <G>
          <Rect x="33" y="36" width="14" height="10" rx="3" stroke="#4A4A4A" strokeWidth="1.5" fill="rgba(173,216,230,0.25)" />
          <Rect x="53" y="36" width="14" height="10" rx="3" stroke="#4A4A4A" strokeWidth="1.5" fill="rgba(173,216,230,0.25)" />
          <Line x1="47" y1="41" x2="53" y2="41" stroke="#4A4A4A" strokeWidth="1.5" />
          <Path d="M 43 58 L 57 58" stroke="#C0392B" strokeWidth="2" fill="none" strokeLinecap="round" />
        </G>
      );
    case "excited":
      return (
        <G>
          <Path
            d="M 38 55 Q 38 70 50 70 Q 62 70 62 55 Q 56 61 50 61 Q 44 61 38 55 Z"
            fill="#C0392B"
          />
          <Path
            d="M 38 55 Q 50 70 62 55"
            stroke="#8B0000"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <Path d="M 41 58 Q 50 62 59 58" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
        </G>
      );
    case "calm":
      return (
        <Path
          d="M 43 58 Q 50 61 57 58"
          stroke="#C0392B"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    default:
      return (
        <Path
          d="M 40 57 Q 50 65 60 57"
          stroke="#C0392B"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      );
  }
}

function ClothingDetail({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "uniform":
      return (
        <G>
          <Rect x="44" y="72" width="12" height="12" rx="2" fill="white" />
          <Path d="M 50 80 L 46 98 L 50 96 L 54 98 Z" fill="#E63946" />
        </G>
      );
    case "sporty":
      return (
        <Rect x="26" y="74" width="7" height="38" rx="3.5" fill="rgba(255,255,255,0.35)" />
      );
    case "formal":
      return (
        <G>
          <Path d="M 26 80 L 44 86 L 44 112 L 26 112 Z" fill="rgba(0,0,0,0.18)" />
          <Path d="M 74 80 L 56 86 L 56 112 L 74 112 Z" fill="rgba(0,0,0,0.18)" />
          <Rect x="44" y="78" width="12" height="14" rx="2" fill="white" />
        </G>
      );
    case "creative":
      return (
        <G>
          <Circle cx="38" cy="85" r="3" fill="rgba(255,255,255,0.35)" />
          <Circle cx="50" cy="92" r="3" fill="rgba(255,255,255,0.35)" />
          <Circle cx="62" cy="85" r="3" fill="rgba(255,255,255,0.35)" />
          <Circle cx="44" cy="100" r="2.5" fill="rgba(255,255,255,0.35)" />
          <Circle cx="56" cy="100" r="2.5" fill="rgba(255,255,255,0.35)" />
        </G>
      );
    default:
      return null;
  }
}

export function CartoonAvatar({
  avatar,
  size = 100,
}: {
  avatar: AvatarData;
  size?: number;
}) {
  const clothingColor = CLOTHING_COLORS[avatar.clothing] ?? "#4F46E5";
  const darkerSkin = darkenColor(avatar.skinTone, 0.12);
  const w = 100;
  const h = 150;
  const svgH = size * (h / w);

  return (
    <View style={{ width: size, height: svgH }}>
      <Svg width={size} height={svgH} viewBox={`0 0 ${w} ${h}`}>
        {/* --- Legs --- */}
        <Rect x="29" y="108" width="16" height="32" rx="8" fill="#1B3A6B" />
        <Rect x="55" y="108" width="16" height="32" rx="8" fill="#1B3A6B" />

        {/* --- Shoes --- */}
        <Ellipse cx="37" cy="142" rx="11" ry="5.5" fill="#222" />
        <Ellipse cx="63" cy="142" rx="11" ry="5.5" fill="#222" />

        {/* --- Body --- */}
        <Rect x="26" y="74" width="48" height="38" rx="10" fill={clothingColor} />

        {/* --- Arms --- */}
        <Rect x="12" y="76" width="14" height="28" rx="7" fill={clothingColor} />
        <Rect x="74" y="76" width="14" height="28" rx="7" fill={clothingColor} />

        {/* --- Hands --- */}
        <Ellipse cx="19" cy="106" rx="7.5" ry="5.5" fill={avatar.skinTone} />
        <Ellipse cx="81" cy="106" rx="7.5" ry="5.5" fill={avatar.skinTone} />

        {/* --- Clothing Detail --- */}
        <ClothingDetail style={avatar.clothing} color={clothingColor} />

        {/* --- Neck --- */}
        <Rect x="44" y="69" width="12" height="8" rx="3" fill={avatar.skinTone} />

        {/* --- Ears --- */}
        <Circle cx="22" cy="46" r="6.5" fill={avatar.skinTone} />
        <Circle cx="78" cy="46" r="6.5" fill={avatar.skinTone} />
        <Circle cx="22" cy="46" r="3.5" fill={darkerSkin} />
        <Circle cx="78" cy="46" r="3.5" fill={darkerSkin} />

        {/* --- Head --- */}
        <Circle cx="50" cy="44" r="29" fill={avatar.skinTone} />

        {/* --- Hair --- */}
        <Hair style={avatar.hairStyle} color={avatar.hairColor} />

        {/* --- Eyebrows --- */}
        <Path
          d="M 35 33 Q 41 30 47 33"
          stroke={avatar.hairColor}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 53 33 Q 59 30 65 33"
          stroke={avatar.hairColor}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* --- Eye whites --- */}
        <Circle cx="41" cy="41" r="5.5" fill="white" />
        <Circle cx="59" cy="41" r="5.5" fill="white" />

        {/* --- Iris --- */}
        <Circle cx="41" cy="41" r="3.8" fill={avatar.eyeColor} />
        <Circle cx="59" cy="41" r="3.8" fill={avatar.eyeColor} />

        {/* --- Pupils --- */}
        <Circle cx="41" cy="41" r="1.8" fill="#0D0D1A" />
        <Circle cx="59" cy="41" r="1.8" fill="#0D0D1A" />

        {/* --- Eye highlights --- */}
        <Circle cx="42.4" cy="39.5" r="1" fill="white" />
        <Circle cx="60.4" cy="39.5" r="1" fill="white" />

        {/* --- Nose --- */}
        <Circle cx="47" cy="50" r="1.6" fill={darkerSkin} />
        <Circle cx="53" cy="50" r="1.6" fill={darkerSkin} />

        {/* --- Mouth / Expressions --- */}
        <Mouth expression={avatar.expression} skin={avatar.skinTone} />

        {/* --- Cheeks (blush) --- */}
        <Ellipse cx="33" cy="52" rx="5" ry="3.5" fill="rgba(255,150,130,0.28)" />
        <Ellipse cx="67" cy="52" rx="5" ry="3.5" fill="rgba(255,150,130,0.28)" />
      </Svg>
    </View>
  );
}
