import React from "react";

export interface LogoProps {
  size?: number;
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({
  size = 28,
  showText = true,
  showBadge = false,
  className = "",
  style = {},
}) => {
  const textSize = Math.max(13, Math.round(size * 0.52));

  return (
    <div
      className={`env-vault-logo ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: `${Math.max(6, Math.round(size * 0.3))}px`,
        userSelect: "none",
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          flexShrink: 0,
          filter: "drop-shadow(0 2px 10px rgba(0, 240, 255, 0.4))",
          transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <defs>
          {/* Radial Glow */}
          <radialGradient id={`bgGlow-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#0A84FF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Outer Shield Gradient */}
          <linearGradient id={`shieldBase-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#142442" />
            <stop offset="40%" stopColor="#0C172B" />
            <stop offset="100%" stopColor="#060C17" />
          </linearGradient>

          {/* Neon Rim Cyber Gradient */}
          <linearGradient id={`neonRim-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="30%" stopColor="#00F0FF" />
            <stop offset="65%" stopColor="var(--accent, #0A84FF)" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>

          {/* Lock Metallic Body Gradient */}
          <linearGradient id={`lockBodyGrad-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="40%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#082F49" />
          </linearGradient>

          {/* Lock Shackle Metallic Gradient */}
          <linearGradient id={`shackleGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#E0F2FE" />
            <stop offset="75%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Keyhole & Core Neon Gradient */}
          <linearGradient id={`keyholeGrad-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Glass Highlight Reflection */}
          <linearGradient id={`glassSheen-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Light Background */}
        <circle cx="256" cy="256" r="250" fill={`url(#bgGlow-${size})`} />

        {/* Outer Shield Contour */}
        <path
          d="M 256,16 L 484,72 C 484,260 416,428 256,496 C 96,428 28,260 28,72 Z"
          fill={`url(#shieldBase-${size})`}
          stroke={`url(#neonRim-${size})`}
          strokeWidth="18"
          strokeLinejoin="round"
        />

        {/* Inner Shield Inset Plate */}
        <path
          d="M 256,40 L 460,90 C 460,250 398,398 256,462 C 114,398 52,250 52,90 Z"
          fill="#080F1E"
          stroke="#00F0FF"
          strokeWidth="4"
          strokeOpacity="0.6"
        />

        {/* Diagonal Glass Sheen Reflection */}
        <path
          d="M 256,40 L 460,90 C 460,175 440,265 395,335 L 210,120 L 256,40 Z"
          fill={`url(#glassSheen-${size})`}
        />

        {/* Cyber Accents */}
        <g opacity="0.6" stroke="#38BDF8" strokeWidth="3.5" fill="none" strokeLinecap="round">
          <path d="M 85,150 L 130,150 L 155,180" />
          <circle cx="85" cy="150" r="4.5" fill="#00F0FF" />

          <path d="M 427,150 L 382,150 L 357,180" />
          <circle cx="427" cy="150" r="4.5" fill="#00F0FF" />
        </g>

        {/* ================= MASTER PADLOCK ================= */}
        {/* Shackle Shadow & Base Arch */}
        <path
          d="M 204,228 L 204,168 C 204,136 227.3,110 256,110 C 284.7,110 308,136 308,168 L 308,228"
          fill="none"
          stroke="#030712"
          strokeWidth="38"
          strokeLinecap="round"
        />

        {/* Shackle Main Metallic Arch */}
        <path
          d="M 204,228 L 204,168 C 204,136 227.3,110 256,110 C 284.7,110 308,136 308,168 L 308,228"
          fill="none"
          stroke={`url(#shackleGrad-${size})`}
          strokeWidth="26"
          strokeLinecap="round"
        />

        {/* Shackle Center Specular Line */}
        <path
          d="M 204,222 L 204,168 C 204,140 227.3,118 256,118 C 284.7,118 308,140 308,168 L 308,222"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Padlock Body */}
        <rect
          x="160"
          y="206"
          width="192"
          height="160"
          rx="28"
          fill={`url(#lockBodyGrad-${size})`}
          stroke="#38BDF8"
          strokeWidth="8"
        />

        {/* Inner Chamber Plate */}
        <rect
          x="174"
          y="220"
          width="164"
          height="132"
          rx="18"
          fill="#041E3A"
          stroke="#00F0FF"
          strokeWidth="2.5"
          strokeOpacity="0.7"
        />

        {/* Padlock Cyber Grooves */}
        <g stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" opacity="0.85">
          <line x1="186" y1="262" x2="216" y2="262" />
          <line x1="186" y1="284" x2="210" y2="284" />
          <line x1="186" y1="306" x2="216" y2="306" />

          <line x1="296" y1="262" x2="326" y2="262" />
          <line x1="302" y1="284" x2="326" y2="284" />
          <line x1="296" y1="306" x2="326" y2="306" />
        </g>

        {/* Corner Rivets */}
        <circle cx="188" cy="232" r="3.5" fill="#38BDF8" />
        <circle cx="324" cy="232" r="3.5" fill="#38BDF8" />
        <circle cx="188" cy="338" r="3.5" fill="#38BDF8" />
        <circle cx="324" cy="338" r="3.5" fill="#38BDF8" />

        {/* Glowing Cyber Keyhole */}
        <circle cx="256" cy="272" r="32" fill="#020B18" stroke="#00F0FF" strokeWidth="3.5" />
        <circle cx="256" cy="264" r="14" fill={`url(#keyholeGrad-${size})`} />
        <path
          d="M 250,270 L 244,295 C 244,300 268,300 268,295 L 262,270 Z"
          fill={`url(#keyholeGrad-${size})`}
        />
        <circle cx="256" cy="264" r="6" fill="#FFFFFF" />
        <circle cx="256" cy="290" r="3.5" fill="#FFFFFF" />

        {/* Top Binary Protection Dots */}
        <circle cx="220" cy="80" r="4.5" fill="#38BDF8" />
        <circle cx="256" cy="62" r="6" fill="#FFFFFF" />
        <circle cx="292" cy="80" r="4.5" fill="#38BDF8" />
      </svg>

      {showText && (
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span
            style={{
              fontSize: `${textSize}px`,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            Env Vault
          </span>
          {showBadge && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "1px 5px",
                borderRadius: "4px",
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              Vellium
            </span>
          )}
        </div>
      )}
    </div>
  );
};
