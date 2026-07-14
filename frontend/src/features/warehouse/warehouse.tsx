import { useState, useEffect, useRef } from 'react';
import InputField from '../../components/InputField.tsx';
import Button from '../../components/Button.tsx';
import { WarehouseSelector } from './components/warehouseSelector.tsx';
import { handleAddWarehouse } from './hooks/handleAddWarehouse.ts';
import { getUsers } from './hooks/getUsers.ts';
export interface WarehouseUser {
  user_id: string;
  username: string;
  role: string;
}
const WarehouseManager = () => {
  const [name, setName] = useState('');
  const [users, setUsers] = useState<WarehouseUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState(JSON.parse(localStorage.getItem('activeWarehouse') || '') || '');
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
  }, [warehouseId]);
  return (
    <div className={"flex flex-col items-center min-h-screen bg-gray-100 p-4"}>
      <div className="flex flex-col overflow-hidden">
        <dialog
          ref={dialogRef} onClose={() => setIsOpen(false)} className="m-auto h-fit w-full max-w-md rounded-lg bg-white p-0 shadow-lg backdrop:backdrop-blur-xs backdrop:bg-black/10 justify-center">
          <div>
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">Add Warehouse</h2>
              <Button children={<><span className="text-xl leading-none" aria-hidden="true">×</span><span
                className="sr-only">Close modal</span></>}
                      size={"sm"}
                      onClick={() => setIsOpen(false)}
                      className={"border-0"}
              />
            </header>
            <form onSubmit={(e) => {e.preventDefault();handleAddWarehouse(name, setName)}} className="flex flex-col">
              <div className="w-4/5 flex flex-col items-center justify-center mt-3">
                <InputField label={"Warehouse Name"} type={"text"} value={name} onChange={setName} />
              </div>
              <footer
                className="flex flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6"
              >
                <Button children={"Cancel"} variant={"danger"} size={"sm"} onClick={() => setIsOpen(false)} type={"button"} />
                <Button children={"Add"} variant={"add"} size={"sm"} type={"submit"} />
              </footer>
            </form>
          </div>
        </dialog>
      </div>
      <div className="w-full max-w-100 m-1 font-sans flex flex-col">
        <div className="flex flex-col">
          <div className={"flex justify-between items-center mb-4"}>
            <WarehouseSelector onChange={(warehouseId: string) => {console.log("New Warehouse selected"); setWarehouseId(warehouseId)}} />
            <Button children={"+"} variant={"add"} size={"md"} onClick={() => setIsOpen(true)} />
          </div>
        </div>

        {/* Add user by username (only visible to admins) */}
        {(() => {
          const activeRole = JSON.parse(localStorage.getItem('activeRole') || 'null');
          if (activeRole === 'admin') {
            return (
              <div className="mb-4 flex gap-2 items-center">
                <input
                  className="border rounded p-2"
                  placeholder="Username to add"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
                <Button children={"Add user"} variant={"add"} size={"sm"} onClick={async () => {
                  const username = newUsername || '';
                  if (!username) return alert('Enter a username');
                  try {
                    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse/users`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ userId: username, role: 'staff' }),
                    });
                    if (!response.ok) {
                      const txt = await response.text();
                      throw new Error(txt || 'Failed to add user');
                    }
                    const newUser = await response.json();
                    setUsers((prev) => [...prev, newUser]);
                    setNewUsername('');
                  } catch (err) {
                    if (err instanceof Error) alert(err.message);
                  }
                }} />
              </div>
            );
          }
          return null;
        })()}

        <table className="w-full border-collapse mt-1">
          <thead>
          <tr className="border-b-2 border-b-slate-700">
            <th className="text-left p-3">Id</th>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Role</th>
          </tr>
          </thead>
          <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center p-3 text-slate-600">
                No users in warehouse.
              </td>
            </tr>
          ) : (
            users.map((user: WarehouseUser) => (
              <tr key={user.user_id} className="border-b border-b-slate-200">
                <td className="p-3">{user.user_id}</td>
                <td className="p-3">{user.username}</td>
                <td className="p-3">
                  {JSON.parse(localStorage.getItem('activeRole') || 'null') === 'admin' ? (
                    <select
                      value={user.role}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        try {
                          const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse/users`, {
                            method: 'PATCH',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.user_id, role: newRole }),
                          });
                          if (!response.ok) {
                            const txt = await response.text();
                            throw new Error(txt || 'Failed to update role');
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
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarehouseManager;