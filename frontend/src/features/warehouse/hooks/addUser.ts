import { api } from '../../../api/client.ts';
import type { WarehouseUser } from '../pages/warehouseUsers.tsx';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';

interface Props {
  newUsername: string;
  newRole: WarehouseRole;
  setUsers: React.Dispatch<React.SetStateAction<WarehouseUser[]>>;
  setNewUsername: React.Dispatch<React.SetStateAction<string>>;
  setNewRole: React.Dispatch<React.SetStateAction<WarehouseRole>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}
export const addUser = async ({newUsername, newRole, setUsers, setNewUsername, setNewRole, addToast}: Props) => {
  const username = newUsername || '';
  if (!username) return alert('Enter a username');
  try {
    const { data: newUser } = await api.post<WarehouseUser>('/warehouses/users', { username: username, role: newRole });
    newUser.username = username;
    setUsers((prev) => [...prev, newUser]);
    setNewUsername('');
    setNewRole(WarehouseRole.STAFF);
    addToast(`Added user "${username}" to active warehouse`, 'success', 5000);
  } catch (err) {
    addToast(`Failed to add user "${username}"`, 'error', 3000);
    if (err instanceof Error) console.error(err.message);
  }
};