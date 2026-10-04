import type { OrganizationInviteDto } from '@shared/dto/organization.dto';

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

const invitesUrl = `${import.meta.env.VITE_NESTJS_HOST_URL}/organizations/invites`;

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data: { message?: string | string[] } = await response.json();
    return (Array.isArray(data.message) ? data.message[0] : data.message) || fallback;
  } catch {
    return fallback;
  }
}

export async function getOrganizationInvites(controller: AbortController, addToast: AddToast): Promise<PendingInvite[]> {
  try {
    const response = await fetch(invitesUrl, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to get invites'));
    return await response.json();
  } catch (err) {
    if (!controller.signal.aborted) {
      addToast('Failed to get invites', 'error', 3000);
    }
    if (err instanceof Error) console.error(err.message);
    return [];
  }
}

export async function createOrganizationInvite(data: OrganizationInviteDto, addToast: AddToast): Promise<boolean> {
  try {
    const response = await fetch(invitesUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to create invite'));
    addToast('Invite sent successfully', 'success', 5000);
    return true;
  } catch (err) {
    addToast(err instanceof Error ? err.message : 'Failed to create invite', 'error', 3000);
    return false;
  }
}

export async function resendOrganizationInvite(inviteId: string, addToast: AddToast): Promise<boolean> {
  try {
    const response = await fetch(`${invitesUrl}/${inviteId}/resend`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to resend invite'));
    addToast('Invite resent', 'success', 3000);
    return true;
  } catch (err) {
    addToast(err instanceof Error ? err.message : 'Failed to resend invite', 'error', 3000);
    return false;
  }
}

export async function revokeOrganizationInvite(inviteId: string, addToast: AddToast): Promise<boolean> {
  try {
    const response = await fetch(`${invitesUrl}/${inviteId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to revoke invite'));
    addToast('Invite revoked', 'success', 3000);
    return true;
  } catch (err) {
    addToast(err instanceof Error ? err.message : 'Failed to revoke invite', 'error', 3000);
    return false;
  }
}
