import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { OrganizationInviteDto } from '@shared/dto/organization.dto';
import { ORG_INVITATION_PERMISSIONS, OrganizationRole } from '@shared/enum/organizationRoles.enum';
import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';
import TableHead from '../../../components/TableHead.tsx';
import TableDataCell from '../../../components/TableDataCell.tsx';
import { readStoredValue } from '../../../hooks/readStoredValue.ts';
import { useToast } from '../../toast';
import { useSubscription } from '../../payment/subscriptionContext';
import {
  createOrganizationInvite,
  getOrganizationInvites,
  type PendingInvite,
  resendOrganizationInvite,
  revokeOrganizationInvite,
} from '../hooks/organizationInvites.ts';

const resolver = classValidatorResolver(OrganizationInviteDto);

export function OrganizationInvites() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationInviteDto>({ resolver, defaultValues: { role: OrganizationRole.MEMBER } });
  const { addToast } = useToast();
  const { isReadOnly } = useSubscription();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const orgRole = readStoredValue<OrganizationRole>('orgRole') as OrganizationRole;
  const allowedRoles = ORG_INVITATION_PERMISSIONS[orgRole] ?? [];

  const [reloadKey, setReloadKey] = useState(0);
  const reloadInvites = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    const controller = new AbortController();
    getOrganizationInvites(controller, addToast).then((data) => {
      if (!controller.signal.aborted) setInvites(data);
    });
    return () => controller.abort();
  }, [addToast, reloadKey]);

  const canManage = (invite: PendingInvite) =>
    invite.warehouseId !== null || allowedRoles.includes(invite.role as OrganizationRole);

  return (
    <section className="card bg-base-100 rounded-xl border border-base-300 p-4 max-w-2xl mx-auto">
      <div className="card-body">
        <section>
          <h2 className="text-lg font-semibold mb-2">Invite to organization</h2>
          <form
            onSubmit={handleSubmit(async (data) => {
              if (await createOrganizationInvite(data, addToast)) {
                reset();
                reloadInvites();
              }
            })}
            className="flex flex-col gap-4 items-start">
            <InputField
              label="Email"
              placeholder="Enter user email" {...register('email')}
              fieldsetClassName="max-w-xs w-full"
              inputClassName="w-full"
            />
            {errors.email && <p className="text-error">{errors.email.message}</p>}
            <select
              aria-label="Organization role"
              className="select select-sm focus:outline-none focus:ring-accent focus:ring-2 focus:border-none"
              {...register('role')}
            >
              {allowedRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-error">{errors.role.message}</p>}
            <Button type="submit" disabled={isReadOnly || isSubmitting}>
              Invite
            </Button>
          </form>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Pending invites</h2>
          <table className="table border border-base-300 rounded-md">
            <thead>
            <tr>
              <TableHead children="Email" variant="first" />
              <TableHead children="Role" />
              <TableHead children="Expires" />
              <TableHead children="" />
            </tr>
            </thead>
            <tbody>
            {invites.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-3 text-base-300">
                  No pending invites.
                </td>
              </tr>
            ) : (
              invites.map((invite) => {
                const expired = new Date(invite.expiresAt) < new Date();
                return (
                  <tr key={invite.inviteId} className="hover:bg-base-300/50 transition-colors">
                    <TableDataCell children={invite.email} />
                    <TableDataCell
                      children={invite.warehouseId ? `${invite.role} in ${invite.warehouseName}` : `${invite.role} (organization)`} />
                    <TableDataCell
                      className={expired ? 'text-error' : ''}
                      children={expired ? 'Expired' : new Date(invite.expiresAt).toLocaleString()} />
                    <TableDataCell>
                      {canManage(invite) && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            disabled={isReadOnly}
                            onClick={async () => {
                              if (await resendOrganizationInvite(invite.inviteId, addToast)) reloadInvites();
                            }}>
                            Resend
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            aria-label="Revoke invite"
                            disabled={isReadOnly}
                            onClick={async () => {
                              if (await revokeOrganizationInvite(invite.inviteId, addToast)) reloadInvites();
                            }}>
                            Revoke
                          </Button>
                        </div>
                      )}
                    </TableDataCell>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}
