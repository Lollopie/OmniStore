import React, { useState } from 'react';

export interface SelectResponse extends Response {
  activeRole: string;
}

interface WarehouseSelectorProps {
  onChange: (warehouseId: string) => void;
}

export const WarehouseSelector = ({ onChange }: WarehouseSelectorProps) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(JSON.parse(localStorage.getItem('activeWarehouse')) || '');
  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = event.target.value;
    setSelectedWarehouse(warehouseId);


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
      localStorage.setItem('activeRole', JSON.stringify((await response.json()).activeRole));
      onChange(warehouseId);
    }
  };
  const warehouses = JSON.parse(localStorage.getItem('user_warehouses'));
  if (!warehouses || warehouses.length === 0) {
    return <p>No warehouses assigned.</p>;
  }

  return (
    <div className="warehouse-selector">
      <label htmlFor="warehouse-select">Active Warehouse: </label>
      <select
        id="warehouse-select"
        value={selectedWarehouse}
        onChange={handleChange}
      >
        <option value="" disabled>-- Select a Warehouse --</option>
        {warehouses.map((warehouse: { id: string, name: string }) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </option>
        ))}
      </select>
    </div>
  );
};