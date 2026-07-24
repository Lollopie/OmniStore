import React from 'react';

const VARIANTS = {
  primary: "btn-primary",
  danger: "btn-error",
  add: "btn-accent",
  info: "btn-info",
}
const SIZES = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
}
interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}
export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const baseButtonStyles = "btn";

  const variantStyles = VARIANTS[variant] || VARIANTS.primary;
  const sizeStyles = SIZES[size] || SIZES.md;
  return (
    <button
      className={`${baseButtonStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}