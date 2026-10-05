import { api, errorMessage } from '../../../api/client.ts';

type AddToast = (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;

export async function removeOrganizationUser(userId: string, addToast: AddToast): Promise<boolean> {
  try {
    await api.delete(`/organizations/users/${userId}`);
    addToast('User removed from organization', 'success', 3000);
    return true;
  } catch (err) {
    addToast(errorMessage(err) ?? 'Failed to remove user', 'error', 3000);
    return false;
  }
}
