import type { WarehouseUser } from '../warehouse.tsx';
interface Props {
  newUsername: string;
  setUsers: React.Dispatch<React.SetStateAction<WarehouseUser[]>>;
  setNewUsername: React.Dispatch<React.SetStateAction<string>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}
export const addUser = async ({newUsername, setUsers, setNewUsername, addToast}: Props) => {
  const username = newUsername || '';
  if (!username) return alert('Enter a username');
  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouse/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: username, role: 'staff' }),
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || 'Failed to add user');
    }
    const newUser = await response.json();
    newUser.username = username;
    setUsers((prev) => [...prev, newUser]);
    setNewUsername('');
    addToast(`Added user "${username}" to active warehouse`, 'success', 5000);
  } catch (err) {
    addToast(`Failed to add user "${username}"`, 'error', 3000);
    if (err instanceof Error) console.error(err.message);
  }
};