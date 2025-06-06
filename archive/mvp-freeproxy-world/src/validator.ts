import { chromium, Browser, BrowserContext } from '@playwright/test';
import { ProxyData, ValidationResult, TestSite, ValidationSummary } from './types.js';
import { writeFileSync } from 'fs';

export class ProxyValidator {
  private browser: Browser | null = null;

  // Lista de sitios para probar los proxies
  private readonly testSites: TestSite[] = [
    {
      name: 'HTTPBin IP Check',
      url: 'https://httpbin.org/ip',
      expectedContent: '"origin"',
      timeout: 15000
    },
    {
      name: 'Google',
      url: 'https://www.google.com',
      expectedContent: 'Google',
      timeout: 20000
    },
    {
      name: 'Amazon',
      url: 'https://amazon.com',
      expectedContent: 'Amazon',
      timeout: 20000
    },
    {
      name: 'GitHub',
      url: 'https://github.com',
      expectedContent: 'GitHub',
      timeout: 15000
    },
    {
      name: 'StackOverflow',
      url: 'https://stackoverflow.com',
      expectedContent: 'Stack Overflow',
      timeout: 15000
    }
  ];

  async initialize(): Promise<void> {
    console.log('🚀 Inicializando browser para validación...');
    
    this.browser = await chromium.launch({
      headless: true, // Usar headless para validación más rápida
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  }

  async validateProxies(proxies: ProxyData[], maxProxiesToTest: number = 20): Promise<ValidationSummary> {
    if (!this.browser) {
      throw new Error('Browser no inicializado. Llama a initialize() primero.');
    }

    console.log(`🧪 Validando ${Math.min(proxies.length, maxProxiesToTest)} proxies...`);
    
    const proxiesToTest = proxies.slice(0, maxProxiesToTest);
    const working: ValidationResult[] = [];
    const notWorking: ValidationResult[] = [];

    for (let i = 0; i < proxiesToTest.length; i++) {
      const proxy = proxiesToTest[i];
      console.log(`\n🔍 Probando proxy ${i + 1}/${proxiesToTest.length}: ${proxy.ip}:${proxy.port}`);

      const result = await this.testSingleProxy(proxy);
      
      if (result.isWorking) {
        working.push(result);
        console.log(`✅ FUNCIONA - ${result.testedSite} (${result.responseTime}ms)`);
      } else {
        notWorking.push(result);
        console.log(`❌ FALLA - ${result.error}`);
      }

      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const summary: ValidationSummary = {
      totalTested: proxiesToTest.length,
      working,
      notWorking,
      successRate: working.length / proxiesToTest.length * 100,
      averageResponseTime: working.length > 0 
        ? working.reduce((sum, r) => sum + (r.responseTime || 0), 0) / working.length 
        : undefined
    };

    this.saveValidationResults(summary);
    this.printValidationSummary(summary);

    return summary;
  }

  private async testSingleProxy(proxy: ProxyData): Promise<ValidationResult> {
    const startTime = Date.now();
    
    // Probar con el primer sitio (HTTPBin es más rápido)
    const testSite = this.testSites[0];
    
    try {
      // Crear contexto con proxy
      const context = await this.browser!.newContext({
        proxy: {
          server: `http://${proxy.ip}:${proxy.port}`
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ignoreHTTPSErrors: true
      });

      const page = await context.newPage();
      
      // Configurar timeout más corto
      page.setDefaultTimeout(testSite.timeout || 15000);
      
      // Intentar navegar al sitio
      const response = await page.goto(testSite.url, {
        waitUntil: 'domcontentloaded',
        timeout: testSite.timeout
      });

      if (response && response.ok()) {
        const content = await page.content();
        const responseTime = Date.now() - startTime;
        
        // Verificar que el contenido esperado esté presente
        if (content.includes(testSite.expectedContent!)) {
          await context.close();
          
          return {
            proxy,
            isWorking: true,
            responseTime,
            testedSite: testSite.name,
            timestamp: new Date()
          };
        }
      }

      await context.close();
      
      return {
        proxy,
        isWorking: false,
        testedSite: testSite.name,
        error: 'Contenido inesperado o respuesta inválida',
        timestamp: new Date()
      };

    } catch (error) {
      return {
        proxy,
        isWorking: false,
        testedSite: testSite.name,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  private saveValidationResults(summary: ValidationSummary): void {
    const timestamp = Date.now();
    
    // Guardar resumen completo
    const summaryPath = `validation-summary-${timestamp}.json`;
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Guardar solo proxies que funcionan
    if (summary.working.length > 0) {
      const workingProxies = summary.working.map(r => `${r.proxy.ip}:${r.proxy.port}`).join('\n');
      const workingPath = `working-proxies-${timestamp}.txt`;
      writeFileSync(workingPath, workingProxies);
      console.log(`\n💾 Proxies funcionando guardados en: ${workingPath}`);
    }
    
    console.log(`💾 Resumen completo guardado en: ${summaryPath}`);
  }

  private printValidationSummary(summary: ValidationSummary): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE VALIDACIÓN');
    console.log('='.repeat(60));
    console.log(`📋 Total probados: ${summary.totalTested}`);
    console.log(`✅ Funcionando: ${summary.working.length}`);
    console.log(`❌ No funcionan: ${summary.notWorking.length}`);
    console.log(`📈 Tasa de éxito: ${summary.successRate.toFixed(1)}%`);
    
    if (summary.averageResponseTime) {
      console.log(`⚡ Tiempo promedio: ${summary.averageResponseTime.toFixed(0)}ms`);
    }
    
    if (summary.working.length > 0) {
      console.log('\n🎯 PROXIES QUE FUNCIONAN:');
      summary.working.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.proxy.ip}:${result.proxy.port} - ${result.responseTime}ms`);
      });
    }
    
    console.log('='.repeat(60));
  }

  async validateWithMultipleSites(proxy: ProxyData): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    console.log(`🔍 Probando ${proxy.ip}:${proxy.port} con múltiples sitios...`);
    
    for (const site of this.testSites) {
      const startTime = Date.now();
      
      try {
        const context = await this.browser!.newContext({
          proxy: {
            server: `http://${proxy.ip}:${proxy.port}`
          },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ignoreHTTPSErrors: true
        });

        const page = await context.newPage();
                 page.setDefaultTimeout(site.timeout || 15000);
        
        const response = await page.goto(site.url, {
          waitUntil: 'domcontentloaded',
          timeout: site.timeout
        });

        const responseTime = Date.now() - startTime;
        let isWorking = false;
        let error: string | undefined;

        if (response && response.ok()) {
          if (site.expectedContent) {
            const content = await page.content();
            isWorking = content.includes(site.expectedContent);
            if (!isWorking) {
              error = 'Contenido esperado no encontrado';
            }
          } else {
            isWorking = true;
          }
        } else {
          error = `HTTP ${response?.status()} - ${response?.statusText()}`;
        }

        await context.close();

        results.push({
          proxy,
          isWorking,
          responseTime: isWorking ? responseTime : undefined,
          testedSite: site.name,
          error,
          timestamp: new Date()
        });

        console.log(`   ${site.name}: ${isWorking ? '✅' : '❌'} ${isWorking ? responseTime + 'ms' : error}`);

      } catch (error) {
        results.push({
          proxy,
          isWorking: false,
          testedSite: site.name,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });

        console.log(`   ${site.name}: ❌ ${error}`);
      }

      // Pausa entre tests del mismo proxy
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser de validación cerrado');
    }
  }
} 