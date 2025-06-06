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
