import { api } from '../../../api/client.ts';
import type { WarehouseUser } from '../pages/warehouseUsers.tsx';
import { readStoredValue } from '../../../hooks/readStoredValue.ts';

interface Props {
  searchTerm?: string;
  setUsers: React.Dispatch<React.SetStateAction<WarehouseUser[]>>;
  setTotalUsers: React.Dispatch<React.SetStateAction<number>>;
  controller: AbortController;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}

export const getUsers = async ({ searchTerm, setUsers, setTotalUsers, controller, addToast }: Props) => {
  const activeRole = readStoredValue('activeRole', '');
  if (activeRole == 'admin' || activeRole == 'manager') {
    const params = new URLSearchParams();
    try {
      params.append('search', searchTerm || '');
      const { data } = await api.get<{ data: { userId: string, username: string, role: string }[], total: number }>(
        '/warehouses/users',
        { params, signal: controller.signal },
      );
      setUsers(data.data);
      setTotalUsers(data.total);
    } catch (err) {
      if (!controller.signal.aborted) {
        addToast('Failed to get users', 'error', 3000);
      }
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  } else {
    if (activeRole == 'staff') {
      setUsers([{
        userId: localStorage.getItem('userId') || '',
        username: localStorage.getItem('username') || '',
        role: localStorage.getItem('activeRole') || '',
      }]);
      setTotalUsers(1);
    } else {
      setUsers([]);
      setTotalUsers(0);
    }
  }
};