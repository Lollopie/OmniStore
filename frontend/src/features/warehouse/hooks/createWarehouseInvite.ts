import { WarehouseInviteDto } from '@shared/dto/warehouse.dto';

export async function createWarehouseInvite(data: WarehouseInviteDto, addToast: (message: string, type: 'success' | 'error', duration: number) => void) {
  try {
    const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/warehouses/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || 'Failed to create invite');
    }
    addToast(`Invite created successfully`, 'success', 5000);
  } catch (err) {
    addToast(`Failed to create invite`, 'error', 3000);
    if (err instanceof Error) console.error(err.message);
  }
}