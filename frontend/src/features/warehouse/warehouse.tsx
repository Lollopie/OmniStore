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
  const [isOpen, setIsOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState(JSON.parse(localStorage.getItem('activeWarehouse') || '') || '');
  const [activeRole, setActiveRole] = useState<string>(readStoredValue('activeRole'));
  const [newUsername, setNewUsername] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
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
    getUsers(setUsers);
  }, [warehouseId, activeRole]);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optional: Add a toast notification here
  };
  return (
    <MainPage children={
      <div>
        <div className="flex flex-col overflow-hidden">
          <dialog
            ref={dialogRef} onClose={() => setIsOpen(false)}
            className="m-auto h-fit w-full max-w-md rounded-lg bg-white p-0 shadow-lg backdrop:backdrop-blur-xs backdrop:bg-black/10 justify-center">
            <div>
              <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
                <h2 className="text-lg font-semibold text-slate-900">Add Warehouse</h2>
                <Button children={<><span className="text-xl leading-none" aria-hidden="true">×</span><span
                  className="sr-only">Close modal</span></>}
                        size={'sm'}
                        onClick={() => setIsOpen(false)}
                        className={'border-0'} />
              </header>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddWarehouse(name, setName);
              }} className="flex flex-col">
                <div className="w-4/5 flex flex-col items-center justify-center mt-3">
                  <InputField label={'Warehouse Name'} type={'text'} value={name} onChange={setName} />
                </div>
                <footer
                  className="flex flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6"
                >
                  <Button children={'Cancel'} variant={'danger'} size={'sm'} onClick={() => setIsOpen(false)}
                          type={'button'} />
                  <Button children={'Add'} variant={'add'} size={'sm'} type={'submit'} />
                </footer>
              </form>
            </div>
          </dialog>
        </div>
        <div className="w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <WarehouseSelector onChange={(warehouseId: string, role: string) => {
                  console.log('New Warehouse selected');
                  setWarehouseId(warehouseId);
                  setActiveRole(role);
                }} />
                <AddButton onClick={() => setIsOpen(true)} />
              </div>
            </div>

            {/* Add user by username (only visible to admins) */}
            {activeRole === 'admin' ? (
              <div className="max-w-md mb-4 flex gap-2 items-center">
                <input
                  className="flex-1 rounded-lg border border-slate-300 py-2 px-3 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Username to add"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)} />
                <Button children={'Add user'} variant={'add'} size={'sm'} onClick={async () => {
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
                }} />
              </div>
            ) : null}
          </div>
          <div className="mt-8 overflow-hidden border border-slate-100 rounded-lg">
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
                        <span className="max-w-[120px] truncate" title={user.user_id}>
                            {user.user_id}
                        </span>
                      <Button
                        onClick={() => copyToClipboard(user.user_id)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                        title="Copy Full ID"
                        children={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>}
                      />
                      </div>}
                    />
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
                              setUsers((prev) => prev.map((u) => u.user_id === user.user_id ? {
                                ...u,
                                role: newRole,
                              } : u));
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
      </div>
      } />
      );
      };

      export default WarehouseManager;