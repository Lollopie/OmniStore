type AddToast = (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;

export interface OrganizationDetails {
  orgId: string;
  name: string;
  createdAt: string;
  subscription: string | null;
}

const organizationsUrl = `${import.meta.env.VITE_NESTJS_HOST_URL}/organizations`;

async function getErrorMessage(response: Response, fallback: string) {
  const data: { message?: string | string[] } = await response.json().catch(() => ({}));
  return (Array.isArray(data.message) ? data.message[0] : data.message) || fallback;
}

export async function getOrganization(controller: AbortController, addToast: AddToast): Promise<OrganizationDetails | null> {
  try {
    const response = await fetch(`${organizationsUrl}/me`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to get organization'));
    return await response.json();
  } catch (err) {
    if (!controller.signal.aborted) {
      addToast('Failed to get organization', 'error', 3000);
    }
    if (err instanceof Error) console.error(err.message);
    return null;
  }
}

export async function renameOrganization(name: string, addToast: AddToast): Promise<string | null> {
  try {
    const response = await fetch(organizationsUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to rename organization'));
    const data: { name: string } = await response.json();
    addToast('Organization renamed', 'success', 3000);
    return data.name;
  } catch (err) {
    addToast(err instanceof Error ? err.message : 'Failed to rename organization', 'error', 3000);
    return null;
  }
}

export async function deleteOrganization(confirmName: string, addToast: AddToast): Promise<boolean> {
  try {
    const response = await fetch(organizationsUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ confirmName }),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to delete organization'));
    addToast('Organization deleted', 'success', 5000);
    return true;
  } catch (err) {
    addToast(err instanceof Error ? err.message : 'Failed to delete organization', 'error', 5000);
    return false;
  }
}
