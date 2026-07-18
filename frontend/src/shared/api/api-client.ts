import { ofetch, type FetchOptions } from 'ofetch';
import { ApiError } from './api-error';
import { API_BASE_URL } from './config';
import { refreshSession } from './refresh';
import { getSocketId } from './socket';

const baseFetch = ofetch.create({
  baseURL: API_BASE_URL,
  credentials: 'include',
  // Echo suppression: the gateway skips broadcasting `board:changed` back to
  // the socket that initiated the mutation. Read lazily per request — the id
  // changes on every reconnect.
  onRequest({ options }) {
    const socketId = getSocketId();
    if (socketId) {
      options.headers.set('x-socket-id', socketId);
    }
  },
  onResponseError({ response }) {
    throw new ApiError(
      response.status,
      response._data?.message ?? response.statusText,
      response._data,
    );
  },
});


const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/logout'];

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
      throw error;
    }
    return baseFetch<T>(path, options);
  }
};
