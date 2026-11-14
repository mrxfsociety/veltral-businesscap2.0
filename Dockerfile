# syntax=docker/dockerfile:1
FROM node:26-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_PRO_PREVIEW=true
ENV NEXT_PUBLIC_PRO_PREVIEW=$NEXT_PUBLIC_PRO_PREVIEW
RUN mkdir -p public && npm run build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=4 \
    CMD node -e 'fetch("http://127.0.0.1:3000/api/health", {signal: AbortSignal.timeout(4000)}).then(async r => { if (!r.ok || (await r.json()).ok !== true) process.exit(1); }).catch(() => process.exit(1))'
CMD ["node", "server.js"]
