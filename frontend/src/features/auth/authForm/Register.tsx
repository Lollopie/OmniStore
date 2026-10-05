import axios from 'axios';
import { api, errorMessage } from '../../../api/client.ts';
import InputField from '../../../components/InputField.tsx';
import Button from '../../../components/Button.tsx';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { RegisterEmailDto } from '@shared/dto/register.dto';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { HomeNavBar } from '../../homepage/components/HomeNavBar.tsx';
import { HomepageFooter } from '../../homepage/components/HomepageFooter.tsx';

interface RegisterProps {
  message?: string;
}

const resolver = classValidatorResolver(RegisterEmailDto);
export default function Register({ message }: RegisterProps) {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterEmailDto>({ resolver });
  const submit = async (registerEmailDto: RegisterEmailDto) => {
    setError('');
    setSuccess('');

    const trimmedEmail = registerEmailDto.email.trim();

    try {
      const { data } = await api.post<{ message?: string }>('/register', { email: trimmedEmail });
      setSuccess(data.message);
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
        <div className="mx-auto max-w-md">
          {message && <p className="px-4 mb-4 text-md text-error font-medium">{message}</p>}
          <form onSubmit={handleSubmit((data) => submit(data))} className="px-4">
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
      </main>
      <footer className="justify-self-end">
        <HomepageFooter />
      </footer>
    </div>
  );
}