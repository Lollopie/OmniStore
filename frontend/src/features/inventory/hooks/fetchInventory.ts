import React from 'react';
import type { InventoryItem } from '../Inventory.tsx';
interface fetchInventoryProps {
  page: number;
  sort: string;
  searchTerm: string;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setTotalInventory: React.Dispatch<React.SetStateAction<number>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  controller: AbortController;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}
export const fetchInventory = async ({page, sort, searchTerm, setInventory, setTotalInventory, setLoading, controller, addToast}: fetchInventoryProps) => {
  const params = new URLSearchParams();
  if (!page || page < 1) {
    page = 1;
  }
  params.append("page", page.toString());
  params.append("sort", sort);
  params.append("search", searchTerm || "");
  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/inventory?${params}`, {method: 'GET', credentials: 'include', signal: controller.signal,});
    if (!response.ok) throw new Error('Failed to fetch inventory.');
    const data = await response.json();
    setInventory(data[0]);
    setTotalInventory(data[1]);
  } catch (err) {
    if (!controller.signal.aborted) {
      addToast("Failed to fetch inventory.", 'error', 3000);
    }
    if (err instanceof Error) {
      console.error(err.message);
    }
  } finally {
    if (!controller.signal.aborted) {
      setLoading(false);
    }
  }
};