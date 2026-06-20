interface InputFieldProps {
  label: string;
  type: 'text' | 'password';
  value: string;
  onChange: (value: string) => void;
}

export default function InputField({ label, type, value, onChange }: InputFieldProps) {
  return (
    <div className="mb-4 last:mb-6">
      <label className="block text-sm font-semibold text-gray-800">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border bg-gray-50 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}