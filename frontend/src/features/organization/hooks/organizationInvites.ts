import type { OrganizationInviteDto } from '@shared/dto/organization.dto';
import { api, errorMessage } from '../../../api/client.ts';

type AddToast = (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;

export interface PendingInvite {
  inviteId: string;
  email: string;
  role: string;
  warehouseId: string | null;
  warehouseName: string | null;
  expiresAt: string;
  createdAt: string;
}

export async function getOrganizationInvites(controller: AbortController, addToast: AddToast): Promise<PendingInvite[]> {
  try {
    const { data } = await api.get<PendingInvite[]>('/organizations/invites', { signal: controller.signal });
    return data;
  } catch (err) {
    if (!controller.signal.aborted) {
      addToast('Failed to get invites', 'error', 3000);
    }
    console.error(errorMessage(err) ?? 'Failed to get invites');
    return [];
  }
}

export async function createOrganizationInvite(data: OrganizationInviteDto, addToast: AddToast): Promise<boolean> {
  try {
    await api.post('/organizations/invites', data);
    addToast('Invite sent successfully', 'success', 5000);
    return true;
  } catch (err) {
    addToast(errorMessage(err) ?? 'Failed to create invite', 'error', 3000);
    return false;
  }
}

export async function resendOrganizationInvite(inviteId: string, addToast: AddToast): Promise<boolean> {
  try {
    await api.post(`/organizations/invites/${inviteId}/resend`);
    addToast('Invite resent', 'success', 3000);
    return true;
  } catch (err) {
    addToast(errorMessage(err) ?? 'Failed to resend invite', 'error', 3000);
    return false;
  }
}

export async function revokeOrganizationInvite(inviteId: string, addToast: AddToast): Promise<boolean> {
  try {
    await api.delete(`/organizations/invites/${inviteId}`);
    addToast('Invite revoked', 'success', 3000);
    return true;
  } catch (err) {
    addToast(errorMessage(err) ?? 'Failed to revoke invite', 'error', 3000);
    return false;
  }
}
