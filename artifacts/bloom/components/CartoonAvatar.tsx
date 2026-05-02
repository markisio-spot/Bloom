import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect, G } from "react-native-svg";

export interface AvatarData {
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  clothing: string;
  expression: string;
  accessory?: string;
}

export const DEFAULT_AVATAR: AvatarData = {
  skinTone: "#FDDBB4",
  hairColor: "#1B3A6B",
  hairStyle: "short_spiky",
  eyeColor: "#1B3A6B",
  clothing: "uniform",
  expression: "happy",
};

const CLOTHING_COLORS: Record<string, string> = {
  uniform: "#1B3A6B",
  casual: "#4F46E5",
  sporty: "#0891B2",
  formal: "#374151",
  creative: "#7C3AED",
  hoodie: "#B45309",
};

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - Math.round(255 * amt));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amt));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ─── Hair ────────────────────────────────────────────────────────────────────

const CAP = "M 22 46 C 22 14 50 8 50 8 C 50 8 78 14 78 46 Q 72 30 50 28 Q 28 30 22 46 Z";
const BANGS = "M 30 40 Q 32 30 50 28 Q 68 30 70 40 L 68 48 Q 60 41 50 40 Q 40 41 32 48 Z";

// Hair drawn BEHIND the head (long styles)
function HairBehind({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "long_straight":
      return (
        <G>
          <Rect x="16" y="44" width="12" height="74" rx="6" fill={color} />
          <Rect x="72" y="44" width="12" height="74" rx="6" fill={color} />
        </G>
      );
    case "twin_tails":
      return (
        <G>
          <Path d="M 14 56 Q 6 66 8 88 Q 8 115 18 128 Q 20 132 24 128 Q 16 114 16 88 Q 14 66 22 56 Z" fill={color} />
          <Path d="M 86 56 Q 94 66 92 88 Q 92 115 82 128 Q 80 132 76 128 Q 84 114 84 88 Q 86 66 78 56 Z" fill={color} />
        </G>
      );
    case "side_braid":
      return (
        <G>
          <Path d="M 20 54 Q 10 64 10 82 Q 10 108 16 124" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />
        </G>
      );
    case "high_ponytail":
      return (
        <G>
          <Path d="M 44 16 Q 60 8 66 20 Q 74 38 68 70 Q 64 100 62 128" stroke={color} strokeWidth="13" fill="none" strokeLinecap="round" />
        </G>
      );
    default:
      return null;
  }
}

function Hair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "short_spiky":
      return (
        <G>
          <Path d={CAP} fill={color} />
          <Path d="M 36 18 L 32 4 L 39 16 L 43 2 L 47 16 L 50 0 L 53 16 L 57 2 L 61 16 L 68 4 L 64 18 Q 57 12 50 11 Q 43 12 36 18 Z" fill={color} />
          <Path d="M 22 46 L 14 54 L 18 62 Q 20 58 22 54 Z" fill={color} />
          <Path d="M 78 46 L 86 54 L 82 62 Q 80 58 78 54 Z" fill={color} />
        </G>
      );
    case "long_straight":
      return (
        <G>
          <Path d={CAP} fill={color} />
          <Path d={BANGS} fill={color} />
        </G>
      );
    case "twin_tails":
      return (
        <G>
          <Path d={CAP} fill={color} />
          <Path d={BANGS} fill={color} />
          <Ellipse cx="22" cy="56" rx="7" ry="4" fill={darken(color, 0.2)} />
          <Ellipse cx="78" cy="56" rx="7" ry="4" fill={darken(color, 0.2)} />
        </G>
      );
    case "bob":
      return (
        <G>
          <Path d={CAP} fill={color} />
          <Path d="M 22 46 L 18 76 Q 20 82 26 84 Q 50 88 74 84 Q 80 82 82 76 L 78 46 Q 68 64 50 65 Q 32 64 22 46 Z" fill={color} />
          <Path d={BANGS} fill={color} />
        </G>
      );
    case "high_ponytail":
      return (
        <G>
          <Path d="M 22 48 C 22 16 50 10 50 10 C 50 10 78 16 78 48 Q 72 34 50 32 Q 28 34 22 48 Z" fill={color} />
          <Ellipse cx="50" cy="13" rx="13" ry="8" fill={color} />
          <Ellipse cx="50" cy="15" rx="8" ry="4" fill={darken(color, 0.2)} />
        </G>
      );
    case "messy_bangs":
      return (
        <G>
          <Path d={CAP} fill={color} />
          <Path d="M 34 18 Q 30 6 38 14" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />
          <Path d="M 50 16 Q 50 3 55 12" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />
          <Path d="M 64 18 Q 70 6 63 14" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />
          <Path d="M 26 36 Q 36 24 52 28 Q 66 30 74 40 L 76 50 Q 62 38 48 42 Q 36 44 28 56 Z" fill={color} />
          <Path d="M 28 48 Q 20 58 22 72 Q 24 78 28 76 Q 26 68 28 58 Z" fill={color} />
        </G>
      );
    case "side_braid":
      return (
        <G>
          <Path d={CAP} fill={color} />
          <Path d={BANGS} fill={color} />
          <Ellipse cx="16" cy="68" rx="5" ry="7" fill={darken(color, 0.14)} />
          <Ellipse cx="13" cy="84" rx="5" ry="7" fill={darken(color, 0.14)} />
          <Ellipse cx="13" cy="100" rx="5" ry="7" fill={darken(color, 0.14)} />
          <Ellipse cx="15" cy="116" rx="4" ry="6" fill={darken(color, 0.14)} />
          <Path d="M 78 46 Q 84 56 82 70 Q 80 76 77 74 Q 79 64 78 54 Z" fill={color} />
        </G>
      );
    default:
      // fallback = short_spiky
      return (
        <G>
          <Path d={CAP} fill={color} />
        </G>
      );
  }
}

