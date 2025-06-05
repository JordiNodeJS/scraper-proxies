import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';

interface ProxyTest {
  proxy: string;
  isWorking: boolean;
  site: string;
  responseTime: number;
  error?: string;
  title?: string;
  statusCode?: number;
}

interface ValidationResult {
  totalTested: number;
  workingProxies: number;
  failedProxies: number;
  successRate: number;
  testResults: ProxyTest[];
  avgResponseTime: number;
}

export class ProxyValidator {
  
  private testSites = [
    { name: 'Google', url: 'https://www.google.com', expectedTitle: 'Google' },
    { name: 'Amazon', url: 'https://www.amazon.com', expectedTitle: 'Amazon' },
    { name: 'HTTPBin', url: 'https://httpbin.org/ip', expectedTitle: null } // Para verificar IP
  ];

  async validateProxies(proxyFile: string, maxProxies: number = 50): Promise<ValidationResult> {
    console.log('🧪 INICIANDO VALIDACIÓN DE PROXIES CON PLAYWRIGHT');
    console.log('===============================================\n');

    // Leer proxies del archivo
    const proxies = this.loadProxies(proxyFile);
    const testProxies = proxies.slice(0, maxProxies); // Limitar para prueba inicial
    
    console.log(`📋 Proxies a probar: ${testProxies.length} de ${proxies.length} totales`);
    console.log(`🎯 Sitios de prueba: ${this.testSites.length}\n`);

    const allResults: ProxyTest[] = [];
    let workingCount = 0;

    // Probar cada proxy
    for (let i = 0; i < testProxies.length; i++) {
      const proxy = testProxies[i];
      console.log(`🔍 [${i + 1}/${testProxies.length}] Probando proxy: ${proxy}`);
      
      const results = await this.testProxy(proxy);
      allResults.push(...results);
      
      // Contar proxies que funcionaron en al menos un sitio
      if (results.some(r => r.isWorking)) {
        workingCount++;
        console.log(`   ✅ FUNCIONA en ${results.filter(r => r.isWorking).length}/${results.length} sitios`);
      } else {
        console.log(`   ❌ No funciona en ningún sitio`);
      }

      // Rate limiting para no sobrecargar
      if (i < testProxies.length - 1) {
        await this.delay(1000);
      }
    }

    const result: ValidationResult = {
      totalTested: testProxies.length,
      workingProxies: workingCount,
      failedProxies: testProxies.length - workingCount,
      successRate: (workingCount / testProxies.length) * 100,
      testResults: allResults,
      avgResponseTime: this.calculateAvgResponseTime(allResults.filter(r => r.isWorking))
    };

    this.printSummary(result);
    this.saveValidationResults(result);

    return result;
  }

  private async testProxy(proxy: string): Promise<ProxyTest[]> {
    const results: ProxyTest[] = [];
    
    for (const site of this.testSites) {
      const result = await this.testProxyOnSite(proxy, site);
      results.push(result);
    }
    
    return results;
  }

