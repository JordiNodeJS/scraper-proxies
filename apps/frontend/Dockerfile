# Dockerfile para Frontend React + Vite + Nginx
# Multi-stage build para optimización de tamaño

# ===== STAGE 1: BUILD =====
FROM node:20-alpine AS builder

# Instalar Bun
RUN npm install -g bun

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json bun.lock* ./
COPY apps/frontend/package.json ./apps/frontend/

# Instalar dependencias
RUN bun install

# Copiar código fuente del frontend
COPY apps/frontend/ ./apps/frontend/

# Cambiar al directorio frontend
WORKDIR /app/apps/frontend

# Build de producción
RUN bun run build

# ===== STAGE 2: PRODUCTION =====
FROM nginx:alpine AS production

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar archivos build desde stage anterior
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"] 