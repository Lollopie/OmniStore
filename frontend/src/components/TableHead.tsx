import React from 'react';

const VARIANTS = {
  first: "py-3.5 pl-4 pr-3",
  other: "px-3 py-3.5",
}
interface TableHeadProps extends React.ComponentPropsWithoutRef<'th'> {
  variant?: keyof typeof VARIANTS;
}
export default function TableHead({ children, variant = 'other', scope = 'col', className = '', ...props }: TableHeadProps) {
  const baseTableHeadStyle = "text-left text-xs font-semibold uppercase tracking-wider text-slate-500";
  const variantStyles = VARIANTS[variant] || VARIANTS.other;
  return (
    <th
      className={`${baseTableHeadStyle} ${variantStyles} ${className}`}
      scope={scope}
      {...props}
    >
      {children}
    </th>
  );
}