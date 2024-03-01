/* eslint-disable @typescript-eslint/naming-convention */
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_ENV: 'test' | 'dev' | 'prod';
      NEXT_PUBLIC_SERVER_ORIGIN_URL: string;
    }
  }
}
