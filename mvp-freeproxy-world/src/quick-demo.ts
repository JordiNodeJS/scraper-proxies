#!/usr/bin/env node

import { FreeproxyWorldScraper } from './scraper.js';
import { ProxyValidator } from './validator.js';

async function quickDemo() {
  console.log('🚀 DEMO RÁPIDO FREEPROXY.WORLD');
  console.log('==============================\n');

  const scraper = new FreeproxyWorldScraper();
  const validator = new ProxyValidator();

  try {
    // FASE 1: Scrapear 2 páginas para obtener ~100 proxies
    console.log('🕷️ Scrapeando proxies...');
    await scraper.initialize();
    const scrapingResult = await scraper.scrapeProxies(2);
    
    console.log(`✅ Scrapeados: ${scrapingResult.totalFound} proxies`);
    
    if (scrapingResult.totalFound === 0) {
      console.log('❌ No se encontraron proxies');
      return;
    }

    // FASE 2: Validar solo los primeros 10 para demostración
    console.log('\n🧪 Validando proxies (muestra de 10)...');
    await validator.initialize();
    
    const sampleProxies = scrapingResult.proxies.slice(0, 10);
    const validationResult = await validator.validateProxies(sampleProxies, 10);

    // RESUMEN
    console.log('\n🎯 RESUMEN DEMO:');
    console.log(`📊 Total scrapeados: ${scrapingResult.totalFound}`);
    console.log(`🧪 Muestra validada: ${validationResult.totalTested}`);
    console.log(`✅ Funcionando: ${validationResult.working.length}`);
    console.log(`📈 Tasa de éxito: ${validationResult.successRate.toFixed(1)}%`);
    
    if (validationResult.working.length > 0) {
      console.log('\n🚀 PROXIES FUNCIONANDO:');
      validationResult.working.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.proxy.ip}:${result.proxy.port} - ${result.responseTime}ms`);
      });
    } else {
      console.log('\n⚠️ Ningún proxy funcionó en la muestra.');
      console.log('   Esto es normal con proxies gratuitos.');
      console.log('   El scraper funciona correctamente.');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await scraper.close();
    await validator.close();
  }
}

quickDemo().catch(console.error); 