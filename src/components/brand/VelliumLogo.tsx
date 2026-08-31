import React from "react";

export interface VelliumLogoProps {
  size?: number;
  showText?: boolean;
  layout?: "horizontal" | "vertical";
  className?: string;
  style?: React.CSSProperties;
}

export const VelliumLogo: React.FC<VelliumLogoProps> = ({
  size = 32,
  showText = true,
  layout = "horizontal",
  className = "",
  style = {},
}) => {
  return (
    <div
      className={`vellium-brand-logo ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: layout === "vertical" ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: layout === "vertical" ? `${Math.max(6, Math.round(size * 0.16))}px` : `${Math.max(8, Math.round(size * 0.3))}px`,
        userSelect: "none",
        color: "inherit",
        ...style,
      }}
    >

      <svg
        width={size}
        height={Math.round(size * 0.8)}
        viewBox="0 145 1024 818"
        preserveAspectRatio="xMidYMid meet"
        fill="currentColor"
        style={{
          flexShrink: 0,
          display: "block",
          filter: "drop-shadow(0 2px 8px var(--accent-subtle, rgba(0, 163, 255, 0.2)))",
        }}
      >
        <g
          transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)"
          fill="currentColor"
          stroke="none"
        >
          <path d="M53 8745 c-34 -24 -29 -64 12 -112 52 -61 101 -80 235 -93 410 -38 673 -149 923 -389 161 -155 293 -332 442 -591 106 -186 1284 -2552 2777 -5580 621 -1260 655 -1327 674 -1334 22 -8 47 38 236 422 773 1576 1151 2344 1548 3147 117 237 259 525 315 640 350 715 1261 2549 1313 2643 256 465 528 758 836 903 161 75 298 110 530 135 175 19 214 32 266 91 46 53 53 93 18 117 -27 19 -189 21 -718 6 -626 -18 -768 -30 -1008 -86 -260 -61 -467 -156 -682 -313 -97 -71 -300 -274 -374 -374 -147 -198 -178 -257 -674 -1272 -115 -236 -373 -761 -572 -1165 -200 -404 -504 -1023 -676 -1375 -369 -754 -336 -690 -354 -690 -8 0 -67 106 -141 255 -185 368 -886 1784 -1431 2890 -469 952 -541 1092 -626 1225 -287 449 -705 733 -1233 839 -228 46 -487 61 -1203 72 -373 5 -413 5 -433 -11z m1717 -370 c184 -30 402 -121 560 -234 171 -121 350 -325 463 -527 55 -99 606 -1204 1367 -2744 608 -1230 930 -1873 946 -1890 12 -13 16 -13 28 0 13 13 278 547 751 1515 62 127 240 487 395 800 155 314 331 669 390 790 355 726 736 1487 780 1560 166 275 368 471 615 597 207 105 451 166 553 139 76 -21 66 -62 -72 -288 -85 -140 -211 -382 -396 -758 -92 -187 -353 -713 -580 -1170 -792 -1595 -1317 -2664 -1742 -3550 -399 -830 -687 -1410 -702 -1413 -20 -4 -297 544 -701 1388 -430 899 -2542 5154 -2657 5355 -26 44 -80 137 -121 208 -86 146 -94 169 -73 202 24 37 64 41 196 20z" />
        </g>
      </svg>
      {showText && (
        <span
          style={{
            fontSize: `${Math.max(14, Math.round(size * 0.55))}px`,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          Vellium
        </span>
      )}
    </div>
  );
};
