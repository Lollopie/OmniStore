import InputField from '../../../components/InputField.tsx';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { WarehouseInviteDto } from '@shared/dto/warehouse.dto';
import { useForm } from 'react-hook-form';
import Button from '../../../components/Button.tsx';
import { WAREHOUSE_INVITATION_PERMISSIONS } from '@shared';
import { readStoredValue } from '../../../hooks/readStoredValue.ts';
import { createWarehouseInvite } from '../hooks/createWarehouseInvite.ts';
import { useToast } from '../../toast';
const resolver = classValidatorResolver(WarehouseInviteDto);
export function WarehouseInvites() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WarehouseInviteDto>({ resolver });
  const { addToast } = useToast();
  return (
    <section className="card bg-base-100 max-w-2xl mx-auto">
      <div className="card-body">
        <h1 className="text-2xl font-bold mb-4">Warehouse Invites</h1>
        <section>
          <h2 className="text-lg font-semibold mb-2">
            <span className="font-semibold">Invite User</span>
          </h2>
          <form
            onSubmit={handleSubmit((data) => createWarehouseInvite(data, addToast))}
          className="flex flex-col gap-4 items-start">
            <InputField
              placeholder="Enter user email" {...register('email')}
              fieldsetClassName="max-w-xs w-full"
              inputClassName="w-full"
            />
            {errors.email && <p className="text-error">{errors.email.message}</p>}
            <select
              className="select select-sm focus:outline-none focus:ring-accent focus:ring-2 focus:border-none"
              {...register('role')}
            >
              <option value="" disabled>
                Select a role
              </option>
              {readStoredValue<string>('activeRole') && ((WAREHOUSE_INVITATION_PERMISSIONS as Record<string, string[]>)[readStoredValue<string>('activeRole')] ?? []).map((role: string) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-error">{errors.role.message}</p>}
            <Button
              type="submit">
              Invite
            </Button>
          </form>
        </section>
      </div>
    </section>
  )
}