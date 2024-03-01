import { AppRouter } from '@server/trpc/trpc.router';
import { TRPCClientError, createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();

export function isTRPCClientError(
  cause: unknown,
): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}
