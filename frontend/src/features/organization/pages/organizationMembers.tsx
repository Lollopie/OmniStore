import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../toast';
import { getUsers } from '../hooks/getUsers.ts';
import Pagination from '../../../components/Pagination.tsx';
import { useSearchParams } from 'react-router';
import TableHead from '../../../components/TableHead.tsx';
import TableDataCell from '../../../components/TableDataCell.tsx';
import Button from '../../../components/Button.tsx';
import { changeUserRole } from '../hooks/changeUserRole.ts';
import { ORG_INVITATION_PERMISSIONS, OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { copyToClipboard } from '../../../utils/copyToClipboard.ts';
import { readStoredValue } from '../../../hooks/readStoredValue.ts';
import { useSubscription } from '../../payment/subscriptionContext';
import { generatePagination } from '../../../hooks/generatePagination.ts';
import { useDebounce } from '../../../hooks/useDebounce.ts';
import { SearchField } from '../../../components/SearchField.tsx';
import { Modal } from '../../../components/Modal.tsx';
import { PageCard, SectionCard } from '../../../components/PageCard.tsx';
import { useAuth } from '../../auth/authContext';
import { removeOrganizationUser } from '../hooks/removeOrganizationUser.ts';

export interface OrganizationUser {
  userId: string;
  username: string;
  role: string;
}

const OrganizationMembers = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [pages, setPages] = useState<(string | number)[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const page: number = Number(searchParams.get('page')) || 1;

  const { addToast } = useToast();
  const { isReadOnly } = useSubscription();
  const { logout } = useAuth();
  const usersPerPage = 10;
  const orgRole = readStoredValue<OrganizationRole>('orgRole') as OrganizationRole;
  const currentUserId = readStoredValue<string>('userId');
  const manageableRoles: string[] = ORG_INVITATION_PERMISSIONS[orgRole] ?? [];
  const canManageUsers = manageableRoles.length > 0;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [userToRemove, setUserToRemove] = useState<OrganizationUser | null>(null);
  const openRemoveDialog = (user: OrganizationUser) => {
    setUserToRemove(user);
    dialogRef.current?.showModal();
  };
  const closeRemoveDialog = () => {
    dialogRef.current?.close();
    setUserToRemove(null);
  };
  const confirmRemove = async () => {
    if (!userToRemove) return;
    const removed = await removeOrganizationUser(userToRemove.userId, addToast);
    if (removed) {
      if (userToRemove.userId === currentUserId) {
        closeRemoveDialog();
        logout();
        return;
      }
      setUsers((prev) => prev.filter((user) => user.userId !== userToRemove.userId));
      setTotalUsers((prev) => prev - 1);
    }
    closeRemoveDialog();
  };
  useEffect(() => {
    const controller = new AbortController();
    getUsers({ searchTerm: debouncedSearchTerm, setUsers, setTotalUsers, controller, addToast });
    return () => controller.abort();
  }, [addToast, debouncedSearchTerm]);
  useEffect(() => {
    generatePagination(Number(page), Math.max(Math.ceil(totalUsers / usersPerPage), 1), setPages);
  }, [page, totalUsers]);
  return (
    <PageCard title="Members" description="Everyone in your organization and their organization role.">
      <SectionCard title={`${totalUsers} ${totalUsers === 1 ? 'member' : 'members'}`}>
        <SearchField className="sm:max-w-xs w-full" searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="overflow-x-auto">
          <table className="table bg-base-100 border border-base-300 rounded-md">
            <thead>
            <tr>
              <TableHead children="Id" variant="first" />
              <TableHead children="Name" />
              <TableHead children="Role" />
              {canManageUsers && <TableHead children="" />}
            </tr>
            </thead>
            <tbody>
            {users.length === 0 ? (
              <tr className="hover:bg-base-300/50 transition-colors">
                <td colSpan={canManageUsers ? 4 : 3} className="text-center p-3 text-base-300">
                  No users in organization.
                </td>
              </tr>
            ) : (
              users.map((user: OrganizationUser) => (
                <tr key={user.userId} className="hover:bg-base-300/50 transition-colors">
                  <TableDataCell className="font-mono" children={
                                                          <div className="flex items-center gap-2">
                    <span className="hidden sm:block sm:max-w-[120px] truncate" title={user.userId}>
                        {user.userId}
                    </span>
                                                           <Button
                                                             onClick={() => {
                                                               copyToClipboard(user.userId);
                                                               addToast('Copied to clipboard!', 'success', 2000);
                                                             }}
                                                             title="Copy Full ID"
                                                             className="bg-base-200 border-base-400 text-base-300"
                                                             size="sm"
                                                             children={
                                                               <svg xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-4 w-4"
                                                                    fill="none" viewBox="0 0 24 24"
                                                                    stroke="currentColor">
                                                                 <use href="/icons.svg#copy-icon" />
                                                               </svg>
                                                             }
                                                           />
                                                         </div>
                                                       } />
                  <TableDataCell children={user.username} />
                  <TableDataCell>
                    {manageableRoles.includes(user.role) ? (
                      <select
                        aria-label={`Role of ${user.username}`}
                        className="select select-sm focus:outline-none focus:ring-none focus:border-none"
                        value={user.role}
                        disabled={isReadOnly}
                        onChange={async (e) => {
                          await changeUserRole({
                            user,
                            newRole: e.target.value,
                            setUsers,
                            addToast,
                          });
                        }}
                      >
                        {manageableRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      user.role
                    )}
                  </TableDataCell>
                  {canManageUsers && (
                    <TableDataCell>
                      {manageableRoles.includes(user.role) && (
                        <Button
                          size="sm"
                          variant="danger"
                          aria-label={`Remove ${user.username}`}
                          onClick={() => openRemoveDialog(user)}>
                          Remove
                        </Button>
                      )}
                    </TableDataCell>
                  )}
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={pages} numberOfPages={Math.ceil(totalUsers / 10)} searchParams={searchParams}
                    setSearchParams={setSearchParams} />
      </SectionCard>
      <Modal dialogRef={dialogRef} title="Remove user" onClose={closeRemoveDialog}>
        <div className="space-y-4 p-4">
          <p>
            {userToRemove?.userId === currentUserId
              ? 'Leave the organization? Your account will be deleted and you will be logged out.'
              : `Remove ${userToRemove?.username} from the organization? Their account will be deleted.`}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeRemoveDialog}>
              Cancel
            </Button>
            <Button variant="danger" aria-label="Confirm removal" onClick={confirmRemove}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </PageCard>
  );
};
export default OrganizationMembers;