export interface InventoryItem {
  itemId: string;
  itemName: string;
  amount: string;
}

export type InventoryDraft = Pick<InventoryItem, 'itemName' | 'amount'>;

// Mirrors InventorySortOption in the backend's InventoryService
export const inventorySortOptions = [
  { value: 'new', label: 'New' },
  { value: 'old', label: 'Old' },
  { value: 'itemName asc', label: 'Name Ascending' },
  { value: 'itemName desc', label: 'Name Descending' },
  { value: 'amount asc', label: 'Amount Ascending' },
  { value: 'amount desc', label: 'Amount Descending' },
] as const;

export type InventorySort = (typeof inventorySortOptions)[number]['value'];

export interface InventoryQuery {
  page: number;
  sort: InventorySort;
  searchTerm: string;
}

// Where the inventory table reads and writes its items. Every method resolves on success
// and throws on failure, so the table handles both sources the same way.
export interface InventorySource {
  pageSize: number;
  list(query: InventoryQuery, signal?: AbortSignal): Promise<[InventoryItem[], number]>;
  add(item: InventoryDraft): Promise<void>;
  update(item: InventoryItem): Promise<void>;
  remove(item: InventoryItem): Promise<void>;
}
