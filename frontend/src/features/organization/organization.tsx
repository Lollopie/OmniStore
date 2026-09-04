import { useEffect, useState } from 'react';
import { useToast } from '../toast';
import { getUsers } from './hooks/getUsers.ts';
import Pagination from '../../components/Pagination.tsx';
import { useSearchParams } from 'react-router';
import TableHead from '../../components/TableHead.tsx';
import TableDataCell from '../../components/TableDataCell.tsx';
import Button from '../../components/Button.tsx';
import { changeUserRole } from './hooks/changeUserRole.ts';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { copyToClipboard } from '../../utils/copyToClipboard.ts';
import { readStoredValue } from '../../hooks/readStoredValue.ts';
import { generatePagination } from '../../hooks/generatePagination.ts';
export interface OrganizationUser {
  userId: string;
  username: string;
  role: string;
}
const Organization = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<(string | number)[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const controller = new AbortController();
  const { addToast } = useToast();
  const usersPerPage = 10;
  useEffect(() => {
    getUsers({searchTerm, setUsers, setTotalUsers, controller, addToast });
  }, [searchTerm]);
  useEffect(() => {
    generatePagination(Number(page), Math.max(Math.ceil(totalUsers / usersPerPage), 1), setPages);
  }, [page, totalUsers]);
  return (
    <section className="card max-w-2xl mx-auto bg-base-100 border-primary border">
      <div className="card-body">
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
                  {readStoredValue('orgRole') === 'owner' || readStoredValue('orgRole') === 'admin' ? (
                    <select
                      className="select select-sm focus:outline-none focus:ring-none focus:border-none"
                      value={user.role}
                      onChange={async (e) => {
                        await changeUserRole({
                          user,
                          newRole: e.target.value,
                          setUsers,
                          addToast
                        })
                      }}
                    >
                      {Object.values(OrganizationRole).map((role) => (
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
      </div>
      <section className="mb-5">
        <Pagination page={page} pages={pages} numberOfPages={Math.ceil(totalUsers / 10)} searchParams={searchParams} setSearchParams={setSearchParams} />
      </section>
    </section>
  );
}
export default Organization;