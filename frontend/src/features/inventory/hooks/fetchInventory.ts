import React from 'react';

export const fetchInventory = async (page: number, sort: string, setInventory: React.Dispatch<React.SetStateAction<string[]>>, setTotalInventory: React.Dispatch<React.SetStateAction<number>>, setError: React.Dispatch<React.SetStateAction<string>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
  const params = new URLSearchParams();
  if (!page || page < 1) {
    page = 1;
  }
  params.append("page", page.toString());
  params.append("sort", sort);
  try {
    const response = await fetch(`${process.env.NESTJS_HOST_URL}/inventory?${params}`, {method: 'GET', credentials: 'include'});
    if (!response.ok) throw new Error('Failed to fetch inventory.');
    const data = await response.json();

    // Only update state if the component is still mounted
    setInventory(data[0]);
    setTotalInventory(data[1]);
  } catch (err) {
    if (err instanceof Error) {
      setError(err.message);
    }
  } finally {
    setLoading(false);
  }
};