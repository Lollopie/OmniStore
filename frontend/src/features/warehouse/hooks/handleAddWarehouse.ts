import React from 'react';
import type { Warehouse } from '../warehouse.tsx';
interface Props {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setActiveWarehouse: React.Dispatch<React.SetStateAction<Warehouse>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}
export const handleAddWarehouse = async ({name, setName, setActiveWarehouse, addToast}: Props) => {

  if (!name.trim()) {
    alert('Please provide a name.');
    return;
  }

  const newWarehouse = {
    name: name.trim(),
  };

  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newWarehouse),
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to add warehouse.');

    const addedItem: {name:string, warehouse_id: string} = await response.json();
    const currentWarehouses = JSON.parse(localStorage.getItem('user_warehouses') || '[]');
    currentWarehouses.push(addedItem);
    localStorage.setItem('user_warehouses', JSON.stringify(currentWarehouses));
    localStorage.setItem('activeWarehouse', JSON.stringify(addedItem.warehouse_id));
    localStorage.setItem('activeRole', JSON.stringify('admin'));
    setName('');
    setActiveWarehouse({ warehouse_id: addedItem.warehouse_id, name: addedItem.name, role: 'admin' });
    addToast(`Warehouse "${addedItem.name}" added successfully!`, 'success', 3000);
  } catch (err: unknown) {
    addToast(`Failed to add warehouse ${name}`, 'error', 3000);
    if (err instanceof Error) {
      console.error(`Error adding warehouse: ${err.message}`);
    }
  }
};