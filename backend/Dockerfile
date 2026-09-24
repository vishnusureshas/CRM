FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl curl \
  && addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
RUN chown -R appuser:appgroup /app
USER appuser
ENV NODE_ENV=production
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://localhost:${PORT:-10000}/health || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
