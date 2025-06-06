# Dockerfile para el backend Bun
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build packages
RUN bun run build:packages

# Build backend
WORKDIR /app/apps/backend
RUN bun run build

# Production stage
FROM oven/bun:1-slim as production
WORKDIR /app

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    && apt-get clean

# Copy built application
COPY --from=base /app/apps/backend/dist ./
COPY --from=base /app/packages ./packages

# Install Playwright browsers
RUN bunx playwright install chromium

EXPOSE 3001

CMD ["bun", "run", "index.js"] 