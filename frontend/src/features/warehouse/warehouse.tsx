import { useState, useEffect, useRef } from 'react';
import InputField from '../../components/InputField.tsx';
import Button from '../../components/Button.tsx';
import { WarehouseSelector } from './components/warehouseSelector.tsx';
import { handleAddWarehouse } from './hooks/handleAddWarehouse.ts';
import { getUsers } from './hooks/getUsers.ts';
import MainPage from '../../components/MainPage.tsx';
import TableHead from '../../components/TableHead.tsx';
import TableDataCell from '../../components/TableDataCell.tsx';
import AddButton from '../../components/AddButton.tsx';
import Pagination from '../../components/Pagination.tsx';
import { useSearchParams } from 'react-router-dom';
import { generatePagination } from '../../hooks/generatePagination.ts';
import { SearchField } from '../../components/SearchField.tsx';
import { useDebounce } from '../../hooks/useDebounce.ts';
export interface WarehouseUser {
  user_id: string;
  username: string;
  role: string;
}
const WarehouseManager = () => {
  const readStoredValue = (key: string) => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : '';
  };
  const [name, setName] = useState('');
  const [users, setUsers] = useState<WarehouseUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState(JSON.parse(localStorage.getItem('activeWarehouse') || '') || '');
  const [activeRole, setActiveRole] = useState<string>(readStoredValue('activeRole'));
  const [newUsername, setNewUsername] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const page: number = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState<(number | string)[]>([]);
  const usersPerPage = 10;
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
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
    getUsers({searchTerm: debouncedSearchTerm, setUsers, setTotalUsers, controller});
    return () => {
      controller.abort();
    };
  }, [warehouseId, activeRole, debouncedSearchTerm]);
  useEffect(() => {
    generatePagination(Number(page), Math.max(Math.ceil(totalUsers / usersPerPage), 1), setPages);
  }, [page, totalUsers]);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  return (
    <MainPage>
      <div className="max-w-2xl w-full">
        <div className="flex flex-col overflow-hidden">
          <dialog
            ref={dialogRef}
            onClose={() => setIsOpen(false)}
            className="m-auto h-fit w-full max-w-md rounded-lg bg-white p-0 shadow-lg backdrop:backdrop-blur-xs backdrop:bg-black/10 justify-center"
          >
            <div>
              <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
                <h2 className="text-lg font-semibold text-slate-900">Add Warehouse</h2>
                <Button
                  size={"sm"}
                  onClick={() => setIsOpen(false)}
                  className={"border-0"}
                  children={
                    <>
                      <span className="text-xl leading-none" aria-hidden="true">×</span>
                      <span className="sr-only">Close modal</span>
                    </>
                  }
                />
              </header>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddWarehouse({name, setName, setWarehouseId, setActiveRole});
                }}
                className="flex flex-col items-center"
              >
                <div className="w-full px-4 flex flex-col mt-3">
                  <InputField label={"Warehouse Name"} type={"text"} value={name} onChange={setName} />
                </div>

                <footer className="w-full flex flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 mt-4 sm:flex-row sm:justify-end sm:px-6">
                  <Button children={"Cancel"} variant={"danger"} size={"sm"} onClick={() => setIsOpen(false)} type={"button"} className="w-full sm:w-auto" />
                  <Button children={"Add"} variant={"add"} size={"sm"} type={"submit"} className="w-full sm:w-auto" />
                </footer>
              </form>
            </div>
          </dialog>
        </div>

        <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-8 overflow-scroll">
          <div className="space-y-6">
            <div className="w-full flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="w-full flex flex-col sm:flex-row md:items-center md:gap-3">
                <div className="flex-3">
                  <WarehouseSelector
                    selectedWarehouse={warehouseId}
                    setSelectedWarehouse={setWarehouseId}
                    onChange={(warehouseId: string, role: string) => {
                      setWarehouseId(warehouseId);
                      setActiveRole(role);
                    }}
                  />
                </div>
                <div className="flex flex-1 pt-2 justify-center sm:justify-end sm:pt-0">
                  <AddButton onClick={() => setIsOpen(true)} />
                </div>
              </div>
            </div>

            <SearchField searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {activeRole === 'admin' ? (
              <div className="w-full flex flex-col md:flex-row gap-2 items-stretch md:items-center mb-4">
                <input
                  className="flex-1 rounded-lg border border-slate-300 py-2 px-3 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Username to add"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
                <Button
                  variant={"add"}
                  size={"sm"}
                  className="w-full md:w-auto whitespace-nowrap"
                  onClick={async () => {
                    const username = newUsername || '';
                    if (!username) return alert('Enter a username');
                    try {
                      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse/users`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ username: username, role: 'staff' }),
                      });
                      if (!response.ok) {
                        const txt = await response.text();
                        throw new Error(txt || 'Failed to add user');
                      }
                      const newUser = await response.json();
                      newUser.username = username;
                      setUsers((prev) => [...prev, newUser]);
                      setNewUsername('');
                    } catch (err) {
                      if (err instanceof Error) alert(err.message);
                    }
                  }}
                  children={"Add user"}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-8 overflow-x-auto border border-slate-100 rounded-lg">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
              <tr>
                <TableHead children="Id" variant="first" />
                <TableHead children="Name" />
                <TableHead children="Role" />
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
              {users.length === 0 ? (
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td colSpan={3} className="text-center p-3 text-slate-600">
                    No users in warehouse.
                  </td>
                </tr>
              ) : (
                users.map((user: WarehouseUser) => (
                  <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                    <TableDataCell className="font-mono text-slate-500" children={
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:block sm:max-w-[120px] truncate" title={user.user_id}>
                            {user.user_id}
                        </span>
                        <Button
                          onClick={() => copyToClipboard(user.user_id)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                          title="Copy Full ID"
                          children={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          }
                        />
                      </div>
                    } />
                    <TableDataCell className="font-medium text-slate-900" children={user.username} />
                    <TableDataCell>
                      {activeRole === 'admin' ? (
                        <select
                          className="rounded border-none bg-transparent py-1 pl-1 pr-8 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:ring-2 focus:ring-emerald-500"
                          value={user.role}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            try {
                              const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse/users`, {
                                method: 'PATCH',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: user.username, role: newRole }),
                              });
                              if (!response.ok) {
                                const txt = await response.text();
                                throw new Error(txt || 'Failed to update role');
                              }
                              const currentUsername = readStoredValue('username');
                              if (user.username === currentUsername) {
                                localStorage.setItem('activeRole', JSON.stringify(newRole));
                                setActiveRole(newRole);
                              }
                              setUsers((prev) => prev.map((u) => u.user_id === user.user_id ? { ...u, role: newRole } : u));
                            } catch (err) {
                              if (err instanceof Error) alert(err.message);
                            }
                          }}
                        >
                          <option value="admin">admin</option>
                          <option value="manager">manager</option>
                          <option value="staff">staff</option>
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
        </div>

        <footer className="mt-4 px-4">
          <Pagination page={page} pages={pages} numberOfPages={Math.ceil(totalUsers / usersPerPage)} searchParams={searchParams} setSearchParams={setSearchParams} />
        </footer>
      </div>
    </MainPage>
  );
    };

      export default WarehouseManager;