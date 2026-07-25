import { useState } from 'react';
import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';

interface ItemFormProps {
  initialValues?: { name: string; amount: string };
  submitLabel: string;
  onSubmit: (data: { name: string; amount: number }) => void;
  onCancel: () => void;
}

export const ItemForm = ({
                           initialValues = { name: '', amount: '0' },
                           submitLabel,
                           onSubmit,
                           onCancel,
                         }: ItemFormProps) => {
  const [name, setName] = useState(initialValues.name);
  const [amount, setAmount] = useState<string>(initialValues.amount);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ name, amount: parseInt(amount, 10) });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="w-full flex flex-col items-center justify-center mt-3 sm:px-4">
        <InputField label="Item Name" type="text" value={name} onChange={setName} />
        <InputField label="Amount" type="number" value={amount} onChange={setAmount} />
      </div>
      <footer className="w-full flex flex-col-reverse gap-3 px-4 py-4 mt-4 sm:flex-row sm:justify-end">
        <Button variant="danger" size="sm" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="add" size="sm" type="submit">
          {submitLabel}
        </Button>
      </footer>
    </form>
  );
};