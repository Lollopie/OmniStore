import type { Warehouse } from '../warehouse.tsx';
export const getWarehouseFromWarehouseId = (warehouseId: string) => {
  const warehouses: Warehouse[] = JSON.parse(localStorage.getItem('user_warehouses') || '[]');
  const activeWarehouse = warehouses.find((warehouse) => warehouse.warehouse_id === warehouseId);
  return activeWarehouse || {warehouse_id: warehouseId, name: ''};
};