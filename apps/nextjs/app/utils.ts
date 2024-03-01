import { env } from 'next-runtime-env';

export const getAuthCode = () => {
  return window.localStorage.getItem('authCode') || '';
};

export const setAuthCode = (authCode: string) => {
  window.localStorage.setItem('authCode', authCode);
};

export const getServerOriginUrl = () => {
  return env('NEXT_PUBLIC_SERVER_ORIGIN_URL');
};
