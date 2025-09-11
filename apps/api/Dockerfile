FROM node:22 AS base

# # create system user nodejs:nextjs
# RUN addgroup --system --gid 1001 nodejs
# RUN useradd --system -u 1001 -g 1001 --create-home --shell /bin/bash nextjs
# USER nextjs

# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs
# USER nextjs

FROM base AS midenup
# install rustup
ENV RUSTUP_HOME="/usr/local/share/rust"
ENV CARGO_HOME="/usr/local/share/rust"
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/usr/local/share/rust/bin:${PATH}"
RUN rustup toolchain install nightly-2025-07-20
# install midenc and cargo-miden
WORKDIR /home/node
RUN git clone https://github.com/0xMiden/compiler
WORKDIR /home/node/compiler
RUN cargo install --path midenc --locked
RUN cargo install --path tools/cargo-miden --locked

# Install dependencies only when needed
FROM midenup AS deps

WORKDIR /home/node/packages/eslint-config
COPY --from=root packages/eslint-config .

WORKDIR /home/node/packages/typescript-config
COPY --from=root packages/typescript-config .

WORKDIR /home/node/apps/api
COPY package.json .

WORKDIR /home/node
COPY --from=root package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM midenup AS builder

WORKDIR /home/node
COPY --from=deps /home/node/node_modules ./node_modules
COPY --from=root .eslintrc.js package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json turbo.json ./

WORKDIR /home/node/packages/eslint-config
COPY --from=deps /home/node/packages/eslint-config/node_modules ./node_modules
COPY --from=root packages/eslint-config .

WORKDIR /home/node/packages/typescript-config
COPY --from=root packages/typescript-config .

WORKDIR /home/node/apps/api
COPY --from=deps /home/node/apps/api/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm --filter api build

# Production image, copy all the files and run next
FROM midenup AS runner

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
WORKDIR /home/node
COPY --from=builder --chown=nextjs:nodejs /home/node/apps/api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /home/node/apps/api/.next/static ./apps/api/.next/static

USER nextjs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
# COPY server2.js .
# CMD ["node", "server2.js"]
CMD ["node", "apps/api/server.js"]
