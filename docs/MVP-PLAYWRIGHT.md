# 🚀 MVP Alternativo - Con Playwright (Anti-Cloudflare)

## 🎯 Objetivo
Crear MVP usando Playwright desde el inicio para evadir las protecciones Cloudflare de hide.mn.

## 🚨 Problema Identificado
- **Status 403 Forbidden** en test básico
- **Cloudflare activo** bloqueando requests automatizados
- **Necesidad de browser real** para evadir detección

---

## 🛠️ Setup MVP con Playwright

### **Dependencias:**
```bash
mkdir mvp-playwright && cd mvp-playwright
bun init -y
bun add cheerio @playwright/test
bun add -D tsx typescript @types/node
bunx playwright install chromium
```

### **Estructura:**
```
mvp-playwright/
├── src/
│   ├── playwright-scraper.ts  # Scraper con browser
│   ├── types.ts              # Tipos básicos
│   └── utils.ts              # Utilidades
└── results/
    └── scraped-data.json     # Resultados
```

---

## 🔧 Implementación con Playwright

### **`src/playwright-scraper.ts`**
```typescript
import { chromium, Browser, Page } from '@playwright/test';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

interface ProxyData {
  ip: string;
  port: number;
  protocol: 'http' | 'https';
  country?: string;
  anonymity?: string;
}

interface ScrapingResult {
  success: boolean;
  proxiesFound: number;
  data: ProxyData[];
  errors: string[];
  cloudflareBypass: boolean;
}

class PlaywrightScraper {
  private browser?: Browser;
  private page?: Page;

  async initBrowser(): Promise<void> {
    console.log('🚀 Iniciando browser con evasión Cloudflare...');
    
    this.browser = await chromium.launch({
      headless: false, // Visible para evitar detección
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    }).then(context => context.newPage());

    // Remover señales de automatización
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
  }

  async testScraping(): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      success: false,
      proxiesFound: 0,
      data: [],
      errors: [],
      cloudflareBypass: false
    };

    try {
      await this.initBrowser();
      
      console.log('🔍 Navegando a hide.mn...');
      
      // Navegar con timeout extendido
      const response = await this.page!.goto('https://hide.mn/es/proxy-list/?type=s#list', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      console.log(`📊 Status: ${response?.status()}`);

      // Verificar si pasamos Cloudflare
      const title = await this.page!.title();
      const url = this.page!.url();
      
      console.log(`📄 Título: ${title}`);
      console.log(`🔗 URL final: ${url}`);

      // Detectar si estamos en página de challenge
      const isChallenge = await this.page!.evaluate(() => {
        return document.body.innerText.includes('Checking your browser') ||
               document.body.innerText.includes('Cloudflare') ||
               document.title.includes('Just a moment');
      });

      if (isChallenge) {
        console.log('⏳ Detectado challenge de Cloudflare, esperando...');
        await this.page!.waitForTimeout(5000);
        
        // Esperar a que termine el challenge
        await this.page!.waitForFunction(() => {
          return !document.body.innerText.includes('Checking your browser');
        }, { timeout: 15000 });
        
        console.log('✅ Challenge superado!');
      }

      result.cloudflareBypass = !isChallenge;

      // Obtener HTML después del challenge
      const html = await this.page!.content();
      
      console.log(`📄 HTML obtenido: ${html.length} caracteres`);

      // Analizar contenido con Cheerio
      const $ = cheerio.load(html);
      
      // Detectar estructura
      const tables = $('table');
      console.log(`📋 Tablas encontradas: ${tables.length}`);

      if (tables.length > 0) {
        const proxies = this.extractProxies($);
        result.data = proxies;
        result.proxiesFound = proxies.length;
        result.success = proxies.length > 0;
        
        console.log(`🎯 Proxies extraídos: ${proxies.length}`);
      }

      // Guardar HTML para análisis
      writeFileSync('results/page-content.html', html);
      
      return result;

    } catch (error) {
      console.error('❌ Error:', error);
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    } finally {
      await this.cleanup();
    }
  }

  private extractProxies($: cheerio.CheerioAPI): ProxyData[] {
    const proxies: ProxyData[] = [];
    
    // Múltiples selectores para tablas
    const tableSelectors = ['table tr', 'tbody tr', '.proxy-list tr'];
    
    for (const selector of tableSelectors) {
      $(selector).each((index, row) => {
        if (index === 0) return; // Skip header
        
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 2) {
          const ipText = $(cells[0]).text().trim();
          const portText = $(cells[1]).text().trim();
          
          if (this.isValidIP(ipText) && this.isValidPort(portText)) {
            proxies.push({
              ip: ipText,
              port: parseInt(portText),
              protocol: this.detectProtocol($row.text()),
              country: cells.length > 2 ? $(cells[2]).text().trim() : undefined
            });
          }
        }
      });
      
      if (proxies.length > 0) break;
    }
    
    return proxies;
  }

  private isValidIP(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  private isValidPort(port: string): boolean {
    const portNum = parseInt(port);
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
  }

  private detectProtocol(text: string): 'http' | 'https' {
    return text.toLowerCase().includes('https') ? 'https' : 'http';
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Ejecutar test
async function runPlaywrightMVP() {
  console.log('🚀 MVP con Playwright - Evasión Cloudflare\n');
  
  const scraper = new PlaywrightScraper();
  const result = await scraper.testScraping();

  console.log('\n📊 RESULTADOS DEL MVP PLAYWRIGHT:');
  console.log('====================================');
  console.log(`✅ Éxito: ${result.success ? 'SÍ' : 'NO'}`);
  console.log(`🛡️ Cloudflare evadido: ${result.cloudflareBypass ? 'SÍ' : 'NO'}`);
  console.log(`📋 Proxies encontrados: ${result.proxiesFound}`);

  if (result.errors.length > 0) {
    console.log(`❌ Errores: ${result.errors.length}`);
    result.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (result.data.length > 0) {
    console.log('\n🔍 MUESTRA DE DATOS:');
    console.log('=====================');
    result.data.slice(0, 5).forEach((proxy, i) => {
      console.log(`${i + 1}. ${proxy.ip}:${proxy.port} (${proxy.protocol})`);
    });
  }

  // Guardar resultados
  writeFileSync('results/playwright-results.json', JSON.stringify(result, null, 2));
  console.log('\n💾 Resultados guardados en results/playwright-results.json');

  console.log('\n🎯 CONCLUSIÓN:');
  console.log('==============');
  if (result.success) {
    console.log('✅ ÉXITO: Playwright puede evadir Cloudflare');
    console.log('✅ Proceder con desarrollo usando browser automation');
  } else if (result.cloudflareBypass) {
    console.log('🟡 PARCIAL: Cloudflare evadido pero estructura diferente');
    console.log('🟡 Revisar selectores y adaptar extracción');
  } else {
    console.log('❌ FALLIDO: Aún hay bloqueos o problemas técnicos');
    console.log('❌ Considerar fuentes alternativas');
  }
}

if (import.meta.main) {
  runPlaywrightMVP().catch(console.error);
}

export { PlaywrightScraper };
```

