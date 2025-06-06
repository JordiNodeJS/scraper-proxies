import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'fs';
import type { ProxyData, ProxySource, ScrapingResult, ScrapingSession } from './types.ts';
import { ProxyParsers } from './parsers.ts';
import { PROXY_SOURCES } from './proxy-sources.ts';

export class ProxyScraper {
  private session: ScrapingSession;
  private results: ScrapingResult[] = [];

  constructor() {
    this.session = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      sources: [],
      totalProxies: 0,
      workingProxies: 0,
      status: 'running'
    };
  }

  async scrapeAllSources(): Promise<ScrapingSession> {
    console.log(chalk.blue.bold('🚀 INICIANDO SCRAPING DE PROXIES FUNCIONALES'));
    console.log(chalk.blue('===============================================\n'));
    
    console.log(chalk.white(`📊 Fuentes configuradas: ${PROXY_SOURCES.length}`));
    console.log(chalk.white(`🕒 Sesión iniciada: ${this.session.startTime.toLocaleString()}\n`));

    // Procesar fuentes prioritarias primero (las tuyas)
    const prioritySources = PROXY_SOURCES.filter(s => s.name.includes('Proxy List Download'));
    const otherSources = PROXY_SOURCES.filter(s => !s.name.includes('Proxy List Download'));

    console.log(chalk.green('🎯 FUENTES PRIORITARIAS (proxy-list.download):'));
    for (const source of prioritySources) {
      await this.scrapeSource(source);
      await this.delay(source.rateLimit);
    }

    console.log(chalk.yellow('\n📋 FUENTES ADICIONALES:'));
    for (const source of otherSources) {
      await this.scrapeSource(source);
      await this.delay(source.rateLimit);
    }

    return this.finishSession();
  }

  private async scrapeSource(source: ProxySource): Promise<ScrapingResult> {
    const spinner = ora({
      text: `Obteniendo ${source.name}...`,
      color: 'cyan'
    }).start();

    const startTime = Date.now();
    let result: ScrapingResult;

    try {
      // Realizar la petición HTTP
      const response = await fetch(source.url, {
        method: 'GET',
        headers: {
          ...source.headers,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || '';
      
      // Obtener contenido
      let content: string;
      if (contentType.includes('application/json')) {
        content = await response.text(); // Para APIs JSON
      } else {
        content = await response.text(); // Para HTML
      }

      // Parsear según el tipo de fuente
      const proxies = this.parseContent(content, source);
      
      result = {
        source: source.name,
        success: true,
        proxies,
        responseTime,
        totalFound: proxies.length
      };

      spinner.succeed(chalk.green(
        `✅ ${source.name}: ${proxies.length} proxies encontrados (${responseTime}ms)`
      ));

      // Mostrar detalles si encontramos proxies
      if (proxies.length > 0) {
        const protocols = [...new Set(proxies.map(p => p.protocol))];
        const countries = [...new Set(proxies.map(p => p.country))].slice(0, 5);
        
        console.log(chalk.gray(`   📋 Protocolos: ${protocols.join(', ')}`));
        console.log(chalk.gray(`   🌍 Países: ${countries.join(', ')}${countries.length === 5 ? '...' : ''}`));
        
        // Mostrar algunos ejemplos
        const examples = proxies.slice(0, 3);
        examples.forEach(proxy => {
          console.log(chalk.gray(`   🔗 ${proxy.ip}:${proxy.port} (${proxy.protocol}, ${proxy.country})`));
        });
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      result = {
        source: source.name,
        success: false,
        proxies: [],
        error: errorMessage,
        responseTime,
        totalFound: 0
      };

      spinner.fail(chalk.red(`❌ ${source.name}: ${errorMessage} (${responseTime}ms)`));
    }

    this.results.push(result);
    this.session.sources.push(result);
    
    return result;
  }

  private parseContent(content: string, source: ProxySource): ProxyData[] {
    try {
      const parserMethod = ProxyParsers[source.parser as keyof typeof ProxyParsers] as any;
      
      if (!parserMethod) {
        console.warn(chalk.yellow(`⚠️  Parser '${source.parser}' no encontrado para ${source.name}`));
        return [];
      }

      return parserMethod(content, source.protocol, source.name);
      
    } catch (error) {
      console.error(chalk.red(`❌ Error parseando ${source.name}:`), error);
      return [];
    }
  }

  private finishSession(): ScrapingSession {
    this.session.endTime = new Date();
    this.session.status = 'completed';
    
    // Calcular estadísticas finales
    const allProxies = this.results.flatMap(r => r.proxies);
    const uniqueProxies = this.deduplicateProxies(allProxies);
    
    this.session.totalProxies = uniqueProxies.length;
    
    // Mostrar resumen final
    console.log(chalk.magenta.bold('\n🏆 RESUMEN FINAL DE SCRAPING'));
    console.log(chalk.magenta('=============================='));
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(chalk.white(`📊 Fuentes procesadas: ${this.results.length}`));
    console.log(chalk.green(`✅ Exitosas: ${successful.length}`));
    console.log(chalk.red(`❌ Fallidas: ${failed.length}`));
    console.log(chalk.blue(`🔗 Total proxies únicos: ${uniqueProxies.length}`));
    
    // Estadísticas por protocolo
    const byProtocol = this.groupBy(uniqueProxies, 'protocol');
    console.log(chalk.white('\n📋 Por protocolo:'));
    Object.entries(byProtocol).forEach(([protocol, proxies]) => {
      console.log(chalk.gray(`   ${protocol}: ${proxies.length} proxies`));
    });
    
    // Estadísticas por país (top 10)
    const byCountry = this.groupBy(uniqueProxies, 'country');
    const topCountries = Object.entries(byCountry)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10);
    
    console.log(chalk.white('\n🌍 Top países:'));
    topCountries.forEach(([country, proxies]) => {
      console.log(chalk.gray(`   ${country}: ${proxies.length} proxies`));
    });

    // Guardar resultados
    this.saveResults(uniqueProxies);
    
    return this.session;
  }

  private deduplicateProxies(proxies: ProxyData[]): ProxyData[] {
    const seen = new Set<string>();
    return proxies.filter(proxy => {
      const key = `${proxy.ip}:${proxy.port}:${proxy.protocol}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private saveResults(proxies: ProxyData[]): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Guardar como JSON
    const jsonData = {
      session: this.session,
      proxies: proxies,
      generatedAt: new Date().toISOString(),
      totalCount: proxies.length
    };
    
    writeFileSync(`results/proxies-${timestamp}.json`, JSON.stringify(jsonData, null, 2));
    
    // Guardar como lista simple para uso directo
    const simpleList = proxies.map(p => `${p.ip}:${p.port}`).join('\n');
    writeFileSync(`results/proxies-simple-${timestamp}.txt`, simpleList);
    
    // Guardar por protocolo
    const byProtocol = this.groupBy(proxies, 'protocol');
    Object.entries(byProtocol).forEach(([protocol, protocolProxies]) => {
      const list = protocolProxies.map(p => `${p.ip}:${p.port}`).join('\n');
      writeFileSync(`results/proxies-${protocol.toLowerCase()}-${timestamp}.txt`, list);
    });
    
    console.log(chalk.green(`\n💾 Resultados guardados en results/`));
    console.log(chalk.gray(`   📄 JSON completo: proxies-${timestamp}.json`));
    console.log(chalk.gray(`   📝 Lista simple: proxies-simple-${timestamp}.txt`));
    Object.keys(byProtocol).forEach(protocol => {
      console.log(chalk.gray(`   📝 ${protocol}: proxies-${protocol.toLowerCase()}-${timestamp}.txt`));
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para obtener estadísticas rápidas
  getQuickStats(): void {
    const allProxies = this.results.flatMap(r => r.proxies);
    const unique = this.deduplicateProxies(allProxies);
    
    console.log(chalk.blue('\n📊 ESTADÍSTICAS RÁPIDAS:'));
    console.log(chalk.white(`   Total fuentes: ${this.results.length}`));
    console.log(chalk.white(`   Proxies únicos: ${unique.length}`));
    console.log(chalk.white(`   Tiempo transcurrido: ${Date.now() - this.session.startTime.getTime()}ms`));
  }
} 