**Yes, absolutely.** You can reuse your NestJS or Node.js `class-validator` DTOs directly on the frontend with React Hook Form.

React Hook Form's resolver library standardizes integrations with external validation tools, including `class-validator`.

---

## How to Set It Up

### 1. Install Dependencies

In addition to `class-validator` and `class-transformer`, you need `@hookform/resolvers`:

```bash
npm install class-validator class-transformer react-hook-form @hookform/resolvers

```

> **Note on Decorators:** `class-validator` relies on TypeScript experimental decorators. Make sure `experimentalDecorators` and `emitDecoratorMetadata` are set to `true` in your frontend project's `tsconfig.json`.

### 2. Share Your DTO Class

Export your class from a shared package (or monorepo workspace) so both backend and frontend import the exact same file:

```typescript
// shared/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  username!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;
}

```

### 3. Wire Up `classValidatorResolver` in React Hook Form

Import `classValidatorResolver` from `@hookform/resolvers/class-validator` and pass your DTO class directly to `useForm`:

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { CreateUserDto } from './shared/dto/create-user.dto';

// Instantiate the resolver with your class
const resolver = classValidatorResolver(CreateUserDto);

export function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserDto>({
    resolver,
    defaultValues: {
      username: '',
      email: '',
    },
  });

  const onSubmit = (data: CreateUserDto) => {
    // Send data to backend - guaranteed valid by class-validator rules
    console.log('Submitting:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Username</label>
        <input {...register('username')} />
        {errors.username && <p>{errors.username.message}</p>}
      </div>

      <div>
        <label>Email</label>
        <input {...register('email')} />
        {errors.email && <p>{errors.email.message}</p>}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}

```

---

## Pros & Cons to Consider

| Pros | Cons |
| --- | --- |
| **100% DRY Logic:** Change rules once in the DTO; backend and frontend update automatically. | **Bundle Size:** Decorators, `reflect-metadata`, `class-validator`, and `class-transformer` add significant weight to client JS bundle size compared to light schemas like Zod or Valibot. |
| **Identical Errors:** Guarantees client-side error messages match what NestJS/backend validation pipes produce. | **Build Setup:** Requires Babel / SWC / Vite configuration adjustments for legacy decorator support. |