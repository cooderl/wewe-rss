/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_ORIGIN_URL: string;
  readonly VITE_ENV: string;
}

interface Window {
  __WEWE_RSS_RUNTIME_CONFIG__?: {
    readonly VITE_SERVER_ORIGIN_URL: string;
  };
}
