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

// Hair drawn BEHIND the head (only ponytail needs this)
function HairBehind({ style, color }: { style: string; color: string }) {
  if (style !== "ponytail") return null;
  return (
    <G>
      <Rect x="42" y="66" width="16" height="62" rx="8" fill={color} />
      <Ellipse cx="50" cy="70" rx="11" ry="4.5" fill={color} />
    </G>
  );
}

function Hair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "long":
      return (
        <G>
          <Path d="M 21 48 Q 21 15 50 13 Q 79 15 79 48 Q 71 28 50 26 Q 29 28 21 48 Z" fill={color} />
          <Rect x="17" y="37" width="10" height="52" rx="5" fill={color} />
          <Rect x="73" y="37" width="10" height="52" rx="5" fill={color} />
        </G>
      );
    case "curly":
      return (
        <G>
          <Path d="M 21 48 Q 21 20 50 14 Q 79 20 79 48 Q 71 30 50 28 Q 29 30 21 48 Z" fill={color} />
          <Circle cx="26" cy="24" r="10" fill={color} />
          <Circle cx="39" cy="13" r="10" fill={color} />
          <Circle cx="50" cy="10" r="10" fill={color} />
          <Circle cx="61" cy="13" r="10" fill={color} />
          <Circle cx="74" cy="24" r="10" fill={color} />
        </G>
      );
    case "bun":
      return (
        <G>
          <Path d="M 21 48 Q 21 15 50 13 Q 79 15 79 48 Q 71 28 50 26 Q 29 28 21 48 Z" fill={color} />
          <Circle cx="50" cy="10" r="11" fill={color} />
          <Circle cx="50" cy="10" r="7" fill={darkenColor(color, 0.12)} />
          <Circle cx="50" cy="10" r="3" fill={darkenColor(color, 0.06)} />
        </G>
      );
    case "spiky":
      return (
        <Path
          d="M 21 48 L 25 29 L 31 16 L 36 29 L 42 8 L 46 27 L 50 6 L 54 27 L 58 8 L 64 29 L 69 16 L 75 29 L 79 48 Q 71 28 50 26 Q 29 28 21 48 Z"
          fill={color}
        />
      );
    case "ponytail":
      return (
        <G>
          {/* Tight pulled-back cap */}
          <Path d="M 22 49 Q 22 15 50 13 Q 78 15 78 49 Q 70 31 50 29 Q 30 31 22 49 Z" fill={color} />
          {/* Hair tie band */}
          <Ellipse cx="50" cy="70" rx="11" ry="5" fill={darkenColor(color, 0.16)} />
          <Ellipse cx="50" cy="70" rx="6" ry="2.5" fill={darkenColor(color, 0.26)} />
        </G>
      );
    default:
      // "short" and fallback
      return (
        <Path
          d="M 21 48 Q 21 15 50 13 Q 79 15 79 48 Q 71 28 50 26 Q 29 28 21 48 Z"
          fill={color}
        />
      );
  }
}

