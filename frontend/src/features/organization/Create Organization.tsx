import axios from 'axios';
import { api, errorMessage } from '../../api/client.ts';
import { startTransition, useEffect, useState } from 'react';
import { useToast } from '../toast';
import Register from '../auth/authForm/Register.tsx';
import InputField from '../../components/InputField.tsx';
import { PasswordInput } from '../../components/PasswordInput.tsx';
import Button from '../../components/Button.tsx';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { OrganizationDto } from '@shared/dto/organization.dto.ts';
import { useForm } from 'react-hook-form';
import { HomeNavBar } from '../homepage/components/HomeNavBar.tsx';
import { HomepageFooter } from '../homepage/components/HomepageFooter.tsx';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/authContext';

export function InvalidToken() {
  return (
    <Register message="Invalid token. Please try again." />
  );
}

const resolver = classValidatorResolver(OrganizationDto);
const CreateOrganization = () => {
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const { addToast } = useToast();
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationDto>({ resolver });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    const verifyToken = async () => {
      const token = new URLSearchParams(window.location.search).get('token');
      if (!token) {
        setVerifying(false);
        return;
      }
      try {
        const { data } = await api.get<{ valid?: boolean, error?: string, email?: string }>('/register/verify', {
          params: { token },
        });
        if (!data.valid) {
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
  }, [addToast]);
  const submit = async (organizationDto: OrganizationDto) => {
    setError('');
    setSuccess('');

    const trimmedUsername = organizationDto.ownerUsername.trim();
    const password = organizationDto.ownerPassword;
    const organizationName = organizationDto.name.trim();
    const token = new URLSearchParams(window.location.search).get('token');
    try {
      const { data } = await api.post<{ message?: string }>(
        '/organizations/register',
        {
          ownerEmail: email,
          ownerUsername: trimmedUsername,
          ownerPassword: password,
          name: organizationName,
        },
        { params: { token } },
      );
      addToast(data.message || 'Organization created successfully.', 'success');
      // React Router applies navigations as transitions; updating auth in the same transition
      // renders both together, so GuestRoute doesn't first bounce the new user to /organizations
      startTransition(() => {
        navigate('/subscribe', { replace: true });
        setIsAuthenticated(true);
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const message = errorMessage(err);
        if (message) {
          console.log(message);
          addToast('Error creating organization', 'error', 5000);
        }
      } else {
        addToast('Something went wrong. Please try again.', 'error', 5000);
      }
    }
  };
  return verifying ? <p>Verifying token...</p> : !tokenValid ? <InvalidToken /> :
    <div className="min-h-screen flex flex-col pt-5 gap-10">
      <header>
        <HomeNavBar />
      </header>
      <main className="grow">
        <section className="mx-auto max-w-md">

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
              {errors.ownerUsername &&
                <p className="text-sm text-error font-medium">{errors.ownerUsername.message}</p>}
              <PasswordInput
                label="Password"
                type="password"
                {...register('ownerPassword')}
              />
              {errors.ownerPassword &&
                <p className="text-sm text-error font-medium">{errors.ownerPassword.message}</p>}
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
        </section>
      </main>
      <footer className="justify-self-end">
        <HomepageFooter />
      </footer>
    </div>;
};

export default CreateOrganization;