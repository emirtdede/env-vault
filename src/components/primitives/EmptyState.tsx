import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "var(--space-10) var(--space-6)",
        gap: "var(--space-3)",
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "48px",
          height: "48px",
          borderRadius: "var(--radius-xl)",
          backgroundColor: "var(--surface-subtle)",
          color: "var(--text-tertiary)",
          border: "1px solid var(--border-subtle)",
          marginBottom: "var(--space-2)",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          maxWidth: "340px",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <div style={{ marginTop: "var(--space-2)" }}>
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
