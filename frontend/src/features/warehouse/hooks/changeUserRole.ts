import type { Warehouse, WarehouseUser } from '../warehouse.tsx';
import { readStoredValue } from '../../../hooks/readStoredValue.ts';
interface Props {
  user: WarehouseUser;
  newRole: string;
  setUsers: React.Dispatch<React.SetStateAction<WarehouseUser[]>>;
  setActiveWarehouse: React.Dispatch<React.SetStateAction<Warehouse>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}
export const changeUserRole = async ({user, newRole, setUsers, setActiveWarehouse, addToast}: Props) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouses/users`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, role: newRole, warehouseId: readStoredValue('activeWarehouse') }),
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || 'Failed to update role');
    }
    const currentUsername = readStoredValue('username');
    if (user.username === currentUsername) {
      localStorage.setItem('activeRole', JSON.stringify(newRole));
      setActiveWarehouse((prev: Warehouse) => ({ ...prev, role: newRole }));
      const warehouses: Warehouse[] = JSON.parse(localStorage.getItem('userWarehouses') || '[]');
      const updatedWarehouses = warehouses.map((warehouse) =>
        warehouse.warehouseId === readStoredValue('activeWarehouse') ? { ...warehouse, role: newRole } : warehouse
      );
      localStorage.setItem('userWarehouses', JSON.stringify(updatedWarehouses));
    }
    setUsers((prev) => prev.map((u) => u.userId === user.userId ? { ...u, role: newRole } : u));
    addToast(`Successfully set User role for "${user.username}"`, 'success', 5000);
  } catch (err) {
    addToast('Failed to update role.', 'error', 5000);
    if (err instanceof Error){
      console.error(err);
    }
  }
};