const VARIANTS = {
  primary: " focus:ring-accent ",
  danger: "  focus:ring-error "
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
  fieldSize?: keyof typeof SIZES;
  setValue?: (value: string) => void;
  fieldsetClassName?: string;
  inputClassName?: string;
}

export default function InputField({ variant, label, fieldSize, inputClassName, setValue, ...props }: InputFieldProps) {
  const baseInputFieldStyle = "input focus:outline-none focus:ring-2 focus:border-none ";
  const variantStyle = variant ? VARIANTS[variant] : VARIANTS['primary'];
  return (
    <fieldset className={`fieldset ${props.fieldsetClassName || ''}`}>
      {label && <label htmlFor={label} className="label text-base-content">
        {label}
      </label>}
      <input
        name={label}
        id={label}
        className={`${baseInputFieldStyle} ${variantStyle} ${inputClassName || ''} ${fieldSize ? SIZES[fieldSize] : ''}`}
        {...props}
        onChange={e => setValue && setValue(e.target.value)}
      />
    </fieldset>
  );
}