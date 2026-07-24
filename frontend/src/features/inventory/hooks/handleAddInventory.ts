import React from 'react';

type Props = {
  name: string;
  amount: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  setRefreshIndex: React.Dispatch<React.SetStateAction<number>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
};

export const handleAddItem = async ({name, amount, setName, setAmount, setRefreshIndex, addToast}: Props) => {
  if (!name.trim() || !amount) {
    alert('Please provide both a name and an amount.');
    return;
  }

  const newItem = {
    name: name.trim(),
    amount: parseInt(amount, 10)
  };

  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newItem),
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to add item.');

    setRefreshIndex(prev => prev + 1);

    setName('');
    setAmount('');
    addToast('Item added successfully!', 'success', 3000);
  } catch (err) {
    addToast('Failed to add item', 'error', 3000);
    if (err instanceof Error) {
      console.error(`Error adding item: ${err.message}`);
    }
  }
};