import React from 'react';

const VARIANTS = {
  primary: "border-slate-300 bg-white text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-500 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  add: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors",
}
const SIZES = {
  sm: "rounded px-3 py-1.5 text-sm",
  md: "rounded-md px-4 py-2 text-base",
  lg: "rounded-lg px-6 py-3 text-lg",
}
interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}
export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const baseButtonStyles = "border font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";

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