import React from 'react';
import { getWarehouseFromWarehouseId } from '../hooks/getWarehouseFromWarehouseId.ts';
import type { Warehouse } from '../pages/warehouseUsers.tsx';

export interface SelectResponse extends Response {
  activeRole: string;
}

interface WarehouseSelectorProps {
  selectedWarehouse: string;
  setActiveWarehouse: React.Dispatch<React.SetStateAction<Warehouse>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}

export const WarehouseSelector = ({ selectedWarehouse, setActiveWarehouse, addToast }: WarehouseSelectorProps) => {
  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = event.target.value;
    const activeWarehouse = getWarehouseFromWarehouseId(warehouseId);
    const response: SelectResponse = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouses/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ warehouseId: warehouseId }),
      credentials: 'include',
    }) as SelectResponse;
    if (response.ok) {
      localStorage.setItem('activeWarehouse', JSON.stringify(warehouseId));
      const { activeRole } = await response.json();
      localStorage.setItem('activeRole', JSON.stringify(activeRole));
      activeWarehouse.role = activeRole;
      setActiveWarehouse(activeWarehouse);
      addToast(`Changed active warehouse to ${activeWarehouse.name || activeWarehouse.warehouseId}`, 'info', 5000);
    }
    else {
      addToast(`Failed to change active warehouse.`, 'error', 5000);
    }
  };
  const warehouses = JSON.parse(localStorage.getItem('userWarehouses') || '[]');
  if (!warehouses || warehouses.length === 0) {
    return <h3>No warehouses assigned.</h3>;
  }
  return (
    <fieldset className="fieldset sm:max-w-xs w-full">
      <legend className="fieldset-legend ml-1">Active Warehouse: </legend>
      <select className="select select-sm focus:border-none focus:outline-none focus:ring-2 focus:ring-accent w-full"
        value={selectedWarehouse}
        onChange={handleChange}
      >
        <option value="" disabled>-- Select a Warehouse --</option>
        {warehouses.map((warehouse: { warehouseId: string, name: string }) => (
          <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
            {warehouse.name}
          </option>
        ))}
      </select>
    </fieldset>
  );
};