import type { Warehouse } from '../warehouse.tsx';
export const getWarehouseFromWarehouseId = (warehouseId: string) => {
  const warehouses: Warehouse[] = JSON.parse(localStorage.getItem('userWarehouses') || '[]');
  const activeWarehouse = warehouses.find((warehouse) => warehouse.warehouseId === warehouseId);
  return activeWarehouse || {warehouseId: warehouseId, name: ''};
};