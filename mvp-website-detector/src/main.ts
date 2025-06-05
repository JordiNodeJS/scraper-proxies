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

  // Verificar opciones de análisis
  const testExcellentOnly = process.argv.includes('--excellent-only') || process.argv.includes('--test-excellent');
  const testProxySites = process.argv.includes('--proxy-sites') || process.argv.includes('--proxies');
  
  let websitesToTest: WebsiteTarget[];
  let testDescription: string;
  
  if (testProxySites) {
    // Analizar específicamente sitios de listas de proxies
    websitesToTest = POPULAR_WEBSITES.filter(site => site.category === 'proxy');
    testDescription = 'ANÁLISIS DE SITIOS DE PROXIES';
    console.log('🔗 Modo de análisis: Sitios de listas de proxies');
    console.log(`📊 Analizando ${websitesToTest.length} sitios especializados en listas de proxies...\n`);
    console.log('🎯 Objetivo: Determinar viabilidad de scraping para automatizar obtención de proxies');
  } else if (testExcellentOnly) {
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
    
    // Exportar resultados con nombre específico para proxies
    const filePrefix = testProxySites ? 'proxy-sites' : 'website-detection';
    await exportToJSON(results, summary, `${filePrefix}-results.json`);
    await exportToTXT(results, summary, `${filePrefix}-summary.txt`);

    console.log('\n' + '📁 ARCHIVOS GENERADOS:');
    console.log(`• Resultados detallados: ${filePrefix}-results.json`);
    console.log(`• Resumen ejecutivo: ${filePrefix}-summary.txt`);

    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Análisis completado en ${totalTime} segundos`);

    if (testProxySites) {
      console.log('\n🔗 ANÁLISIS DE SITIOS DE PROXIES COMPLETADO');
      console.log('Evaluando viabilidad para automatizar obtención de listas de proxies');
      
      const accessibleCount = results.filter(r => r.accessible).length;
      const excellentCount = results.filter(r => r.scrapingViability === 'excellent').length;
      const goodCount = results.filter(r => r.scrapingViability === 'good').length;
      
      console.log(`\n📊 RESULTADOS PARA SCRAPING DE PROXIES:`);
      console.log(`• Sitios accesibles: ${accessibleCount}/${results.length}`);
      console.log(`• Excelentes para scraping: ${excellentCount}/${results.length}`);
      console.log(`• Buenos para scraping: ${goodCount}/${results.length}`);
      console.log(`• Viables total: ${excellentCount + goodCount}/${results.length}`);
      
      if (excellentCount + goodCount > 0) {
        console.log('\n✅ Recomendación: Proceder con implementación de scraper');
      } else {
        console.log('\n⚠️  Recomendación: Evaluar técnicas avanzadas o proxies alternativos');
      }
    } else if (testExcellentOnly) {
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