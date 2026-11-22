import React from "react";
import { LucideIcon } from "lucide-react";
import { Switch } from "../../../components/primitives/Switch";

interface ToggleRowProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  checked: boolean;
  onChange: (checked: boolean) => void | Promise<unknown>;
  disabled?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
  disabled,
}) => (
  <div className="row toggle-row">
    <div className="row-start">
      {Icon && (
        <span className="row-icon" aria-hidden>
          <Icon size={16} />
        </span>
      )}
      <div>
        <div className="row-label">{label}</div>
        {description && <div className="row-desc">{description}</div>}
      </div>
    </div>
    <div className="row-control">
      <Switch
        checked={checked}
        onChange={(next) => void onChange(next)}
        disabled={disabled}
        ariaLabel={label}
      />
    </div>
  </div>
);
