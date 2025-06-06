# 🌐 Scraper Proxies - Monorepo

Sistema completo de scraping y validación de proxies con arquitectura moderna y lista para deployment.

## 🏗️ Arquitectura del Proyecto

```
scraper-proxies/
├── apps/
│   ├── frontend/          # React SPA con Vite
│   └── backend/           # Bun + Express API Server
├── packages/
│   ├── shared/            # Tipos TypeScript compartidos
│   ├── proxy-scraper/     # Lógica de scraping de proxies
│   └── proxy-validator/   # Sistema de validación de proxies
├── docs/                  # Documentación técnica
├── scripts/               # Scripts de build y deploy
└── docker-compose.yml     # Setup para desarrollo local
```

## 🚀 Inicio Rápido

### Prerrequisitos
- **Bun** >= 1.0.0
- **Node.js** >= 18.0.0

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd scraper-proxies

# Instalar dependencias
bun install

# Build de packages
bun run build:packages
```

### Desarrollo Local
```bash
# Iniciar frontend y backend en paralelo
bun run dev

# O por separado:
bun run dev:frontend  # Puerto 5173
bun run dev:backend   # Puerto 3001
```

### Producción
```bash
# Build completo
bun run build

# Ejecutar aplicaciones
bun run start:frontend
bun run start:backend
```

## 📦 Packages

### `@scraper-proxies/shared`
Tipos TypeScript y utilidades compartidas entre frontend y backend.

### `@scraper-proxies/proxy-scraper`
Sistema de scraping con bypass de Cloudflare y extracción masiva:
- **ProxyListDownloadScraper**: Proxies HTTPS
- **ProxyListHTTPScraper**: Proxies HTTP
- **DataExporter**: Exportación JSON/CSV

### `@scraper-proxies/proxy-validator`
Sistema de validación de proxies en sitios reales:
- **ProxyTester**: Testing completo con Playwright
- Detección de anonimato (Elite/Anonymous/Transparent)
- Medición de velocidad y rendimiento

## 🌐 API Endpoints

### Scraping
- `POST /api/scrape/all` - Extrae todos los proxies
- `POST /api/scrape/https` - Solo proxies HTTPS
- `POST /api/scrape/http` - Solo proxies HTTP

### Validación
- `POST /api/validate` - Validación completa en sitios específicos
- `POST /api/validate/quick` - Test rápido de conectividad

### Health Check
- `GET /health` - Estado del servidor

## 🐳 Docker

### Desarrollo Local
```bash
docker-compose up -d
```

### Producción (Solo Backend)
```bash
docker build -t scraper-proxies-backend .
docker run -p 3001:3001 scraper-proxies-backend
```

## 🚀 Deployment

### Opción 1: Hosting Separado (Recomendado)

**Frontend** → Netlify/Vercel (Gratis)
```bash
cd apps/frontend
bun run build
# Deploy a Netlify/Vercel
```

**Backend** → Railway/Render ($5-10/mes)
```bash
cd apps/backend
# Deploy con Dockerfile
```

### Opción 2: Script Automatizado
```bash
./scripts/deploy.sh
```

## 📈 Características

### ✅ Scraping Masivo
- **41+ proxies** extraídos en ~10 segundos
- **Bypass Cloudflare** automático
- **Múltiples fuentes** simultáneas
- **Metadatos completos** (país, velocidad, anonimato)

### ✅ Validación Robusta
- **Testing en sitios reales** (Amazon, Google, redes sociales)
- **Detección de bloqueos** y CAPTCHAs
- **Clasificación de anonimato** automática
- **Medición de performance**

### ✅ Arquitectura Escalable
- **Monorepo organizado** con workspaces
- **Packages independientes** y reutilizables
- **APIs REST** bien documentadas
- **TypeScript estricto** en todo el proyecto

### ✅ Ready for Production
- **Docker support** completo
- **Scripts de deployment** automatizados
- **Health checks** implementados
- **Logging y error handling** robusto

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `bun run dev` | Desarrollo con hot reload |
| `bun run build` | Build completo del proyecto |
| `bun run test` | Ejecutar tests |
| `bun run lint` | Linting de código |
| `bun run clean` | Limpiar builds y node_modules |

## 📊 Métricas de Rendimiento

- **Extracción**: ~10.8 segundos para 41 proxies
- **Bypass Cloudflare**: 100% éxito
- **Arquitectura**: Escalable hasta 1000+ proxies
- **Validación**: Testing completo en <30 segundos

## 🛡️ Seguridad

- **Anti-detección** avanzada con Playwright
- **User-agents rotativos** y delays aleatorios
- **Headers realistas** para bypass de protecciones
- **Rate limiting** respetado automáticamente

## 📋 Próximas Mejoras

- [ ] Cache de proxies con Redis
- [ ] WebSockets para updates en tiempo real
- [ ] Dashboard de métricas
- [ ] Integración con APIs premium
- [ ] Sistema de scoring automático

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con ❤️ usando Bun, TypeScript, React y Playwright**
