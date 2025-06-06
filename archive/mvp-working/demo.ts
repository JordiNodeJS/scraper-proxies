// Demo funcional sin errores TypeScript
import { SimpleScraper } from './src/simple-scraper.ts';

console.log('🎉 Iniciando demo del scraper funcional...\n');

SimpleScraper.scrapeAll()
  .then(proxies => {
    console.log(`\n✅ ¡Demo completado! Obtenidos ${proxies.length} proxies únicos`);
  })
  .catch(error => {
    console.error('❌ Error en demo:', error);
  }); 