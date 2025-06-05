# 🚀 MVP - Validación de Scraping hide.mn

## 🎯 Objetivo del MVP

Crear una prueba de concepto mínima para validar que es posible extraer proxies de https://hide.mn/es/proxy-list/?type=s#list antes de desarrollar la aplicación completa.

---

## 📋 Alcance del MVP

### ✅ **Lo que SÍ incluye:**

- Script básico de scraping sin UI
- Detección de estructura DOM de la página
- Extracción de proxies de una página
- Validación básica de formato de datos
- Test de conectividad simple (sin Playwright)

### ❌ **Lo que NO incluye:**

- Interfaz React completa
- Paginación automática
- Validación con Playwright
- Estado global con Context
- UI responsive

---

## 🛠️ Stack del MVP

```bash
# Dependencias mínimas
bun add cheerio
bun add -D @types/cheerio tsx
```

**Herramientas:**

- **HTTP Client**: fetch nativo para requests
- **HTML Parser**: cheerio para parsing
- **Runtime**: tsx para ejecutar TypeScript directamente

---

## 📁 Estructura del MVP

```
mvp/
├── src/
│   ├── scraper-test.ts      # Script principal de prueba
│   ├── types.ts             # Tipos básicos
│   └── utils.ts             # Utilidades de validación
├── results/
│   └── scraped-data.json    # Datos extraídos (gitignored)
├── package.json
└── README-MVP.md
```

---

## 🔧 Implementación del MVP

### **Archivo 1: `mvp/src/types.ts`**

```typescript
export interface ProxyData {
  ip: string;
  port: number;
  protocol: "http" | "https";
  country?: string;
  anonymity?: string;
  uptime?: string;
}

export interface ScrapingResult {
  success: boolean;
  proxiesFound: number;
  data: ProxyData[];
  errors: string[];
  pageStructure: {
    hasTable: boolean;
    tableRows: number;
    paginationFound: boolean;
    totalPages?: number;
  };
}
```

### **Archivo 2: `mvp/src/utils.ts`**

```typescript
export const isValidIP = (ip: string): boolean => {
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

export const isValidPort = (port: string | number): boolean => {
  const portNum = typeof port === "string" ? parseInt(port) : port;
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
};

export const detectProtocol = (text: string): "http" | "https" => {
  return text.toLowerCase().includes("https") ? "https" : "http";
};

export const cleanText = (text: string): string => {
  return text.trim().replace(/\s+/g, " ");
};
```

### **Archivo 3: `mvp/src/scraper-test.ts`**

