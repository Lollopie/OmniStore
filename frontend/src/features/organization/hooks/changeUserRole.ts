import { readStoredValue } from '../../../hooks/readStoredValue.ts';
import type { OrganizationUser } from '../pages/organizationMembers.tsx';
import { api } from '../../../api/client.ts';

interface Props {
  user: OrganizationUser;
  newRole: string;
  setUsers: React.Dispatch<React.SetStateAction<OrganizationUser[]>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}

export const changeUserRole = async ({ user, newRole, setUsers, addToast }: Props) => {
  try {
    await api.patch('/organizations/users', { username: user.username, role: newRole });
    const currentUsername = readStoredValue('username');
    if (user.username === currentUsername) {
      localStorage.setItem('orgRole', newRole);
    }
    setUsers((prev) => prev.map((u) => u.userId === user.userId ? { ...u, role: newRole } : u));
    addToast(`Successfully set User role for "${user.username}"`, 'success', 5000);
  } catch (err) {
    addToast('Failed to update role.', 'error', 5000);
    if (err instanceof Error) {
      console.error(err);
    }
  }
};
