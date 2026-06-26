// Handle POST request for new item
export const handleAddItem = async (name, amount, inventory, setName, setAmount, setInventory) => {

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
    const response = await fetch('http://localhost:3000/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newItem),
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to add item.');

    // Refresh the list or append the returned item
    const addedItem = await response.json();
    setInventory([...inventory, addedItem]);

    // Reset form fields
    setName('');
    setAmount('');
  } catch (err) {
    alert(`Error adding item: ${err.message}`);
  }
};