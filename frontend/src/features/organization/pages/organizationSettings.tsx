import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { UpdateOrganizationDto } from '@shared/dto/organization.dto';
import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';
import { Modal } from '../../../components/Modal.tsx';
import { readStoredValue } from '../../../hooks/readStoredValue.ts';
import { useToast } from '../../toast';
import { useAuth } from '../../auth/authContext';
import {
  deleteOrganization,
  getOrganization,
  type OrganizationDetails,
  renameOrganization,
} from '../hooks/organizationSettings.ts';

const resolver = classValidatorResolver(UpdateOrganizationDto);

export function OrganizationSettings() {
  const { addToast } = useToast();
  const { logout } = useAuth();
  const isOwner = readStoredValue<string>('orgRole') === 'owner';
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOrganizationDto>({ resolver });

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getOrganization(controller, addToast).then((data) => {
      if (data && !controller.signal.aborted) {
        setOrganization(data);
        reset({ name: data.name });
      }
    });
    return () => controller.abort();
  }, [addToast, reset]);

  const closeDeleteDialog = () => {
    dialogRef.current?.close();
    setConfirmName('');
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    const deleted = await deleteOrganization(confirmName, addToast);
    setIsDeleting(false);
    if (deleted) {
      closeDeleteDialog();
      logout();
    }
  };

  return (
    <div className="card bg-base-100 p-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Organization Settings</h1>
      {organization && (
        <p className="text-base-content/70">
          {organization.name} · created {new Date(organization.createdAt).toLocaleDateString()}
        </p>
      )}

      <section className="card border border-primary/30 bg-primary/5">
        <div className="card-body gap-4">
          <h3 className="card-title text-primary">Organization name</h3>
          <form
            onSubmit={handleSubmit(async (data) => {
              const name = await renameOrganization(data.name, addToast);
              if (name && organization) {
                setOrganization({ ...organization, name });
                reset({ name });
              }
            })}
            className="space-y-4">
            <InputField
              label="Organization Name"
              inputClassName="w-full"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-error">{errors.name.message}</p>}
            <div className="card-actions justify-end">
              <Button type="submit" disabled={isSubmitting || !organization}>
                Save
              </Button>
            </div>
          </form>
        </div>
      </section>

      {isOwner && (
        <section className="card border border-error/30 bg-error/5">
          <div className="card-body gap-4">
            <h3 className="card-title text-error">Danger Zone</h3>
            <p className="text-sm text-base-content/80">
              Deleting the organization permanently removes all warehouses, inventory and invites, and deletes the
              accounts of all members. An active subscription is cancelled immediately.
            </p>
            <div className="card-actions justify-end">
              <Button variant="danger" aria-label="Delete Organization" onClick={() => dialogRef.current?.showModal()}>
                Delete Organization
              </Button>
            </div>
          </div>
        </section>
      )}

      <Modal dialogRef={dialogRef} title="Delete Organization" onClose={closeDeleteDialog}>
        <form onSubmit={handleDelete} className="space-y-4 p-4">
          <p className="text-sm text-base-content/80">
            This cannot be undone. Type <strong>{organization?.name}</strong> to confirm:
          </p>
          <InputField
            variant="danger"
            inputClassName="w-full"
            placeholder="Organization name"
            value={confirmName}
            setValue={setConfirmName}
          />
          <div className="modal-action">
            <Button type="button" variant="ghost" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              aria-label="Confirm organization deletion"
              disabled={isDeleting || confirmName.trim() !== organization?.name}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
