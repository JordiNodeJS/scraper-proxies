import { ProxyScraper } from './proxy-scraper.ts';
import { mkdirSync } from 'fs';

async function main() {
  // Crear directorio de resultados si no existe
  try {
    mkdirSync('results', { recursive: true });
  } catch (error) {
    // Directorio ya existe
  }

  console.log('🎉 Iniciando scraper de proxies funcional...\n');
  
  const scraper = new ProxyScraper();
  
  try {
    const session = await scraper.scrapeAllSources();
    
    console.log('\n✅ ¡Scraping completado exitosamente!');
    console.log(`🎯 Total de proxies únicos obtenidos: ${session.totalProxies}`);
    console.log(`⏱️  Tiempo total: ${session.endTime && session.startTime ? 
      (session.endTime.getTime() - session.startTime.getTime()) / 1000 : 0}s`);
    
  } catch (error) {
    console.error('❌ Error durante el scraping:', error);
    process.exit(1);
  }
}

main().catch(console.error); 