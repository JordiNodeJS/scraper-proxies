#!/usr/bin/env node

import { FreeproxyWorldScraper } from './scraper.js';
import { ProxyValidator } from './validator.js';

async function main() {
  console.log('🌟 MVP FREEPROXY.WORLD - SCRAPER Y VALIDADOR');
  console.log('================================================\n');

  const scraper = new FreeproxyWorldScraper();
  const validator = new ProxyValidator();

  try {
    // === FASE 1: SCRAPING ===
    console.log('🕷️ FASE 1: SCRAPING DE PROXIES');
    console.log('━'.repeat(40));
    
    await scraper.initialize();
    const scrapingResult = await scraper.scrapeProxies(3); // Scrapear 3 páginas
    
    if (!scrapingResult.success) {
      console.error('❌ Error en scraping, terminando...');
      return;
    }

    console.log(`\n✅ Scraping completado: ${scrapingResult.totalFound} proxies encontrados`);

    // === FASE 2: VALIDACIÓN ===
    console.log('\n🧪 FASE 2: VALIDACIÓN DE PROXIES');
    console.log('━'.repeat(40));
    
    await validator.initialize();
    const validationResult = await validator.validateProxies(scrapingResult.proxies, 15);

    // === RESUMEN FINAL ===
    console.log('\n🎯 RESUMEN FINAL');
    console.log('━'.repeat(40));
    console.log(`📊 Total scrapeados: ${scrapingResult.totalFound}`);
    console.log(`🧪 Total probados: ${validationResult.totalTested}`);
    console.log(`✅ Funcionando: ${validationResult.working.length}`);
    console.log(`📈 Tasa de éxito: ${validationResult.successRate.toFixed(1)}%`);
    
    if (validationResult.working.length > 0) {
      console.log('\n🚀 Proxies listos para usar:');
      validationResult.working.slice(0, 5).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.proxy.ip}:${result.proxy.port} (${result.responseTime}ms)`);
      });
      
      if (validationResult.working.length > 5) {
        console.log(`   ... y ${validationResult.working.length - 5} más`);
      }
    }

  } catch (error) {
    console.error('💥 Error durante la ejecución:', error);
  } finally {
    await scraper.close();
    await validator.close();
  }
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 