import { registerAs } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

export default registerAs('auth', () => ({
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS!, 10) || 10,
  jwtSecret: process.env.JWT_SECRET || randomBytes(32).toString('hex'),
}));