---

## 🚀 Comandos para Ejecutar

### **Setup:**
```bash
mkdir mvp-playwright && cd mvp-playwright
bun init -y
bun add cheerio @playwright/test
bun add -D tsx typescript @types/node

# Instalar browser
bunx playwright install chromium

# Crear estructura
mkdir -p src results
```

### **Ejecución:**
```bash
# Ejecutar MVP con Playwright
bunx tsx src/playwright-scraper.ts
```

---

## 🎯 Ventajas del Approach con Playwright

### **✅ Beneficios:**
1. **Browser real** → Evade detección automatizada
2. **JavaScript execution** → Maneja contenido dinámico  
3. **Headers naturales** → Parece navegación humana
4. **Challenge handling** → Puede esperar Cloudflare
5. **Screenshots** → Debug visual si falla

### **⚠️ Consideraciones:**
- **Más lento** que fetch directo
- **Consume más recursos** (browser completo)
- **Requiere instalación** de binarios de browser
- **Puede necesitar headless=false** para evitar detección

---

## 📋 Checklist MVP Playwright

- [ ] Setup de proyecto con Playwright
- [ ] Configurar browser con anti-detección
- [ ] Navegar a hide.mn
- [ ] Manejar Cloudflare challenge automáticamente
- [ ] Extraer proxies con Cheerio
- [ ] Validar datos extraídos
- [ ] Generar reporte de factibilidad

---

**🎯 Este approach tiene mayor probabilidad de éxito contra Cloudflare.** 