// ─── Anime Eyes ──────────────────────────────────────────────────────────────

function AnimeEye({ cx, eyeColor, expression }: { cx: number; eyeColor: string; expression: string }) {
  const isCool = expression === "cool";
  const isExcited = expression === "excited";

  // Almond shape: M (cx-11) cy Q top-peak (cx) cy Q (cx+11) cy
  const lx = cx - 11;
  const rx = cx + 11;
  const cy = 46;
  const topY = isCool ? 44 : 40;
  const bottomY = isCool ? 50 : 52;

  const whiteAlmond = `M ${lx} ${cy} Q ${cx - 4} ${topY} ${cx} ${topY} Q ${cx + 4} ${topY} ${rx} ${cy} Q ${cx + 4} ${bottomY} ${cx} ${bottomY} Q ${cx - 4} ${bottomY} ${lx} ${cy} Z`;

  return (
    <G>
      {/* Eye white */}
      <Path d={whiteAlmond} fill="white" />
      {/* Iris */}
      <Circle cx={cx} cy={cy} r={isExcited ? 7 : 5.5} fill={eyeColor} />
      {/* Pupil */}
      <Circle cx={cx} cy={cy} r={isExcited ? 4 : 3} fill="#070714" />
      {/* Inner iris highlight ring */}
      <Circle cx={cx} cy={cy} r={isExcited ? 5.5 : 4.2} fill="none" stroke={eyeColor} strokeWidth="1" opacity={0.5} />
      {/* Main star highlight */}
      <Circle cx={cx + 2.5} cy={cy - 2.5} r={isExcited ? 2.2 : 1.8} fill="white" />
      {/* Secondary highlight */}
      <Circle cx={cx - 2} cy={cy + 1.8} r={isExcited ? 1.2 : 0.9} fill="rgba(255,255,255,0.65)" />
      {/* Upper lid thick line */}
      <Path d={`M ${lx} ${cy} Q ${cx - 4} ${topY} ${cx} ${topY} Q ${cx + 4} ${topY} ${rx} ${cy}`}
        stroke={darken(eyeColor, 0.5)} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Lash accents at corners */}
      <Path d={`M ${lx} ${cy} L ${lx - 2} ${cy - 1}`} stroke={darken(eyeColor, 0.4)} strokeWidth="1.5" strokeLinecap="round" />
      <Path d={`M ${rx} ${cy} L ${rx + 2} ${cy - 1}`} stroke={darken(eyeColor, 0.4)} strokeWidth="1.5" strokeLinecap="round" />
      {/* Lower lid thin line */}
      <Path d={`M ${lx} ${cy} Q ${cx} ${bottomY} ${rx} ${cy}`}
        stroke={darken(eyeColor, 0.3)} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity={0.6} />
    </G>
  );
}

// ─── Mouth ───────────────────────────────────────────────────────────────────

