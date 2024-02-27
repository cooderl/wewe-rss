'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  httpBatchLink,
  getFetch,
  loggerLink,
  TRPCClientError,
} from '@trpc/client';
import { useState } from 'react';
import { trpc } from './trpc';
import { AppRouter } from '@server/trpc/trpc.router';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { setAuthCode } from './utils';

const NEXT_PUBLIC_SERVER_ORIGIN_URL = process.env.NEXT_PUBLIC_SERVER_ORIGIN_URL;

if (
  NEXT_PUBLIC_SERVER_ORIGIN_URL === undefined ||
  NEXT_PUBLIC_SERVER_ORIGIN_URL === ''
) {
  throw new Error('app-err: NEXT_PUBLIC_SERVER_ORIGIN_URL is not defined!');
}

export function isTRPCClientError(
  cause: unknown,
): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}

export const TrpcProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchIntervalInBackground: false,
            retryDelay: (retryCount) => Math.min(retryCount * 1000, 60 * 1000),
            retry(failureCount, error) {
              console.log('failureCount: ', failureCount);
              if (isTRPCClientError(error)) {
                if (error.data?.httpStatus === 401) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            onError(error) {
              console.error('queries onError: ', error);
              if (isTRPCClientError(error)) {
                if (error.data?.httpStatus === 401) {
                  toast.error('无权限', {
                    description: error.message,
                  });

                  setAuthCode('');
                  router.push('/login');
                } else {
                  toast.error('请求失败!', {
                    description: error.message,
                  });
                }
              }
            },
          },
          mutations: {
            onError(error) {
              console.error('mutations onError: ', error);
              if (isTRPCClientError(error)) {
                if (error.data?.httpStatus === 401) {
                  toast.error('无权限', {
                    description: error.message,
                  });
                  setAuthCode('');
                  router.push('/login');
                } else {
                  toast.error('请求失败!', {
                    description: error.message,
                  });
                }
              }
            },
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: () => true,
        }),
        httpBatchLink({
          url: NEXT_PUBLIC_SERVER_ORIGIN_URL + '/trpc',
          async headers() {
            const token = localStorage.getItem('authCode') || '';

            if (!token) {
              router.push('/login');
              return {};
            }
            return token
              ? {
                  Authorization: `${token}`,
                }
              : {};
          },
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
