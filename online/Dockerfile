# syntax=docker/dockerfile:1
#
# Build multi-stage do Firmafoot (Next.js + worker BullMQ). A mesma imagem final
# serve tanto o app web (`node server.js`) quanto o worker de rodada
# (`node_modules/.bin/tsx src/worker.ts` — sobrescrito via `command:` no
# docker-compose.yml), evitando manter dois Dockerfiles em paralelo.

# --- deps: instala as dependências uma única vez, cacheável entre builds --- #
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- builder: compila o Next.js com output standalone --- #
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runner: imagem final de produção --- #
FROM node:22-alpine AS runner
WORKDIR /app

# tini garante que SIGTERM/SIGINT chegam de verdade ao processo Node (graceful
# shutdown do Next.js e do worker) em vez de serem engolidos pelo PID 1.
RUN apk add --no-cache tini \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001 -G nodejs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# node_modules completo (não só o subconjunto rastreado pelo standalone do
# Next) — o worker roda via tsx e usa pacotes (bullmq, drizzle-kit para
# migrações pontuais) que o build web sozinho não precisaria enxergar.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs src ./src
COPY --chown=nextjs:nodejs drizzle.config.ts package.json tsconfig.json ./

# Usuário sem privilégios — nunca roda como root.
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
