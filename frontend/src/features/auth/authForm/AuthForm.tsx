import axios from 'axios';
import { api, errorMessage } from '../../../api/client.ts';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { RegisterDto } from '@shared/dto/register.dto';
import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';
import { PasswordInput } from '../../../components/PasswordInput.tsx';
import { HomeNavBar } from '../../homepage/components/HomeNavBar.tsx';
import { HomepageFooter } from '../../homepage/components/HomepageFooter.tsx';

type LoginResponse = {
  warehouses: { warehouseId: string; name: string; role: string }[] | null;
  orgId: string;
  orgRole: string;
  activeWarehouse: string | null;
  activeRole: string | null;
  message?: string;
  userId: string;
  username: string;
};

interface AuthFormProps {
  title: string;
  buttonText: string;
  endpoint: string;
  successMessage: string;
  onSuccess?: () => void;
  handleResponse: (data: LoginResponse) => void;
}

const resolver = classValidatorResolver(RegisterDto);
export default function AuthForm({
                                   title,
                                   buttonText,
                                   endpoint,
                                   successMessage,
                                   onSuccess,
                                   handleResponse,
                                 }: AuthFormProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({ resolver });
  const submit = async (registerDto: RegisterDto) => {
    setError('');
    setSuccess('');

    const trimmedUsername = registerDto.username.trim();
    const password = registerDto.password;

    try {
      const { data } = await api.post<LoginResponse>(endpoint, { username: trimmedUsername, password });
      handleResponse(data);
      setSuccess(successMessage);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const message = errorMessage(err);
        if (message) {
          setError(message);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-5 gap-10">
      <header>
        <HomeNavBar />
      </header>
      <main className="grow">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit((data) => submit(data))} className="px-4">
            <h2 className="mb-6 text-2xl font-bold">{title}</h2>

            {error && <p className="mb-4 text-sm text-error font-medium">{error}</p>}
            {success && <p className="mb-4 text-sm text-success font-medium">{success}</p>}
            <InputField
              label="Username"
              type="text"
              {...register('username')}
            />
            {errors.username && <p className="mb-4 text-sm text-error font-medium">{errors.username.message}</p>}
            <PasswordInput
              label="Password"
              type="password"
              {...register('password')}
            />
            {errors.password && <p className="mb-4 text-sm text-error font-medium">{errors.password.message}</p>}
            <Button type="submit" className="mt-4">
              {buttonText}
            </Button>
          </form>
        </div>
      </main>
      <footer className="justify-self-end">
        <HomepageFooter />
      </footer>
    </div>

  );
}