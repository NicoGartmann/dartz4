# syntax=docker/dockerfile:1.7

# -------- deps --------
FROM node:20-alpine AS deps
WORKDIR /app

# Optional: libc6-compat kann bei manchen Node-Modulen helfen
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci


# -------- build --------
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# -------- runtime --------
FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next "standalone" output enthält einen server.js + minimal node_modules
# plus statische Dateien und public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Next standalone hört standardmäßig auf PORT 3000
EXPOSE 3000

# "server.js" liegt im Root des standalone outputs
CMD ["node", "server.js"]
