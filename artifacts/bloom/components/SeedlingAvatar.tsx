import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path, G } from "react-native-svg";

export interface SeedlingData {
  expression: string;
  petalColor: string;
  potColor: string;
}

export const DEFAULT_SEEDLING: SeedlingData = {
  expression: "happy",
  petalColor: "#F5C518",
  potColor: "#C17A5F",
};

export function getStage(coins: number): 1 | 2 | 3 | 4 {
  if (coins >= 2000) return 4;
  if (coins >= 500) return 3;
  if (coins >= 100) return 2;
  return 1;
}

const STEM = "#16A34A";
const LEAF = "#22C55E";
const LEAF_D = "#15803D";
const HEAD = "#86EFAC";
const CHEEK = "rgba(255,150,120,0.3)";

interface LeafDef { y: number; s: number }
interface StageConf { headCY: number; headR: number; leaves: LeafDef[] }

const STAGES: Record<number, StageConf> = {
  1: { headCY: 108, headR: 14, leaves: [{ y: 121, s: 0.8 }] },
  2: { headCY: 93,  headR: 16, leaves: [{ y: 120, s: 0.82 }, { y: 110, s: 0.94 }] },
  3: { headCY: 77,  headR: 18, leaves: [{ y: 120, s: 0.82 }, { y: 110, s: 0.9 }, { y: 100, s: 1.0 }] },
  4: { headCY: 62,  headR: 20, leaves: [{ y: 121, s: 0.78 }, { y: 111, s: 0.87 }, { y: 101, s: 0.94 }, { y: 90, s: 1.0 }] },
};

function lp(y: number, s: number) {
  return `M 50 ${y} C ${50-8*s} ${y-7*s} ${50-20*s} ${y-5*s} ${50-22*s} ${y+2*s} C ${50-24*s} ${y+8*s} ${50-10*s} ${y+9*s} 50 ${y} Z`;
}
function rp(y: number, s: number) {
  return `M 50 ${y} C ${50+8*s} ${y-7*s} ${50+20*s} ${y-5*s} ${50+22*s} ${y+2*s} C ${50+24*s} ${y+8*s} ${50+10*s} ${y+9*s} 50 ${y} Z`;
}

