FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm && corepack install -g pnpm@latest-10

FROM base AS development-dependencies-env

COPY . /app
WORKDIR /app
RUN pnpm fetch --dev
RUN pnpm install


FROM base AS production-dependencies-env
WORKDIR /app
COPY package.json pnpm-lock.yaml /app/
RUN pnpm fetch --prod
RUN pnpm install -r --offline --prod

FROM base AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm run build


FROM base
WORKDIR /app
COPY package.json pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
CMD ["pnpm", "run", "start"]
