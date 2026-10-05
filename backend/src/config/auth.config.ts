import { registerAs } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

export default registerAs('auth', () => ({
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS!, 10) || 10,
  jwtSecret: process.env.JWT_SECRET || randomBytes(32).toString('hex'),
  // Access tokens are short-lived; the refresh token renews them
  jwtExpiresIn: parseInt(process.env.JWT_EXPIRATION!, 10) || 900,
  refreshExpiresIn:
    parseInt(process.env.REFRESH_TOKEN_EXPIRATION!, 10) || 7 * 24 * 3600,
}));
