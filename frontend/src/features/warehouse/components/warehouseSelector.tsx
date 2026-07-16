import React from 'react';

export interface SelectResponse extends Response {
  activeRole: string;
}

interface WarehouseSelectorProps {
  selectedWarehouse: string;
  setSelectedWarehouse: React.Dispatch<React.SetStateAction<string>>;
  onChange: (warehouseId: string, activeRole: string) => void;
}

export const WarehouseSelector = ({ selectedWarehouse, setSelectedWarehouse, onChange }: WarehouseSelectorProps) => {
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
      const { activeRole } = await response.json();
      localStorage.setItem('activeRole', JSON.stringify(activeRole));
      onChange(warehouseId, activeRole);
    }
  };
  const warehouses = JSON.parse(localStorage.getItem('user_warehouses') || '[]');
  if (!warehouses || warehouses.length === 0) {
    return <p>No warehouses assigned.</p>;
  }

  return (
    <div className="warehouse-selector">
      <label className="text-sm font-medium text-slate-700" htmlFor="warehouse-select">Active Warehouse: </label>
      <select className="rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-sm font-semibold text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        id="warehouse-select"
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
    </div>
  );
};