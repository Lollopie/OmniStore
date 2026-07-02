export const fetchInventory = async (page, sort, setInventory, setTotalInventory, setError, setLoading) => {
  const params = new URLSearchParams();
  if (!page || page < 1) {
    page = 1;
  }
  params.append("page", page);
  params.append("sort", sort);
  try {
    const response = await fetch(`http://localhost:3000/inventory?${params}`, {method: 'GET', credentials: 'include'});
    if (!response.ok) throw new Error('Failed to fetch inventory.');
    const data = await response.json();

    // Only update state if the component is still mounted
    setInventory(data[0]);
    setTotalInventory(data[1]);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};