import { APIRequestContext, expect } from '@playwright/test';

export async function registerUser(request: APIRequestContext) {
  const credentials = {
    username:  `warehouse_user_${Date.now()}`,
    password:  'password123',
  }
  const response = await request.post(`${process.env.VITE_NESTJS_HOST_URL}/register`, {
    data: {
      username: credentials.username,
      password: credentials.password,
    }
  });
  expect(response.status()).toBe(201);
  return credentials.username;
}