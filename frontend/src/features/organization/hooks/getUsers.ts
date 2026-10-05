import type { OrganizationUser } from '../pages/organizationMembers.tsx';
import { api } from '../../../api/client.ts';

interface Props {
  searchTerm?: string;
  setUsers: React.Dispatch<React.SetStateAction<OrganizationUser[]>>;
  setTotalUsers: React.Dispatch<React.SetStateAction<number>>;
  controller: AbortController;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}

export const getUsers = async ({ searchTerm, setUsers, setTotalUsers, controller, addToast }: Props) => {
  const activeRole = localStorage.getItem('orgRole') || '';
  if (activeRole == 'owner' || activeRole == 'admin') {
    const params = new URLSearchParams();
    try {
      params.append('search', searchTerm || '');
      const { data } = await api.get<{ data: { userId: string, username: string, role: string }[], total: number }>(
        '/organizations/users',
        { params, signal: controller.signal },
      );
      setUsers(data.data);
      setTotalUsers(data.total);
    } catch (err) {
      if (!controller.signal.aborted) {
        addToast('Failed to get users', 'error', 3000);
      }
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  } else {
    if (activeRole == 'member') {
      setUsers([{
        userId: localStorage.getItem('userId') || '',
        username: localStorage.getItem('username') || '',
        role: localStorage.getItem('orgRole') || '',
      }]);
      setTotalUsers(1);
    } else {
      setUsers([]);
      setTotalUsers(0);
    }
  }
};