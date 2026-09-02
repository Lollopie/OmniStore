import type { OrganizationUser } from '../organization.tsx';
interface Props {
  searchTerm?: string;
  setUsers: React.Dispatch<React.SetStateAction<OrganizationUser[]>>;
  setTotalUsers: React.Dispatch<React.SetStateAction<number>>;
  controller: AbortController;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}
export const getUsers = async ({searchTerm, setUsers, setTotalUsers, controller, addToast}: Props) => {
  const activeRole = JSON.parse(localStorage.getItem('orgRole') || '');
  if (activeRole == 'owner' || activeRole == 'admin') {
    const params = new URLSearchParams();
    try {
      params.append('search', searchTerm || '');
      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/organizations/users?${params}`, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Failed to get users.');
      const data: {data: {userId: string, username: string, role: string}[], total: number} = await response.json();
      setUsers(data.data);
      setTotalUsers(data.total);
    } catch (err) {
      if (!controller.signal.aborted) {
        addToast("Failed to get users", 'error', 3000);
      }
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  }
  else {
    if (activeRole == 'member'){
      setUsers([{userId: JSON.parse(localStorage.getItem('userId') || ''), username: JSON.parse(localStorage.getItem('username') || ''), role: JSON.parse(localStorage.getItem('activeRole') || '')}])
      setTotalUsers(1);
    }
    else {
      setUsers([]);
      setTotalUsers(0);
    }
  }
};