import React from "react";

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: "sm" | "md" | "lg";
  intensity?: "normal" | "strong";
  borderRadius?: string;
  bordered?: boolean;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  blur = "md",
  intensity = "normal",
  borderRadius = "var(--radius-lg)",
  bordered = true,
  children,
  style,
  className = "",
  ...props
}) => {
  const getBlurValue = () => {
    switch (blur) {
      case "sm":
        return "var(--glass-blur-sm)";
      case "lg":
        return "var(--glass-blur-lg)";
      default:
        return "var(--glass-blur-md)";
    }
  };

  const getBackground = () => {
    return intensity === "strong"
      ? "var(--glass-bg-strong, var(--surface-strong))"
      : "var(--glass-bg, var(--surface))";
  };

  return (
    <div
      style={{
        backgroundColor: getBackground(),
        backdropFilter: `blur(${getBlurValue()})`,
        WebkitBackdropFilter: `blur(${getBlurValue()})`,
        border: bordered ? "1px solid var(--glass-border, var(--border))" : "none",
        borderRadius,
        boxShadow: "var(--shadow-md)",
        ...style,
      }}
      className={`glass-surface ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