function AnimeMouth({ expression }: { expression: string }) {
  switch (expression) {
    case "cool":
      return (
        <G>
          <Path d="M 43 66 L 57 66" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" />
          <Path d="M 50 66 L 55 70" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round" />
        </G>
      );
    case "excited":
      return (
        <G>
          <Path d="M 38 64 Q 50 76 62 64 Q 56 68 50 68 Q 44 68 38 64 Z" fill="#C0392B" />
          <Path d="M 38 64 Q 50 76 62 64" stroke="#8B0000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Path d="M 41 66 Q 50 70 59 66" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
        </G>
      );
    case "studious":
      return (
        <Path d="M 44 66 Q 50 69 56 66" stroke="#C0392B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      );
    case "calm":
      return (
        <Path d="M 44 65 Q 50 67 56 65" stroke="#C0392B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      );
    case "determined":
      return (
        <G>
          <Path d="M 42 66 Q 50 63 58 66" stroke="#C0392B" strokeWidth="2" fill="none" strokeLinecap="round" />
        </G>
      );
    default:
      // happy
      return (
        <G>
          <Path d="M 40 64 Q 50 73 60 64" stroke="#C0392B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <Path d="M 44 66 Q 50 70 56 66" stroke="rgba(192,57,43,0.3)" strokeWidth="1" fill="none" />
        </G>
      );
  }
}

// ─── Eyebrows ────────────────────────────────────────────────────────────────

function AnimeEyebrows({ expression, color }: { expression: string; color: string }) {
  const isDetermined = expression === "determined";
  const isCool = expression === "cool";
  if (isDetermined) {
    // Furrowed, angled inward
    return (
      <G>
        <Path d="M 27 36 Q 36 33 45 37" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M 55 37 Q 64 33 73 36" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (isCool) {
    return (
      <G>
        <Path d="M 27 37 Q 36 35 45 38" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <Path d="M 55 38 Q 64 35 73 37" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  return (
    <G>
      <Path d="M 27 37 Q 37 32 46 36" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M 54 36 Q 63 32 73 37" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </G>
  );
}

// ─── Clothing ────────────────────────────────────────────────────────────────

function ClothingDetail({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "uniform":
      return (
        <G>
          {/* Sailor collar */}
          <Path d="M 36 88 L 50 100 L 64 88 L 58 88 L 50 96 L 42 88 Z" fill={darken(color, 0.18)} />
          <Path d="M 42 88 L 50 96 L 58 88" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
        </G>
      );
    case "sporty":
      return (
        <G>
          <Rect x="26" y="90" width="8" height="36" rx="4" fill="rgba(255,255,255,0.3)" />
          <Path d="M 50 88 L 50 128" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        </G>
      );
    case "formal":
      return (
        <G>
          <Path d="M 26 96 L 44 102 L 44 126 L 26 126 Z" fill="rgba(0,0,0,0.2)" />
          <Path d="M 74 96 L 56 102 L 56 126 L 74 126 Z" fill="rgba(0,0,0,0.2)" />
          <Rect x="44" y="90" width="12" height="18" rx="2" fill="white" />
        </G>
      );
    case "hoodie":
      return (
        <G>
          <Path d="M 36 88 Q 50 82 64 88 L 64 96 Q 50 90 36 96 Z" fill={darken(color, 0.12)} />
          <Rect x="44" y="100" width="12" height="24" rx="6" fill={darken(color, 0.08)} />
        </G>
      );
    case "creative":
      return (
        <G>
          <Circle cx="38" cy="100" r="4" fill="rgba(255,255,255,0.35)" />
          <Circle cx="50" cy="108" r="4" fill="rgba(255,255,255,0.35)" />
          <Circle cx="62" cy="100" r="4" fill="rgba(255,255,255,0.35)" />
        </G>
      );
    default:
      return null;
  }
}

// ─── Full body anime avatar ───────────────────────────────────────────────────

export function CartoonAvatar({ avatar, size = 100 }: { avatar: AvatarData; size?: number }) {
  const clothingColor = CLOTHING_COLORS[avatar.clothing] ?? "#1B3A6B";
  const darkerSkin = darken(avatar.skinTone, 0.12);
  const hairDark = darken(avatar.hairColor, 0.15);
  const w = 100;
  const h = 160;
  const svgH = size * (h / w);

  return (
    <View style={{ width: size, height: svgH }}>
      <Svg width={size} height={svgH} viewBox={`0 0 ${w} ${h}`}>
        {/* ── Legs ── */}
        <Rect x="31" y="126" width="16" height="30" rx="8" fill="#1B3A6B" />
        <Rect x="53" y="126" width="16" height="30" rx="8" fill="#1B3A6B" />
        {/* ── Shoes ── */}
        <Ellipse cx="39" cy="158" rx="13" ry="6" fill="#1A1A1A" />
        <Ellipse cx="61" cy="158" rx="13" ry="6" fill="#1A1A1A" />
        {/* ── Body ── */}
        <Rect x="27" y="88" width="46" height="42" rx="10" fill={clothingColor} />
        {/* ── Arms ── */}
        <Rect x="12" y="90" width="15" height="30" rx="7.5" fill={clothingColor} />
        <Rect x="73" y="90" width="15" height="30" rx="7.5" fill={clothingColor} />
        {/* ── Hands ── */}
        <Ellipse cx="19.5" cy="122" rx="8.5" ry="6" fill={avatar.skinTone} />
        <Ellipse cx="80.5" cy="122" rx="8.5" ry="6" fill={avatar.skinTone} />
        {/* ── Clothing detail ── */}
        <ClothingDetail style={avatar.clothing} color={clothingColor} />
        {/* ── Neck ── */}
        <Rect x="45" y="78" width="10" height="13" rx="5" fill={avatar.skinTone} />
        {/* ── Hair behind head ── */}
        <HairBehind style={avatar.hairStyle} color={avatar.hairColor} />
        {/* ── Ears ── */}
        <Ellipse cx="21" cy="50" rx="5.5" ry="7" fill={avatar.skinTone} />
        <Ellipse cx="79" cy="50" rx="5.5" ry="7" fill={avatar.skinTone} />
        <Ellipse cx="21" cy="50" rx="3" ry="4.5" fill={darkerSkin} />
        <Ellipse cx="79" cy="50" rx="3" ry="4.5" fill={darkerSkin} />
        {/* ── Head (anime oval with pointed chin) ── */}
        <Path
          d="M 22 44 C 22 14 50 8 50 8 C 50 8 78 14 78 44 C 78 66 62 79 50 81 C 38 79 22 66 22 44 Z"
          fill={avatar.skinTone}
        />
        {/* ── Hair front/top ── */}
        <Hair style={avatar.hairStyle} color={avatar.hairColor} />
        {/* ── Eyebrows ── */}
        <AnimeEyebrows expression={avatar.expression} color={hairDark} />
        {/* ── Eyes ── */}
        <AnimeEye cx={37} eyeColor={avatar.eyeColor} expression={avatar.expression} />
        <AnimeEye cx={63} eyeColor={avatar.eyeColor} expression={avatar.expression} />
        {/* ── Nose (minimal anime style) ── */}
        <Path d="M 48 57 Q 50 59 52 57" stroke={darkerSkin} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {/* ── Mouth ── */}
        <AnimeMouth expression={avatar.expression} />
        {/* ── Cheek blush ── */}
        <Ellipse cx="27" cy="56" rx="9" ry="5.5" fill="rgba(255,140,120,0.22)" />
        <Ellipse cx="73" cy="56" rx="9" ry="5.5" fill="rgba(255,140,120,0.22)" />
      </Svg>
    </View>
  );
}

// ─── Head-only anime avatar (for leaderboard) ────────────────────────────────

export function CartoonAvatarHead({ avatar, size = 44 }: { avatar: AvatarData; size?: number }) {
  const darkerSkin = darken(avatar.skinTone, 0.12);
  const hairDark = darken(avatar.hairColor, 0.15);

  return (
    <View style={{ width: size, height: size }}>
      {/* viewBox focuses on head: x 8→92, y 0→76 */}
      <Svg width={size} height={size} viewBox="8 0 84 76">
        {/* Hair behind (stub for ponytail/long) */}
        {(avatar.hairStyle === "long_straight") && (
          <G>
            <Rect x="16" y="44" width="12" height="34" rx="6" fill={avatar.hairColor} />
            <Rect x="72" y="44" width="12" height="34" rx="6" fill={avatar.hairColor} />
          </G>
        )}
        {avatar.hairStyle === "twin_tails" && (
          <G>
            <Path d="M 14 56 Q 8 68 10 80" stroke={avatar.hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
            <Path d="M 86 56 Q 92 68 90 80" stroke={avatar.hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
          </G>
        )}
        {/* Ears */}
        <Ellipse cx="21" cy="50" rx="5.5" ry="7" fill={avatar.skinTone} />
        <Ellipse cx="79" cy="50" rx="5.5" ry="7" fill={avatar.skinTone} />
        <Ellipse cx="21" cy="50" rx="3" ry="4.5" fill={darkerSkin} />
        <Ellipse cx="79" cy="50" rx="3" ry="4.5" fill={darkerSkin} />
        {/* Head */}
        <Path
          d="M 22 44 C 22 14 50 8 50 8 C 50 8 78 14 78 44 C 78 66 62 79 50 81 C 38 79 22 66 22 44 Z"
          fill={avatar.skinTone}
        />
        {/* Hair */}
        <Hair style={avatar.hairStyle} color={avatar.hairColor} />
        {/* Eyebrows */}
        <AnimeEyebrows expression={avatar.expression} color={hairDark} />
        {/* Eyes */}
        <AnimeEye cx={37} eyeColor={avatar.eyeColor} expression={avatar.expression} />
        <AnimeEye cx={63} eyeColor={avatar.eyeColor} expression={avatar.expression} />
        {/* Nose */}
        <Path d="M 48 57 Q 50 59 52 57" stroke={darkerSkin} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {/* Mouth */}
        <AnimeMouth expression={avatar.expression} />
        {/* Cheeks */}
        <Ellipse cx="27" cy="56" rx="9" ry="5.5" fill="rgba(255,140,120,0.22)" />
        <Ellipse cx="73" cy="56" rx="9" ry="5.5" fill="rgba(255,140,120,0.22)" />
      </Svg>
    </View>
  );
}