function SeedEye({ cx, cy, r, expression }: { cx: number; cy: number; r: number; expression: string }) {
  if (expression === "cool") {
    return (
      <G>
        <Ellipse cx={cx} cy={cy + r*0.15} rx={r} ry={r*0.55} fill="white" />
        <Circle cx={cx} cy={cy + r*0.15} r={r*0.5} fill="#1B3A6B" />
        <Circle cx={cx} cy={cy + r*0.15} r={r*0.25} fill="#070714" />
        <Circle cx={cx + r*0.3} cy={cy} r={r*0.18} fill="white" />
        <Path d={`M ${cx-r} ${cy+r*0.05} Q ${cx} ${cy-r*0.55} ${cx+r} ${cy+r*0.05}`} stroke="#1B3A6B" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (expression === "excited") {
    return (
      <G>
        <Circle cx={cx} cy={cy} r={r*1.15} fill="white" />
        <Circle cx={cx} cy={cy} r={r*0.78} fill="#1B3A6B" />
        <Circle cx={cx} cy={cy} r={r*0.42} fill="#070714" />
        <Circle cx={cx+r*0.3} cy={cy-r*0.3} r={r*0.25} fill="white" />
      </G>
    );
  }
  if (expression === "determined") {
    return (
      <G>
        <Ellipse cx={cx} cy={cy} rx={r} ry={r*0.78} fill="white" />
        <Circle cx={cx} cy={cy} r={r*0.6} fill="#1B3A6B" />
        <Circle cx={cx} cy={cy} r={r*0.3} fill="#070714" />
        <Circle cx={cx+r*0.25} cy={cy-r*0.25} r={r*0.17} fill="white" />
        <Path d={`M ${cx-r} ${cy-r*0.15} Q ${cx} ${cy-r*0.78} ${cx+r} ${cy-r*0.15}`} stroke="#1B3A6B" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </G>
    );
  }
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="white" />
      <Circle cx={cx} cy={cy} r={r*0.62} fill="#1B3A6B" />
      <Circle cx={cx} cy={cy} r={r*0.33} fill="#070714" />
      <Circle cx={cx+r*0.24} cy={cy-r*0.24} r={r*0.19} fill="white" />
    </G>
  );
}

function SeedMouth({ cx, cy, r, expression }: { cx: number; cy: number; r: number; expression: string }) {
  const mW = r * 0.62;
  switch (expression) {
    case "excited":
      return (
        <G>
          <Path d={`M ${cx-mW} ${cy} Q ${cx} ${cy+r*0.85} ${cx+mW} ${cy} Q ${cx+mW*0.6} ${cy+r*0.45} ${cx-mW*0.6} ${cy+r*0.45} Z`} fill="#DC2626" />
          <Path d={`M ${cx-mW*0.55} ${cy+r*0.08} L ${cx+mW*0.55} ${cy+r*0.08}`} stroke="rgba(255,255,255,0.55)" strokeWidth={r*0.3} fill="none" strokeLinecap="round" />
        </G>
      );
    case "cool":
      return <Path d={`M ${cx-mW*0.55} ${cy+r*0.12} L ${cx+mW*0.55} ${cy+r*0.12} M ${cx+mW*0.15} ${cy+r*0.12} L ${cx+mW*0.55} ${cy+r*0.55}`} stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" fill="none" />;
    case "studious":
      return <Path d={`M ${cx-mW*0.5} ${cy} Q ${cx} ${cy+r*0.5} ${cx+mW*0.5} ${cy}`} stroke="#DC2626" strokeWidth="1.4" fill="none" strokeLinecap="round" />;
    case "calm":
      return <Path d={`M ${cx-mW*0.4} ${cy+r*0.1} Q ${cx} ${cy+r*0.25} ${cx+mW*0.4} ${cy+r*0.1}`} stroke="#DC2626" strokeWidth="1.2" fill="none" strokeLinecap="round" />;
    case "determined":
      return <Path d={`M ${cx-mW*0.5} ${cy+r*0.2} Q ${cx} ${cy-r*0.1} ${cx+mW*0.5} ${cy+r*0.2}`} stroke="#DC2626" strokeWidth="1.4" fill="none" strokeLinecap="round" />;
    default:
      return <Path d={`M ${cx-mW*0.7} ${cy} Q ${cx} ${cy+r*0.7} ${cx+mW*0.7} ${cy}`} stroke="#DC2626" strokeWidth="1.7" fill="none" strokeLinecap="round" />;
  }
}

function Petals({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <G>
      {angles.map(a => {
        const rad = (a * Math.PI) / 180;
        const d = r * 1.26;
        const px = cx + Math.cos(rad) * d;
        const py = cy + Math.sin(rad) * d;
        return (
          <Ellipse key={a} cx={px} cy={py} rx={r * 0.27} ry={r * 0.44} fill={color} opacity={0.9}
            transform={`rotate(${a} ${px} ${py})`} />
        );
      })}
    </G>
  );
}

export function SeedlingAvatar({
  seedling,
  size = 100,
  coins = 0,
}: {
  seedling: SeedlingData;
  size?: number;
  coins?: number;
}) {
  const stage = getStage(coins);
  const { headCY, headR, leaves } = STAGES[stage]!;
  const stemTop = headCY + headR;
  const W = 100, H = 170;
  const svgH = size * (H / W);
  const eyeR = headR * 0.27;
  const eyeLX = 50 - headR * 0.37;
  const eyeRX = 50 + headR * 0.37;
  const eyeY = headCY - headR * 0.1;
  const mCY = headCY + headR * 0.38;
  const mR = headR * 0.68;

  return (
    <View style={{ width: size, height: svgH }}>
      <Svg width={size} height={svgH} viewBox={`0 0 ${W} ${H}`}>
        {/* Pot body */}
        <Path d="M 28 132 L 32 162 Q 50 168 68 162 L 72 132 Z" fill={seedling.potColor} stroke="#D1D5DB" strokeWidth="1" />
        <Path d="M 32 135 L 34 158 Q 35 163 33 162" stroke="rgba(180,180,180,0.35)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Pot rim (gold) */}
        <Ellipse cx={50} cy={132} rx={22} ry={6} fill="#F5C518" />
        <Path d="M 33 130 Q 50 127 67 130" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Soil */}
        <Ellipse cx={50} cy={132} rx={18} ry={4} fill="#4A2912" />
        {/* Stem */}
        <Path d={`M 50 126 L 50 ${stemTop}`} stroke={STEM} strokeWidth="4.5" strokeLinecap="round" />
        {/* Leaves */}
        {leaves.map((l, i) => (
          <G key={i}>
            <Path d={lp(l.y, l.s)} fill={LEAF} stroke={LEAF_D} strokeWidth="0.5" />
            <Path d={rp(l.y, l.s)} fill={LEAF} stroke={LEAF_D} strokeWidth="0.5" />
          </G>
        ))}
        {/* Stage 3: flower bud on top */}
        {stage === 3 && (
          <G>
            <Path d={`M 50 ${headCY - headR} L 50 ${headCY - headR - 5}`} stroke={STEM} strokeWidth="2.5" strokeLinecap="round" />
            <Ellipse cx={50} cy={headCY - headR - 11} rx={7} ry={9} fill={seedling.petalColor} opacity={0.88} />
            <Ellipse cx={50} cy={headCY - headR - 11} rx={4} ry={5} fill={seedling.petalColor} />
          </G>
        )}
        {/* Stage 4: full petals */}
        {stage === 4 && <Petals cx={50} cy={headCY} r={headR} color={seedling.petalColor} />}
        {/* Head */}
        <Circle cx={50} cy={headCY} r={headR} fill={HEAD} />
        <Path d={`M ${50-headR*0.65} ${headCY-headR*0.32} Q 50 ${headCY-headR*1.08} ${50+headR*0.65} ${headCY-headR*0.32}`} stroke="rgba(255,255,255,0.42)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {/* Cheeks */}
        <Ellipse cx={50-headR*0.54} cy={headCY+headR*0.14} rx={headR*0.27} ry={headR*0.17} fill={CHEEK} />
        <Ellipse cx={50+headR*0.54} cy={headCY+headR*0.14} rx={headR*0.27} ry={headR*0.17} fill={CHEEK} />
        {/* Eyes */}
        <SeedEye cx={eyeLX} cy={eyeY} r={eyeR} expression={seedling.expression} />
        <SeedEye cx={eyeRX} cy={eyeY} r={eyeR} expression={seedling.expression} />
        {/* Mouth */}
        <SeedMouth cx={50} cy={mCY} r={mR} expression={seedling.expression} />
      </Svg>
    </View>
  );
}

