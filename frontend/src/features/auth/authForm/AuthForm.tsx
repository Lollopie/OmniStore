import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { RegisterDto } from '@shared/dto/register.dto.ts';
import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';
import { PasswordInput } from '../../../components/PasswordInput.tsx';


interface AuthFormProps {
  title: string;
  buttonText: string;
  endpoint: string;
  successMessage: string;
  onSuccess?: () => void;
  handleResponse: (data: {
    warehouses: { warehouseId: string; name: string; role: string }[] | null;
    activeWarehouse: string | null;
    activeRole: string | null;
    message?: string;
    userId: string;
    username: string;
  }) => void;
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
      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
        credentials: 'include'
      });

      const data: {
        warehouses: { warehouseId: string; name: string; role: string }[] | null;
        activeWarehouse: string | null;
        activeRole: string | null;
        message?: string;
        userId: string;
        username: string;
      } = await response.json();
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
    <main className="flex flex-1 justify-center p-6">
      <div className="w-full max-w-md rounded-lg height:90%">
        <form onSubmit={handleSubmit((data) => submit(data))}>
          <h2 className="mb-6 text-2xl font-bold text-base-400">{title}</h2>

          {error && <p className="mb-4 text-sm text-error font-medium">{error}</p>}
          {success && <p className="mb-4 text-sm text-success font-medium">{success}</p>}
          <div className="space-y-4">
            <InputField
              label="Username"
              type="text"
              {...register('username')}
            />
            {errors.username && <p className="mb-4 text-sm text-error font-medium">{errors.username.message}</p>}
            <PasswordInput
              className="last:mb-6"
              label="Password"
              type="password"
              {...register('password')}
            />
            {errors.password && <p className="mb-4 text-sm text-error font-medium">{errors.password.message}</p>}
          </div>
          <Button type="submit">
            {buttonText}
          </Button>
        </form>
      </div>
    </main>
  );
}