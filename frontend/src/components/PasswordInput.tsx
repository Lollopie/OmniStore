import React, { useState } from 'react';
import Button from './Button.tsx';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label = 'Password', error, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="flex flex-col gap-1 w-full max-w-2xl mb-4">
        {label && (
          <label htmlFor={props.id || 'password-input'} className="text-sm font-medium text-base-content">
            {label}
          </label>
        )}
        <div className="relative flex items-center max-w-xs">
          <input
            {...props}
            ref={ref}
            id={props.id || 'password-input'}
            type={showPassword ? 'text' : 'password'}
            className={`input focus:outline-none focus:ring-1 focus:border-accent focus:ring-accent ${className}`}
          />

          <Button
            type="button"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            size='xs'
            className="btn-ghost hover: absolute right-2 p-1 text-base-200 rounded"
          >
            {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <use href="/icons.svg#eye-off-icon" />
                </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <use href="/icons.svg#eye-icon" />
              </svg>
            )}
          </Button>
        </div>

        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';