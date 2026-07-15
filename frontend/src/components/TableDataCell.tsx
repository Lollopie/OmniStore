import React from 'react';

const VARIANTS = {
  primary: "text-slate-500",
}
interface TableDataCellProps extends React.ComponentPropsWithoutRef<'td'> {
  variant?: keyof typeof VARIANTS;
}
export default function TableDataCell({ children, variant = 'primary', className = '', ...props }: TableDataCellProps) {
  const baseTableDataCellStyle = "whitespace-nowrap px-3 py-4 text-sm";
  const variantStyles = VARIANTS[variant] || VARIANTS.primary;
  return (
    <td
      className={`${baseTableDataCellStyle} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}