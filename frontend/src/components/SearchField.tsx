import InputField from './InputField.tsx';
interface SearchFieldProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
}
export function SearchField({ searchTerm, setSearchTerm, className }: SearchFieldProps) {
  return (
    <div>
      <InputField className={`input-sm ${className || ''}`} type="search" value={searchTerm} onChange={(e) => setSearchTerm(e)} placeholder="Search..." />
    </div>
  );
}