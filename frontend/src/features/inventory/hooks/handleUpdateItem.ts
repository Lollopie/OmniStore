import React from 'react';

type Props = {
  itemId: string;
  itemName: string;
  amount: string;
  setRefreshIndex: React.Dispatch<React.SetStateAction<number>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
};

export const handleUpdateItem = async ({itemId, itemName, amount, setRefreshIndex, addToast}: Props) => {
  if (!itemId || !itemName.trim() || !amount) {
    alert('Please provide an ID, a name and an amount.');
    return;
  }

  const newItem = {
    itemId: itemId,
    itemName: itemName.trim(),
    amount: amount.trim(),
  };

  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/inventory`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newItem),
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to update item.');

    setRefreshIndex(prev => prev + 1);

    addToast('Item updated successfully!', 'success', 3000);
  } catch (err) {
    addToast('Failed to update item', 'error', 3000);
    if (err instanceof Error) {
      console.error(`Error updating item: ${err.message}`);
    }
  }
};