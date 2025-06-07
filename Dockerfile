# Dockerfile para Backend Bun + Express + Playwright
# Optimizado para monorepo structure

FROM oven/bun:1-alpine AS production
WORKDIR /app

# Instalar dependencias del sistema para Playwright (Alpine)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

# Configurar Playwright para usar Chromium del sistema
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar archivos de dependencias
COPY package.json bun.lock* ./
COPY apps/backend/package.json ./apps/backend/

# Instalar dependencias
RUN bun install

# Copiar código fuente del backend
COPY apps/backend ./apps/backend

# Crear grupo nodejs si no existe y usar usuario bun existente
RUN addgroup -g 1001 -S nodejs 2>/dev/null || true && \
    adduser bun nodejs 2>/dev/null || true

# Cambiar permisos al usuario bun
RUN chown -R bun:nodejs /app

# Cambiar a usuario no-root
USER bun

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicio
WORKDIR /app/apps/backend
CMD ["bun", "run", "src/index.ts"] 