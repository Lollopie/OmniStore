import { useState, useEffect, useRef } from 'react';
import InputField from '../../components/InputField.tsx';
import Button from '../../components/Button.tsx';
import { WarehouseSelector } from './components/warehouseSelector.tsx';
import { handleAddWarehouse } from './hooks/handleAddWarehouse.ts';
import { getUsers } from './hooks/getUsers.ts';
import TableHead from '../../components/TableHead.tsx';
import TableDataCell from '../../components/TableDataCell.tsx';
import AddButton from '../../components/AddButton.tsx';
import Pagination from '../../components/Pagination.tsx';
import { useSearchParams } from 'react-router';
import { generatePagination } from '../../hooks/generatePagination.ts';
import { SearchField } from '../../components/SearchField.tsx';
import { useDebounce } from '../../hooks/useDebounce.ts';
import { useToast } from '../toast';
import { getWarehouseFromWarehouseId } from './hooks/getWarehouseFromWarehouseId.ts';
import { addUser } from './hooks/addUser.ts';
import { changeUserRole } from './hooks/changeUserRole.ts';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { WarehouseDto } from '@shared/dto/warehouse.dto';
import { useForm } from 'react-hook-form';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';
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
const WarehouseManager = () => {
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
    console.log(activeWarehouse);
    const controller = new AbortController();
    getUsers({searchTerm: debouncedSearchTerm, setUsers, setTotalUsers, controller, addToast});
    return () => {
      controller.abort();
    };
  }, [activeWarehouse, debouncedSearchTerm]);
  useEffect(() => {
    generatePagination(Number(page), Math.max(Math.ceil(totalUsers / usersPerPage), 1), setPages);
  }, [page, totalUsers]);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
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

        {activeWarehouse.role === 'admin' ? (
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center my-4">
            <InputField
              fieldsetClassName="w-full sm:max-w-xs"
              inputClassName="input-sm w-full placeholder-base-300"
              type="text"
              placeholder="Username to add"
              value={newUsername}
              setValue={setNewUsername}
            />
            <Button
              variant={"add"}
              size={"sm"}
              onClick={async () => {
                await addUser({ newUsername, setUsers, setNewUsername, addToast });
              }}
              children={"Add user"}
            />
          </div>
        ) : null}

        <table className="table mt-8 border border-base-300 rounded-md">
          <thead>
            <tr>
              <TableHead children="Id" variant="first"/>
              <TableHead children="Name" />
              <TableHead children="Role" />
            </tr>
          </thead>
          <tbody>
          {users.length === 0 ? (
            <tr className="hover:bg-base-300/50 transition-colors">
              <td colSpan={3} className="text-center p-3 text-base-300">
                No users in warehouse.
              </td>
            </tr>
          ) : (
            users.map((user: WarehouseUser) => (
              <tr key={user.userId} className="hover:bg-base-300/50 transition-colors">
                <TableDataCell className="font-mono" children={
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:block sm:max-w-[120px] truncate" title={user.userId}>
                        {user.userId}
                    </span>
                    <Button
                      onClick={() => {copyToClipboard(user.userId); addToast('Copied to clipboard!','success',2000);}}
                      title="Copy Full ID"
                      className="bg-base-200 border-base-400 text-base-300"
                      size="sm"
                      children={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <use href="/icons.svg#copy-icon" />
                        </svg>
                      }
                    />
                  </div>
                } />
                <TableDataCell children={user.username} />
                <TableDataCell>
                  {activeWarehouse.role === 'admin' ? (
                    <select
                      className="select select-sm focus:outline-none focus:ring-none focus:border-none"
                      value={user.role}
                      onChange={async (e) => {
                        await changeUserRole({
                          user,
                          newRole: e.target.value,
                          setUsers,
                          setActiveWarehouse,
                          addToast
                        })
                      }}
                    >
                      {Object.values(WarehouseRole).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    user.role
                  )}
                </TableDataCell>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      <section className="mt-4">
        <Pagination page={page} pages={pages} numberOfPages={Math.ceil(totalUsers / usersPerPage)} searchParams={searchParams} setSearchParams={setSearchParams} />
      </section>
    </section>
  );
    };

export default WarehouseManager;