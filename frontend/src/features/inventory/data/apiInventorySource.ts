import type { InventoryItem, InventorySource } from './inventorySource.ts';

const inventoryUrl = `${import.meta.env.VITE_NESTJS_HOST_URL}/inventory`;

const send = async (method: 'POST' | 'PATCH' | 'DELETE', item: Partial<InventoryItem>) => {
  const response = await fetch(inventoryUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
    credentials: 'include',
  });
  if (!response.ok) throw new Error(`Inventory ${method} failed with status ${response.status}.`);
};

export const apiInventorySource: InventorySource = {
  // Matches itemsPerPage in the backend's InventoryService
  pageSize: 10,
  async list({ page, sort, searchTerm }, signal) {
    const params = new URLSearchParams();
    params.append('page', Math.max(page, 1).toString());
    params.append('sort', sort);
    params.append('search', searchTerm || '');
    const response = await fetch(`${inventoryUrl}?${params}`, { method: 'GET', credentials: 'include', signal });
    if (!response.ok) throw new Error('Failed to fetch inventory.');
    return await response.json();
  },
  add: (item) => send('POST', item),
  update: (item) => send('PATCH', item),
  remove: (item) => send('DELETE', item),
};
