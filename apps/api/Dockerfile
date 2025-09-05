FROM node:22 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /home/node
COPY --from=root package.json pnpm-lock.yaml pnpm-workspace.yaml ./
WORKDIR /home/node/packages/eslint-config
COPY --from=root packages/eslint-config/package.json .
WORKDIR /home/node/packages/typescript-config
COPY --from=root packages/typescript-config/package.json .
WORKDIR /home/node/apps/api
COPY package.json .
WORKDIR /home/node
#RUN corepack enable pnpm && pnpm i --frozen-lockfile
RUN corepack enable pnpm && pnpm i

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /home/node
COPY --from=deps /home/node/node_modules ./node_modules
COPY --from=root package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
WORKDIR /home/node/packages/eslint-config
COPY --from=deps /home/node/packages/eslint-config/node_modules ./node_modules
COPY --from=root packages/eslint-config .
WORKDIR /home/node/packages/typescript-config
COPY --from=root packages/typescript-config .
WORKDIR /home/node/apps/api
COPY --from=deps /home/node/apps/api/node_modules ./node_modules
COPY . .
#RUN corepack enable pnpm && pnpm build

# Production image, copy all the files and run next
#FROM base AS runner
#WORKDIR /app

#ENV NODE_ENV=production

#RUN addgroup --system --gid 1001 nodejs
#RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
#COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
#COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

#USER nextjs

EXPOSE 3001

ENV PORT=3001

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
