# PRD - Scraper de Proxies con Validación

## 📋 Resumen Ejecutivo

**Nombre del Proyecto:** Scraper de Proxies con Validación
**Versión:** 1.0.0
**Fecha:** 2024
**Tipo:** Single Page Application (SPA) React con TypeScript

### Descripción
Aplicación web React que extrae proxies desde hide.mn, los valida mediante Playwright y presenta los resultados funcionales en una interfaz moderna y responsiva.

## 🎯 Objetivos del Producto

### Objetivo Principal
Desarrollar una herramienta automatizada que permita extraer, validar y presentar proxies funcionales de manera eficiente y confiable.

### Objetivos Específicos
1. **Extracción Automática**: Scraping completo de todas las páginas de proxies
2. **Validación en Tiempo Real**: Verificación de funcionalidad de cada proxy
3. **Interfaz Intuitiva**: Presentación clara y organizada de resultados
4. **Performance**: Optimización para manejar grandes volúmenes de datos

## 👥 Usuarios Objetivo

- **Desarrolladores**: Que necesiten proxies para testing o desarrollo
- **Administradores de Red**: Para análisis de conectividad
- **Investigadores de Seguridad**: Para auditorías y pruebas de penetración

## ⚡ Funcionalidades Core

### 1. Extracción de Proxies (Scraping)
**Fuente:** https://hide.mn/es/proxy-list/?type=s#list

#### Especificaciones Técnicas:
- **Librería:** Cheerio para parsing HTML
- **Método:** Navegación automática por paginación
- **Detección de Páginas:** Análisis del DOM para determinar total de páginas
- **Estructura de Datos:**
  ```typescript
  interface Proxy {
    ip: string;
    port: number;
    protocol: 'http' | 'https';
    country?: string;
    anonymity?: string;
    lastChecked?: Date;
  }
  ```

#### Proceso de Extracción:
1. **Análisis Inicial**: Detectar estructura de paginación
2. **Iteración Secuencial**: Navegar página por página
3. **Parsing de Datos**: Extraer IP, puerto y protocolo
4. **Almacenamiento Temporal**: Array en memoria para procesamiento

### 2. Validación de Proxies
**Herramienta:** Playwright para testing automatizado

#### Criterios de Validación:
- **Test Básico**: Solicitud GET a https://example.com
- **Métricas Registradas:**
  - Latencia de respuesta (ms)
  - Estado de conexión (exitoso/fallido)
  - Tiempo de timeout
  - Código de respuesta HTTP

#### Configuración de Playwright:
```typescript
interface ValidationConfig {
  timeout: number; // 10000ms por defecto
  retries: number; // 2 intentos por defecto
  concurrency: number; // 5 conexiones simultáneas
}
```

#### Proceso de Validación:
1. **Configuración de Proxy**: Setup de Playwright con proxy
2. **Ejecución de Test**: Request a endpoint de prueba
3. **Medición de Métricas**: Captura de latencia y estado
4. **Filtrado**: Solo proxies exitosos pasan al resultado final

### 3. Frontend React

#### Estructura de Componentes:
```
src/
├── components/
│   ├── ProxyTable/
│   │   ├── ProxyTable.tsx
│   │   ├── ProxyRow.tsx
│   │   └── Pagination.tsx
│   ├── Controls/
│   │   ├── ActionButton.tsx
│   │   └── StatusIndicator.tsx
│   └── Layout/
│       ├── Header.tsx
│       └── Container.tsx
├── hooks/
│   ├── useProxyScraper.ts
│   ├── useProxyValidator.ts
│   └── usePagination.ts
├── services/
│   ├── scraperService.ts
│   ├── validatorService.ts
│   └── apiService.ts
├── types/
│   └── proxy.types.ts
└── utils/
    ├── helpers.ts
    └── constants.ts
```

#### Funcionalidades de UI:

##### Tabla de Proxies
- **Paginación**: 10 proxies por página
- **Columnas Mostradas:**
  - IP Address
  - Puerto
  - Protocolo
  - Latencia
  - Estado
  - País (si disponible)
- **Ordenamiento**: Por latencia, estado, IP
- **Filtros**: Por protocolo, estado, rango de latencia

##### Controles de Acción
- **Botón Principal**: "Iniciar Scraping"
- **Estados del Botón:**
  - Idle: "Iniciar Scraping"
  - Loading: "Extrayendo..." con spinner
  - Validating: "Validando..." con progreso
  - Complete: "Reiniciar Proceso"
- **Botón Secundario**: "Limpiar Resultados"

##### Indicadores de Estado
- **Barra de Progreso**: Durante extracción y validación
- **Contador en Tiempo Real**: Proxies encontrados/validados
- **Notificaciones**: Toast para errores o completado
- **Estado de Conexión**: Indicador de conexión a internet

## 🛠️ Especificaciones Técnicas

### Stack Tecnológico
- **Frontend**: React 19.1.0 + TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: CSS Modules / Tailwind CSS
- **Scraping**: Cheerio + Axios
- **Testing**: Playwright
- **State Management**: React Context + useReducer
- **Linting**: ESLint con configuración TypeScript

