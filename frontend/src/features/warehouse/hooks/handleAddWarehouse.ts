import React from 'react';
import type { Warehouse } from '../warehouse.tsx';
import { WarehouseDto } from '@shared/dto/warehouse.dto';
interface Props {
  warehouseDto: WarehouseDto;
  setActiveWarehouse: React.Dispatch<React.SetStateAction<Warehouse>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}
export const handleAddWarehouse = async ({warehouseDto, setActiveWarehouse, addToast}: Props) => {

  if (!warehouseDto.warehouseName.trim()) {
    addToast('Please provide a valid warehouse name.', 'error', 3000);
    return;
  }

  const newWarehouse = {
    warehouseName: warehouseDto.warehouseName.trim(),
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

    const addedItem: { name:string, warehouse_id: string, role:string } = await response.json();
    const currentWarehouses = JSON.parse(localStorage.getItem('user_warehouses') || '[]');
    currentWarehouses.push(addedItem);
    localStorage.setItem('user_warehouses', JSON.stringify(currentWarehouses));
    localStorage.setItem('activeWarehouse', JSON.stringify(addedItem.warehouse_id));
    localStorage.setItem('activeRole', JSON.stringify(addedItem.role));
    setActiveWarehouse({ warehouse_id: addedItem.warehouse_id, name: addedItem.name, role: addedItem.role });
    addToast(`Warehouse "${addedItem.name}" added successfully!`, 'success', 3000);
  } catch (err: unknown) {
    addToast(`Failed to add warehouse ${warehouseDto.warehouseName}`, 'error', 3000);
    if (err instanceof Error) {
      console.error(`Error adding warehouse: ${err.message}`);
    }
  }
};