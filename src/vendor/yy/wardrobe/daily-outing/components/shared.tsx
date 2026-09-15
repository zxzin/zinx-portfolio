import type { ReactNode } from "react";
import { getYyWardrobeAnchor, type YyWardrobeAnchorId } from "../../anchors";

export type DailyOutingPose = "idle" | "jump" | "roll" | "dance" | "moveLeft" | "moveRight" | string;

export type DailyOutingAnchorOverride = Partial<
  Record<YyWardrobeAnchorId, { x?: number; y?: number; rotate?: number; scale?: number }>
>;

export type DailyOutingWardrobeProps = {
  scale?: number;
  anchors?: DailyOutingAnchorOverride;
  pose?: DailyOutingPose;
  emotion?: string;
  equipped?: boolean;
  className?: string;
};

type DailyOutingPartRootProps = DailyOutingWardrobeProps & {
  itemId: string;
  anchorId: YyWardrobeAnchorId;
  layer: number;
  children: ReactNode;
};

export const DAILY_OUTING_COLORS = {
  yellow: "#FFE84A",
  yellowDeep: "#FFC928",
  red: "#FF405D",
  redDeep: "#D91F45",
  cream: "#FFF4D8",
  creamDeep: "#F2D79A",
  blue: "#1E8EF1",
  blueDark: "#1267C8",
  navy: "#1E2D4A",
  gold: "#F6C66B",
  mint: "#68E6C4",
  pink: "#FF7BA6",
  white: "#FFFFFF",
  shadow: "rgba(30,45,74,.16)",
};

export function anchorTransform(
  anchorId: YyWardrobeAnchorId,
  scale = 1,
  overrides: DailyOutingAnchorOverride = {},
) {
  const anchor = getYyWardrobeAnchor(anchorId);
  const override = overrides[anchorId] ?? {};
  const x = override.x ?? anchor.x;
  const y = override.y ?? anchor.y;
  const rotate = override.rotate ?? anchor.rotate;
  const anchorScale = override.scale ?? 1;

  return `translate(${x} ${y}) rotate(${rotate}) scale(${scale * anchorScale})`;
}

export function DailyOutingPartRoot({
  itemId,
  anchorId,
  layer,
  scale = 1,
  anchors,
  pose = "idle",
  emotion = "neutral",
  equipped = true,
  className,
  children,
}: DailyOutingPartRootProps) {
  if (!equipped) return null;

  return (
    <g
      className={className}
      data-wardrobe-item={itemId}
      data-wardrobe-anchor={anchorId}
      data-wardrobe-layer={layer}
      data-wardrobe-pose={pose}
      data-wardrobe-emotion={emotion}
      pointerEvents="none"
      transform={anchorTransform(anchorId, scale, anchors)}
    >
      {children}
    </g>
  );
}

export function SoftOverlayShadow({ id = "daily-outing-soft-overlay-shadow" }: { id?: string }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#1e2d4a" floodOpacity="0.14" />
    </filter>
  );
}