function Mouth({ expression }: { expression: string }) {
  switch (expression) {
    case "cool":
      return (
        <G>
          <Rect x="32" y="37" width="15" height="9" rx="4" fill="#1A1A2E" />
          <Rect x="53" y="37" width="15" height="9" rx="4" fill="#1A1A2E" />
          <Line x1="47" y1="41.5" x2="53" y2="41.5" stroke="#1A1A2E" strokeWidth="2.5" />
          <Path d="M 42 61 Q 50 66 58 61" stroke="#C0392B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </G>
      );
    case "studious":
      return (
        <G>
          <Rect x="32" y="36" width="15" height="11" rx="3.5" stroke="#4A4A4A" strokeWidth="1.5" fill="rgba(173,216,230,0.25)" />
          <Rect x="53" y="36" width="15" height="11" rx="3.5" stroke="#4A4A4A" strokeWidth="1.5" fill="rgba(173,216,230,0.25)" />
          <Line x1="47" y1="41.5" x2="53" y2="41.5" stroke="#4A4A4A" strokeWidth="1.5" />
          <Path d="M 43 60 L 57 60" stroke="#C0392B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </G>
      );
    case "excited":
      return (
        <G>
          <Path d="M 37 57 Q 37 72 50 72 Q 63 72 63 57 Q 57 63 50 63 Q 43 63 37 57 Z" fill="#C0392B" />
          <Path d="M 37 57 Q 50 72 63 57" stroke="#8B0000" strokeWidth="2" fill="none" strokeLinecap="round" />
          <Path d="M 40 60 Q 50 65 60 60" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
        </G>
      );
    case "calm":
      return (
        <Path d="M 43 60 Q 50 64 57 60" stroke="#C0392B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      );
    default:
      // happy
      return (
        <Path d="M 37 59 Q 50 70 63 59" stroke="#C0392B" strokeWidth="3" fill="none" strokeLinecap="round" />
      );
  }
}

function ClothingDetail({ style }: { style: string }) {
  switch (style) {
    case "uniform":
      return (
        <G>
          <Rect x="44" y="73" width="12" height="13" rx="2" fill="white" />
          <Path d="M 50 82 L 46 100 L 50 98 L 54 100 Z" fill="#E63946" />
        </G>
      );
    case "sporty":
      return <Rect x="26" y="75" width="7" height="38" rx="3.5" fill="rgba(255,255,255,0.35)" />;
    case "formal":
      return (
        <G>
          <Path d="M 26 81 L 44 87 L 44 113 L 26 113 Z" fill="rgba(0,0,0,0.18)" />
          <Path d="M 74 81 L 56 87 L 56 113 L 74 113 Z" fill="rgba(0,0,0,0.18)" />
          <Rect x="44" y="79" width="12" height="15" rx="2" fill="white" />
        </G>
      );
    case "creative":
      return (
        <G>
          <Circle cx="38" cy="86" r="3.5" fill="rgba(255,255,255,0.38)" />
          <Circle cx="50" cy="93" r="3.5" fill="rgba(255,255,255,0.38)" />
          <Circle cx="62" cy="86" r="3.5" fill="rgba(255,255,255,0.38)" />
          <Circle cx="44" cy="101" r="2.8" fill="rgba(255,255,255,0.38)" />
          <Circle cx="56" cy="101" r="2.8" fill="rgba(255,255,255,0.38)" />
        </G>
      );
    default:
      return null;
  }
}

// ─── Full body avatar ────────────────────────────────────────────────────────

export function CartoonAvatar({ avatar, size = 100 }: { avatar: AvatarData; size?: number }) {
  const clothingColor = CLOTHING_COLORS[avatar.clothing] ?? "#4F46E5";
  const darkerSkin = darkenColor(avatar.skinTone, 0.12);
  const w = 100;
  const h = 152;
  const svgH = size * (h / w);

  return (
    <View style={{ width: size, height: svgH }}>
      <Svg width={size} height={svgH} viewBox={`0 0 ${w} ${h}`}>
        {/* Legs */}
        <Rect x="29" y="109" width="16" height="33" rx="8" fill="#1B3A6B" />
        <Rect x="55" y="109" width="16" height="33" rx="8" fill="#1B3A6B" />
        {/* Shoes */}
        <Ellipse cx="37" cy="144" rx="12" ry="6" fill="#1A1A1A" />
        <Ellipse cx="63" cy="144" rx="12" ry="6" fill="#1A1A1A" />
        {/* Body */}
        <Rect x="26" y="75" width="48" height="38" rx="10" fill={clothingColor} />
        {/* Arms */}
        <Rect x="11" y="77" width="15" height="28" rx="7.5" fill={clothingColor} />
        <Rect x="74" y="77" width="15" height="28" rx="7.5" fill={clothingColor} />
        {/* Hands */}
        <Ellipse cx="18.5" cy="107" rx="8" ry="6" fill={avatar.skinTone} />
        <Ellipse cx="81.5" cy="107" rx="8" ry="6" fill={avatar.skinTone} />
        {/* Clothing detail */}
        <ClothingDetail style={avatar.clothing} />
        {/* Neck */}
        <Rect x="44" y="70" width="12" height="8" rx="3" fill={avatar.skinTone} />
        {/* Ponytail behind head */}
        <HairBehind style={avatar.hairStyle} color={avatar.hairColor} />
        {/* Ears */}
        <Circle cx="21" cy="46" r="7" fill={avatar.skinTone} />
        <Circle cx="79" cy="46" r="7" fill={avatar.skinTone} />
        <Circle cx="21" cy="46" r="4" fill={darkerSkin} />
        <Circle cx="79" cy="46" r="4" fill={darkerSkin} />
        {/* Head */}
        <Circle cx="50" cy="44" r="30" fill={avatar.skinTone} />
        {/* Hair (front/top) */}
        <Hair style={avatar.hairStyle} color={avatar.hairColor} />
        {/* Eyebrows */}
        <Path d="M 34 31 Q 41 27 47 31" stroke={avatar.hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M 53 31 Q 59 27 66 31" stroke={avatar.hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Eye whites — bigger for cuter look */}
        <Circle cx="41" cy="43" r="7" fill="white" />
        <Circle cx="59" cy="43" r="7" fill="white" />
        {/* Iris */}
        <Circle cx="41" cy="43" r="5" fill={avatar.eyeColor} />
        <Circle cx="59" cy="43" r="5" fill={avatar.eyeColor} />
        {/* Pupils */}
        <Circle cx="41" cy="43" r="2.4" fill="#0D0D1A" />
        <Circle cx="59" cy="43" r="2.4" fill="#0D0D1A" />
        {/* Highlights — double sparkle */}
        <Circle cx="42.8" cy="41.2" r="1.4" fill="white" />
        <Circle cx="60.8" cy="41.2" r="1.4" fill="white" />
        <Circle cx="44" cy="44.2" r="0.8" fill="rgba(255,255,255,0.55)" />
        <Circle cx="62" cy="44.2" r="0.8" fill="rgba(255,255,255,0.55)" />
        {/* Cute button nose */}
        <Circle cx="50" cy="52" r="2.2" fill={darkerSkin} />
        {/* Mouth */}
        <Mouth expression={avatar.expression} />
        {/* Rosy cheeks — bigger & more pink */}
        <Ellipse cx="32" cy="52" rx="7.5" ry="5.5" fill="rgba(255,100,90,0.30)" />
        <Ellipse cx="68" cy="52" rx="7.5" ry="5.5" fill="rgba(255,100,90,0.30)" />
      </Svg>
    </View>
  );
}

// ─── Head-only avatar (for leaderboard circles) ──────────────────────────────

export const DEFAULT_AVATAR: AvatarData = {
  skinTone: "#FDDBB4",
  hairColor: "#1B3A6B",
  hairStyle: "short",
  eyeColor: "#1B3A6B",
  clothing: "casual",
  expression: "happy",
};

export function CartoonAvatarHead({ avatar, size = 44 }: { avatar: AvatarData; size?: number }) {
  const darkerSkin = darkenColor(avatar.skinTone, 0.12);

  return (
    <View style={{ width: size, height: size }}>
      {/* viewBox focuses on head area: x 6→94, y 0→76 */}
      <Svg width={size} height={size} viewBox="6 0 88 76">
        {/* Ponytail stub behind head */}
        {avatar.hairStyle === "ponytail" && (
          <Rect x="42" y="66" width="16" height="18" rx="8" fill={avatar.hairColor} />
        )}
        {/* Ears */}
        <Circle cx="21" cy="46" r="7" fill={avatar.skinTone} />
        <Circle cx="79" cy="46" r="7" fill={avatar.skinTone} />
        <Circle cx="21" cy="46" r="4" fill={darkerSkin} />
        <Circle cx="79" cy="46" r="4" fill={darkerSkin} />
        {/* Head */}
        <Circle cx="50" cy="44" r="30" fill={avatar.skinTone} />
        {/* Hair */}
        <Hair style={avatar.hairStyle} color={avatar.hairColor} />
        {/* Eyebrows */}
        <Path d="M 34 31 Q 41 27 47 31" stroke={avatar.hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M 53 31 Q 59 27 66 31" stroke={avatar.hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Eye whites */}
        <Circle cx="41" cy="43" r="7" fill="white" />
        <Circle cx="59" cy="43" r="7" fill="white" />
        {/* Iris */}
        <Circle cx="41" cy="43" r="5" fill={avatar.eyeColor} />
        <Circle cx="59" cy="43" r="5" fill={avatar.eyeColor} />
        {/* Pupils */}
        <Circle cx="41" cy="43" r="2.4" fill="#0D0D1A" />
        <Circle cx="59" cy="43" r="2.4" fill="#0D0D1A" />
        {/* Highlights */}
        <Circle cx="42.8" cy="41.2" r="1.4" fill="white" />
        <Circle cx="60.8" cy="41.2" r="1.4" fill="white" />
        <Circle cx="44" cy="44.2" r="0.8" fill="rgba(255,255,255,0.55)" />
        <Circle cx="62" cy="44.2" r="0.8" fill="rgba(255,255,255,0.55)" />
        {/* Button nose */}
        <Circle cx="50" cy="52" r="2.2" fill={darkerSkin} />
        {/* Mouth */}
        <Mouth expression={avatar.expression} />
        {/* Cheeks */}
        <Ellipse cx="32" cy="52" rx="7.5" ry="5.5" fill="rgba(255,100,90,0.30)" />
        <Ellipse cx="68" cy="52" rx="7.5" ry="5.5" fill="rgba(255,100,90,0.30)" />
      </Svg>
    </View>
  );
}
