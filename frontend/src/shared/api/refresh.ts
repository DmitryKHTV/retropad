import { ofetch } from 'ofetch';
import { API_BASE_URL } from './config';

let inflightRefresh: Promise<void> | null = null;

export const refreshSession = (): Promise<void> => {
  inflightRefresh ??= ofetch('/auth/refresh', {
    baseURL: API_BASE_URL,
    method: 'POST',
    credentials: 'include',
  })
    .then(() => undefined)
    .finally(() => {
      inflightRefresh = null;
    });
  return inflightRefresh;
};
