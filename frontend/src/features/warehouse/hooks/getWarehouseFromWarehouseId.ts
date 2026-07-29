import type { Warehouse } from '../warehouse.tsx';
export const getWarehouseFromWarehouseId = (warehouseId: string) => {
  const warehouses: Warehouse[] = JSON.parse(localStorage.getItem('user_warehouses') || '[]');
  const activeWarehouse = warehouses.find((warehouse) => warehouse.warehouseId === warehouseId);
  return activeWarehouse || {warehouseId: warehouseId, name: ''};
};