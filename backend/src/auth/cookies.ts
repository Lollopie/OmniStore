import { CookieOptions } from 'express';

export const ACCESS_COOKIE = 'token';
export const REFRESH_COOKIE = 'refresh_token';

// Setting and clearing a cookie must use the same options, or browsers keep it
export const sessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
});