### Arquitectura de la Aplicación

#### Patrón de Estado
```typescript
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
```

#### Flujo de Datos
1. **Usuario Inicia Proceso** → Dispatch de acción SCRAPING_START
2. **Scraper Service** → Extrae proxies y actualiza estado
3. **Validator Service** → Valida proxies en lotes
4. **UI Update** → Reactiva renderiza tabla con resultados

### Configuración de Desarrollo

#### Scripts de Package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "scrape": "tsx scripts/scraper.ts"
  }
}
```

#### Dependencias Requeridas
```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "@playwright/test": "^1.40.0"
  }
}
```

### Reglas de Codificación

#### ESLint Configuration
- **Base**: @eslint/js recommended + TypeScript recommended
- **React Rules**: react-hooks recommended + react-refresh
- **Globals**: Browser environment
- **Ignored**: dist/ directory

#### Convenciones de Código
- **Formato**: TypeScript estricto
- **Naming**: camelCase para variables, PascalCase para componentes
- **Imports**: Absolutos con alias configurados
- **Comentarios**: JSDoc para funciones públicas

#### Estructura de Archivos
- **Componentes**: Un componente por archivo
- **Hooks**: Prefijo 'use' obligatorio
- **Tipos**: Sufijo '.types.ts'
- **Servicios**: Sufijo '.service.ts'

## 📊 Métricas y Performance

### KPIs del Sistema
- **Tiempo de Extracción**: < 30 segundos para todas las páginas
- **Tasa de Validación**: 80% de proxies procesados en < 2 minutos
- **Latencia UI**: < 100ms para interacciones
- **Precisión**: > 95% de proxies validados funcionan correctamente

### Optimizaciones
- **Concurrencia**: Máximo 5 validaciones simultáneas
- **Caching**: Resultados válidos por 1 hora
- **Lazy Loading**: Tabla virtualizada para > 100 resultados
- **Error Handling**: Retry automático con backoff exponencial

## 🚀 Roadmap de Desarrollo

### Fase 1: Core Functionality (Semana 1-2)
- [ ] Setup inicial del proyecto
- [ ] Implementación del scraper base
- [ ] Validador básico con Playwright
- [ ] UI mínima funcional

### Fase 2: Enhancement (Semana 3)
- [ ] Paginación avanzada
- [ ] Indicadores de progreso
- [ ] Manejo de errores robusto
- [ ] Testing unitario

### Fase 3: Polish (Semana 4)
- [ ] UI/UX refinamiento
- [ ] Optimizaciones de performance
- [ ] Documentación completa
- [ ] Testing end-to-end

## 🔍 Casos de Uso

### Caso de Uso 1: Extracción Completa
**Actor**: Usuario
**Flujo Principal:**
1. Usuario hace clic en "Iniciar Scraping"
2. Sistema navega hide.mn y extrae todos los proxies
3. Sistema valida cada proxy automáticamente
4. Sistema muestra resultados en tabla paginada

### Caso de Uso 2: Re-validación
**Actor**: Usuario
**Flujo Principal:**
1. Usuario hace clic en "Reiniciar Proceso"
2. Sistema limpia resultados anteriores
3. Sistema ejecuta extracción y validación nuevamente
4. Sistema actualiza tabla con nuevos resultados

### Caso de Uso 3: Filtrado de Resultados
**Actor**: Usuario
**Flujo Principal:**
1. Usuario selecciona filtros (protocolo, latencia)
2. Sistema filtra tabla en tiempo real
3. Paginación se ajusta automáticamente
4. URL se actualiza para mantener estado

## ⚠️ Consideraciones de Riesgo

### Riesgos Técnicos
- **Rate Limiting**: hide.mn puede limitar requests
- **Estructura de Página**: Cambios en DOM pueden romper scraper
- **Proxy Reliability**: Alta tasa de proxies no funcionales

### Mitigaciones
- **Throttling**: Delays entre requests para evitar blocking
- **Selectors Flexibles**: XPath y CSS selectors robustos
- **Error Recovery**: Manejo graceful de fallos de validación

## 📈 Métricas de Éxito

### Técnicas
- Time to First Proxy: < 10 segundos
- Validation Success Rate: > 30%
- UI Responsiveness: < 200ms

### Funcionales
- User Completion Rate: > 90%
- Error Rate: < 5%
- Proxy Accuracy: > 95%

## 🔧 Configuración del Entorno

### Variables de Entorno
```env
VITE_SCRAPING_DELAY=2000
VITE_VALIDATION_TIMEOUT=10000
VITE_MAX_CONCURRENT_VALIDATIONS=5
VITE_RESULTS_CACHE_TTL=3600000
```

### Comandos de Desarrollo
```bash
# Instalación
npm install

# Desarrollo
npm run dev

# Build de producción
npm run build

# Linting
npm run lint

# Testing
npm run test
```

---

**Documento de Referencia para IA Cursor**
Este PRD sirve como guía completa para el desarrollo del scraper de proxies. Contiene todas las especificaciones técnicas, reglas de codificación y estándares que deben seguirse durante el desarrollo. 