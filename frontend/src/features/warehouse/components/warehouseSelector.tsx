import React from 'react';
import { getWarehouseFromWarehouseId } from '../hooks/getWarehouseFromWarehouseId.ts';
import type { Warehouse } from '../warehouse.tsx';

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
    setActiveWarehouse(activeWarehouse);


    const response: SelectResponse = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: warehouseId }),
      credentials: 'include',
    }) as SelectResponse;
    if (response.ok) {
      localStorage.setItem('activeWarehouse', JSON.stringify(event.target.value));
      const { activeRole } = await response.json();
      localStorage.setItem('activeRole', JSON.stringify(activeRole));
      addToast(`Changed active warehouse to ${activeWarehouse.name || activeWarehouse.warehouse_id}`, 'info', 5000);
    }
  };
  const warehouses = JSON.parse(localStorage.getItem('user_warehouses') || '[]');
  if (!warehouses || warehouses.length === 0) {
    return <p>No warehouses assigned.</p>;
  }

  return (
    <fieldset className="fieldset warehouse-selector flex flex-row justify-left md:items-center gap-2">
      <legend className="fieldset-legend ml-1">Active Warehouse: </legend>
      <select className="select select-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:max-w-xs w-full"
        value={selectedWarehouse}
        onChange={handleChange}
      >
        <option value="" disabled>-- Select a Warehouse --</option>
        {warehouses.map((warehouse: { warehouse_id: string, name: string }) => (
          <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
            {warehouse.name}
          </option>
        ))}
      </select>
    </fieldset>
  );
};