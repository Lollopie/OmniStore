import { api, errorMessage } from '../../../api/client.ts';
import { useState, useRef } from 'react';
import { useToast } from '../../toast';
import { readStoredValue } from '../../../hooks/readStoredValue.ts';
import { useAuth } from '../../auth/authContext/';
import { Modal } from '../../../components/Modal.tsx';
import { PageCard, SectionCard } from '../../../components/PageCard.tsx';
import Button from '../../../components/Button.tsx';
import InputField from '../../../components/InputField.tsx';
import { PasswordInput } from '../../../components/PasswordInput.tsx';
import { useForm } from 'react-hook-form';
import { ChangePasswordDto } from '@shared';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
const resolver = classValidatorResolver(ChangePasswordDto);
export const AccountSettings = () => {
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { addToast } = useToast();
  const { logout } = useAuth();

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<ChangePasswordDto>({ resolver });
  const handleOpenModal = () => {
    setPassword('');
    dialogRef.current?.showModal();
  };

  const handleCloseModal = () => {
    dialogRef.current?.close();
    setPassword('');
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      addToast('Please re-enter your password to confirm deletion.', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete('/users', {
        data: {
          userId: readStoredValue('userId', ''),
          password: password,
        },
      });

      addToast('Account successfully deleted.', 'success');
      handleCloseModal();
      logout();
    } catch (error) {
      addToast(errorMessage(error) ?? 'Failed to delete account.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdatePassword = async (changePasswordDto: ChangePasswordDto) => {

    if (!changePasswordDto.password || !changePasswordDto.newPassword || !changePasswordDto.confirmPassword) {
      addToast('Please fill in all fields.', 'error');
      return;
    }

    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      addToast('New password and confirmation do not match.', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      await api.patch('/users', {
        password: changePasswordDto.password,
        newPassword: changePasswordDto.newPassword,
        confirmPassword: changePasswordDto.confirmPassword,
      });

      addToast('Password updated successfully.', 'success');
    } catch (error) {
      addToast(errorMessage(error) ?? 'Failed to update password.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <PageCard title="Account Settings" description="Manage your profile and authentication settings.">
      <SectionCard title="Change Password" description="Update your current password to keep your account secure.">
          <form onSubmit={handleSubmit((data) => {handleUpdatePassword(data)})} className="space-y-4">
            <PasswordInput
              className="input input-bordered w-full focus:input-primary"
              placeholder="Current Password"
              label="Current Password"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
            <PasswordInput
              className="input input-bordered w-full focus:input-primary"
              placeholder="New Password"
              label="New Password"
              {...register('newPassword')}
            />
            {errors.newPassword && <p className="text-xs text-error">{errors.newPassword.message}</p>}
            <PasswordInput
              className="input input-bordered w-full focus:input-primary"
              placeholder="Confirm New Password"
              label="Confirm New Password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="text-xs text-error">{errors.confirmPassword.message}</p>}
            <div className="card-actions justify-end">
              <Button
                type="submit"
                variant="primary"
              >
                {isUpdating ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
      </SectionCard>

      <SectionCard
        tone="error"
        title="Danger Zone"
        description="Deleting your account is permanent. All associated data will be permanently removed."
        actions={
          <Button variant={"danger"} onClick={handleOpenModal}>
            Delete Account
          </Button>
        }
      />

      <Modal dialogRef={dialogRef} title="Delete Account" onClose={handleCloseModal}>
        <form onSubmit={handleDeleteAccount} className="space-y-4 p-4">
          <p className="text-sm text-base-content/80">
            This action cannot be undone. Please enter your password to confirm deletion:
          </p>

          <InputField
            variant="danger"
            type="password"
            inputClassName="w-full"
            placeholder="Enter your password"
            value={password}
            setValue={(e) => setPassword(e)}
          />
          <div className="modal-action">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseModal}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Deleting...
                </>
              ) : (
                'Confirm Deletion'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </PageCard>
  );
};