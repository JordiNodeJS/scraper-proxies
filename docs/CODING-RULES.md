# 📋 Reglas de Codificación - Scraper de Proxies

## 🎯 Reglas Fundamentales

### **1. Package Manager**

- ✅ **Usar BUN exclusivamente**: `bun add`, `bun run`, `bunx`
- ❌ **NO usar npm/yarn**: Evitar `npm install`, `yarn add`

### **2. HTTP Requests**

- ✅ **Fetch nativo**: Usar `fetch()` API estándar
- ❌ **NO usar axios**: Evitar librerías HTTP externas
- **Ejemplo correcto:**

```typescript
const response = await fetch(url, {
  headers: { "User-Agent": userAgent },
  signal: AbortSignal.timeout(10000),
});
```

### **3. Módulos ESM6**

- ✅ **ES Modules**: `import/export` syntax
- ❌ **CommonJS**: Evitar `require()` y `module.exports`
- **Configuración package.json:**

```json
{
  "type": "module"
}
```

### **4. TypeScript Estricto**

- ✅ **Tipos explícitos**: Siempre definir tipos
- ✅ **Interfaces bien definidas**: Para objetos complejos
- ❌ **NO usar `any`**: Usar tipos específicos o `unknown`

### **5. React Moderno**

- ✅ **Componentes funcionales**: Solo function components
- ✅ **Hooks**: useState, useEffect, custom hooks
- ❌ **Class components**: No usar React.Component

---

## 🛠️ Stack Tecnológico Aprobado

### **Core**

- **Runtime**: Bun
- **Frontend**: React 19.1.0 + TypeScript
- **Build**: Vite 6.3.5
- **Styling**: Tailwind CSS

### **Scraping & Testing**

- **HTML Parser**: Cheerio
- **Browser Testing**: Playwright
- **HTTP**: fetch nativo
- **File System**: Node.js fs modules

### **Development**

- **Linting**: ESLint con TypeScript
- **Testing**: Vitest + React Testing Library
- **TypeScript**: tsx para ejecución directa

---

## 📁 Estructura de Archivos

### **Convenciones de Naming**

```
src/
├── components/        # PascalCase
│   ├── ProxyTable.tsx
│   └── ActionButton.tsx
├── hooks/            # camelCase con prefijo 'use'
│   ├── useProxyScraper.ts
│   └── useAppContext.ts
├── services/         # camelCase con sufijo 'Service'
│   ├── scraperService.ts
│   └── validatorService.ts
├── types/           # camelCase con sufijo '.types.ts'
│   ├── proxy.types.ts
│   └── ui.types.ts
└── utils/           # camelCase
    ├── helpers.ts
    └── constants.ts
```

### **Exports/Imports**

```typescript
// ✅ ESM exports
export interface ProxyData { ... }
export class ScraperService { ... }
export default ProxyTable;

// ✅ ESM imports
import { ProxyData } from '../types/proxy.types.js';
import ScraperService from '../services/scraperService.js';
```

---

## 🚀 Comandos Estándar

### **Setup del Proyecto**

```bash
# Inicializar
bun init -y

# Instalar dependencias
bun add react react-dom cheerio @playwright/test
bun add -D typescript @types/react @types/node vite

# Desarrollo
bun run dev
bun run build
bun run lint
```

