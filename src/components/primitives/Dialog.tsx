import React, { useEffect } from "react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";
import { GlassSurface } from "./GlassSurface";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "480px",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1000,
        padding: "var(--space-4)",
      }}
      className="animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GlassSurface
        intensity="strong"
        blur="lg"
        borderRadius="var(--radius-xl)"
        style={{
          width: "100%",
          maxWidth,
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
        className="animate-scale-up"
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "var(--space-5) var(--space-6) var(--space-3) var(--space-6)",
            borderBottom: "1px solid var(--separator)",
          }}
        >
          <div>
            <h2
              id="dialog-title"
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                style={{
                  fontSize: "12.5px",
                  color: "var(--text-secondary)",
                  marginTop: "2px",
                }}
              >
                {description}
              </p>
            )}
          </div>
          <IconButton
            icon={<X size={16} />}
            aria-label="Kapat"
            size="sm"
            onClick={onClose}
          />
        </header>
        <div
          style={{
            padding: "var(--space-6)",
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      </GlassSurface>
    </div>
  );
};
