import InputField from './InputField.tsx';
interface SearchFieldProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}
export function SearchField({ searchTerm, setSearchTerm }: SearchFieldProps) {
  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <InputField label="Search" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e)} />
    </div>
  );
}