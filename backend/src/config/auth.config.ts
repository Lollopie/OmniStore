// src/config/auth.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  // parseInt ensures it's a number, radix 10 prevents parsing quirks, fallback to 10
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS!, 10) || 10,
}));
