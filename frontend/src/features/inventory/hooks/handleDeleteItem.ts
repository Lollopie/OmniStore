import React from 'react';

type Props = {
  itemId: string;
  itemName: string;
  amount: string;
  setRefreshIndex: React.Dispatch<React.SetStateAction<number>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
};

export const handleDeleteItem = async ({itemId, itemName, amount, setRefreshIndex, addToast}: Props) => {
  if (!itemId || !itemName.trim() || !amount) {
    alert('Please provide an ID, a name and an amount.');
    return;
  }

  const newItem = {
    itemId: itemId,
    itemName: itemName.trim(),
    amount: amount.trim()
  };

  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/inventory`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newItem),
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to delete item.');

    setRefreshIndex(prev => prev + 1);

    addToast('Item deleted successfully!', 'success', 3000);
  } catch (err) {
    addToast('Failed to delete item', 'error', 3000);
    if (err instanceof Error) {
      console.error(`Error deleting item: ${err.message}`);
    }
  }
};