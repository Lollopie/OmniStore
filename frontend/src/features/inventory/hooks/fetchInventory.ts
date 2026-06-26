export const fetchInventory = async (setMounted, setInventory, setError, setLoading) => {
  setMounted(false);
  try {
    const response = await fetch('http://localhost:3000/inventory', {method: 'GET', credentials: 'include'});
    if (!response.ok) throw new Error('Failed to fetch inventory.');
    const data = await response.json();

    // Only update state if the component is still mounted
    setInventory(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};