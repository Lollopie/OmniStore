import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { RegisterDto } from '@shared/dto/register.dto';
import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';
import { PasswordInput } from '../../../components/PasswordInput.tsx';

type LoginResponse = {
  warehouses: { warehouseId: string; name: string; role: string }[] | null;
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
export default function AuthForm({ title, buttonText, endpoint, successMessage, onSuccess, handleResponse }: AuthFormProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<RegisterDto>({ resolver });
  const submit = async (registerDto: RegisterDto) => {
    setError('');
    setSuccess('');

    const trimmedUsername = registerDto.username.trim();
    const password = registerDto.password;

    try {
      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
        credentials: 'include'
      });

      const data: LoginResponse = await response.json();
      handleResponse(data);
      if (!response.ok) {
        if( data.message ){
          setError(data.message);
        }
      } else {
        setSuccess(successMessage);
        if (onSuccess) onSuccess();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit((data) => submit(data))}>
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
  );
}