import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect, G } from "react-native-svg";

export interface AvatarData {
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  clothingColor: string;
  expression: string;
  accessory?: string;
}

export const DEFAULT_AVATAR: AvatarData = {
  skinTone: "#FDDBB4",
  hairColor: "#1B3A6B",
  hairStyle: "short_spiky",
  eyeColor: "#1B3A6B",
  clothingColor: "#1B3A6B",
  expression: "happy",
};

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - Math.round(255 * amt));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amt));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + Math.round(255 * amt));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amt));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ─── Hair behind head (long styles) ──────────────────────────────────────────

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
        <Path d="M 20 54 Q 10 64 10 82 Q 10 108 16 124" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />
      );
    case "high_ponytail":
      return (
        <Path d="M 44 16 Q 60 8 66 20 Q 74 38 68 70 Q 64 100 62 128" stroke={color} strokeWidth="13" fill="none" strokeLinecap="round" />
      );
    default:
      return null;
  }
}

const CAP = "M 22 46 C 22 14 50 8 50 8 C 50 8 78 14 78 46 Q 72 30 50 28 Q 28 30 22 46 Z";
const BANGS = "M 30 40 Q 32 30 50 28 Q 68 30 70 40 L 68 48 Q 60 41 50 40 Q 40 41 32 48 Z";

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
      return <Path d={CAP} fill={color} />;
  }
}

// ─── Eyes (expressive, rounder) ──────────────────────────────────────────────

function Eye({ cx, eyeColor, expression }: { cx: number; eyeColor: string; expression: string }) {
  const cy = 46;
  const isCool = expression === "cool";
  const isExcited = expression === "excited";
  const isHappy = expression === "happy" || expression === "studious" || expression === "calm";

  if (isCool) {
    // Half-closed, sleepy cool eyes
    return (
      <G>
        <Ellipse cx={cx} cy={cy + 1} rx={9} ry={5} fill="white" />
        <Circle cx={cx} cy={cy + 1} r={4} fill={eyeColor} />
        <Circle cx={cx} cy={cy + 1} r={2.2} fill="#070714" />
        <Circle cx={cx + 2} cy={cy - 1} r={1.4} fill="white" />
        <Path d={`M ${cx - 9} ${cy + 1} Q ${cx} ${cy - 5} ${cx + 9} ${cy + 1}`} stroke={darken(eyeColor, 0.4)} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </G>
    );
  }

  if (isExcited) {
    // Large sparkling eyes
    return (
      <G>
        <Circle cx={cx} cy={cy} r={10} fill="white" stroke={darken(eyeColor, 0.3)} strokeWidth="1.5" />
        <Circle cx={cx} cy={cy} r={7} fill={eyeColor} />
        <Circle cx={cx} cy={cy} r={4.5} fill="#070714" />
        <Circle cx={cx + 3} cy={cy - 3} r={2.5} fill="white" />
        <Circle cx={cx - 2} cy={cy + 2} r={1.2} fill="rgba(255,255,255,0.7)" />
        <Path d={`M ${cx - 9} ${cy} Q ${cx} ${cy - 9} ${cx + 9} ${cy}`} stroke={darken(eyeColor, 0.5)} strokeWidth="2" fill="none" strokeLinecap="round" />
      </G>
    );
  }

  if (isHappy) {
    // Soft round friendly eyes
    return (
      <G>
        <Ellipse cx={cx} cy={cy} rx={8} ry={8.5} fill="white" stroke={darken(eyeColor, 0.2)} strokeWidth="1" />
        <Circle cx={cx} cy={cy} r={5.5} fill={eyeColor} />
        <Circle cx={cx} cy={cy} r={3} fill="#070714" />
        <Circle cx={cx + 2} cy={cy - 2.5} r={1.8} fill="white" />
        <Circle cx={cx - 1.5} cy={cy + 1.5} r={0.9} fill="rgba(255,255,255,0.6)" />
        <Path d={`M ${cx - 7} ${cy} Q ${cx} ${cy - 7} ${cx + 7} ${cy}`} stroke={darken(eyeColor, 0.4)} strokeWidth="2" fill="none" strokeLinecap="round" />
      </G>
    );
  }

  // determined / default — focused, slightly narrowed
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={8} ry={7} fill="white" stroke={darken(eyeColor, 0.2)} strokeWidth="1" />
      <Circle cx={cx} cy={cy} r={5} fill={eyeColor} />
      <Circle cx={cx} cy={cy} r={2.8} fill="#070714" />
      <Circle cx={cx + 2} cy={cy - 2} r={1.5} fill="white" />
      <Path d={`M ${cx - 8} ${cy - 1} Q ${cx} ${cy - 7} ${cx + 8} ${cy - 1}`} stroke={darken(eyeColor, 0.5)} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </G>
  );
}

