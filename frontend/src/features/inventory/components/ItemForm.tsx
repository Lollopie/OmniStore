import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { InventoryDto } from '@shared/dto/inventory.dto';
import { useForm } from 'react-hook-form';

interface ItemFormProps {
  submitLabel: string;
  onSubmit: (data: { itemName: string; amount: number }) => void;
  onCancel: () => void;
}
const resolver = classValidatorResolver(InventoryDto);
export const ItemForm = ({
                           submitLabel,
                           onSubmit,
                           onCancel,
                         }: ItemFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<InventoryDto>({
    resolver
  });

  const submit = (inventoryDto: InventoryDto) => {
    onSubmit({ itemName: inventoryDto.itemName, amount: parseInt(inventoryDto.amount, 10) });
  };

  return (
    <form onSubmit={handleSubmit((data) => submit(data))} className="flex flex-col">
      <div className="w-full flex flex-col items-center justify-center mt-3 sm:px-4">
        <InputField label="Item Name" type="text" {...register('itemName')} />
        {errors.itemName && <p className="mb-4 text-sm text-error font-medium">{errors.itemName.message}</p>}
        <InputField label="Amount" type="number" {...register('amount')} />
        {errors.amount && <p className="mb-4 text-sm text-error font-medium">{errors.amount.message}</p>}
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