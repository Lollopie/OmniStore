const SIZES = {
  xs: "input-xs",
  sm: "input-sm",
  md: "input-md",
  lg: "input-lg",
  xl: "input-xl"
}
interface InputFieldProps extends React.HTMLProps<HTMLInputElement> {
  label?: string;
  className?: string;
  fieldSize?: keyof typeof SIZES;
  setValue?: (value: string) => void;
}

export default function InputField({ label, fieldSize, className, setValue, ...props }: InputFieldProps) {
  const baseInputFieldStyle = "input focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
  return (
    <div className={`max-w-2xl w-full`}>
      <fieldset className="fieldset w-full">
        {label && <label className="label">{label}</label>}
        <input
          className={`${baseInputFieldStyle} ${className || ''} ${fieldSize ? SIZES[fieldSize] : ''}`}
          {...props}
          onChange={e => setValue && setValue(e.target.value)}
        />
      </fieldset>
    </div>
  );
}