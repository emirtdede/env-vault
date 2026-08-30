import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  variant?: "default" | "danger";
  disabled?: boolean;
  divider?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  title?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
  title,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleWheel = () => {
      onClose();
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [onClose]);

  // Adjust position to stay inside window bounds
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 12;
    const maxY = window.innerHeight - rect.height - 12;

    const adjustedX = Math.max(8, Math.min(x, maxX));
    const adjustedY = Math.max(8, Math.min(y, maxY));

    menuRef.current.style.left = `${adjustedX}px`;
    menuRef.current.style.top = `${adjustedY}px`;
  }, [x, y]);

  const menuContent = (
    <div
      ref={menuRef}
      role="menu"
      className="animate-scale-up"
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 999999,
        minWidth: "220px",
        maxWidth: "320px",
        backgroundColor: "var(--surface-strong)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 12px 36px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.25)",
        padding: "5px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      {title && (
        <div
          style={{
            padding: "6px 10px 5px 10px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-tertiary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
      )}

      {items.map((item) => {
        const isDanger = item.variant === "danger";

        return (
          <React.Fragment key={item.id}>
            {item.divider && (
              <div
                style={{
                  height: "1px",
                  backgroundColor: "var(--border-subtle)",
                  margin: "3px 4px",
                }}
              />
            )}
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                onClose();
                item.onClick();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                width: "100%",
                padding: "7px 10px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                backgroundColor: "transparent",
                color: isDanger ? "var(--danger)" : "var(--text-primary)",
                fontSize: "12.5px",
                fontWeight: 450,
                textAlign: "left",
                cursor: item.disabled ? "not-allowed" : "pointer",
                opacity: item.disabled ? 0.45 : 1,
                transition: "all 0.1s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (item.disabled) return;
                (e.currentTarget as HTMLElement).style.backgroundColor = isDanger
                  ? "var(--danger-subtle)"
                  : "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                {item.icon && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: isDanger ? "var(--danger)" : "var(--accent)",
                      opacity: 0.9,
                    }}
                  >
                    {item.icon}
                  </span>
                )}
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              </div>

              {item.shortcut && (
                <span
                  style={{
                    fontSize: "10.5px",
                    color: "var(--text-tertiary)",
                    marginLeft: "8px",
                  }}
                >
                  {item.shortcut}
                </span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(menuContent, document.body) : menuContent;
};
