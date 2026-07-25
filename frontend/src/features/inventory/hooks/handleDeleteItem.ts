import React from 'react';

type Props = {
  id: string;
  name: string;
  amount: string;
  setRefreshIndex: React.Dispatch<React.SetStateAction<number>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
};

export const handleDeleteItem = async ({id, name, amount, setRefreshIndex, addToast}: Props) => {
  if (!id || !name.trim() || !amount) {
    alert('Please provide an ID, a name and an amount.');
    return;
  }

  const newItem = {
    id: id,
    name: name.trim(),
    amount: parseInt(amount, 10)
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