// ─── Mouth ───────────────────────────────────────────────────────────────────

function Mouth({ expression }: { expression: string }) {
  switch (expression) {
    case "cool":
      return (
        <G>
          <Path d="M 43 66 L 57 66" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M 51 66 L 56 70" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" />
        </G>
      );
    case "excited":
      return (
        <G>
          <Path d="M 37 63 Q 50 77 63 63 Q 56 68 50 68 Q 44 68 37 63 Z" fill="#C0392B" />
          <Path d="M 37 63 Q 50 77 63 63" stroke="#8B0000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Path d="M 41 67 Q 50 71 59 67" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" />
          {/* Teeth hint */}
          <Rect x="42" y="63" width="16" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
        </G>
      );
    case "studious":
      return (
        <Path d="M 44 66 Q 50 70 56 66" stroke="#C0392B" strokeWidth="2" fill="none" strokeLinecap="round" />
      );
    case "calm":
      return (
        <Path d="M 44 65 Q 50 67 56 65" stroke="#C0392B" strokeWidth="2" fill="none" strokeLinecap="round" />
      );
    case "determined":
      return (
        <G>
          <Path d="M 42 67 Q 50 63 58 67" stroke="#C0392B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <Path d="M 45 68 L 55 68" stroke="#C0392B" strokeWidth="1" strokeLinecap="round" opacity={0.5} />
        </G>
      );
    default:
      // happy — wide friendly smile
      return (
        <G>
          <Path d="M 39 63 Q 50 74 61 63" stroke="#C0392B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <Path d="M 43 66 Q 50 71 57 66" stroke="rgba(192,57,43,0.3)" strokeWidth="1.2" fill="none" />
        </G>
      );
  }
}

// ─── Eyebrows ────────────────────────────────────────────────────────────────

