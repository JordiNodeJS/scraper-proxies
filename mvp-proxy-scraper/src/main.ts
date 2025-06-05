#!/usr/bin/env bun

import { ProxyListDownloadScraper } from './scrapers/ProxyListDownloadScraper.js';
import { ProxyListHTTPScraper } from './scrapers/ProxyListHTTPScraper.js';
import { exportToJSON, exportToCSV } from './utils/DataExporter.js';
import type { ProxyData, ScrapingResult } from './types/proxy.types.js';
import chalk from 'chalk';

/**
 * MVP Proxy Scraper - Extrae proxies de sitios especializados
 * Fase 1: Extracción de listas de proxies
 */

async function displayHeader(): Promise<void> {
  console.log(chalk.blue('🔗 MVP PROXY SCRAPER - FASE 1'));
  console.log(chalk.blue('========================================'));
  console.log(chalk.gray('Extrayendo proxies de sitios especializados\n'));
}

async function scrapeBothSites(): Promise<void> {
  await displayHeader();
  
  console.log('🎯 Iniciando extracción de AMBOS sitios de proxies...\n');

  // Configurar scrapers
  const httpsScraperConfig = {
    headless: false,
    timeout: 30000,
    maxRetries: 3,
    delayBetweenRequests: 2000,
    logLevel: 'info' as const
  };

  const httpScraperConfig = {
    headless: false,
    timeout: 30000,
    maxRetries: 3,
    delayBetweenRequests: 2000,
    logLevel: 'info' as const
  };

  const httpsProxyScraper = new ProxyListDownloadScraper(httpsScraperConfig);
  const httpProxyScraper = new ProxyListHTTPScraper(httpScraperConfig);

  let allProxies: ProxyData[] = [];
  let allResults: ScrapingResult[] = [];

  try {
    console.log('1️⃣ Extrayendo de Proxy List Download HTTPS...');
    console.log('━'.repeat(50));
    
    const httpsResult = await httpsProxyScraper.run();
    allResults.push(httpsResult);
    
    if (httpsResult.success) {
      allProxies.push(...httpsResult.proxies);
      console.log(`✅ HTTPS: ${httpsResult.proxies.length} proxies extraídos en ${httpsResult.executionTime}ms`);
    } else {
      console.log(`❌ HTTPS falló: ${httpsResult.errors.join(', ')}`);
    }

    console.log('\n2️⃣ Extrayendo de Proxy List Download HTTP...');
    console.log('━'.repeat(50));
    
    const httpResult = await httpProxyScraper.run();
    allResults.push(httpResult);
    
    if (httpResult.success) {
      allProxies.push(...httpResult.proxies);
      console.log(`✅ HTTP: ${httpResult.proxies.length} proxies extraídos en ${httpResult.executionTime}ms`);
    } else {
      console.log(`❌ HTTP falló: ${httpResult.errors.join(', ')}`);
    }

  } catch (error) {
    console.error(chalk.red('💥 Error durante la extracción:'), error);
    return;
  }

  // Resultados combinados
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTADOS COMBINADOS');
  console.log('═'.repeat(60));

  console.log(`🔗 Total de proxies extraídos: ${allProxies.length}`);

  // Estadísticas por protocolo
  const httpProxies = allProxies.filter(p => p.protocol === 'http');
  const httpsProxies = allProxies.filter(p => p.protocol === 'https');
  
  console.log(`📈 Proxies HTTP: ${httpProxies.length}`);
  console.log(`🔒 Proxies HTTPS: ${httpsProxies.length}`);

  // Estadísticas por anonimato
  const eliteProxies = allProxies.filter(p => p.anonymity === 'elite');
  const anonymousProxies = allProxies.filter(p => p.anonymity === 'anonymous');
  const transparentProxies = allProxies.filter(p => p.anonymity === 'transparent');
  
  console.log(`⭐ Elite: ${eliteProxies.length}`);
  console.log(`👤 Anonymous: ${anonymousProxies.length}`);
  console.log(`👁️  Transparent: ${transparentProxies.length}`);

  // Estadísticas por país (top 5)
  const countryStats = allProxies
    .filter(p => p.country)
    .reduce((acc, proxy) => {
      acc[proxy.country!] = (acc[proxy.country!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topCountries = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (topCountries.length > 0) {
    console.log('\n🌍 Top 5 países:');
    topCountries.forEach(([country, count], index) => {
      console.log(`${index + 1}. ${country}: ${count} proxies`);
    });
  }

  // Exportar datos
  if (allProxies.length > 0) {
    console.log('\n📁 Exportando datos...');
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    const combinedResult: ScrapingResult = {
      success: true,
      proxies: allProxies,
      totalFound: allProxies.length,
      errors: allResults.flatMap(r => r.errors),
      timestamp: new Date(),
      executionTime: allResults.reduce((total, r) => total + r.executionTime, 0),
      source: {
        name: 'Combined Proxy Sources',
        url: 'Multiple sources',
        scrapedAt: new Date()
      }
    };

    await exportToJSON(
      combinedResult, 
      `data/combined-proxies-${timestamp}.json`
    );
    
    await exportToCSV(
      allProxies, 
      `data/combined-proxies-${timestamp}.csv`
    );

    console.log(`📄 JSON: data/combined-proxies-${timestamp}.json`);
    console.log(`📊 CSV: data/combined-proxies-${timestamp}.csv`);
  }

  console.log('\n🎯 EXTRACCIÓN COMPLETA - FASE 1 FINALIZADA');
  console.log('Proxies listos para testing en sitios reales (Amazon, redes sociales)');
}

async function scrapeHTTPSOnly(): Promise<void> {
  await displayHeader();
  
  console.log('🔒 Modo: Solo extracción HTTPS...\n');

  const config = {
    headless: false,
    timeout: 30000,
    maxRetries: 3,
    delayBetweenRequests: 2000,
    logLevel: 'info' as const
  };

  const proxyScraper = new ProxyListDownloadScraper(config);

  try {
    console.log('🚀 Iniciando extracción de Proxy List Download HTTPS...');
    console.log('━'.repeat(50));
    
    const result = await proxyScraper.run();
    
    if (result.success) {
      console.log(`\n✅ Extracción exitosa:`);
      console.log(`📊 ${result.proxies.length} proxies encontrados`);
      console.log(`⏱️  Tiempo: ${result.executionTime}ms`);
      console.log(`🌐 Fuente: ${result.source.name}`);
      
      // Mostrar algunos ejemplos
      const sampleProxies = result.proxies.slice(0, 5);
      console.log(`\n📋 Primeros ${sampleProxies.length} proxies:`);
      sampleProxies.forEach((proxy, index) => {
        const anonBadge = proxy.anonymity === 'elite' ? '⭐' : 
                         proxy.anonymity === 'anonymous' ? '👤' : '👁️';
        console.log(`${index + 1}. ${proxy.ip}:${proxy.port} ${anonBadge} ${proxy.anonymity || 'N/A'}`);
      });

      // Exportar datos
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      await exportToJSON(result, `data/https-proxies-${timestamp}.json`);
      await exportToCSV(result.proxies, `data/https-proxies-${timestamp}.csv`);
      
      console.log(`\n📁 Archivos generados:`);
      console.log(`📄 JSON: data/https-proxies-${timestamp}.json`);
      console.log(`📊 CSV: data/https-proxies-${timestamp}.csv`);
      
    } else {
      console.log(`\n❌ Error en la extracción:`);
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error(chalk.red('💥 Error ejecutando el scraper:'), error);
  }
}

async function scrapeHTTPOnly(): Promise<void> {
  await displayHeader();
  
  console.log('🌐 Modo: Solo extracción HTTP...\n');

  const config = {
    headless: false,
    timeout: 30000,
    maxRetries: 3,
    delayBetweenRequests: 2000,
    logLevel: 'info' as const
  };

  const proxyScraper = new ProxyListHTTPScraper(config);

  try {
    console.log('🚀 Iniciando extracción de Proxy List Download HTTP...');
    console.log('━'.repeat(50));
    
    const result = await proxyScraper.run();
    
    if (result.success) {
      console.log(`\n✅ Extracción exitosa:`);
      console.log(`📊 ${result.proxies.length} proxies encontrados`);
      console.log(`⏱️  Tiempo: ${result.executionTime}ms`);
      console.log(`🌐 Fuente: ${result.source.name}`);
      
      // Mostrar algunos ejemplos
      const sampleProxies = result.proxies.slice(0, 5);
      console.log(`\n📋 Primeros ${sampleProxies.length} proxies:`);
      sampleProxies.forEach((proxy, index) => {
        const anonBadge = proxy.anonymity === 'elite' ? '⭐' : 
                         proxy.anonymity === 'anonymous' ? '👤' : '👁️';
        const speed = proxy.speed ? `(${proxy.speed}ms)` : '';
        const country = proxy.country ? `[${proxy.country}]` : '';
        console.log(`${index + 1}. ${proxy.ip}:${proxy.port} ${anonBadge} ${proxy.anonymity || 'N/A'} ${country} ${speed}`);
      });

      // Exportar datos
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      await exportToJSON(result, `data/http-proxies-${timestamp}.json`);
      await exportToCSV(result.proxies, `data/http-proxies-${timestamp}.csv`);
      
      console.log(`\n📁 Archivos generados:`);
      console.log(`📄 JSON: data/http-proxies-${timestamp}.json`);
      console.log(`📊 CSV: data/http-proxies-${timestamp}.csv`);
      
    } else {
      console.log(`\n❌ Error en la extracción:`);
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error(chalk.red('💥 Error ejecutando el scraper:'), error);
  }
}

async function main(): Promise<void> {
  // Determinar modo según argumentos
  const args = process.argv.slice(2);
  
  if (args.includes('--both') || args.includes('--all')) {
    await scrapeBothSites();
  } else if (args.includes('--http')) {
    await scrapeHTTPOnly();
  } else if (args.includes('--https')) {
    await scrapeHTTPSOnly();
  } else {
    // Modo por defecto: extracción combinada
    await scrapeBothSites();
  }
}

// Ejecutar programa principal
main().catch(error => {
  console.error(chalk.red('💥 Error fatal:'), error);
  process.exit(1);
}); 