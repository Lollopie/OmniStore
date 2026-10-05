import { api, errorMessage } from '../../../api/client.ts';

type AddToast = (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;

export interface OrganizationDetails {
  orgId: string;
  name: string;
  createdAt: string;
  subscription: string | null;
}

export async function getOrganization(controller: AbortController, addToast: AddToast): Promise<OrganizationDetails | null> {
  try {
    const { data } = await api.get<OrganizationDetails>('/organizations/me', { signal: controller.signal });
    return data;
  } catch (err) {
    if (!controller.signal.aborted) {
      addToast('Failed to get organization', 'error', 3000);
    }
    console.error(errorMessage(err) ?? 'Failed to get organization');
    return null;
  }
}

export async function renameOrganization(name: string, addToast: AddToast): Promise<string | null> {
  try {
    const { data } = await api.patch<{ name: string }>('/organizations', { name });
    addToast('Organization renamed', 'success', 3000);
    return data.name;
  } catch (err) {
    addToast(errorMessage(err) ?? 'Failed to rename organization', 'error', 3000);
    return null;
  }
}

export async function deleteOrganization(confirmName: string, addToast: AddToast): Promise<boolean> {
  try {
    await api.delete('/organizations', { data: { confirmName } });
    addToast('Organization deleted', 'success', 5000);
    return true;
  } catch (err) {
    addToast(errorMessage(err) ?? 'Failed to delete organization', 'error', 5000);
    return false;
  }
}
