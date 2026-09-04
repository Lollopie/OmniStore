import { WarehouseUserTable } from '../components/warehouseUserTable.tsx';
import { useState, useEffect, useRef } from 'react';
import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';
import { WarehouseSelector } from '../components/warehouseSelector.tsx';
import { handleAddWarehouse } from '../hooks/handleAddWarehouse.ts';
import { getUsers } from '../hooks/getUsers.ts';
import AddButton from '../../../components/AddButton.tsx';
import Pagination from '../../../components/Pagination.tsx';
import { useSearchParams } from 'react-router';
import { generatePagination } from '../../../hooks/generatePagination.ts';
import { SearchField } from '../../../components/SearchField.tsx';
import { useDebounce } from '../../../hooks/useDebounce.ts';
import { useToast } from '../../toast';
import { getWarehouseFromWarehouseId } from '../hooks/getWarehouseFromWarehouseId.ts';
import { addUser } from '../hooks/addUser.ts';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { WarehouseDto } from '@shared/dto/warehouse.dto';
import { useForm } from 'react-hook-form';
import { WAREHOUSE_INVITATION_PERMISSIONS, WarehouseRole } from '@shared/enum/warehouseRoles.enum';
export interface WarehouseUser {
  userId: string;
  username: string;
  role: string;
}
export interface Warehouse {
  warehouseId: string;
  name: string;
  role?: string;
}

const resolver = classValidatorResolver(WarehouseDto);
const WarehouseUsers = () => {
  const [users, setUsers] = useState<WarehouseUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeWarehouse, setActiveWarehouse] = useState<Warehouse>(() => {
    try {
      const rawStoredId = localStorage.getItem('activeWarehouse');
      const warehouseId = rawStoredId ? JSON.parse(rawStoredId) : '';
      return getWarehouseFromWarehouseId(warehouseId);
    } catch (error) {
      console.error('Failed to parse activeWarehouse from localStorage:', error);
      return getWarehouseFromWarehouseId('');
    }
  });
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<WarehouseRole>(WarehouseRole.STAFF);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const page: number = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState<(number | string)[]>([]);
  const usersPerPage = 10;
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WarehouseDto>({ resolver });
  useEffect(() => {
    const dialog: HTMLDialogElement | null = dialogRef.current;
    if (!dialog){
      return;
    }
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);
  useEffect(() => {
    const controller = new AbortController();
    getUsers({searchTerm: debouncedSearchTerm, setUsers, setTotalUsers, controller, addToast});
    return () => {
      controller.abort();
    };
  }, [activeWarehouse, debouncedSearchTerm]);
  useEffect(() => {
    generatePagination(Number(page), Math.max(Math.ceil(totalUsers / usersPerPage), 1), setPages);
  }, [page, totalUsers]);
  return (
    <section className="max-w-2xl mx-auto">
      <dialog
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
        className="modal backdrop-blur-md"
      >
        <div className="modal-box sm:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-base-400">Add Warehouse</h2>
            <Button
              size="md"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              children='X'
            />
          </div>

          <form
            onSubmit={handleSubmit((data) => {
              handleAddWarehouse({warehouseDto: data, setActiveWarehouse, addToast });
              setIsOpen(false);
            })}
            className="pt-4"
          >
            <InputField label={"Warehouse Name"} type={"text"} {...register('warehouseName')} />
            {errors.warehouseName && <p className="text-error text-sm">{errors.warehouseName.message}</p>}

            <section className="flex flex-col-reverse gap-3 px-4 py-4 mt-4 sm:flex-row sm:justify-end">
              <Button children={"Cancel"} variant={"danger"} size={"sm"} onClick={() => setIsOpen(false)} type={"button"} />
              <Button children={"Add"} variant={"add"} size={"sm"} type={"submit"} />
            </section>
          </form>
        </div>
      </dialog>
      <div className="mx-auto bg-base-100 rounded-xl border border-base-300 p-4 sm:p-8 overflow-scroll">
        <div className="pb-6 mb-6 border-b border-base-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <WarehouseSelector
            selectedWarehouse={activeWarehouse.warehouseId}
            setActiveWarehouse={setActiveWarehouse}
            addToast={addToast}
          />
          <AddButton className="btn-sm sm:btn-md" onClick={() => setIsOpen(true)} />
        </div>

        <SearchField className="sm:max-w-xs w-full" searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        {activeWarehouse.role && Object.values(WAREHOUSE_INVITATION_PERMISSIONS[activeWarehouse.role]).length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center my-4">
            <InputField
              fieldsetClassName="w-full sm:max-w-xs"
              inputClassName="input-sm w-full placeholder-base-300"
              type="text"
              placeholder="Username to add"
              value={newUsername}
              setValue={setNewUsername}
            />
            <select
              className="select select-sm focus:outline-none focus:ring-accent focus:ring-2 focus:border-none"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as WarehouseRole)}
            >
              {Object.values(WAREHOUSE_INVITATION_PERMISSIONS[activeWarehouse.role]).map((role: string) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <Button
              variant={"add"}
              size={"sm"}
              onClick={async () => {
                await addUser({ newUsername, newRole, setUsers, setNewUsername, setNewRole, addToast });
              }}
              children={"Add user"}
            />
          </div>
        ) : null}
        <WarehouseUserTable users={users} activeWarehouse={activeWarehouse} setUsers={setUsers} setActiveWarehouse={setActiveWarehouse} addToast={addToast} />
      </div>

      <section className="mt-4">
        <Pagination page={page} pages={pages} numberOfPages={Math.ceil(totalUsers / usersPerPage)} searchParams={searchParams} setSearchParams={setSearchParams} />
      </section>
    </section>
  );
};

export default WarehouseUsers;