import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { RegisterEmailDto } from '@shared/dto/register.dto';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
const resolver = classValidatorResolver(RegisterEmailDto);
export default function Register() {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<RegisterEmailDto>({ resolver });
  const submit = async (registerEmailDto: RegisterEmailDto) => {
    setError('');
    setSuccess('');

    const trimmedEmail = registerEmailDto.email.trim();

    try {
      const response = await fetch(`${import.meta.env.VITE_NESTJS_HOST_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail })
      });

      const data: {
        message?: string;
      } = await response.json();
      if (!response.ok) {
        if( data.message ){
          setError(data.message);
        }
      } else {
        setSuccess(data.message);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };
  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit((data) => submit(data))}>
        <h2 className="mb-6 text-2xl font-bold">Register</h2>
        {success && <p className="mb-4 text-sm text-success font-medium">{success}</p>}
        {error && <p className="mb-4 text-sm text-error font-medium">{error}</p>}
        <InputField
          label="Email"
          type="email"
          {...register('email')}
        />
        {errors.email && <p className="mb-4 text-sm text-error font-medium">{errors.email.message}</p>}
        <Button type="submit" className="mt-4">
          Register
        </Button>
      </form>
    </div>
  );
}