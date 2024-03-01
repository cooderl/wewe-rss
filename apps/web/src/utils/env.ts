export const isProd = import.meta.env.PROD;

export const serverOriginUrl = isProd
  ? window.__WEWE_RSS_SERVER_ORIGIN_URL__
  : import.meta.env.VITE_SERVER_ORIGIN_URL;
