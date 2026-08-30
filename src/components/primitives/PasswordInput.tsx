import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, InputProps } from "./Input";
import { IconButton } from "./IconButton";

export interface PasswordInputProps extends Omit<InputProps, "type" | "rightIcon"> {
  showToggle?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <Input
        ref={ref}
        type={isVisible ? "text" : "password"}
        autoComplete="current-password"
        rightIcon={
          showToggle ? (
            <IconButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label={isVisible ? "Parolayı Gizle" : "Parolayı Göster"}
              icon={isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
              onClick={() => setIsVisible(!isVisible)}
              tabIndex={-1}
            />
          ) : undefined
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";
