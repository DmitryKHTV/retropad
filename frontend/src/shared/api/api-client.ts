import { ofetch, type FetchOptions } from 'ofetch';
import { ApiError } from './api-error';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const baseFetch = ofetch.create({
  baseURL,
  credentials: 'include',
  onResponseError({ response }) {
    throw new ApiError(
      response.status,
      response._data?.message ?? response.statusText,
      response._data,
    );
  },
});

const REFRESH_PATH = '/auth/refresh';

// Endpoints that should never trigger a silent refresh on 401:
//   /auth/refresh   — would loop
//   /auth/login     — 401 here = bad credentials, not an expired session
//   /auth/register  — same
//   /auth/logout    — best-effort cleanup, refreshing first is pointless
const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/logout'];

// Single-flight: if N requests 401 at once, they all await the same refresh
// instead of firing N parallel /auth/refresh calls (which would also rotate
// the refresh token N times on the backend and invalidate each other).
let inflightRefresh: Promise<void> | null = null;

const refreshSession = (): Promise<void> => {
  inflightRefresh ??= baseFetch(REFRESH_PATH, { method: 'POST' })
    .then(() => undefined)
    .finally(() => {
      inflightRefresh = null;
    });
  return inflightRefresh;
};

const shouldTryRefresh = (error: unknown, path: string): boolean => {
  if (!(error instanceof ApiError) || !error.isUnauthorized) return false;
  return !NO_REFRESH_PATHS.some((p) => path.startsWith(p));
};

export const apiClient = async <T = unknown>(
  path: string,
  options?: FetchOptions<'json'>,
): Promise<T> => {
  try {
    return await baseFetch<T>(path, options);
  } catch (error) {
    if (!shouldTryRefresh(error, path)) throw error;

    try {
      await refreshSession();
    } catch {
      // Refresh itself failed — propagate the original 401 so the global
      // QueryCache handler can clear `me` and the AuthGate can redirect.
      throw error;
    }

    // One retry only: if the second attempt also 401s we let it bubble.
    return baseFetch<T>(path, options);
  }
};
