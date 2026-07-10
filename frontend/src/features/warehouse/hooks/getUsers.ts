import type { WarehouseUser } from '../warehouse.tsx';

export const getUsers = async (setUsers: React.Dispatch<React.SetStateAction<WarehouseUser[]>>) => {
  const activeRole = JSON.parse(localStorage.getItem('activeRole'));
  if (activeRole == 'admin' || activeRole == 'manager') {
    try {
      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse/users`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to get users.');
      const data = await response.json();
      setUsers(data);

    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  }
};