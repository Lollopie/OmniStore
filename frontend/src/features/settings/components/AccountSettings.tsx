import { useState, useRef } from 'react';
import { useToast } from '../../toast';
import { readStoredValue } from '../../../hooks/readStoredValue.ts';
import { useAuth } from '../../auth/authContext/';
import { Modal } from '../../../components/Modal.tsx';
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
      const response = await fetch('http://localhost:3000/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: readStoredValue('userId', ''),
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete account.');
      }

      addToast('Account successfully deleted.', 'success');
      handleCloseModal();
      logout();
    } catch (error) {
      if (error instanceof Error) {
        addToast(error.message || 'Failed to delete account.', 'error');
      }
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
      const response = await fetch('http://localhost:3000/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: changePasswordDto.password,
          newPassword: changePasswordDto.newPassword,
          confirmPassword: changePasswordDto.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update password.');
      }

      addToast('Password updated successfully.', 'success');
    } catch (error) {
      if (error instanceof Error) {
        addToast(error.message || 'Failed to update password.', 'error');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl">
      <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
      <p className="text-base-content/70 mb-6">Manage your profile and authentication settings.</p>

      <div className="card border border-primary/30 bg-primary/5 shadow-sm mb-6">
        <div className="card-body">
          <h3 className="card-title text-primary">Change Password</h3>
          <p className="text-sm text-base-content/80 mb-4">
            Update your current password to keep your account secure.
          </p>
          <form onSubmit={handleSubmit((data) => {handleUpdatePassword(data)})} className="space-y-4">
            <div className="form-control">
              <PasswordInput
                className="input input-bordered w-full focus:input-primary"
                placeholder="Current Password"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
            </div>
            <div className="form-control">
              <PasswordInput
                className="input input-bordered w-full focus:input-primary"
                placeholder="New Password"
                {...register('newPassword')}
              />
              {errors.newPassword && <p className="text-xs text-error">{errors.newPassword.message}</p>}
            </div>
            <div className="form-control">
              <PasswordInput
                className="input input-bordered w-full focus:input-primary"
                placeholder="Confirm New Password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-xs text-error">{errors.confirmPassword.message}</p>}
            </div>
            <div className="card-actions justify-end mt-4">
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
        </div>
      </div>

      <div className="card border border-error/30 bg-error/5 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-error">Danger Zone</h3>
          <p className="text-sm text-base-content/80">
            Deleting your account is permanent. All associated data will be permanently removed.
          </p>
          <div className="card-actions justify-end mt-4">
            <Button variant={"danger"} onClick={handleOpenModal}>
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <Modal dialogRef={dialogRef} title="Delete Account" onClose={handleCloseModal}>
        <form onSubmit={handleDeleteAccount} className="space-y-4 pt-4">
          <p className="text-sm text-base-content/80">
            This action cannot be undone. Please enter your password to confirm deletion:
          </p>

          <div className="form-control">
            <InputField
              variant="danger"
              type="password"
              className="input input-bordered w-full focus:input-error"
              placeholder="Enter your password"
              value={password}
              setValue={(e) => setPassword(e)}
              autoFocus
            />
          </div>

          <div className="modal-action">
            <Button
              variant="primary"
              className="btn btn-ghost text-base-content"
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
    </div>
  );
};