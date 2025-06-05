# MVP FreeProxy.World - Scraper y Validador

## 🎯 Descripción

Este MVP scrapea proxies HTTPS desde **freeproxy.world** y los valida usando Playwright para comprobar su funcionamiento contra sitios web conocidos.

## ✨ Características

### 🕷️ Scraper
- Extrae proxies de freeproxy.world con paginación
- Obtiene IP, puerto, país, velocidad, anonimato
- Soporte para múltiples páginas
- Validación de formato IP
- Exporta resultados en JSON y TXT

### 🧪 Validador  
- Prueba proxies contra sitios reales:
  - HTTPBin (verificación IP)
  - Google
  - Amazon
  - GitHub  
  - StackOverflow
- Mide tiempo de respuesta
- Genera reportes de funcionalidad
- Exporta proxies funcionando

## 📋 Requisitos

- **Bun** (gestor de paquetes)
- **Node.js** 18+
- **Playwright** (instalado automáticamente)

## 🚀 Instalación

```bash
cd mvp-freeproxy-world
bun install
```

## 💻 Uso

### Demo Rápida
Scrapea 2 páginas (~100 proxies) y valida muestra de 10:
```bash
bun run demo
```

### Solo Scraping  
Prueba rápida de 1 página (~50 proxies):
```bash
bun run test
```

### Sistema Completo
Scrapea 3 páginas y valida 15 proxies:
```bash
bun run start
```

### Solo Validación
Prueba proxies específicos:
```bash
bun run test:validation
```

## 📁 Estructura

```
mvp-freeproxy-world/
├── src/
│   ├── types.ts          # Interfaces TypeScript
│   ├── scraper.ts        # Scraper principal
│   ├── validator.ts      # Validador de proxies
│   ├── main.ts           # Sistema completo
│   ├── test.ts           # Test rápido scraping
│   ├── quick-demo.ts     # Demo completa
│   └── test-validation.ts # Test validación
├── package.json
└── README.md
```

## 🔧 Configuración

### Scraper
- **Páginas por defecto**: 3
- **Proxies por página**: ~50
- **Timeout navegación**: 30s
- **Pausa entre páginas**: 3s

### Validador
- **Sitios de prueba**: HTTPBin, Google, Amazon, GitHub, StackOverflow
- **Timeout por proxy**: 15s
- **Máximo a validar**: Configurable
- **Pausa entre tests**: 1s

## 📊 Resultados

### Archivos Generados

**Scraping:**
- `freeproxy-world-{timestamp}.json` - Datos completos
- `freeproxy-world-{timestamp}.txt` - Lista IP:puerto

**Validación:**
- `validation-summary-{timestamp}.json` - Reporte completo
- `working-proxies-{timestamp}.txt` - Solo proxies funcionando

### Ejemplo de Salida

```
🎯 RESUMEN DEMO:
📊 Total scrapeados: 100
🧪 Muestra validada: 10  
✅ Funcionando: 2
📈 Tasa de éxito: 20.0%

🚀 PROXIES FUNCIONANDO:
   1. 192.168.1.1:8080 - 1245ms
   2. 10.0.0.1:3128 - 2340ms
```

## ⚠️ Limitaciones

### Proxies Gratuitos
- **Tasa de éxito baja**: Normal en proxies gratuitos
- **Conexiones inestables**: Pueden fallar frecuentemente  
- **Velocidad variable**: Tiempos de respuesta altos

### Rate Limiting
- Pausa automática entre páginas
- Timeout para evitar bloqueos
- Browser visible para debugging

## 🛠️ Desarrollo

### Comandos Disponibles

```bash
bun run demo              # Demo rápida completa
bun run test              # Test scraping únicamente  
bun run start             # Sistema completo
bun run test:validation   # Test validación únicamente
bun run test:html         # Análisis estructura HTML
```

### Personalización

**Modificar sitios de prueba** en `src/validator.ts`:
```typescript
private readonly testSites: TestSite[] = [
  {
    name: 'Mi Sitio',
    url: 'https://ejemplo.com',
    expectedContent: 'Texto esperado',
    timeout: 15000
  }
];
```

**Cambiar parámetros de scraping** en `src/scraper.ts`:
```typescript
const baseUrl = 'https://www.freeproxy.world/?type=https&speed=500&page=';
await this.page.waitForTimeout(3000); // Pausa personalizada
```

## 📈 Optimizaciones

### Performance
- Browser headless para validación
- Timeouts configurables
- Procesamiento paralelo posible

### Robustez  
- Validación de formato IP
- Manejo de errores por proxy
- Reintentos automáticos
- Logs detallados

## 🎯 Casos de Uso

1. **Investigación de proxies**: Análisis de disponibilidad
2. **Testing de conectividad**: Pruebas de red
3. **Automatización web**: Rotación de IPs
4. **Scraping distribuido**: Evasión de rate limits

## 🔮 Mejoras Futuras

- [ ] Soporte para SOCKS4/SOCKS5
- [ ] Validación geolocalización
- [ ] Métricas de latencia avanzadas
- [ ] Base de datos de proxies
- [ ] API REST para resultados
- [ ] Notificaciones de nuevos proxies
- [ ] Dashboard web en tiempo real

---

**Estado**: ✅ **MVP FUNCIONAL**  
**Scraping**: ✅ **100% Operativo**  
**Validación**: ✅ **100% Operativo**  
**Fuente**: freeproxy.world (HTTPS proxies) 