function Eyebrows({ expression, color }: { expression: string; color: string }) {
  if (expression === "determined") {
    return (
      <G>
        <Path d="M 27 35 Q 36 31 45 36" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M 55 36 Q 64 31 73 35" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (expression === "excited") {
    return (
      <G>
        <Path d="M 28 33 Q 37 28 46 33" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M 54 33 Q 63 28 72 33" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (expression === "cool") {
    return (
      <G>
        <Path d="M 27 38 Q 36 36 45 39" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <Path d="M 55 39 Q 64 36 73 38" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  return (
    <G>
      <Path d="M 27 36 Q 37 31 46 35" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M 54 35 Q 63 31 73 36" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </G>
  );
}

// ─── Full body avatar — organic, non-square body ──────────────────────────────

export function CartoonAvatar({ avatar, size = 100 }: { avatar: AvatarData; size?: number }) {
  const clothingColor = avatar.clothingColor ?? "#1B3A6B";
  const darkerCloth = darken(clothingColor, 0.18);
  const lighterCloth = lighten(clothingColor, 0.12);
  const darkerSkin = darken(avatar.skinTone, 0.12);
  const hairDark = darken(avatar.hairColor, 0.15);
  const w = 100;
  const h = 165;
  const svgH = size * (h / w);

  return (
    <View style={{ width: size, height: svgH }}>
      <Svg width={size} height={svgH} viewBox={`0 0 ${w} ${h}`}>

        {/* ── Legs — tapered pill shape ── */}
        <Path d="M 31 128 C 28 128 26 132 26 138 L 28 158 Q 31 163 37 162 Q 43 163 44 158 L 44 134 C 44 130 42 128 40 128 Z" fill={darken(clothingColor, 0.4)} />
        <Path d="M 56 128 C 53 128 51 132 51 138 L 53 158 Q 56 163 62 162 Q 68 163 69 158 L 67 134 C 67 130 65 128 62 128 Z" fill={darken(clothingColor, 0.4)} />

        {/* ── Shoes — rounded, friendly ── */}
        <Ellipse cx="37" cy="161" rx="13" ry="5.5" fill="#2A2A3E" />
        <Ellipse cx="61" cy="161" rx="13" ry="5.5" fill="#2A2A3E" />
        <Path d="M 25 160 Q 30 157 37 158" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <Path d="M 49 160 Q 54 157 61 158" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* ── Body — organic pear/teardrop torso (wide at shoulders, gently tapered) ── */}
        <Path
          d="M 20 89 C 12 92 10 108 13 124 Q 16 136 50 138 Q 84 136 87 124 C 90 108 88 92 80 89 Q 66 82 50 83 Q 34 82 20 89 Z"
          fill={clothingColor}
        />

        {/* ── Shirt highlight (subtle sheen on upper chest) ── */}
        <Path
          d="M 28 89 C 22 92 19 102 21 114 Q 24 118 32 116 Q 26 106 28 96 Z"
          fill={lighterCloth}
          opacity={0.3}
        />

        {/* ── V-neck collar ── */}
        <Path d="M 36 90 L 50 105 L 64 90" stroke={darkerCloth} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M 36 90 L 50 105 L 64 90" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* ── Left arm — organic curved shape ── */}
        <Path
          d="M 18 92 C 10 96 8 112 10 122 Q 12 130 18 128 Q 22 128 24 124 L 22 108 L 22 94 Z"
          fill={clothingColor}
        />

        {/* ── Right arm ── */}
        <Path
          d="M 82 92 C 90 96 92 112 90 122 Q 88 130 82 128 Q 78 128 76 124 L 78 108 L 78 94 Z"
          fill={clothingColor}
        />

        {/* ── Hands — rounded, soft ── */}
        <Ellipse cx="15" cy="127" rx="8" ry="6" fill={avatar.skinTone} />
        <Ellipse cx="85" cy="127" rx="8" ry="6" fill={avatar.skinTone} />

        {/* ── Neck ── */}
        <Rect x="45" y="77" width="10" height="14" rx="5" fill={avatar.skinTone} />

        {/* ── Hair behind head ── */}
        <HairBehind style={avatar.hairStyle} color={avatar.hairColor} />

        {/* ── Ears ── */}
        <Ellipse cx="21" cy="50" rx="5.5" ry="7" fill={avatar.skinTone} />
        <Ellipse cx="79" cy="50" rx="5.5" ry="7" fill={avatar.skinTone} />
        <Ellipse cx="21" cy="50" rx="3" ry="4.5" fill={darkerSkin} />
        <Ellipse cx="79" cy="50" rx="3" ry="4.5" fill={darkerSkin} />

        {/* ── Head — round oval with softer chin ── */}
        <Path
          d="M 21 44 C 21 12 50 7 50 7 C 50 7 79 12 79 44 C 79 68 64 82 50 83 C 36 82 21 68 21 44 Z"
          fill={avatar.skinTone}
        />

        {/* ── Hair ── */}
        <Hair style={avatar.hairStyle} color={avatar.hairColor} />

        {/* ── Eyebrows ── */}
        <Eyebrows expression={avatar.expression} color={hairDark} />

        {/* ── Eyes ── */}
        <Eye cx={36} eyeColor={avatar.eyeColor} expression={avatar.expression} />
        <Eye cx={64} eyeColor={avatar.eyeColor} expression={avatar.expression} />

        {/* ── Nose (minimal) ── */}
        <Path d="M 48 57 Q 50 60 52 57" stroke={darkerSkin} strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {/* ── Mouth ── */}
        <Mouth expression={avatar.expression} />

        {/* ── Cheek blush ── */}
        <Ellipse cx="26" cy="58" rx="9" ry="5.5" fill="rgba(255,140,120,0.22)" />
        <Ellipse cx="74" cy="58" rx="9" ry="5.5" fill="rgba(255,140,120,0.22)" />
      </Svg>
    </View>
  );
}

// ─── Head-only avatar (for lists/leaderboard) ────────────────────────────────

export function CartoonAvatarHead({ avatar, size = 44 }: { avatar: AvatarData; size?: number }) {
  const darkerSkin = darken(avatar.skinTone, 0.12);
  const hairDark = darken(avatar.hairColor, 0.15);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="8 0 84 84">
        {/* Hair behind */}
        {avatar.hairStyle === "long_straight" && (
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
          d="M 21 44 C 21 12 50 7 50 7 C 50 7 79 12 79 44 C 79 68 64 82 50 83 C 36 82 21 68 21 44 Z"
          fill={avatar.skinTone}
        />
        {/* Hair */}
        <Hair style={avatar.hairStyle} color={avatar.hairColor} />
        {/* Eyebrows */}
        <Eyebrows expression={avatar.expression} color={hairDark} />
        {/* Eyes */}
        <Eye cx={36} eyeColor={avatar.eyeColor} expression={avatar.expression} />
        <Eye cx={64} eyeColor={avatar.eyeColor} expression={avatar.expression} />
        {/* Nose */}
        <Path d="M 48 57 Q 50 60 52 57" stroke={darkerSkin} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {/* Mouth */}
        <Mouth expression={avatar.expression} />
        {/* Cheeks */}
        <Ellipse cx="26" cy="58" rx="9" ry="5.5" fill="rgba(255,140,120,0.22)" />
        <Ellipse cx="74" cy="58" rx="9" ry="5.5" fill="rgba(255,140,120,0.22)" />
      </Svg>
    </View>
  );
}