```typescript
import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { ProxyData, ScrapingResult } from "./types";
import { isValidIP, isValidPort, detectProtocol, cleanText } from "./utils";

class HideMnScraper {
  private readonly baseUrl = "https://hide.mn/es/proxy-list/?type=s";
  private readonly userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

  async testScraping(): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      success: false,
      proxiesFound: 0,
      data: [],
      errors: [],
      pageStructure: {
        hasTable: false,
        tableRows: 0,
        paginationFound: false,
      },
    };

    try {
      console.log("🔍 Iniciando test de scraping...");

      // 1. Fetch de la página principal
      const html = await this.fetchPage(this.baseUrl);
      console.log("✅ Página obtenida exitosamente");

      // 2. Analizar estructura de la página
      const $ = cheerio.load(html);
      this.analyzePageStructure($, result);

      // 3. Intentar extraer proxies
      const proxies = this.extractProxies($);
      result.data = proxies;
      result.proxiesFound = proxies.length;

      // 4. Validar datos extraídos
      const validProxies = proxies.filter(
        (p) => isValidIP(p.ip) && isValidPort(p.port)
      );
      console.log(`📊 Proxies encontrados: ${proxies.length}`);
      console.log(`✅ Proxies válidos: ${validProxies.length}`);

      result.success = validProxies.length > 0;

      // 5. Guardar resultados
      this.saveResults(result);

      return result;
    } catch (error) {
      console.error("❌ Error durante scraping:", error);
      result.errors.push(
        error instanceof Error ? error.message : String(error)
      );
      return result;
    }
  }
  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        "User-Agent": this.userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  }

  private analyzePageStructure(
    $: cheerio.CheerioAPI,
    result: ScrapingResult
  ): void {
    console.log("🔍 Analizando estructura de la página...");

    // Buscar tablas posibles
    const tables = $("table");
    console.log(`📋 Tablas encontradas: ${tables.length}`);

    if (tables.length > 0) {
      result.pageStructure.hasTable = true;

      // Analizar la tabla más probable
      tables.each((i, table) => {
        const $table = $(table);
        const rows = $table.find("tr");
        console.log(`📋 Tabla ${i + 1}: ${rows.length} filas`);

        if (rows.length > result.pageStructure.tableRows) {
          result.pageStructure.tableRows = rows.length;
        }
      });
    }

    // Buscar paginación
    const paginationSelectors = [
      ".pagination",
      ".pager",
      ".page-numbers",
      '[class*="page"]',
      '[class*="pagination"]',
    ];

    for (const selector of paginationSelectors) {
      const paginationEl = $(selector);
      if (paginationEl.length > 0) {
        result.pageStructure.paginationFound = true;
        console.log(`📄 Paginación encontrada: ${selector}`);

        // Intentar extraer número total de páginas
        const pageNumbers = paginationEl
          .find("a, span")
          .map((_, el) => {
            const text = $(el).text().trim();
            return parseInt(text);
          })
          .get()
          .filter((num) => !isNaN(num));

        if (pageNumbers.length > 0) {
          result.pageStructure.totalPages = Math.max(...pageNumbers);
        }
        break;
      }
    }
  }

  private extractProxies($: cheerio.CheerioAPI): ProxyData[] {
    console.log("🕷️ Extrayendo proxies...");
    const proxies: ProxyData[] = [];

    // Múltiples estrategias de extracción
    const tableSelectors = [
      "table tr",
      ".proxy-list tr",
      '[class*="proxy"] tr',
      "tbody tr",
    ];

    for (const selector of tableSelectors) {
      const rows = $(selector);
      console.log(`🔍 Probando selector: ${selector} (${rows.length} filas)`);

      if (rows.length > 1) {
        // Más de 1 fila (excluyendo header)
        rows.each((index, row) => {
          if (index === 0) return; // Skip header row

          const $row = $(row);
          const cells = $row.find("td");

          if (cells.length >= 2) {
            const proxy = this.extractProxyFromRow($, $row, cells);
            if (proxy) {
              proxies.push(proxy);
            }
          }
        });

        if (proxies.length > 0) {
          console.log(`✅ Extracción exitosa con selector: ${selector}`);
          break; // Si encontramos proxies, no necesitamos probar otros selectores
        }
      }
    }

    return proxies;
  }

  private extractProxyFromRow(
    $: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<cheerio.Element>,
    cells: cheerio.Cheerio<cheerio.Element>
  ): ProxyData | null {
    try {
      // Estrategias múltiples para extraer IP y puerto
      const firstCell = cleanText($(cells[0]).text());
      const secondCell = cleanText($(cells[1]).text());

      let ip = "";
      let port = 0;

      // Estrategia 1: IP en primera celda, puerto en segunda
      if (isValidIP(firstCell) && isValidPort(secondCell)) {
        ip = firstCell;
        port = parseInt(secondCell);
      }
      // Estrategia 2: IP:Puerto en primera celda
      else if (firstCell.includes(":")) {
        const [ipPart, portPart] = firstCell.split(":");
        if (isValidIP(ipPart.trim()) && isValidPort(portPart.trim())) {
          ip = ipPart.trim();
          port = parseInt(portPart.trim());
        }
      }

      if (!ip || !port) {
        return null;
      }

      // Extraer información adicional
      const protocol = detectProtocol($row.text());
      const country = this.extractCountry($, $row, cells);
      const anonymity = this.extractAnonymity($, $row, cells);

      return {
        ip,
        port,
        protocol,
        country,
        anonymity,
      };
    } catch (error) {
      console.warn("⚠️ Error extrayendo proxy de fila:", error);
      return null;
    }
  }

  private extractCountry(
    $: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<cheerio.Element>,
    cells: cheerio.Cheerio<cheerio.Element>
  ): string | undefined {
    // Buscar país en diferentes posiciones
    for (let i = 2; i < Math.min(cells.length, 6); i++) {
      const cellText = cleanText($(cells[i]).text());

      // Si parece un país (2-3 letras o nombre común)
      if (
        cellText.length === 2 ||
        cellText.length === 3 ||
        ["United States", "Germany", "France", "China"].some((country) =>
          cellText.toLowerCase().includes(country.toLowerCase())
        )
      ) {
        return cellText;
      }
    }

    return undefined;
  }

  private extractAnonymity(
    $: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<cheerio.Element>,
    cells: cheerio.Cheerio<cheerio.Element>
  ): string | undefined {
    const text = $row.text().toLowerCase();

    if (text.includes("elite") || text.includes("high")) return "Elite";
    if (text.includes("anonymous")) return "Anonymous";
    if (text.includes("transparent")) return "Transparent";

    return undefined;
  }

  private saveResults(result: ScrapingResult): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `results/scraping-test-${timestamp}.json`;

      writeFileSync(filename, JSON.stringify(result, null, 2));
      console.log(`💾 Resultados guardados en: ${filename}`);
    } catch (error) {
      console.warn("⚠️ No se pudieron guardar los resultados:", error);
    }
  }
}

// Ejecutar test
async function runMVP() {
  console.log("🚀 Iniciando MVP de Scraping hide.mn\n");

  const scraper = new HideMnScraper();
  const result = await scraper.testScraping();

  console.log("\n📊 RESULTADOS DEL MVP:");
  console.log("=====================================");
  console.log(`✅ Éxito: ${result.success ? "SÍ" : "NO"}`);
  console.log(`📋 Proxies encontrados: ${result.proxiesFound}`);
  console.log(`🏗️ Estructura encontrada:`);
  console.log(`   - Tabla: ${result.pageStructure.hasTable ? "SÍ" : "NO"}`);
  console.log(`   - Filas: ${result.pageStructure.tableRows}`);
  console.log(
    `   - Paginación: ${result.pageStructure.paginationFound ? "SÍ" : "NO"}`
  );
  if (result.pageStructure.totalPages) {
    console.log(`   - Páginas totales: ${result.pageStructure.totalPages}`);
  }

  if (result.errors.length > 0) {
    console.log(`❌ Errores: ${result.errors.length}`);
    result.errors.forEach((error) => console.log(`   - ${error}`));
  }

  if (result.data.length > 0) {
    console.log("\n🔍 MUESTRA DE DATOS:");
    console.log("=====================================");
    result.data.slice(0, 3).forEach((proxy, i) => {
      console.log(`${i + 1}. ${proxy.ip}:${proxy.port} (${proxy.protocol})`);
      if (proxy.country) console.log(`   País: ${proxy.country}`);
      if (proxy.anonymity) console.log(`   Anonimato: ${proxy.anonymity}`);
    });
  }

  console.log("\n🎯 CONCLUSIÓN:");
  console.log("=====================================");
  if (result.success) {
    console.log("✅ El scraping es FACTIBLE");
    console.log("✅ Se puede proceder con el desarrollo completo");
  } else {
    console.log("❌ El scraping presenta PROBLEMAS");
    console.log("❌ Se necesita revisar la estructura de la página");
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  runMVP().catch(console.error);
}

export { HideMnScraper };
```

