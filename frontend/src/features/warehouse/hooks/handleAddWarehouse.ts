import { api } from '../../../api/client.ts';
import React from 'react';
import type { Warehouse } from '../pages/warehouseUsers.tsx';
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
    const { data: addedItem } = await api.post<{ name:string, warehouseId: string, role:string }>(
      '/warehouses',
      newWarehouse,
    );
    const currentWarehouses = JSON.parse(localStorage.getItem('userWarehouses') || '[]');
    currentWarehouses.push(addedItem);
    localStorage.setItem('userWarehouses', JSON.stringify(currentWarehouses));
    localStorage.setItem('activeWarehouse', addedItem.warehouseId);
    localStorage.setItem('activeRole', addedItem.role);
    setActiveWarehouse({ warehouseId: addedItem.warehouseId, name: addedItem.name, role: addedItem.role });
    addToast(`Warehouse "${addedItem.name}" added successfully!`, 'success', 3000);
  } catch (err: unknown) {
    addToast(`Failed to add warehouse ${warehouseDto.warehouseName}`, 'error', 3000);
    if (err instanceof Error) {
      console.error(`Error adding warehouse: ${err.message}`);
    }
  }
};