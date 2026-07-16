import type { WarehouseUser } from '../warehouse.tsx';
interface Props {
  setUsers: React.Dispatch<React.SetStateAction<WarehouseUser[]>>;
  setTotalUsers: React.Dispatch<React.SetStateAction<number>>;
}
export const getUsers = async ({setUsers, setTotalUsers}: Props) => {
  const activeRole = JSON.parse(localStorage.getItem('activeRole') || '');
  if (activeRole == 'admin' || activeRole == 'manager') {
    try {
      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse/users`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to get users.');
      const data: {data: {user_id: string, username: string, role: string}[], total: number} = await response.json();
      setUsers(data.data);
      setTotalUsers(data.total);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  }
  else {
    if (activeRole == 'staff'){
      setUsers([{user_id: JSON.parse(localStorage.getItem('user_id') || ''), username: JSON.parse(localStorage.getItem('username') || ''), role: JSON.parse(localStorage.getItem('activeRole') || '')}])
      setTotalUsers(1);
    }
    else {
      setUsers([]);
      setTotalUsers(0);
    }
  }
};