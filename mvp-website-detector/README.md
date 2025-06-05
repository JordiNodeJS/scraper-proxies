# 🎯 MVP Website Detector

**Detecta qué sitios web populares se pueden scrapear con Playwright**

Este MVP analiza automáticamente una lista de sitios web populares (Amazon, Google, Twitter, Instagram, etc.) para determinar qué tan viables son para scraping usando Playwright. Detecta protecciones como Cloudflare, CAPTCHAs, rate limiting y más.

## 🚀 Características

### ✅ Detección Automática
- **Cloudflare**: Detecta protección Cloudflare Enterprise
- **CAPTCHAs**: Identifica reCAPTCHA, hCaptcha y similares
- **Rate Limiting**: Detecta limitaciones de velocidad
- **Elementos Esperados**: Verifica si la página se carga correctamente
- **Códigos de Estado**: Analiza respuestas HTTP
- **Tiempo de Respuesta**: Mide performance de carga

### 📊 Análisis Completo
- **16 sitios populares** preconfigurados (Amazon, Google, Twitter, etc.)
- **6 categorías** (ecommerce, social, search, entertainment, news, tech)
- **4 niveles de viabilidad** (excellent, good, difficult, impossible)
- **Screenshots automáticos** de páginas bloqueadas
- **Estadísticas detalladas** por categoría y protección

### 💾 Exportación
- **JSON completo** con todos los datos
- **TXT resumido** para lectura rápida
- **Consola coloreada** para análisis interactivo
- **Screenshots** de páginas problemáticas

## 🛠️ Instalación

```bash
# Navegar al directorio del MVP
cd mvp-website-detector

# Instalar dependencias con BUN
bun install

# Instalar browsers de Playwright (solo la primera vez)
bunx playwright install chromium
```

## 📋 Uso

### Demo Rápida (8 sitios representativos)
```bash
bun run demo
```

### Análisis Completo (16 sitios)
```bash
# Editar src/main.ts y cambiar testWebsites por POPULAR_WEBSITES
bun run start
```

### Solo Testing
```bash
bun run test
```

## 📁 Estructura del Proyecto

```
mvp-website-detector/
├── src/
│   ├── types.ts        # Interfaces TypeScript
│   ├── websites.ts     # Configuración de sitios web
│   ├── detector.ts     # Lógica principal de detección
│   ├── utils.ts        # Utilidades de exportación
│   └── main.ts         # Archivo principal
├── screenshots/        # Capturas de páginas bloqueadas
├── package.json
└── README.md
```

## 🎯 Sitios Web Incluidos

### 🛒 E-commerce
- **Amazon** (high risk) - Mayor plataforma de comercio electrónico
- **AliExpress** (medium risk) - Marketplace global desde China
- **eBay** (medium risk) - Plataforma de subastas y ventas

### 📱 Redes Sociales  
- **Twitter/X** (high risk) - Red social de microblogging
- **Instagram** (high risk) - Compartir fotos y videos
- **Facebook** (high risk) - Red social principal
- **LinkedIn** (high risk) - Red social profesional

### 🔍 Buscadores
- **Google** (medium risk) - Motor de búsqueda principal
- **Bing** (low risk) - Buscador de Microsoft
- **DuckDuckGo** (low risk) - Búsqueda privada

### 🎬 Entretenimiento
- **YouTube** (medium risk) - Plataforma de videos
- **Netflix** (medium risk) - Streaming de video
- **Twitch** (low risk) - Streaming para gamers

### 📰 Noticias
- **BBC News** (low risk) - Noticias británicas
- **CNN** (low risk) - Noticias estadounidenses

### 💻 Tecnología
- **GitHub** (low risk) - Desarrollo colaborativo
- **Stack Overflow** (low risk) - Q&A para programadores

## 📊 Ejemplo de Resultados

```
🎯 RESUMEN DE DETECCIÓN DE SITIOS WEB
=====================================

📊 Estadísticas Generales:
   Total sitios analizados: 8
   Accesibles: 6 (75%)
   Bloqueados: 2 (25%)
   Con Cloudflare: 3 (37%)
   Con CAPTCHA: 1 (12%)
   Con Rate Limiting: 0 (0%)
   Tiempo promedio: 2847ms

🎯 Viabilidad de Scraping:
   Excelente: 4 sitios
   Buena: 2 sitios
   Difícil: 1 sitios
   Imposible: 1 sitios

📋 Por Categorías:
   SEARCH: 3/3 accesibles (100%)
   TECH: 2/2 accesibles (100%)
   NEWS: 1/1 accesibles (100%)
   ECOMMERCE: 0/1 accesibles (0%)
   SOCIAL: 0/1 accesibles (0%)
```

## 🎯 Niveles de Viabilidad

### 🟢 EXCELENTE
- Sin protecciones detectadas
- Todos los elementos esperados presentes
- Tiempo de respuesta rápido
- **Ideal para MVPs**

