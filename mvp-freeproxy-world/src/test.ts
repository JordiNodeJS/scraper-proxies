#!/usr/bin/env node

import { FreeproxyWorldScraper } from './scraper.js';

async function testScraping() {
  console.log('🧪 TEST RÁPIDO - SCRAPING FREEPROXY.WORLD');
  console.log('==========================================\n');

  const scraper = new FreeproxyWorldScraper();

  try {
    await scraper.initialize();
    
    // Scrapear solo 1 página para test rápido
    console.log('📡 Scrapeando 1 página de prueba...');
    const result = await scraper.scrapeProxies(1);

    if (result.success) {
      console.log(`\n✅ ¡Éxito! Encontrados ${result.totalFound} proxies`);
      
      // Mostrar algunos ejemplos
      if (result.proxies.length > 0) {
        console.log('\n📋 Primeros 5 proxies:');
        result.proxies.slice(0, 5).forEach((proxy, index) => {
          console.log(`   ${index + 1}. ${proxy.ip}:${proxy.port} (${proxy.country}) - ${proxy.speed}ms`);
        });
      }
    } else {
      console.log('❌ Error en scraping:', result.error);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await scraper.close();
  }
}

testScraping().catch(console.error); 