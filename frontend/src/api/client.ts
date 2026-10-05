import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_NESTJS_HOST_URL,
  withCredentials: true,
});

// A 401 from these means the credentials themselves are wrong, so refreshing can't help
const NO_REFRESH_PATHS = ['/auth/refresh', '/login', '/logout'];
// The messages AuthGuard rejects missing or stale access tokens with (backend/src/auth/auth.guard.ts).
// Other 401s, like a wrong password, aren't fixed by refreshing.
const SESSION_ERRORS = ['No token provided', 'Invalid token'];

type RetriableRequest = InternalAxiosRequestConfig & { _retried?: boolean };

// Shared, so concurrent 401s wait for a single refresh instead of each rotating the token
let refreshing: Promise<void> | null = null;

const refreshSession = () => {
  refreshing ??= api
    .post('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

// Access tokens are short-lived: renew the session once and repeat the request
api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const request = error.config as RetriableRequest | undefined;
  if (
    error.response?.status !== 401 ||
    !SESSION_ERRORS.includes(errorMessage(error) ?? '') ||
    !request ||
    request._retried ||
    NO_REFRESH_PATHS.includes(request.url ?? '')
  ) {
    throw error;
  }
  request._retried = true;
  try {
    await refreshSession();
  } catch {
    // The session can't be renewed; callers handle the original 401
    throw error;
  }
  return api(request);
});

/** The message the backend sent with an error response, if any. */
export const errorMessage = (err: unknown): string | undefined => {
  if (!axios.isAxiosError(err)) {
    return undefined;
  }
  const message: unknown = (err.response?.data as { message?: unknown } | undefined)?.message;
  // Validation errors arrive as a list; the first one is enough to show
  if (Array.isArray(message)) {
    return typeof message[0] === 'string' ? message[0] : undefined;
  }
  return typeof message === 'string' ? message : undefined;
};
