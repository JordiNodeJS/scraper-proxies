# 🔗 MVP Proxy Scraper

**Extractor automatizado de listas de proxies con validación en sitios reales**

## 📋 Descripción

MVP para extraer proxies de sitios especializados y probar su funcionalidad en plataformas como Amazon y redes sociales usando Playwright.

## 🎯 Objetivos

### Fase 1: Prototipo Básico
- ✅ Extraer proxies de Proxy List Download (https://www.proxy-list.download/HTTPS)
- ✅ Validar formato y estructura de datos
- ✅ Exportar resultados a JSON/CSV

### Fase 2: Validación de Proxies  
- 🔄 Probar proxies en Amazon
- 🔄 Probar proxies en redes sociales (Twitter, Instagram, Facebook)
- 🔄 Sistema de scoring por rendimiento

### Fase 3: Expansión
- 🔄 Agregar SPYS.ONE como fuente adicional
- 🔄 Sistema de rotación inteligente
- 🔄 Dashboard de monitoreo

## 🛠️ Stack Tecnológico

- **Runtime:** Bun
- **Lenguaje:** TypeScript (strict mode)
- **Web Scraping:** Playwright
- **HTTP:** fetch() nativo
- **Módulos:** ESM6 (import/export)

## 📁 Estructura del Proyecto

```
mvp-proxy-scraper/
├── src/
│   ├── core/           # Clases base y configuración
│   ├── scrapers/       # Scrapers específicos por sitio
│   ├── testers/        # Testing de proxies en sitios reales
│   ├── utils/          # Utilidades y helpers
│   └── types/          # Definiciones TypeScript
├── data/               # Datos extraídos (JSON, CSV)
├── logs/               # Logs de ejecución
├── tests/              # Tests automatizados
└── scripts/            # Scripts de utilidad
```

## 🚀 Instalación y Uso

```bash
# Instalar dependencias
bun install

# Ejecutar scraper de Proxy List Download
bun run scrape:proxy-list-download

# Probar proxies en Amazon
bun run test:amazon

# Probar proxies en redes sociales
bun run test:social

# Ejecutar suite completa
bun run full-pipeline
```

## 📊 Métricas de Éxito

### Fase 1
- [ ] Extraer 100+ proxies de Proxy List Download
- [ ] Tiempo de ejecución < 30 segundos
- [ ] Tasa de éxito > 90%

### Fase 2
- [ ] Validar 50+ proxies en Amazon
- [ ] Identificar 10+ proxies funcionales
- [ ] Tiempo de testing < 5 min/proxy

## 🔧 Desarrollo

### Convenciones de Código
- **Clases:** PascalCase
- **Funciones/Variables:** camelCase
- **Servicios:** Sufijo 'Service'
- **Tipos:** Archivos '.types.ts'

### Configuración Anti-Detección
```typescript
// Configuración optimizada para Cloudflare
const browserConfig = {
  headless: false,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--disable-background-timer-throttling'
  ]
};
```

## 📝 Log de Cambios

- **5 Jun 2025:** Proyecto iniciado, estructura base creada
- **Próximo:** Implementación core scraper

---

**Basado en análisis del MVP Website Detector**  
**Estado:** En desarrollo activo 