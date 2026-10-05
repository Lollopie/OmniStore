import { api } from '../../../api/client.ts';
import { WarehouseInviteDto } from '@shared/dto/warehouse.dto';

export async function createWarehouseInvite(data: WarehouseInviteDto, addToast: (message: string, type: 'success' | 'error', duration: number) => void) {
  try {
    await api.post('/warehouses/invites', data);
    addToast(`Invite created successfully`, 'success', 5000);
  } catch (err) {
    addToast(`Failed to create invite`, 'error', 3000);
    if (err instanceof Error) console.error(err.message);
  }
}