  private async testProxyOnSite(proxy: string, site: any): Promise<ProxyTest> {
    const startTime = Date.now();
    
    try {
      const browser = await chromium.launch({
        headless: true,
        args: [
          `--proxy-server=http://${proxy}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
      });

      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      // Configurar timeout más corto para proxies lentos
      page.setDefaultTimeout(15000);

      const response = await page.goto(site.url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      const responseTime = Date.now() - startTime;
      const title = await page.title();
      const statusCode = response?.status() || 0;

      await browser.close();

      // Verificar si la respuesta es válida
      const isWorking = this.isValidResponse(statusCode, title, site);

      return {
        proxy,
        site: site.name,
        isWorking,
        responseTime,
        title,
        statusCode
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        proxy,
        site: site.name,
        isWorking: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  private isValidResponse(statusCode: number, title: string, site: any): boolean {
    // Verificar status code válido
    if (statusCode < 200 || statusCode >= 400) {
      return false;
    }

    // Para HTTPBin, cualquier respuesta 200 es buena
    if (site.name === 'HTTPBin') {
      return statusCode === 200;
    }

    // Para otros sitios, verificar título esperado
    if (site.expectedTitle) {
      return title.toLowerCase().includes(site.expectedTitle.toLowerCase());
    }

    return true;
  }

  private loadProxies(filename: string): string[] {
    try {
      const content = readFileSync(filename, 'utf-8');
      return content.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes(':'));
    } catch (error) {
      console.error('❌ Error leyendo archivo de proxies:', error);
      return [];
    }
  }

  private calculateAvgResponseTime(workingResults: ProxyTest[]): number {
    if (workingResults.length === 0) return 0;
    const sum = workingResults.reduce((acc, r) => acc + r.responseTime, 0);
    return Math.round(sum / workingResults.length);
  }

  private printSummary(result: ValidationResult): void {
    console.log('\n🏆 RESUMEN DE VALIDACIÓN');
    console.log('========================');
    console.log(`📊 Proxies probados: ${result.totalTested}`);
    console.log(`✅ Funcionando: ${result.workingProxies} (${result.successRate.toFixed(1)}%)`);
    console.log(`❌ Fallando: ${result.failedProxies}`);
    console.log(`⏱️  Tiempo promedio: ${result.avgResponseTime}ms`);
    
    // Estadísticas por sitio
    console.log('\n📈 Por sitio web:');
    for (const site of this.testSites) {
      const siteResults = result.testResults.filter(r => r.site === site.name);
      const workingSite = siteResults.filter(r => r.isWorking).length;
      const successRate = (workingSite / siteResults.length) * 100;
      console.log(`   ${site.name}: ${workingSite}/${siteResults.length} (${successRate.toFixed(1)}%)`);
    }

    // Top 10 proxies más rápidos
    const workingResults = result.testResults
      .filter(r => r.isWorking)
      .sort((a, b) => a.responseTime - b.responseTime)
      .slice(0, 10);

    if (workingResults.length > 0) {
      console.log('\n🚀 Top 10 proxies más rápidos:');
      workingResults.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.proxy} → ${r.site} (${r.responseTime}ms)`);
      });
    }
  }

  private saveValidationResults(result: ValidationResult): void {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    
    // Guardar resultados completos
    writeFileSync(
      `results/validation-${timestamp}.json`, 
      JSON.stringify(result, null, 2)
    );
    
    // Guardar solo proxies que funcionan
    const workingProxies = [...new Set(
      result.testResults
        .filter(r => r.isWorking)
        .map(r => r.proxy)
    )];
    
    writeFileSync(
      `results/working-proxies-${timestamp}.txt`,
      workingProxies.join('\n')
    );

    // Guardar proxies por sitio
    for (const site of this.testSites) {
      const siteProxies = [...new Set(
        result.testResults
          .filter(r => r.isWorking && r.site === site.name)
          .map(r => r.proxy)
      )];
      
      if (siteProxies.length > 0) {
        writeFileSync(
          `results/working-${site.name.toLowerCase()}-${timestamp}.txt`,
          siteProxies.join('\n')
        );
      }
    }

    console.log(`\n💾 Resultados guardados en results/`);
    console.log(`   📄 Completo: validation-${timestamp}.json`);
    console.log(`   📝 Solo funcionando: working-proxies-${timestamp}.txt`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para validación rápida de los mejores proxies
  async quickValidation(proxyFile: string): Promise<string[]> {
    console.log('⚡ VALIDACIÓN RÁPIDA - Solo HTTPBin');
    console.log('==================================\n');

    const proxies = this.loadProxies(proxyFile);
    const testProxies = proxies.slice(0, 20); // Solo primeros 20 para test rápido
    const workingProxies: string[] = [];

    for (let i = 0; i < testProxies.length; i++) {
      const proxy = testProxies[i];
      console.log(`🔍 [${i + 1}/${testProxies.length}] ${proxy}`);
      
      const result = await this.testProxyOnSite(proxy, { 
        name: 'HTTPBin', 
        url: 'https://httpbin.org/ip', 
        expectedTitle: null 
      });
      
      if (result.isWorking) {
        workingProxies.push(proxy);
        console.log(`   ✅ Funciona (${result.responseTime}ms)`);
      } else {
        console.log(`   ❌ No funciona (${result.error || 'timeout'})`);
      }
    }

    console.log(`\n🎯 Resultado rápido: ${workingProxies.length}/${testProxies.length} funcionando`);
    return workingProxies;
  }
} 