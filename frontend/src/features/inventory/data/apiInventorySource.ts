import { api } from '../../../api/client.ts';
import type { InventoryItem, InventorySource } from './inventorySource.ts';

type ApiInventoryItem = Omit<InventoryItem, 'amount'> & { amount: number | string };

export const apiInventorySource: InventorySource = {
  // Matches itemsPerPage in the backend's InventoryService
  pageSize: 10,
  async list({ page, sort, searchTerm }, signal) {
    const { data: [items, total] } = await api.get<[ApiInventoryItem[], number]>('/inventory', {
      params: { page: Math.max(page, 1), sort, search: searchTerm || '' },
      signal,
    });
    // The numeric column arrives as a number, but the API expects amounts back as number strings
    return [items.map((item) => ({ ...item, amount: String(item.amount) })), total];
  },
  add: async (item) => {
    await api.post('/inventory', item);
  },
  update: async (item) => {
    await api.patch('/inventory', item);
  },
  remove: async (item) => {
    await api.delete('/inventory', { data: item });
  },
};
