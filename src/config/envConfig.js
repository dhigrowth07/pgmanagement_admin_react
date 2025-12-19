export const SITE_NAME =
  import.meta.env.VITE_PUBLIC_SITE_NAME || 'PG Admin Panel';

export const API_URL = import.meta.env.VITE_PUBLIC_API_URL;

export function assertEnv() {
  if (!import.meta.env.VITE_PUBLIC_SITE_NAME) {
    throw new Error('Missing VITE_PUBLIC_SITE_NAME — check your .env file!');
  }
  if (!import.meta.env.VITE_PUBLIC_API_URL) {
    throw new Error('Missing VITE_PUBLIC_API_URL — check your .env file!');
  }
}

assertEnv();
