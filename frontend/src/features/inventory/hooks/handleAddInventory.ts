import React from 'react';

type Props = {
  name: string;
  amount: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  setRefreshIndex: React.Dispatch<React.SetStateAction<number>>;
};

export const handleAddItem = async ({name, amount, setName, setAmount, setRefreshIndex}: Props) => {
  // Basic validation
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

    // Trigger a refresh so the Inventory component refetches the list
    setRefreshIndex(prev => prev + 1);

    // Reset form fields
    setName('');
    setAmount('');
  } catch (err: unknown) {
    if (err instanceof Error) {
      alert(`Error adding item: ${err.message}`);
    }
  }
};