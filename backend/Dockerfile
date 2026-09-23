FROM node:20-alpine AS builder
WORKDIR /app
# Install OpenSSL for Prisma engine detection (Alpine has openssl 3.x)
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
# Prisma generate (no DB needed)
RUN npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
USER appuser
ENV NODE_ENV=production
EXPOSE 10000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