export function SeedlingAvatarHead({
  seedling,
  size = 44,
  coins = 0,
}: {
  seedling: SeedlingData;
  size?: number;
  coins?: number;
}) {
  const stage = getStage(coins);
  const cx = 30, cy = 28, r = 19;
  const eyeR = r * 0.26;
  const eyeLX = cx - r * 0.36;
  const eyeRX = cx + r * 0.36;
  const eyeY = cy - r * 0.1;
  const mCY = cy + r * 0.4;
  const mR = r * 0.66;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 60 60">
        {/* Stage 4 petals */}
        {stage === 4 && (
          <G>
            {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
              const rad = (a * Math.PI) / 180;
              const d = r * 1.18;
              const px = cx + Math.cos(rad) * d;
              const py = cy + Math.sin(rad) * d;
              return (
                <Ellipse key={a} cx={px} cy={py} rx={r*0.23} ry={r*0.38}
                  fill={seedling.petalColor} opacity={0.9}
                  transform={`rotate(${a} ${px} ${py})`} />
              );
            })}
          </G>
        )}
        {/* Stage 3 bud */}
        {stage === 3 && (
          <G>
            <Path d={`M ${cx} ${cy-r} L ${cx} ${cy-r-4}`} stroke={STEM} strokeWidth="2" strokeLinecap="round" />
            <Ellipse cx={cx} cy={cy-r-9} rx={5} ry={6.5} fill={seedling.petalColor} opacity={0.88} />
            <Ellipse cx={cx} cy={cy-r-9} rx={3} ry={4} fill={seedling.petalColor} />
          </G>
        )}
        {/* Stem stub */}
        <Path d={`M ${cx} ${cy+r} L ${cx} ${cy+r+9}`} stroke={STEM} strokeWidth="3.5" strokeLinecap="round" />
        {/* Tiny leaves */}
        <Path d={`M ${cx} ${cy+r+4} C ${cx-5} ${cy+r} ${cx-11} ${cy+r+2} ${cx-12} ${cy+r+7} C ${cx-13} ${cy+r+11} ${cx-6} ${cy+r+10} ${cx} ${cy+r+4} Z`} fill={LEAF} />
        <Path d={`M ${cx} ${cy+r+4} C ${cx+5} ${cy+r} ${cx+11} ${cy+r+2} ${cx+12} ${cy+r+7} C ${cx+13} ${cy+r+11} ${cx+6} ${cy+r+10} ${cx} ${cy+r+4} Z`} fill={LEAF} />
        {/* Head */}
        <Circle cx={cx} cy={cy} r={r} fill={HEAD} />
        <Path d={`M ${cx-r*0.63} ${cy-r*0.3} Q ${cx} ${cy-r*1.07} ${cx+r*0.63} ${cy-r*0.3}`} stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* Cheeks */}
        <Ellipse cx={cx-r*0.54} cy={cy+r*0.14} rx={r*0.26} ry={r*0.16} fill={CHEEK} />
        <Ellipse cx={cx+r*0.54} cy={cy+r*0.14} rx={r*0.26} ry={r*0.16} fill={CHEEK} />
        {/* Eyes */}
        <SeedEye cx={eyeLX} cy={eyeY} r={eyeR} expression={seedling.expression} />
        <SeedEye cx={eyeRX} cy={eyeY} r={eyeR} expression={seedling.expression} />
        {/* Mouth */}
        <SeedMouth cx={cx} cy={mCY} r={mR} expression={seedling.expression} />
      </Svg>
    </View>
  );
}
