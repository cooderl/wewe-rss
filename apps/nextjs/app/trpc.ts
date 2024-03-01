import { AppRouter } from '@server/trpc/trpc.router';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();
