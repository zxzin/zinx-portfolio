import { DailyOutingPartRoot, SoftOverlayShadow, type DailyOutingWardrobeProps } from "./shared";

export function DailyRedScarf(props: DailyOutingWardrobeProps) {
  const anchors = {
    ...props.anchors,
    body: { x: 150, y: 194, rotate: -2, scale: 1.07, ...props.anchors?.body },
  };

  return (
    <DailyOutingPartRoot itemId="yy_wardrobe_daily_red_scarf" anchorId="body" layer={45} {...props} anchors={anchors}>
      <defs>
        <linearGradient id="daily-red-scarf-fill" x1="-86" y1="-20" x2="86" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF6D70" />
          <stop offset="0.52" stopColor="#FF2F50" />
          <stop offset="1" stopColor="#D7193F" />
        </linearGradient>
        <SoftOverlayShadow id="daily-red-scarf-shadow" />
      </defs>
      <g filter="url(#daily-red-scarf-shadow)">
        <path
          d="M37 11 C49 14 66 28 76 47 C80 55 74 62 65 59 C47 52 34 38 26 20 Z"
          fill="#D7193F"
          opacity="0.22"
          transform="translate(3 5)"
        />
        <path
          d="M38 9 C52 13 68 27 77 45 C80 52 74 59 66 56 C47 49 34 35 26 17 Z"
          fill="url(#daily-red-scarf-fill)"
          stroke="#FFF4F4"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M-73 -11 C-39 -1 35 0 72 -11 C80 -6 79 8 68 15 C31 38 -32 38 -68 15 C-79 8 -81 -6 -73 -11 Z"
          fill="#B90F31"
          opacity="0.18"
          transform="translate(0 4)"
        />
        <path
          d="M-73 -14 C-39 -3 35 -3 72 -14 C82 -8 80 7 68 15 C31 38 -32 38 -68 15 C-80 7 -83 -8 -73 -14 Z"
          fill="url(#daily-red-scarf-fill)"
          stroke="#FFF4F4"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path d="M-57 -5 C-25 8 26 8 57 -6" fill="none" stroke="#FFADB4" strokeWidth="4" strokeLinecap="round" opacity="0.66" />
        <path
          d="M24 -1 C34 -12 53 -11 61 1 C67 10 60 24 46 25 C32 27 20 11 24 -1 Z"
          fill="#FF405D"
          stroke="#FFF4F4"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path d="M33 4 C41 1 50 2 55 8" fill="none" stroke="#B90F31" strokeWidth="3.4" strokeLinecap="round" opacity="0.56" />
        <path d="M49 23 C56 34 61 44 66 55" fill="none" stroke="#FFADB4" strokeWidth="3.4" strokeLinecap="round" opacity="0.58" />
      </g>
    </DailyOutingPartRoot>
  );
}
