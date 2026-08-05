const VARIANTS = {
  primary: " focus:border-accent focus:ring-accent ",
  danger: " focus:border-error focus:ring-error "
};
const SIZES = {
  xs: "input-xs",
  sm: "input-sm",
  md: "input-md",
  lg: "input-lg",
  xl: "input-xl"
}
interface InputFieldProps extends React.HTMLProps<HTMLInputElement> {
  variant?: keyof typeof VARIANTS;
  label?: string;
  className?: string;
  fieldSize?: keyof typeof SIZES;
  setValue?: (value: string) => void;
}

export default function InputField({ variant, label, fieldSize, className, setValue, ...props }: InputFieldProps) {
  const baseInputFieldStyle = "input focus:outline-none focus:ring-1";
  const variantStyle = variant ? VARIANTS[variant] : VARIANTS['primary'];
  return (
    <div className={`max-w-2xl w-full`}>
      <fieldset className="fieldset w-full">
        {label && <label htmlFor={label} className="label text-base-content">
          {label}
        </label>}
        <input
          name={label}
          id={label}
          className={`${baseInputFieldStyle} ${variantStyle} ${className || ''} ${fieldSize ? SIZES[fieldSize] : ''}`}
          {...props}
          onChange={e => setValue && setValue(e.target.value)}
        />
      </fieldset>
    </div>
  );
}