---

## 🚀 Comandos para Ejecutar el MVP

### **Setup:**

```bash
# Crear directorio MVP
mkdir mvp && cd mvp

# Inicializar proyecto
bun init -y

# Instalar dependencias
bun add cheerio
bun add -D @types/cheerio tsx typescript @types/node

# Crear estructura
mkdir -p src results
```

### **Ejecución:**

```bash
# Ejecutar test de scraping
bunx tsx src/scraper-test.ts

# O añadir al package.json:
bun run mvp
```

---

## 📋 Checklist del MVP

### **Preparación:**

- [ ] Crear directorio `mvp/`
- [ ] Instalar dependencias mínimas
- [ ] Configurar TypeScript básico
- [ ] Crear estructura de archivos

### **Implementación:**

- [ ] Implementar tipos básicos
- [ ] Crear utilidades de validación
- [ ] Desarrollar scraper principal
- [ ] Añadir análisis de estructura DOM
- [ ] Implementar múltiples estrategias de extracción

### **Testing:**

- [ ] Ejecutar test contra hide.mn
- [ ] Verificar extracción de datos
- [ ] Analizar estructura de paginación
- [ ] Validar formato de proxies
- [ ] Documentar hallazgos

### **Validación:**

- [ ] ✅ Se pueden extraer proxies válidos
- [ ] ✅ Se detecta estructura de paginación
- [ ] ✅ Rate limiting es manejable
- [ ] ✅ Formato de datos es consistente
- [ ] ✅ No hay blocking inmediato

---

## 🎯 Criterios de Éxito del MVP

### **✅ MVP EXITOSO si:**

1. **Extrae al menos 10 proxies válidos** de la primera página
2. **Detecta estructura de paginación** correctamente
3. **No recibe errores 403/429** inmediatamente
4. **Formato de datos es consistente** y parseable
5. **Tiempo de respuesta < 10 segundos**

### **❌ MVP FALLIDO si:**

- Cloudflare o protección anti-bot bloquea requests
- Estructura DOM es demasiado dinámica/cambiante
- Rate limiting muy agresivo (< 1 request/minuto)
- Datos están en JavaScript dinámico (no HTML estático)
- Requiere autenticación obligatoria

---

## 📈 Siguientes Pasos según Resultados

### **🟢 Si MVP es EXITOSO:**

1. Proceder con el desarrollo completo según `TASKS.md`
2. Usar learnings del MVP para optimizar selectores
3. Implementar delays basados en testing real
4. Añadir estrategias de fallback identificadas

### **🟡 Si MVP es PARCIAL:**

1. Identificar problemas específicos
2. Ajustar estrategias de scraping
3. Considerar usar Playwright desde el inicio
4. Evaluar proxies alternativos para scraping

### **🔴 Si MVP FALLA:**

1. Analizar causa raíz del fallo
2. Evaluar páginas alternativas de proxies
3. Considerar APIs de terceros
4. Replantear arquitectura del proyecto

---

**💡 Tiempo estimado del MVP: 2-4 horas**

Este MVP nos dará la confianza necesaria para proceder con el desarrollo completo, o nos alertará sobre problemas potenciales antes de invertir tiempo en la aplicación full-stack.
