import { useState, useEffect } from 'react';

const InventoryManager = () => {
  // State for inventory items and form inputs
  const [inventory, setInventory] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base API URL - replace with your actual API endpoint
  const API_URL = 'http://localhost:3000/inventory';
// 1. Set your initial loading state to true right away

  useEffect(() => {
    // Use an abort controller to safely handle cleanup if the component unmounts
    let isMounted = true;

    const fetchInventory = async () => {
      try {
        const response = await fetch(API_URL, {method: 'GET', credentials: 'include'});
        if (!response.ok) throw new Error('Failed to fetch inventory.');
        const data = await response.json();

        // Only update state if the component is still mounted
        if (isMounted) {
          setInventory(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInventory();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array ensures this runs once on mount



  // Handle POST request for new item
  const handleAddItem = async (e) => {
    e.preventDefault();

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
      const response = await fetch(API_URL, {
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

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Inventory Manager</h2>

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            lineHeight: '1'
          }}
          title="Add Item"
        >
          +
        </button>
      </form>

      {/* Status Messages */}
      {loading && <p>Loading inventory...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Inventory Table */}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
          <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Amount</th>
          </tr>
          </thead>
          <tbody>
          {inventory.length === 0 ? (
            <tr>
              <td colSpan={2} style={{ textAlign: 'center', padding: '12px', color: '#777' }}>
                No items in inventory.
              </td>
            </tr>
          ) : (
            inventory.map((item, index) => (
              <tr key={item.id || index} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{item.name}</td>
                <td style={{ padding: '12px' }}>{item.amount}</td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InventoryManager;