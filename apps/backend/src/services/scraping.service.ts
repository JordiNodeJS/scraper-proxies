import { chromium, Browser, BrowserContext, Page } from 'playwright';

// Tipos para el scraper
interface ProxyData {
  ip: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  country?: string;
  anonymity?: 'transparent' | 'anonymous' | 'elite';
  speed?: number;
  source: string;
}

interface ScrapingResult {
  success: boolean;
  proxies: ProxyData[];
  totalFound: number;
  errors: string[];
  timestamp: Date;
  executionTime: number;
  source: {
    name: string;
    url: string;
    scrapedAt: Date;
  };
}

/**
 * Servicio de scraping real integrado al MVP
 * Basado en el ProxyListDownloadScraper exitoso de la Fase 2
 */
class ScrapingService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  
  private readonly targetUrl = 'https://www.proxy-list.download/HTTPS';
  private readonly siteName = 'Proxy List Download';

  /**
   * Inicializar navegador con timeout progresivo optimizado
   */
  private async initializeBrowserWithProgressiveTimeout(): Promise<void> {
    console.log('🔧 Inicializando navegador con configuración optimizada mejorada...');

    // Configuración mínima para máxima compatibilidad  
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--no-first-run',
      '--disable-default-apps'
    ];

    console.log('🚀 Lanzando navegador Chromium optimizado...');
    
    try {
      this.browser = await chromium.launch({
        headless: true, // Cambiar a headless para mejor compatibilidad
        args: browserArgs,
        timeout: 300000, // 5 minutos timeout ampliado
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
        executablePath: undefined, // Usar path por defecto
        slowMo: 0 // Sin retrasos adicionales
      });
      
      console.log('✅ Navegador lanzado exitosamente');
    } catch (error) {
      console.error('❌ Error al lanzar navegador:', error);
      throw new Error(`Error inicializando navegador: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    console.log('🔧 Creando contexto optimizado del navegador...');
    
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      ignoreHTTPSErrors: true,
      colorScheme: 'light'
    });
    
    console.log('✅ Contexto creado exitosamente');

    // Script anti-detección mejorado
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      (window as any).chrome = {
        runtime: {},
      };
    });

    console.log('📄 Creando nueva página optimizada...');
    
    this.page = await this.context.newPage();
    
    // Configurar timeouts optimizados
    this.page.setDefaultTimeout(120000); // 2 minutos para operaciones
    this.page.setDefaultNavigationTimeout(120000); // 2 minutos para navegación
    
    console.log('✅ Página creada exitosamente');
    console.log('✅ Navegador completamente inicializado y optimizado al 100%');
  }

  /**
   * Navegación optimizada con manejo robusto de errores
   */
  private async navigateWithOptimizedHandling(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Página no disponible');
    }

    console.log(`🌐 Navegando con optimización a: ${url}`);

    // Delay inicial anti-detección
    await this.delay(1500);

    const response = await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 120000 // 2 minutos para navegación
    });

    console.log('📡 Response status:', response?.status());

    if (!response) {
      throw new Error('No se recibió respuesta del servidor');
    }

    if (response.status() >= 400) {
      console.log('❌ Error HTTP:', {
        status: response.status(),
        statusText: response.statusText(),
        url: response.url()
      });
      throw new Error(`HTTP Error: ${response.status()} - ${response.statusText()}`);
    }

    // Detectar y manejar Cloudflare con mejor estrategia
    const isCloudflare = await this.detectCloudflare();
    
    if (isCloudflare) {
      console.log('🛡️ Cloudflare detectado, manejando con estrategia optimizada...');
      await this.handleCloudflareOptimized();
    } else {
      console.log('✅ No se detectó Cloudflare, continuando...');
    }

    // **NUEVO: Manejar modal de consentimiento de cookies**
    await this.handleCookieConsent();

    // Esperar carga completa con timeout reducido
    await this.delay(2000);

    console.log(`✅ Navegación optimizada completada. Status: ${response.status()}`);
  }

  /**
   * Manejo optimizado de challenge de Cloudflare
   */
  private async handleCloudflareOptimized(): Promise<void> {
    if (!this.page) return;

    try {
      // Esperar a que el challenge se complete automáticamente
      await this.page.waitForLoadState('domcontentloaded', { timeout: 25000 });
      
      // Verificar múltiples veces si seguimos en el challenge
      let attempts = 0;
      while (attempts < 3) {
        const stillInChallenge = await this.detectCloudflare();
        if (!stillInChallenge) {
          console.log('✅ Challenge de Cloudflare completado exitosamente');
          return;
        }
        
        console.log(`⏳ Challenge activo (intento ${attempts + 1}/3), esperando...`);
        await this.delay(5000);
        attempts++;
      }
      
      console.log('⚠️ Challenge tomó más tiempo del esperado, continuando...');
    } catch (error) {
      console.log('⚠️ Timeout en challenge de Cloudflare optimizado, continuando...');
    }
  }

  /**
   * **NUEVO: Manejar modal de consentimiento de cookies**
   */
  private async handleCookieConsent(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('🍪 Verificando modal de consentimiento de cookies...');
      
      // Esperar un poco para que aparezca el modal
      await this.delay(2000);
      
      // Buscar diferentes tipos de botones de consentimiento comunes
      const consentSelectors = [
        'button[role="button"]:has-text("Consent")',
        'button:has-text("Accept")',
        'button:has-text("Aceptar")',
        'button:has-text("Consent")',
        '[data-role="consent"] button',
        '.consent-button',
        '#consent-button',
        'button[data-accept]'
      ];

      for (const selector of consentSelectors) {
        try {
          // Buscar el botón con timeout corto
          const consentButton = await this.page.locator(selector).first();
          
          if (await consentButton.isVisible({ timeout: 3000 })) {
            console.log(`🍪 Modal de cookies encontrado, selector: ${selector}`);
            await consentButton.click();
            console.log('✅ Consentimiento de cookies aceptado exitosamente');
            
            // Esperar a que el modal se cierre
            await this.delay(2000);
            return;
          }
        } catch (error) {
          // Continuar con el siguiente selector
          continue;
        }
      }
      
      console.log('ℹ️ No se encontró modal de consentimiento de cookies');
      
    } catch (error) {
      console.log('⚠️ Error manejando modal de cookies, continuando...', error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Esperar contenido con múltiples estrategias de fallback
   */
  private async waitForContentWithFallbacks(): Promise<void> {
    if (!this.page) {
      throw new Error('Página no disponible');
    }

    const strategies = [
      { selector: 'table', timeout: 20000, name: 'tabla principal' },
      { selector: 'tbody tr', timeout: 15000, name: 'filas de tabla' },
      { selector: 'td', timeout: 10000, name: 'celdas de datos' },
      { selector: 'pre', timeout: 10000, name: 'texto preformateado' },
      { selector: '.proxy-table', timeout: 10000, name: 'tabla de proxies' }
    ];

    for (const strategy of strategies) {
      try {
        await this.page.waitForSelector(strategy.selector, { timeout: strategy.timeout });
        console.log(`✅ Contenido encontrado: ${strategy.name}`);
        return;
      } catch {
        console.log(`⚠️ ${strategy.name} no encontrado, probando siguiente estrategia...`);
      }
    }

    // Último intento - verificar si hay contenido de texto
    try {
      const pageContent = await this.page.textContent('body');
      if (pageContent && pageContent.length > 100) {
        console.log('✅ Contenido de texto detectado, continuando extracción...');
        return;
      }
    } catch {
      // Ignorar error
    }

    throw new Error('No se pudo localizar contenido de proxies con ninguna estrategia');
  }

  /**
   * Extracción optimizada de datos de proxy - MEJORADA CON DETECCIÓN ESPECÍFICA
   */
  private async extractProxyDataWithOptimization(): Promise<ProxyData[]> {
    if (!this.page) {
      throw new Error('Página no disponible');
    }

    console.log('📊 Extrayendo datos con algoritmo optimizado mejorado...');

    const proxies = await this.page.evaluate(() => {
      const results: Array<{
        ip: string;
        port: number;
        country?: string;
        anonymity?: string;
        speed?: number;
      }> = [];

      // **ESTRATEGIA ESPECÍFICA PARA PROXY-LIST.DOWNLOAD**
      // Buscar la tabla principal de proxies (estructura específica verificada)
      const mainGrid = document.querySelector('div[role="grid"], .dataTables_wrapper table, table');
      
      if (mainGrid) {
        console.log('🎯 Tabla principal de proxies encontrada');
        
        // Buscar todas las filas de datos (excluyendo header)
        const dataRows = mainGrid.querySelectorAll('div[role="row"]:not(:first-child), tbody tr:not(:first-child), tr:not(:first-child)');
        
        console.log(`📋 Encontradas ${dataRows.length} filas de datos`);
        
        for (const row of dataRows) {
          const cells = row.querySelectorAll('div[role="gridcell"], td, th');
          
          if (cells.length >= 5) { // IP, Port, Anonymity, Country, Speed
            const ipCell = cells[0]?.textContent?.trim() || '';
            const portCell = cells[1]?.textContent?.trim() || '';
            const anonymityCell = cells[2]?.textContent?.trim() || '';
            const countryCell = cells[3]?.textContent?.trim() || '';
            const speedCell = cells[4]?.textContent?.trim() || '';
            
            // Validar IP
            const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            const portPattern = /^\d+$/;
            
            if (ipPattern.test(ipCell) && portPattern.test(portCell)) {
              const port = parseInt(portCell, 10);
              
              if (port > 0 && port <= 65535) {
                const proxy: any = {
                  ip: ipCell,
                  port: port
                };

                // Extraer país
                if (countryCell && countryCell.length > 0 && !countryCell.includes('ms')) {
                  proxy.country = countryCell;
                }

                // Extraer nivel de anonimato
                if (anonymityCell) {
                  const anon = anonymityCell.toLowerCase();
                  if (anon.includes('elite')) {
                    proxy.anonymity = 'elite';
                  } else if (anon.includes('anonymous')) {
                    proxy.anonymity = 'anonymous';
                  } else if (anon.includes('transparent')) {
                    proxy.anonymity = 'transparent';
                  }
                }

                // Extraer velocidad
                if (speedCell) {
                  const speedMatch = speedCell.match(/(\d+)\s*ms/);
                  if (speedMatch) {
                    proxy.speed = parseInt(speedMatch[1], 10);
                  }
                }

                results.push(proxy);
                console.log(`✅ Proxy extraído: ${proxy.ip}:${proxy.port} (${proxy.country || 'N/A'})`);
              }
            }
          }
        }
      }

      // **FALLBACK: Buscar en cualquier tabla si no encontramos la estructura específica**
      if (results.length === 0) {
        console.log('🔄 Usando estrategia de fallback - buscando en todas las tablas...');
        
        const allTables = document.querySelectorAll('table');
        
        for (const table of allTables) {
          const rows = table.querySelectorAll('tr');
          
          for (const row of rows) {
            const cells = row.querySelectorAll('td, th');
            
            if (cells.length >= 2) {
              const firstCell = cells[0]?.textContent?.trim() || '';
              const secondCell = cells[1]?.textContent?.trim() || '';
              
              // IP y puerto en celdas separadas
              const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
              const portPattern = /^\d+$/;
              
              if (ipPattern.test(firstCell) && portPattern.test(secondCell)) {
                const port = parseInt(secondCell, 10);
                
                if (port > 0 && port <= 65535) {
                  const proxy: any = {
                    ip: firstCell,
                    port: port
                  };

                  // Extraer metadatos adicionales si están disponibles
                  if (cells.length > 2) {
                    const thirdCell = cells[2]?.textContent?.trim();
                    if (thirdCell && thirdCell.length > 0) {
                      if (thirdCell.toLowerCase().includes('elite') || 
                          thirdCell.toLowerCase().includes('anonymous') || 
                          thirdCell.toLowerCase().includes('transparent')) {
                        proxy.anonymity = thirdCell.toLowerCase();
                      } else if (thirdCell.length <= 20 && !thirdCell.includes('ms')) {
                        proxy.country = thirdCell;
                      }
                    }
                  }

                  if (cells.length > 3) {
                    const fourthCell = cells[3]?.textContent?.trim();
                    if (fourthCell && fourthCell.length <= 20 && !fourthCell.includes('ms')) {
                      proxy.country = fourthCell;
                    }
                  }

                  results.push(proxy);
                }
              }
            }
          }
        }
      }

      console.log(`📊 Total de proxies extraídos: ${results.length}`);
      return results;
    });

    // Convertir a formato ProxyData con validaciones y deduplicación
    const formattedProxies: ProxyData[] = proxies
      .filter((proxy, index, array) => 
        // Eliminar duplicados
        array.findIndex(p => p.ip === proxy.ip && p.port === proxy.port) === index
      )
      .map(proxy => ({
        ...proxy,
        protocol: 'https' as const,
        source: this.targetUrl,
        anonymity: proxy.anonymity as 'transparent' | 'anonymous' | 'elite' | undefined
      }));

    console.log(`✅ Extracción optimizada completada: ${formattedProxies.length} proxies únicos validados`);
    return formattedProxies;
  }

  /**
   * Inicializar navegador con configuración anti-detección
   */
  private async initializeBrowser(): Promise<void> {
    console.log('🔧 Inicializando navegador con configuración optimizada...');

    // Configuración mínima para máxima compatibilidad  
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--no-first-run',
      '--disable-default-apps'
    ];

    console.log('🚀 Lanzando navegador Chromium...');
    
    try {
      this.browser = await chromium.launch({
        headless: true, // Cambiar a headless para mejor compatibilidad
        args: browserArgs,
        timeout: 300000, // 5 minutos timeout ampliado
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
        executablePath: undefined, // Usar path por defecto
        slowMo: 0 // Sin retrasos adicionales
      });
      
      console.log('✅ Navegador lanzado exitosamente');
    } catch (error) {
      console.error('❌ Error al lanzar navegador:', error);
      throw new Error(`Error inicializando navegador: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    console.log('🔧 Creando contexto del navegador...');
    
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 }, // Tamaño más común
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      ignoreHTTPSErrors: true, // Ignorar errores SSL
      colorScheme: 'light'
    });
    
    console.log('✅ Contexto creado exitosamente');

    // Script anti-detección
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      (window as any).chrome = {
        runtime: {},
      };
    });

    console.log('📄 Creando nueva página...');
    
    this.page = await this.context.newPage();
    
    // Configurar timeouts seguros (sin valores negativos)
    this.page.setDefaultTimeout(90000); // 90 segundos para operaciones
    this.page.setDefaultNavigationTimeout(90000); // 90 segundos para navegación
    
    console.log('✅ Página creada exitosamente');
    console.log('✅ Navegador completamente inicializado y listo');
  }

  /**
   * Navegar con manejo de Cloudflare
   */
  private async navigateWithCloudflareHandling(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Página no disponible');
    }

    console.log(`🌐 Navegando a: ${url}`);

    // Delay inicial anti-detección
    await this.delay(2000);

    const response = await this.page.goto(url, {
      waitUntil: 'domcontentloaded', // Más rápido que networkidle
      timeout: 90000 // 90 segundos para navegación
    });

    console.log('📡 Response status:', response?.status());
    console.log('📡 Response headers:', response?.headers());

    if (!response) {
      throw new Error('No se recibió respuesta del servidor');
    }

    if (response.status() >= 400) {
      console.log('❌ Error HTTP:', {
        status: response.status(),
        statusText: response.statusText(),
        url: response.url()
      });
      throw new Error(`HTTP Error: ${response.status()} - ${response.statusText()}`);
    }

    // Detectar y manejar Cloudflare
    const isCloudflare = await this.detectCloudflare();
    
    if (isCloudflare) {
      console.log('🛡️ Cloudflare detectado, esperando challenge...');
      await this.handleCloudflareChallenge();
    }

    // Esperar carga completa
    await this.delay(3000);

    console.log(`✅ Navegación completada. Status: ${response.status()}`);
  }

  /**
   * Detectar presencia de Cloudflare
   */
  private async detectCloudflare(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const cloudflareIndicators = [
        'Just a moment...',
        'Checking your browser before accessing',
        'DDoS protection by Cloudflare',
        'Please wait...',
        'cf-browser-verification'
      ];

      const pageContent = await this.page.textContent('body') || '';
      const title = await this.page.title();

      return cloudflareIndicators.some(indicator => 
        pageContent.includes(indicator) || title.includes(indicator)
      );
    } catch {
      return false;
    }
  }

  /**
   * Manejar challenge de Cloudflare
   */
  private async handleCloudflareChallenge(): Promise<void> {
    if (!this.page) return;

    try {
             // Esperar a que el challenge se complete automáticamente
      await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });
      
      // Verificar si seguimos en el challenge
      const stillInChallenge = await this.detectCloudflare();
      
      if (stillInChallenge) {
        console.log('⏳ Challenge aún activo, esperando más tiempo...');
        await this.delay(10000);
      } else {
        console.log('✅ Challenge de Cloudflare completado');
      }
    } catch (error) {
      console.log('⚠️ Timeout en challenge de Cloudflare, continuando...');
    }
  }

  /**
   * Extraer datos de proxy de la tabla
   */
  private async extractProxyDataFromTable(): Promise<ProxyData[]> {
    if (!this.page) {
      throw new Error('Página no disponible');
    }

    console.log('📊 Extrayendo datos de la tabla...');

    const proxies = await this.page.evaluate(() => {
      const results: Array<{
        ip: string;
        port: number;
        country?: string;
        anonymity?: string;
      }> = [];

      // Buscar todas las tablas
      const tables = document.querySelectorAll('table, .proxy-table');
      
      for (const table of tables) {
        const rows = table.querySelectorAll('tr, tbody tr');
        
        for (const row of rows) {
          const cells = row.querySelectorAll('td, th');
          
          if (cells.length >= 2) {
            const firstCell = cells[0]?.textContent?.trim() || '';
            const secondCell = cells[1]?.textContent?.trim() || '';
            
            // Verificar formato IP:Puerto
            const ipPortPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/;
            const ipPortMatch = firstCell.match(ipPortPattern);
            
            if (ipPortMatch) {
              const [, ip, portStr] = ipPortMatch;
              const port = parseInt(portStr, 10);
              
              if (port > 0 && port <= 65535) {
                const proxy: any = { ip, port };

                // Extraer país si disponible
                if (cells.length > 2) {
                  const countryCell = cells[2]?.textContent?.trim();
                  if (countryCell && countryCell.length > 0) {
                    proxy.country = countryCell;
                  }
                }

                // Extraer anonimato si disponible
                if (cells.length > 3) {
                  const anonymityCell = cells[3]?.textContent?.trim()?.toLowerCase();
                  if (anonymityCell) {
                    if (anonymityCell.includes('elite') || anonymityCell.includes('high')) {
                      proxy.anonymity = 'elite';
                    } else if (anonymityCell.includes('anonymous')) {
                      proxy.anonymity = 'anonymous';
                    } else if (anonymityCell.includes('transparent')) {
                      proxy.anonymity = 'transparent';
                    }
                  }
                }

                results.push(proxy);
              }
            } else {
              // IP y puerto en celdas separadas
              const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
              const portPattern = /^\d+$/;
              
              if (ipPattern.test(firstCell) && portPattern.test(secondCell)) {
                const port = parseInt(secondCell, 10);
                
                if (port > 0 && port <= 65535) {
                  const proxy: any = {
                    ip: firstCell,
                    port
                  };

                  // Extraer metadatos adicionales
                  if (cells.length > 2) {
                    const countryCell = cells[2]?.textContent?.trim();
                    if (countryCell) proxy.country = countryCell;
                  }

                  results.push(proxy);
                }
              }
            }
          }
        }
      }

      return results;
    });

    // Convertir a formato ProxyData
    const formattedProxies: ProxyData[] = proxies.map(proxy => ({
      ...proxy,
      protocol: 'https' as const, // Este scraper es específico para HTTPS
      source: this.targetUrl,
      anonymity: proxy.anonymity as 'transparent' | 'anonymous' | 'elite' | undefined
    }));

    console.log(`✅ Extraídos ${formattedProxies.length} proxies`);
    return formattedProxies;
  }

  /**
   * Validar proxy básico
   */
  private isValidProxy(ip: string, port: number): boolean {
    const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipPattern);
    
    if (!match) return false;
    
    return match.slice(1).every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    }) && port > 0 && port <= 65535;
  }

  /**
   * Delay helper
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpiar recursos
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } catch (error) {
      console.error('Error en cleanup:', error);
    }
  }

  /**
   * Método optimizado de scraping con retry inteligente
   */
  async scrapeProxies(): Promise<ScrapingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let proxies: ProxyData[] = [];
    let retryCount = 0;
    const maxRetries = 2;

    console.log(`🚀 Iniciando scraping optimizado de ${this.siteName}`);

    while (retryCount <= maxRetries && proxies.length === 0) {
      try {
        if (retryCount > 0) {
          console.log(`🔄 Reintento ${retryCount}/${maxRetries}...`);
          await this.delay(3000); // Pausa entre reintentos
        }

        // Inicializar navegador con timeout progresivo
        console.log('🔧 Inicializando navegador...');
        await this.initializeBrowserWithProgressiveTimeout();
        console.log('✅ Navegador inicializado');

        // Navegar al sitio con manejo robusto
        console.log('🌐 Navegando al sitio...');
        await this.navigateWithOptimizedHandling(this.targetUrl);
        console.log('✅ Navegación completada');

        if (!this.page) {
          throw new Error('Página no disponible después de navegación');
        }

        // Esperar contenido con estrategia inteligente
        console.log('⏳ Esperando contenido de proxies...');
        await this.waitForContentWithFallbacks();
        console.log('✅ Contenido localizado');

        // Extraer datos con validación mejorada
        console.log('📊 Extrayendo datos...');
        const extractedProxies = await this.extractProxyDataWithOptimization();
        
        // Validar proxies con filtros estrictos
        proxies = extractedProxies.filter(proxy => 
          this.isValidProxy(proxy.ip, proxy.port)
        );

        console.log(`✅ Extracción completada: ${proxies.length}/${extractedProxies.length} proxies válidos`);

        // Si tenemos resultados, salir del bucle
        if (proxies.length > 0) {
          console.log(`🎯 Scraping exitoso con ${proxies.length} proxies encontrados`);
          break;
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : 'No stack trace';
        
        console.error(`❌ Error en intento ${retryCount + 1}:`, {
          message: errorMessage,
          type: error?.constructor?.name || 'Unknown'
        });
        
        errors.push(`Intento ${retryCount + 1}: ${errorMessage}`);
        
        // Limpiar recursos antes del siguiente intento
        await this.cleanup();
        
        retryCount++;
        
        // Si es el último intento, no hacer más reintentos
        if (retryCount > maxRetries) {
          console.error(`❌ Todos los reintentos fallaron. Errores: ${errors.length}`);
        }
      }
    }

    // Cleanup final
    await this.cleanup();

    const executionTime = Date.now() - startTime;

    const result: ScrapingResult = {
      success: proxies.length > 0,
      proxies,
      totalFound: proxies.length,
      errors,
      timestamp: new Date(),
      executionTime,
      source: {
        name: this.siteName,
        url: this.targetUrl,
        scrapedAt: new Date()
      }
    };

    console.log(`🎯 Scraping finalizado:`, {
      proxiesFound: proxies.length,
      executionTime: `${(executionTime / 1000).toFixed(1)}s`,
      errors: errors.length,
      retries: retryCount,
      success: result.success
    });

    return result;
  }
}

// Exportar servicio
export const scrapingService = new ScrapingService(); 