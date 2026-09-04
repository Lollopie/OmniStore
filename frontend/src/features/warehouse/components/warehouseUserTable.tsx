import TableHead from '../../../components/TableHead.tsx';
import type { Warehouse, WarehouseUser } from '../pages/warehouseUsers.tsx';
import Button from '../../../components/Button.tsx';
import { copyToClipboard } from '../../../utils/copyToClipboard.ts';
import TableDataCell from '../../../components/TableDataCell.tsx';
import { changeUserRole } from '../hooks/changeUserRole.ts';
import { WarehouseRole } from '@shared';
interface WarehouseUserTableProps {
  users: WarehouseUser[];
  activeWarehouse: Warehouse;
  setUsers: React.Dispatch<React.SetStateAction<WarehouseUser[]>>;
  setActiveWarehouse: React.Dispatch<React.SetStateAction<Warehouse>>;
  addToast: (message: string, variant: 'success' | 'error' | 'info', duration: number) => void;
}
export function WarehouseUserTable({ users, activeWarehouse, setUsers, setActiveWarehouse, addToast }: WarehouseUserTableProps) {
  return (
    <table className="table mt-8 border border-base-300 rounded-md">
      <thead>
      <tr>
        <TableHead children="Id" variant="first"/>
        <TableHead children="Name" />
        <TableHead children="Role" />
      </tr>
      </thead>
      <tbody>
      {users.length === 0 ? (
        <tr className="hover:bg-base-300/50 transition-colors">
          <td colSpan={3} className="text-center p-3 text-base-300">
            No users in warehouse.
          </td>
        </tr>
      ) : (
        users.map((user: WarehouseUser) => (
          <tr key={user.userId} className="hover:bg-base-300/50 transition-colors">
            <TableDataCell className="font-mono" children={
              <div className="flex items-center gap-2">
                    <span className="hidden sm:block sm:max-w-[120px] truncate" title={user.userId}>
                        {user.userId}
                    </span>
                <Button
                  onClick={() => {copyToClipboard(user.userId); addToast('Copied to clipboard!','success',2000);}}
                  title="Copy Full ID"
                  className="bg-base-200 border-base-400 text-base-300"
                  size="sm"
                  children={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <use href="/icons.svg#copy-icon" />
                    </svg>
                  }
                />
              </div>
            } />
            <TableDataCell children={user.username} />
            <TableDataCell>
              {activeWarehouse.role === 'admin' ? (
                <select
                  className="select select-sm focus:outline-none focus:ring-none focus:border-none"
                  value={user.role}
                  onChange={async (e) => {
                    await changeUserRole({
                      user,
                      newRole: e.target.value,
                      setUsers,
                      setActiveWarehouse,
                      addToast
                    })
                  }}
                >
                  {Object.values(WarehouseRole).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                user.role
              )}
            </TableDataCell>
          </tr>
        ))
      )}
      </tbody>
    </table>
  )
}