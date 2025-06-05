# 🕷️ Scraper de Proxies con Validación

Una Single Page Application (SPA) desarrollada en React + TypeScript que extrae y valida proxies de hide.mn con un sistema de validación concurrente usando Playwright.

## 🚀 Características

- **Scraping Inteligente**: Extracción automática de proxies con paginación
- **Validación Concurrente**: Hasta 5 conexiones simultáneas con Playwright
- **UI Responsive**: Interfaz moderna con Tailwind CSS
- **Filtrado en Tiempo Real**: Búsqueda y filtros avanzados
- **Exportación de Datos**: Múltiples formatos de salida
- **Rate Limiting**: Scraping responsable con delays configurables

## 🛠️ Stack Tecnológico

- **Frontend**: React 19.1.0 + TypeScript + Vite 6.3.5
- **Styling**: Tailwind CSS
- **Scraping**: Cheerio + fetch nativo
- **Validación**: Playwright
- **Build**: Bun 1.1.0+

## 📋 Requisitos

- **Bun**: 1.1.0 o superior
- **Node.js**: 18+ (para Playwright)
- **OS**: Windows, macOS, Linux

## ⚡ Instalación Rápida

```bash
# Clonar repositorio
git clone <repo-url>
cd scraper-proxies

# Instalar dependencias
bun install

# Instalar navegadores de Playwright
bunx playwright install

# Iniciar desarrollo
bun run dev
```

## 🎯 Scripts Disponibles

```bash
# Desarrollo
bun run dev          # Servidor de desarrollo (puerto 5173)
bun run build        # Build de producción
bun run preview      # Preview del build

# Testing y Linting
bun run test         # Ejecutar tests
bun run lint         # Analizar código
bun run lint:fix     # Corregir problemas automáticamente

# MVPs y Pruebas de Concepto
bun run mvp:working      # MVP funcional con fuentes sin Cloudflare
bun run mvp:playwright   # MVP con Playwright para evasión Cloudflare
bun run mvp:hibrido      # MVP híbrido (usuario + automatización)
bun run mvp:freeproxy    # MVP FreeProxy.World - Demo rápida
bun run mvp:freeproxy:full # MVP FreeProxy.World - Sistema completo
```

# Testing

bun run test # Ejecutar tests
bunx vitest # Tests en modo watch

# Linting

bun run lint # ESLint
bun run lint:fix # Auto-fix de ESLint

# MVP Testing

cd mvp && bunx tsx src/scraper-test.ts # Test básico de scraping

```

## 📁 Estructura del Proyecto

```

scraper-proxies/
├── src/
│ ├── components/ # Componentes React
│ ├── hooks/ # Custom hooks
│ ├── services/ # Lógica de negocio
│ ├── types/ # Definiciones TypeScript
│ └── utils/ # Utilidades y helpers
├── docs/ # Documentación técnica
├── mvp/ # Prueba de concepto mínima
└── .github/ # Configuración GitHub Copilot

````

## 🔧 Configuración

### Variables de Entorno

Crear `.env.local`:

```env
VITE_SCRAPING_DELAY=2000
VITE_VALIDATION_TIMEOUT=10000
VITE_MAX_CONCURRENT_VALIDATIONS=5
VITE_RESULTS_CACHE_TTL=3600000
````

### GitHub Copilot

El proyecto incluye configuración optimizada para GitHub Copilot en `.github/copilot-instructions.md` con:

- Patrones arquitecturales específicos
- Reglas de TypeScript estricto
- Convenciones de naming
- Buenas prácticas de scraping

## 📖 Documentación

- **[PRD.md](docs/PRD.md)**: Especificaciones del producto
- **[MVP-PLAN.md](MVP-PLAN.md)**: Plan de validación técnica
- **[TASKS.md](TASKS.md)**: Lista de tareas de desarrollo

## 🚀 Desarrollo

### Primer Setup

```bash
# Instalar todo desde cero
bun install
bunx playwright install chromium

# Ejecutar tests de validación
bun run test

# Iniciar desarrollo
bun run dev
```

### Workflow de Desarrollo

1. **MVP First**: Validar scraping con `cd mvp && bunx tsx src/scraper-test.ts`
2. **Componentes**: Desarrollar UI con hot reload
3. **Testing**: Validar proxies con Playwright
4. **Build**: `bun run build && bun run preview`

## 🎯 Objetivos de Performance

- **Extracción**: < 30s para todas las páginas
- **Validación**: 80% en < 2min con 5 conexiones concurrentes
- **UI**: < 100ms respuesta, lazy loading para +100 resultados
- **Precisión**: > 95% de proxies validados funcionan

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

---

**Desarrollado con ❤️ usando Bun + React + TypeScript**
},
})

```

```
