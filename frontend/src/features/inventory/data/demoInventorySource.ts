import type { InventoryDraft, InventoryItem, InventorySort, InventorySource } from './inventorySource.ts';

interface DemoItem extends InventoryItem {
  // Stands in for the backend's time-ordered UUIDv7 ids, which the "new" and "old" sorts use
  createdAt: number;
}

const defaultItems: InventoryDraft[] = [
  { itemName: 'AMD Ryzen 9 7900X CPU', amount: '42' },
  { itemName: 'Anker 100W USB-C GaN Charger', amount: '310' },
  { itemName: 'ASUS ROG Swift 27" 4K Monitor', amount: '14' },
  { itemName: 'Corsair Vengeance 32GB DDR5', amount: '128' },
  { itemName: 'Ethiopian Yirgacheffe Beans (1kg)', amount: '450' },
  { itemName: 'Keychron Q1 Pro Wireless Keyboard', amount: '64' },
  { itemName: 'Logitech MX Master 3S Mouse', amount: '210' },
  { itemName: 'Monin Vanilla Syrup (750ml)', amount: '88' },
  { itemName: 'Oatly Barista Edition Oat Milk (1L)', amount: '24' },
  { itemName: '12oz Biodegradable Coffee Cups (500pk)', amount: '15' },
  { itemName: 'Samsung 990 Pro 2TB NVMe SSD', amount: '57' },
  { itemName: 'Stainless Steel Milk Pitcher (600ml)', amount: '33' },
];

const byName = (a: DemoItem, b: DemoItem) => a.itemName.localeCompare(b.itemName);
const byAmount = (a: DemoItem, b: DemoItem) => Number(a.amount) - Number(b.amount);
const byCreatedAt = (a: DemoItem, b: DemoItem) => a.createdAt - b.createdAt;

// Same orderings as the backend's InventoryService, including its tie-breakers.
// Typed as a Record so adding a sort option fails to compile until the demo handles it.
const comparators: Record<InventorySort, (a: DemoItem, b: DemoItem) => number> = {
  'new': (a, b) => byCreatedAt(b, a),
  'old': byCreatedAt,
  'itemName asc': (a, b) => byName(a, b) || byCreatedAt(b, a),
  'itemName desc': (a, b) => byName(b, a) || byCreatedAt(b, a),
  'amount asc': (a, b) => byAmount(a, b) || byName(a, b),
  'amount desc': (a, b) => byAmount(b, a) || byName(a, b),
};

// An in-memory inventory for the homepage demo. Nothing leaves the browser, and every new
// source starts from the sample items again.
export const createDemoInventorySource = (pageSize = 5, initialItems = defaultItems): InventorySource => {
  let nextId = 0;
  const toDemoItem = (draft: InventoryDraft): DemoItem => {
    nextId += 1;
    return { itemId: `demo-${nextId}`, itemName: draft.itemName, amount: draft.amount, createdAt: nextId };
  };
  let items: DemoItem[] = initialItems.map(toDemoItem);

  const findItem = (itemId: string) => {
    const item = items.find((candidate) => candidate.itemId === itemId);
    if (!item) throw new Error('Item not found');
    return item;
  };

  return {
    pageSize,
    async list({ page, sort, searchTerm }) {
      const term = searchTerm.trim().toLowerCase();
      const matches = items
        .filter((item) => item.itemName.toLowerCase().includes(term))
        .sort(comparators[sort]);
      const start = (Math.max(page, 1) - 1) * pageSize;
      const pageItems = matches
        .slice(start, start + pageSize)
        .map(({ itemId, itemName, amount }) => ({ itemId, itemName, amount }));
      return [pageItems, matches.length];
    },
    async add(draft) {
      items.push(toDemoItem(draft));
    },
    async update({ itemId, itemName, amount }) {
      Object.assign(findItem(itemId), { itemName, amount });
    },
    async remove({ itemId }) {
      findItem(itemId);
      items = items.filter((item) => item.itemId !== itemId);
    },
  };
};
