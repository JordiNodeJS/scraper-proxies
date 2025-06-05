# GitHub Copilot Instructions - Scraper de Proxies

## 📋 Contexto del Proyecto

Este proyecto es un **Scraper de Proxies con Validación** desarrollado como Single Page Application (SPA) React con TypeScript.

**Referencia completa**: Ver `PRD.md` en la raíz del proyecto para especificaciones detalladas.

## 🎯 Reglas de Desarrollo Obligatorias

### ⚠️ 0. Herramientas Fundamentales - CRÍTICO

- **SOLO BUN**: Usar `bun` y `bunx` para TODAS las operaciones (install, run, build, etc.)
- **SOLO FETCH**: Usar `fetch` nativo para HTTP requests (NO axios, NO request, NO otras libs)
- **SOLO ES6 MODULES**: Usar `import/export` exclusivamente (NO require, NO CommonJS)
- **BUNDLE**: Todos los archivos deben usar sintaxis ES6 moderna

### 1. TypeScript Estricto

- Tipos explícitos siempre
- Interfaces bien definidas
- No usar `any`
- Preferir tipos union sobre opcionales cuando sea apropiado

### 2. React Moderno

- Solo componentes funcionales
- Hooks personalizados para lógica reutilizable
- Context API para estado global
- Error boundaries para manejo de errores

### 3. Scraping Responsable

- Delays entre requests (2000ms por defecto)
- Error handling robusto con retry automático
- Rate limiting para evitar blocking
- Selectors CSS flexibles y robustos

### 4. Validación Concurrente

- Máximo 5 conexiones simultáneas con Playwright
- Timeout de 10 segundos por proxy
- Métricas de latencia y estado
- Filtrado automático de proxies no funcionales

### 5. UI/UX Responsiva

- Tailwind CSS para styling
- Componentes reutilizables
- Indicadores de progreso en tiempo real
- Paginación para grandes datasets (10 items por página)

## 🏗️ Patrones Arquitecturales

### Estructura de Carpetas

```
src/
├── components/
│   ├── ProxyTable/     # Tabla y paginación
│   ├── Controls/       # Botones y controles
│   └── Layout/         # Header y container
├── hooks/              # Custom hooks
├── services/           # Lógica de negocio
├── types/              # Definiciones TypeScript
└── utils/              # Helpers y constantes
```

### Convenciones de Naming

- **Componentes**: PascalCase (ej: `ProxyTable.tsx`)
- **Hooks**: camelCase con prefijo `use` (ej: `useProxyScraper.ts`)
- **Services**: camelCase con sufijo `Service` (ej: `scraperService.ts`)
- **Types**: camelCase con sufijo `.types.ts` (ej: `proxy.types.ts`)

## 📊 Tipos Principales

```typescript
interface Proxy {
  ip: string;
  port: number;
  protocol: "http" | "https";
  country?: string;
  anonymity?: string;
  latency?: number;
  isValid?: boolean;
  lastChecked?: Date;
}

interface AppState {
  proxies: Proxy[];
  validatedProxies: Proxy[];
  isLoading: boolean;
  isValidating: boolean;
  currentPage: number;
  totalPages: number;
  error: string | null;
  progress: {
    scraped: number;
    validated: number;
    total: number;
  };
}

interface ValidationConfig {
  timeout: number; // 10000ms por defecto
  retries: number; // 2 intentos por defecto
  concurrency: number; // 5 conexiones simultáneas
}
```

## 🔧 Configuración Técnica

### Stack Tecnológico

- **Runtime**: ⚠️ **IMPORTANTE: Usar BUN y BUNX exclusivamente**
- **React**: 19.1.0 + TypeScript
- **Build**: Vite 6.3.5
- **Styling**: Tailwind CSS
- **Scraping**: ⚠️ **IMPORTANTE: Cheerio + fetch nativo (NO axios u otras librerías)**
- **Testing**: Playwright para validación de proxies
- **State**: React Context + useReducer
- **Módulos**: ⚠️ **IMPORTANTE: ES6 modules exclusivamente (import/export)**

### Variables de Entorno

```env
VITE_SCRAPING_DELAY=2000
VITE_VALIDATION_TIMEOUT=10000
VITE_MAX_CONCURRENT_VALIDATIONS=5
VITE_RESULTS_CACHE_TTL=3600000
```

## 🎯 Objetivos de Performance

- **Tiempo de Extracción**: < 30 segundos para todas las páginas
- **Tasa de Validación**: 80% de proxies procesados en < 2 minutos
- **Latencia UI**: < 100ms para interacciones
- **Precisión**: > 95% de proxies validados funcionan correctamente

## 🚨 Consideraciones Especiales

### Fuente de Datos

- **URL Base**: https://hide.mn/es/proxy-list/?type=s#list
- **Paginación**: Detectar automáticamente número total de páginas
- **Parsing**: Usar Cheerio para extraer IP, puerto, protocolo

### Error Handling

- Retry automático con backoff exponencial
- Manejo graceful de fallos de red
- Logs detallados para debugging
- Fallbacks para cambios en estructura DOM

### Optimizaciones

- Lazy loading para tablas grandes
- Virtualización para > 100 resultados
- Caching de resultados válidos (1 hora TTL)
- Throttling inteligente para evitar rate limiting

## 📝 Comentarios y Documentación

- JSDoc para todas las funciones públicas
- Comentarios explicativos para lógica compleja
- README actualizado con instrucciones de uso
- Changelog para tracking de cambios

---

**Nota**: Este archivo debe mantenerse sincronizado con las especificaciones del PRD.md
