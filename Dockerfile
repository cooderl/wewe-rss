FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm i -g pnpm

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm run -r build

RUN pnpm deploy --filter=web --prod /app/web

RUN pnpm deploy --filter=server --prod /app/server
RUN cd /app/server && pnpm exec prisma generate




FROM base AS web
COPY --from=build /app/web /app/web

WORKDIR /app/web

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_PUBLIC_SERVER_ORIGIN_URL="http://localhost:4000"
ENV NEXT_PUBLIC_ENV=prod

CMD ["npm", "run", "start"]


FROM base AS server
COPY --from=build /app/server /app/server

WORKDIR /app/server

EXPOSE 4000

ENV NODE_ENV=production
ENV HOST="0.0.0.0"
ENV SERVER_ORIGIN_URL=""
ENV MAX_REQUEST_PER_MINUTE=60
ENV AUTH_CODE=""
ENV DATABASE_URL=""

CMD ["./docker-bootstrap.sh"]