### **Scripts de Package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "test": "vitest",
    "preview": "vite preview"
  }
}
```

---

## 📝 Estilo de Código

### **Fetch Patterns**

```typescript
// ✅ Correcto - Con timeout y error handling
async function fetchData(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    if (error.name === "TimeoutError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

// ❌ Incorrecto - Usando axios
import axios from "axios";
const response = await axios.get(url);
```

### **TypeScript Interfaces**

```typescript
// ✅ Correcto - Tipos específicos
interface Proxy {
  ip: string;
  port: number;
  protocol: "http" | "https";
  lastChecked?: Date;
}

// ❌ Incorrecto - Usando any
interface Proxy {
  ip: any;
  port: any;
  protocol: any;
}
```

### **React Components**

```typescript
// ✅ Correcto - Functional component con tipos
import React, { memo } from 'react';

interface ProxyRowProps {
  proxy: Proxy;
  onSelect: (proxy: Proxy) => void;
}

const ProxyRow: React.FC<ProxyRowProps> = memo(({ proxy, onSelect }) => {
  return (
    <tr onClick={() => onSelect(proxy)}>
      <td>{proxy.ip}</td>
      <td>{proxy.port}</td>
    </tr>
  );
});

export default ProxyRow;

// ❌ Incorrecto - Class component
class ProxyRow extends React.Component { ... }
```

---

## 🔧 Configuraciones Requeridas

### **tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

### **vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
```

---

## ⚠️ Prohibiciones Estrictas

### **❌ NO Usar:**

- `npm install` → Usar `bun add`
- `yarn add` → Usar `bun add`
- `axios` → Usar `fetch()`
- `require()` → Usar `import`
- `module.exports` → Usar `export`
- Class components → Usar function components
- `any` type → Usar tipos específicos

### **✅ Usar SIEMPRE:**

- `bun` para package management
- `fetch()` para HTTP requests
- ESM imports/exports
- TypeScript estricto
- Functional React components

---

## 🧪 Testing

### **Configuración Vitest**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

### **Comandos de Testing**

```bash
# Ejecutar tests
bun run test

# Watch mode
bun run test:watch

# Coverage
bun run test --coverage
```

---

## 📈 Performance

### **Optimizaciones Requeridas**

- `React.memo` para componentes que renderizan frecuentemente
- `useCallback` para handlers pasados como props
- `useMemo` para cálculos costosos
- Lazy loading para componentes pesados

### **Ejemplo de Optimización**

```typescript
import React, { memo, useCallback, useMemo } from 'react';

const ProxyTable: React.FC<Props> = memo(({ proxies, onSelect }) => {
  const sortedProxies = useMemo(() =>
    proxies.sort((a, b) => a.latency - b.latency),
    [proxies]
  );

  const handleSelect = useCallback((proxy: Proxy) => {
    onSelect(proxy);
  }, [onSelect]);

  return (
    // JSX aquí
  );
});
```

---

## 📋 TASK TRACKING Y PHASE IDS

**Para nuevas features y gestión de tareas**, consultar reglas específicas en:

- **Archivo**: `.github/prompts/rules-task.prompt.md`
- **Sistema**: Automated Phase ID assignment y task tracker creation
- **Uso**: Se aplica automáticamente para requests de nuevas features

**Referencias adicionales**:

- **Quick Reference**: `docs/tasks/TASK-TRACKING-QUICK-REFERENCE.md`
- **INDEX maestro**: `docs/tasks/INDEX-TASK-TRACKER-ORGANIZADO.md`

---

## 🏷️ SISTEMA DE NOMENCLATURA GENERAL

### **📋 Phase ID System - P{X}-F{Y} Format**

El proyecto utiliza un sistema estructurado de identificación de fases y features:

#### **🔢 Formato de Phase IDs**

```
P{X}-F{Y}_{DESCRIPTION}.md
```

- **P{X}**: Número de Phase (1, 2, 3...)
- **F{Y}**: Número de Feature dentro de la phase
- **{DESCRIPTION}**: Descripción descriptiva del feature

#### **📊 Estructura de Phases**

**Phase 1 (P1) - MVP Base** ✅ COMPLETADO

- `P1-F1_MVP-BASE-SETUP.md` - Setup inicial del proyecto
- `P1-F2_SCRAPING-ENGINE.md` - Motor de scraping básico
- `P1-F3_UI-INTERFACE.md` - Interfaz de usuario MVP

**Phase 2 (P2) - Features Avanzados** 🚧 EN PROGRESO

- `P2-F1_ADVANCED-SCRAPING.md` - ✅ Scraping avanzado completado
- `P2-F2_SISTEMA-AUTENTICACION-USUARIOS.md` - 🔄 NEXT: Sistema de autenticación
- `P2-F3_EXPORT-SYSTEM.md` - Sistema de exportación avanzado
- `P2-F4_PROXY-MANAGEMENT.md` - Gestión avanzada de proxies

**Phase 3 (P3) - Expansiones Futuras** ⏳ PENDIENTE

- `P3-F1_ENTERPRISE-FEATURES.md` - Features empresariales
- `P3-F2_API-INTEGRATION.md` - Integraciones externas
- `P3-F3_ANALYTICS-DASHBOARD.md` - Dashboard de analíticas

### **📁 Nomenclatura de Archivos del Proyecto**

#### **Componentes React**

```typescript
// ✅ CORRECTO - PascalCase
ProxyTable.tsx;
SystemStatus.tsx;
ActionButton.tsx;
UserDashboard.tsx;

// ❌ INCORRECTO
proxyTable.tsx;
system - status.tsx;
action_button.tsx;
```

#### **Hooks Personalizados**

```typescript
// ✅ CORRECTO - camelCase con prefijo 'use'
useApi.ts;
useProxyScraper.ts;
useAppContext.ts;
useValidation.ts;

// ❌ INCORRECTO
Api.ts;
ProxyScraper.ts;
hookApi.ts;
```

#### **Services y Utilidades**

```typescript
// ✅ CORRECTO - camelCase con sufijo descriptivo
api.ts; // Service principal
scraperService.ts; // Servicio específico
validatorService.ts; // Servicio específico
helpers.ts; // Utilidades generales
constants.ts; // Constantes del proyecto

// ❌ INCORRECTO
API.ts;
Scraper.ts;
validator_service.ts;
```

#### **Types y Interfaces**

```typescript
// ✅ CORRECTO - camelCase con sufijo '.types.ts'
api.types.ts; // Tipos de la API
proxy.types.ts; // Tipos de proxies
ui.types.ts; // Tipos de UI
validation.types.ts; // Tipos de validación

// ❌ INCORRECTO
ApiTypes.ts;
proxy - types.ts;
ui_types.ts;
types.ts; // Muy genérico
```

### **📂 Nomenclatura de Directorios**

#### **Estructura Principal**

```
apps/
├── frontend/          # React application
├── backend/           # Express API server
└── cli/               # Command line tools

packages/
├── shared/            # Shared TypeScript types
├── proxy-scraper/     # Proxy scraping logic
└── proxy-validator/   # Proxy validation logic

docs/
├── tasks/            # Task tracking files
├── assets/           # Documentation assets
└── *.md             # Main documentation files
```

#### **Estructura de `src/` (Frontend)**

```
src/
├── components/       # React components (PascalCase)
├── hooks/           # Custom hooks (camelCase + use prefix)
├── services/        # API services (camelCase)
├── types/          # TypeScript definitions (.types.ts)
├── utils/          # Utility functions (camelCase)
├── styles/         # CSS/Tailwind styles
└── pages/          # Page components (PascalCase)
```

### **🔤 Convenciones de Variables y Funciones**

#### **Variables**

```typescript
// ✅ CORRECTO - camelCase descriptivo
const proxyList: Proxy[] = [];
const isLoadingData = false;
const userAuthToken = "token";
const apiBaseUrl = "http://localhost:3001";

// ❌ INCORRECTO
const ProxyList = [];
const is_loading_data = false;
const token = "token"; // Muy genérico
const url = "http://..."; // Muy genérico
```

#### **Funciones**

```typescript
// ✅ CORRECTO - camelCase con verbos descriptivos
function fetchProxyData(): Promise<Proxy[]> { }
function validateProxyList(proxies: Proxy[]): boolean { }
function exportToCSV(data: any[]): string { }
function handleUserAuthentication(): void { }

// ❌ INCORRECTO
function ProxyData() { }           // PascalCase
function validate_proxy() { }      // snake_case
function export() { }              // Palabra reservada
function handle() { }              // Muy genérico
```

#### **Constantes**

```typescript
// ✅ CORRECTO - SCREAMING_SNAKE_CASE para constantes globales
const API_BASE_URL = "http://localhost:3001";
const DEFAULT_TIMEOUT = 10000;
const MAX_RETRY_ATTEMPTS = 3;
const SUPPORTED_PROXY_TYPES = ["HTTP", "HTTPS", "SOCKS5"] as const;

// ❌ INCORRECTO
const apiBaseUrl = "http://..."; // camelCase para constantes
const timeout = 10000; // Muy genérico
const MaxRetryAttempts = 3; // PascalCase
```

### **📊 Nomenclatura de Tasks y Documentación**

#### **Archivos de Tasks**

```
// ✅ FORMATO CORRECTO
P2-F2_SISTEMA-AUTENTICACION-USUARIOS.md
P2-F3_EXPORT-SYSTEM.md
P2-F4_PROXY-MANAGEMENT.md

// ❌ FORMATO INCORRECTO
task-auth.md
sistema_autenticacion.md
P2F2-auth.md
```

#### **Archivos de Documentación**

```
// ✅ CORRECTO - SCREAMING-KEBAB-CASE
PRD.md                           # Product Requirements Document
CODING-RULES.md                  # Este archivo
MVP-COMPLETADO-FINAL.md         # Documentos de estado
TASK-TRACKING-QUICK-REFERENCE.md # Referencias rápidas

// ❌ INCORRECTO
prd.md
coding_rules.md
mvp-completado-final.md
taskTrackingQuickReference.md
```

### **🎯 Nomenclatura de Commits y Branches**

#### **Commits**

```bash
# ✅ CORRECTO - Conventional Commits
feat(P2-F2): add user authentication system
fix(scraper): resolve timeout issues in proxy validation
docs(nomenclatura): add comprehensive naming system guide
refactor(api): optimize proxy endpoint performance

# ❌ INCORRECTO
added auth
fixed bug
updated docs
changes
```

#### **Branches**

```bash
# ✅ CORRECTO - kebab-case con prefijo descriptivo
feature/P2-F2-user-authentication
bugfix/proxy-validation-timeout
hotfix/critical-scraping-issue
docs/nomenclatura-system

# ❌ INCORRECTO
P2F2_auth
FixBug
userAuthentication
feature_auth
```

### **🔍 Quick Reference - Nomenclatura**

| **Elemento**          | **Formato**            | **Ejemplo**                   |
| --------------------- | ---------------------- | ----------------------------- |
| **Phase IDs**         | `P{X}-F{Y}_{DESC}`     | `P2-F2_SISTEMA-AUTENTICACION` |
| **Componentes React** | `PascalCase`           | `ProxyTable.tsx`              |
| **Hooks**             | `use + camelCase`      | `useApi.ts`                   |
| **Services**          | `camelCase`            | `scraperService.ts`           |
| **Types**             | `camelCase.types.ts`   | `api.types.ts`                |
| **Variables**         | `camelCase`            | `proxyList`                   |
| **Constantes**        | `SCREAMING_SNAKE_CASE` | `API_BASE_URL`                |
| **Documentos**        | `SCREAMING-KEBAB-CASE` | `CODING-RULES.md`             |
| **Commits**           | `conventional commits` | `feat(P2-F2): add auth`       |
| **Branches**          | `prefix/kebab-case`    | `feature/user-auth`           |

### **✅ Validación de Nomenclatura**

Para verificar que se está siguiendo la nomenclatura correcta:

1. **Phase IDs**: Verificar formato `P{X}-F{Y}_{DESCRIPTION}` en `docs/tasks/`
2. **Archivos React**: Verificar PascalCase en `src/components/`
3. **Hooks**: Verificar prefijo `use` en `src/hooks/`
4. **Types**: Verificar sufijo `.types.ts` en `src/types/`
5. **Documentación**: Verificar SCREAMING-KEBAB-CASE en `docs/`

**Comando de verificación sugerido:**

```bash
# Verificar nomenclatura de archivos
find src/ -name "*.tsx" | grep -v '^[A-Z]' # Debe estar vacío
find src/hooks/ -name "*.ts" | grep -v '^use' # Debe estar vacío
find src/types/ -name "*.ts" | grep -v '.types.ts$' # Debe estar vacío
```

---
