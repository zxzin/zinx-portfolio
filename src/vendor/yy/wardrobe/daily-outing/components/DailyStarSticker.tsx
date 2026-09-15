import { DAILY_OUTING_COLORS, DailyOutingPartRoot, type DailyOutingWardrobeProps } from "./shared";

export function DailyStarSticker(props: DailyOutingWardrobeProps) {
  return (
    <DailyOutingPartRoot
      itemId="yy_wardrobe_daily_star_sticker"
      anchorId="face_accessory"
      layer={42}
      anchors={{ face_accessory: { x: 88, y: 178, scale: 0.72 } }}
      {...props}
    >
      <path d="M0 -18 L5 -6 L18 -6 L8 2 L12 15 L0 8 L-12 15 L-8 2 L-18 -6 L-5 -6Z" fill={DAILY_OUTING_COLORS.yellow} stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="-4" cy="-2" r="2" fill="#FFFFFF" opacity=".6" />
    </DailyOutingPartRoot>
  );
}
