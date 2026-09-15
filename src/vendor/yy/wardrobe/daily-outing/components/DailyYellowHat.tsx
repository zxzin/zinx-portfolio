import { DAILY_OUTING_COLORS, DailyOutingPartRoot, SoftOverlayShadow, type DailyOutingWardrobeProps } from "./shared";

export function DailyYellowHat(props: DailyOutingWardrobeProps) {
  const anchors = {
    ...props.anchors,
    hat: { x: 142, y: 42, rotate: -3, scale: 1.07, ...props.anchors?.hat },
  };

  return (
    <DailyOutingPartRoot itemId="yy_wardrobe_daily_yellow_hat" anchorId="hat" layer={30} {...props} anchors={anchors}>
      <defs>
        <linearGradient id="daily-yellow-hat-fill" x1="-58" y1="-30" x2="58" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF577" />
          <stop offset="0.48" stopColor="#FFE24A" />
          <stop offset="1" stopColor="#FFC62A" />
        </linearGradient>
        <linearGradient id="daily-yellow-hat-shade" x1="-54" y1="7" x2="58" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F5C21D" />
          <stop offset="1" stopColor="#E6A90F" />
        </linearGradient>
        <SoftOverlayShadow id="daily-yellow-hat-shadow" />
      </defs>
      <g filter="url(#daily-yellow-hat-shadow)">
        <path
          d="M-55 19 C-55 4 -43 -12 -19 -21 C11 -32 43 -24 58 -6 C68 7 67 20 55 28 C35 40 -30 39 -50 27 C-55 24 -58 21 -55 19Z"
          fill="#C98E00"
          opacity="0.16"
          transform="translate(0 5)"
        />
        <path
          d="M-55 17 C-55 1 -42 -14 -18 -23 C12 -34 43 -25 58 -8 C69 5 68 18 55 26 C34 38 -30 37 -50 25 C-56 21 -58 18 -55 17Z"
          fill="url(#daily-yellow-hat-fill)"
          stroke="#FFF2A8"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path
          d="M-42 13 C-18 22 22 23 48 11"
          fill="none"
          stroke="url(#daily-yellow-hat-shade)"
          strokeWidth="4.2"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path d="M-28 4 C-4 -3 25 -5 47 -15" fill="none" stroke="#FFF7AD" strokeWidth="3" strokeLinecap="round" opacity="0.48" />
        <path d="M-4 -23 C3 -34 18 -31 19 -19" fill="none" stroke={DAILY_OUTING_COLORS.red} strokeWidth="4.6" strokeLinecap="round" />
        <circle cx="27" cy="-13" r="3.3" fill="#FFFFFF" opacity="0.68" />
      </g>
    </DailyOutingPartRoot>
  );
}
