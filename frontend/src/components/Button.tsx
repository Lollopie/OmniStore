const VARIANTS = {
  primary: "border-slate-300 bg-white text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-500",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  add: "bg-green-500 text-white hover:bg-green-400 focus-visible:outline-green-600",
}
const SIZES = {
  sm: "rounded px-3 py-1.5 text-sm",
  md: "rounded-md px-4 py-2 text-base",
  lg: "rounded-lg px-6 py-3 text-lg",
}
export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
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