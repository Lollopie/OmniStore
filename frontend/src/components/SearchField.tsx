import InputField from './InputField.tsx';
interface SearchFieldProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
}
export function SearchField({ searchTerm, setSearchTerm, className }: SearchFieldProps) {
  return (
    <InputField inputClassName={`input-sm placeholder-base-300 ${className || ''}`} type="search" value={searchTerm} setValue={setSearchTerm} placeholder="Search..." />
  );
}