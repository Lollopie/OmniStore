import React from 'react';

export const handleAddWarehouse = async (name: string,setName: React.Dispatch<React.SetStateAction<string>>) => {

  if (!name.trim()) {
    alert('Please provide a name.');
    return;
  }

  const newWarehouse = {
    name: name.trim(),
  };

  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newWarehouse),
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to add warehouse.');

    const addedItem: {name:string} = await response.json();
    const currentWarehouses = JSON.parse(localStorage.getItem('user_warehouses'));
    currentWarehouses.push(addedItem);
    localStorage.setItem('user_warehouses', JSON.stringify(currentWarehouses));
    setName('');
  } catch (err: unknown) {
    if (err instanceof Error) {
      alert(`Error adding warehouse: ${err.message}`);
    }
  }
};