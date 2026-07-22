interface InputFieldProps {
  label?: string;
  type: 'text' | 'password' | 'number' | 'search';
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  size?: string;
}

export default function InputField({ label, type, value, onChange, className, placeholder, size }: InputFieldProps) {
  const baseInputFieldStyle = "input focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
  return (
    <div className={`max-w-2xl w-full`}>
      <fieldset className="fieldset w-full">
        {label && <label className="label">{label}</label>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputFieldStyle} ${className || ''} ${size}`}
          placeholder={placeholder}
        />
      </fieldset>
    </div>
  );
}