### 🔵 BUENA
- Protecciones mínimas
- Mayoría de elementos presentes
- Scraping viable con cuidado

### 🟡 DIFÍCIL
- Cloudflare o rate limiting detectado
- Algunos elementos faltantes
- **Requiere proxies y rotación**

### 🔴 IMPOSIBLE
- CAPTCHAs activos
- Bloqueo total detectado
- **Considerar APIs oficiales**

## ⚙️ Configuración

### User-Agents Disponibles
```typescript
// Cambiar en src/main.ts
userAgent: USER_AGENTS[0].value  // Chrome Desktop (por defecto)
userAgent: USER_AGENTS[1].value  // Firefox Desktop
userAgent: USER_AGENTS[2].value  // Safari Desktop
userAgent: USER_AGENTS[3].value  // Chrome Mobile
userAgent: USER_AGENTS[4].value  // iPhone Safari
userAgent: USER_AGENTS[5].value  // Bot-friendly (Googlebot)
```

### Configuraciones del Detector
```typescript
const detector = new WebsiteDetector({
  headless: false,              // Mostrar browser (true para producción)
  timeout: 15000,               // Timeout por sitio en ms
  screenshotOnBlock: true,      // Capturar pantalla si bloqueado
  waitForNetworkIdle: true,     // Esperar carga completa
  retries: 2                    // Reintentos en caso de error
});
```

## 📝 Archivos Generados

### `website-detection-results.json`
```json
{
  "summary": {
    "totalTested": 8,
    "accessible": 6,
    "blocked": 2,
    "viabilityBreakdown": {...},
    "recommendations": [...]
  },
  "results": [
    {
      "website": {...},
      "accessible": true,
      "scrapingViability": "excellent",
      "detectedProtections": [],
      "responseTime": 1234,
      "notes": [...]
    }
  ]
}
```

### `website-detection-summary.txt`
Resumen legible en texto plano con estadísticas y recomendaciones.

### `screenshots/`
Capturas automáticas de páginas que presentan bloqueos o CAPTCHAs.

## 🔧 Comandos del Workspace

```bash
# Desde la raíz del proyecto scraper-proxies
bun run mvp:website-detector      # Demo rápida (cuando se agregue al package.json)
```

## 💡 Casos de Uso

### 1. **Planificación de MVP**
Identifica qué sitios son viables para prototipos rápidos.

### 2. **Arquitectura de Scraping**
Planifica infraestructura según nivel de protecciones.

### 3. **Monitoreo de Cambios**
Ejecuta periódicamente para detectar nuevas protecciones.

### 4. **Selección de Herramientas**
Decide entre Playwright, APIs oficiales o servicios especializados.

## 🚀 Próximos Pasos

### Para Sitios "Excelentes" y "Buenos"
1. ✅ Implementar scrapers directos con Playwright
2. ✅ Usar delays moderados (2-5 segundos)
3. ✅ Implementar rotación básica de User-Agents

### Para Sitios "Difíciles"
1. ⚠️ Implementar proxies residenciales
2. ⚠️ Rotación avanzada de User-Agents y fingerprints
3. ⚠️ Usar stealth plugins para Playwright
4. ⚠️ Implementar delays más largos (5-15 segundos)

### Para Sitios "Imposibles"
1. ❌ Buscar APIs oficiales
2. ❌ Considerar servicios como ScrapingBee, Apify
3. ❌ Implementar resolución automática de CAPTCHAs
4. ❌ Evaluar si el ROI justifica la complejidad

## 🛡️ Detecciones Implementadas

### Cloudflare
- Headers `cf-ray`
- Contenido con "cloudflare"
- URLs con `cdn-cgi`
- Títulos con "Cloudflare"

### CAPTCHAs
- reCAPTCHA, hCaptcha
- Elementos con ID/class "captcha"
- Títulos con "captcha"

### Rate Limiting
- Status 429
- Contenido "rate limit", "too many requests"
- Mensajes "unusual traffic"

### Bloqueos Específicos
- Selectors personalizados por sitio
- Mensajes de error conocidos
- Páginas de verificación

## 📈 Métricas Objetivo

- **Tiempo de análisis**: < 30 segundos por sitio
- **Precisión de detección**: > 95%
- **Cobertura de protecciones**: Cloudflare, CAPTCHAs, Rate Limiting
- **False positives**: < 5%

## 🏆 Estado del MVP

✅ **COMPLETADO Y FUNCIONAL**
- Detección automática de protecciones
- Análisis de 16 sitios populares
- Exportación a múltiples formatos  
- Screenshots de páginas bloqueadas
- Estadísticas detalladas y recomendaciones
- Cumple todas las reglas de desarrollo (BUN, TypeScript, ES Modules)

---

## 🎯 Conclusión

Este MVP te permite **tomar decisiones informadas** sobre qué sitios web son viables para scraping antes de invertir tiempo en desarrollo. Los resultados te ayudarán a priorizar esfuerzos y planificar la arquitectura técnica correcta para cada objetivo. 