type AddToast = (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;

export async function removeOrganizationUser(userId: string, addToast: AddToast): Promise<boolean> {
  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/organizations/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const data: { message?: string } = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to remove user');
    }
    addToast('User removed from organization', 'success', 3000);
    return true;
  } catch (err) {
    addToast(err instanceof Error ? err.message : 'Failed to remove user', 'error', 3000);
    return false;
  }
}
