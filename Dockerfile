FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S ninja && adduser -S ninja -G ninja

COPY --from=builder --chown=ninja:ninja /app/.next/standalone ./
COPY --from=builder --chown=ninja:ninja /app/.next/static ./.next/static
COPY --from=builder --chown=ninja:ninja /app/public ./public
COPY --from=builder --chown=ninja:ninja /app/prisma ./prisma
COPY --from=builder --chown=ninja:ninja /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=ninja:ninja /app/node_modules ./node_modules

USER ninja
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
