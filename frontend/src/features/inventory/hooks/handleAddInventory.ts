// Handle POST request for new item
import React from 'react';

export const handleAddItem = async (name: string, amount: string, inventory: ({name: string, amount: string})[], setName: React.Dispatch<React.SetStateAction<string>>, setAmount: React.Dispatch<React.SetStateAction<string>>, setInventory: React.Dispatch<React.SetStateAction<({name: string, amount: string})[]>>) => {

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

    // Refresh the list or append the returned item
    const addedItem: {name:string, amount: string} = await response.json();
    setInventory([...inventory, addedItem]);

    // Reset form fields
    setName('');
    setAmount('');
  } catch (err: unknown) {
    if (err instanceof Error) {
      alert(`Error adding item: ${err.message}`);
    }
  }
};