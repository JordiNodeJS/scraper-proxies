#!/usr/bin/env bun

import { WebsiteDetector } from './detector.js';
import { POPULAR_WEBSITES, USER_AGENTS, EXCELLENT_WEBSITES } from './websites.js';
import { 
  displaySummary, 
  displayDetailedResults, 
  exportToJSON, 
  exportToTXT,
  ensureScreenshotsDir
} from './utils.js';
import chalk from 'chalk';
import type { WebsiteTarget } from './types.js';

/**
 * MVP Website Detector - Detecta qué sitios web se pueden scrapear con Playwright
 */

async function main(): Promise<void> {
  console.log(chalk.blue('🎯 MVP WEBSITE DETECTOR'));
  console.log(chalk.blue('========================'));
  console.log(chalk.gray('Detectando qué sitios web populares se pueden scrapear con Playwright\n'));

  // Verificar si se quiere probar solo sitios excellent
  const testExcellentOnly = process.argv.includes('--excellent-only') || process.argv.includes('--test-excellent');
  
  let websitesToTest: WebsiteTarget[];
  let testDescription: string;
  
  if (testExcellentOnly) {
    // Seleccionar solo algunos sitios excellent para prueba rápida
    websitesToTest = EXCELLENT_WEBSITES.slice(0, 10); // Primeros 10 sitios excellent
    testDescription = 'SITIOS EXCELENTES SELECCIONADOS';
    console.log('🎯 Modo de prueba: Solo sitios con alta probabilidad de ser EXCELENTES');
    console.log(`📊 Analizando ${websitesToTest.length} sitios académicos, gubernamentales y open source...\n`);
  } else {
    // Modo demo: selección representativa de diferentes categorías
    const demoSites = [
      // 1 sitio de cada categoría problemática
      POPULAR_WEBSITES.find(site => site.name === 'Amazon')!,
      POPULAR_WEBSITES.find(site => site.name === 'Twitter/X')!,
      POPULAR_WEBSITES.find(site => site.name === 'Google')!,
      POPULAR_WEBSITES.find(site => site.name === 'YouTube')!,
      
      // 4 sitios excellent para comparar
      POPULAR_WEBSITES.find(site => site.name === 'Wikipedia')!,
      POPULAR_WEBSITES.find(site => site.name === 'GitHub')!,
      POPULAR_WEBSITES.find(site => site.name === 'MDN Web Docs')!,
      POPULAR_WEBSITES.find(site => site.name === 'ArXiv')!,
    ].filter(Boolean);
    
    websitesToTest = demoSites;
    testDescription = 'DEMO COMPARATIVO';
    console.log('🔬 Modo demo: Comparación entre sitios problemáticos vs sitios excelentes');
    console.log(`📊 Analizando ${websitesToTest.length} sitios representativos...\n`);
  }

  // Configurar detector
  const detector = new WebsiteDetector({
    headless: false, // Mostrar browser para debugging
    timeout: 15000,
    userAgent: USER_AGENTS[0].value, // Chrome Desktop por defecto
    screenshotOnBlock: true,
    waitForNetworkIdle: true
  });

  // Asegurar que existe el directorio de screenshots
  await ensureScreenshotsDir();

  try {
    // Inicializar Playwright
    await detector.initialize();

    console.log(`🚀 Iniciando detección para: ${testDescription}`);
    console.log('━'.repeat(60));

        const startTime = Date.now();
    const { results, summary } = await detector.detectMultipleWebsites(websitesToTest);
    const endTime = Date.now();
    
    console.log('\n' + '═'.repeat(60));
    console.log('📋 RESULTADOS DEL ANÁLISIS');
    console.log('═'.repeat(60));
    
    // Mostrar reporte detallado
    displaySummary(summary);
    displayDetailedResults(results);
    
    // Exportar resultados
    await exportToJSON(results, summary, 'website-detection-results.json');
    await exportToTXT(results, summary, 'website-detection-summary.txt');

    console.log('\n' + '📁 ARCHIVOS GENERADOS:');
    console.log(`• Resultados detallados: website-detection-results.json`);
    console.log(`• Resumen ejecutivo: website-detection-summary.txt`);

    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Análisis completado en ${totalTime} segundos`);

    if (testExcellentOnly) {
      console.log('\n🎯 ANÁLISIS DE SITIOS EXCELENTES COMPLETADO');
      console.log('Estos sitios fueron seleccionados por tener alta probabilidad de ser accesibles');
      
      const excellentCount = results.filter(r => r.scrapingViability === 'excellent').length;
      const successRate = ((excellentCount / results.length) * 100).toFixed(1);
      
      console.log(`\n📊 TASA DE ÉXITO: ${excellentCount}/${results.length} (${successRate}%) clasificados como EXCELENTES`);
    }

  } catch (error) {
    console.error(chalk.red('❌ Error ejecutando el detector:'), error);
    process.exit(1);
  } finally {
    await detector.close();
  }
}

// Medir tiempo total
const startTime = Date.now();

// Ejecutar programa principal
main().catch(error => {
  console.error(chalk.red('💥 Error fatal:'), error);
  process.exit(1);
});