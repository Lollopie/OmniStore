import { useEffect, useState } from 'react';
import { useToast } from '../toast';
import Register from '../auth/authForm/Register.tsx';
import InputField from '../../components/InputField.tsx';
import { PasswordInput } from '../../components/PasswordInput.tsx';
import Button from '../../components/Button.tsx';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { OrganizationDto } from '@shared/dto/organization.dto.ts';
import { useForm } from 'react-hook-form';
export function InvalidToken() {
  return (
    <div>
      <h2 className="text-lg mb-4">
        Invalid token. Please try again.
      </h2>
      <Register />
    </div>
  );
}
const resolver = classValidatorResolver(OrganizationDto);
const CreateOrganization = () => {
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<OrganizationDto>({ resolver });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    const verifyToken = async () => {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setVerifying(false);
        return;
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/register/verify?token=${token}`, {
          method: 'GET',
          credentials: 'include'
        });
        const data: { valid?: boolean, error?: string, email?: string } = await response.json();
        if (!response.ok || !data.valid) {
          throw new Error(data.error || 'Token verification failed');
        }
        setTokenValid(true);
        setEmail(data.email || '');
      } catch {
        addToast('Token verification failed.', 'error');
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, []);
  const submit = async (organizationDto: OrganizationDto) => {
    setError('');
    setSuccess('');

    const trimmedUsername = organizationDto.ownerUsername.trim();
    const password = organizationDto.ownerPassword;
    const organizationName = organizationDto.name.trim();
    const token = new URLSearchParams(window.location.search).get("token");
    try {
      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/organizations/register?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: email, ownerUsername: trimmedUsername, ownerPassword: password, name: organizationName }),
      });

      const data: {
        message?: string;
      } = await response.json();
      if (!response.ok) {
        if( data.message ){
          console.log(data.message);
          addToast('Error creating organization', 'error', 5000);
        }
      } else {
        setSuccess(data.message || 'Organization created successfully.');
      }
    } catch {
      addToast('Something went wrong. Please try again.', 'error', 5000);
    }
  };
  return (
    <section className="max-w-md mx-auto">
      {verifying ? <p>Verifying token...</p> : tokenValid ?
        <form onSubmit={handleSubmit((data) => submit(data))}>
          <h2 className="mb-6 text-2xl font-bold">Create Organization</h2>

          {error && <p className="mb-4 text-sm text-error font-medium">{error}</p>}
          {success && <p className="mb-4 text-sm text-success font-medium">{success}</p>}
          <div className="flex flex-col gap-2">
            <InputField
              label="Email"
              value={email}
              disabled
              inputClassName="bg-base-100"
              type="email"
              {...register('ownerEmail')}
            />
            <InputField
              label="Username"
              type="text"
              {...register('ownerUsername')}
            />
            {errors.ownerUsername && <p className="text-sm text-error font-medium">{errors.ownerUsername.message}</p>}
            <PasswordInput
              label="Password"
              type="password"
              {...register('ownerPassword')}
            />
            {errors.ownerPassword && <p className="text-sm text-error font-medium">{errors.ownerPassword.message}</p>}
            <InputField
              label="Organization Name"
              type="text"
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-error font-medium">{errors.name.message}</p>}
            <Button type="submit" className="mt-4 self-start">
              Create
            </Button>
          </div>
        </form>
        :
        <InvalidToken />}
    </section>
  );
};

export default CreateOrganization;