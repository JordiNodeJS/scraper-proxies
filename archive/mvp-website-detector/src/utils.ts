import type { DetectionResult, DetectionSummary } from './types.js';
import chalk from 'chalk';

/**
 * Utilidades para formatear y exportar resultados
 */

/**
 * Exporta los resultados a un archivo JSON
 */
export async function exportToJSON(
  results: DetectionResult[], 
  summary: DetectionSummary, 
  filename: string = 'website-detection-results.json'
): Promise<void> {
  const data = {
    summary,
    results: results.map(result => ({
      ...result,
      timestamp: result.timestamp.toISOString()
    })),
    generatedAt: new Date().toISOString(),
    version: '1.0.0'
  };

  const fs = await import('fs/promises');
  await fs.writeFile(filename, JSON.stringify(data, null, 2));
  console.log(chalk.green(`📁 Resultados exportados a: ${filename}`));
}

/**
 * Exporta un resumen simple en formato TXT
 */
export async function exportToTXT(
  results: DetectionResult[], 
  summary: DetectionSummary, 
  filename: string = 'website-detection-summary.txt'
): Promise<void> {
  const lines: string[] = [];
  
  lines.push('🎯 RESUMEN DE DETECCIÓN DE SITIOS WEB');
  lines.push('=====================================');
  lines.push('');
  lines.push(`📊 Estadísticas Generales:`);
  lines.push(`   Total sitios analizados: ${summary.totalTested}`);
  lines.push(`   Accesibles: ${summary.accessible} (${Math.round(summary.accessible / summary.totalTested * 100)}%)`);
  lines.push(`   Bloqueados: ${summary.blocked} (${Math.round(summary.blocked / summary.totalTested * 100)}%)`);
  lines.push(`   Con Cloudflare: ${summary.withCloudflare} (${Math.round(summary.withCloudflare / summary.totalTested * 100)}%)`);
  lines.push(`   Con CAPTCHA: ${summary.withCaptcha} (${Math.round(summary.withCaptcha / summary.totalTested * 100)}%)`);
  lines.push(`   Con Rate Limiting: ${summary.withRateLimit} (${Math.round(summary.withRateLimit / summary.totalTested * 100)}%)`);
  lines.push(`   Tiempo promedio de respuesta: ${Math.round(summary.averageResponseTime)}ms`);
  lines.push('');

  lines.push(`🎯 Viabilidad de Scraping:`);
  lines.push(`   Excelente: ${summary.viabilityBreakdown.excellent} sitios`);
  lines.push(`   Buena: ${summary.viabilityBreakdown.good} sitios`);
  lines.push(`   Difícil: ${summary.viabilityBreakdown.difficult} sitios`);
  lines.push(`   Imposible: ${summary.viabilityBreakdown.impossible} sitios`);
  lines.push('');

  lines.push(`📋 Por Categorías:`);
  Object.entries(summary.categoryBreakdown).forEach(([category, stats]) => {
    lines.push(`   ${category.toUpperCase()}: ${stats.accessible}/${stats.total} accesibles (${Math.round(stats.accessible / stats.total * 100)}%)`);
  });
  lines.push('');

  if (summary.recommendations.length > 0) {
    lines.push(`💡 Recomendaciones:`);
    summary.recommendations.forEach(rec => {
      lines.push(`   ${rec}`);
    });
    lines.push('');
  }

  lines.push(`📝 Resultados Detallados:`);
  lines.push('========================');
  
  // Agrupar por viabilidad
  const groupedResults = {
    excellent: results.filter(r => r.scrapingViability === 'excellent'),
    good: results.filter(r => r.scrapingViability === 'good'),
    difficult: results.filter(r => r.scrapingViability === 'difficult'),
    impossible: results.filter(r => r.scrapingViability === 'impossible')
  };

  Object.entries(groupedResults).forEach(([viability, siteResults]) => {
    if (siteResults.length === 0) return;
    
    lines.push('');
    lines.push(`🎯 ${viability.toUpperCase()} (${siteResults.length} sitios):`);
    siteResults.forEach(result => {
      lines.push(`   • ${result.website.name} (${result.website.url})`);
      lines.push(`     Categoría: ${result.website.category}`);
      lines.push(`     Tiempo de respuesta: ${result.responseTime}ms`);
      lines.push(`     Status: ${result.statusCode || 'N/A'}`);
      
      if (result.detectedProtections.length > 0) {
        lines.push(`     Protecciones: ${result.detectedProtections.join(', ')}`);
      }
      
      if (result.notes.length > 0) {
        lines.push(`     Notas: ${result.notes.slice(0, 2).join(' | ')}`);
      }
      lines.push('');
    });
  });

  const fs = await import('fs/promises');
  await fs.writeFile(filename, lines.join('\n'));
  console.log(chalk.green(`📄 Resumen exportado a: ${filename}`));
}

/**
 * Muestra un resumen colorido en consola
 */
export function displaySummary(summary: DetectionSummary): void {
  console.log('\n' + chalk.blue('🎯 RESUMEN DE DETECCIÓN DE SITIOS WEB'));
  console.log(chalk.blue('====================================='));
  
  console.log('\n' + chalk.yellow('📊 Estadísticas Generales:'));
  console.log(`   Total sitios analizados: ${chalk.bold(summary.totalTested)}`);
  console.log(`   Accesibles: ${chalk.green(summary.accessible)} (${chalk.green(Math.round(summary.accessible / summary.totalTested * 100) + '%')})`);
  console.log(`   Bloqueados: ${chalk.red(summary.blocked)} (${chalk.red(Math.round(summary.blocked / summary.totalTested * 100) + '%')})`);
  console.log(`   Con Cloudflare: ${chalk.yellow(summary.withCloudflare)} (${Math.round(summary.withCloudflare / summary.totalTested * 100)}%)`);
  console.log(`   Con CAPTCHA: ${chalk.red(summary.withCaptcha)} (${Math.round(summary.withCaptcha / summary.totalTested * 100)}%)`);
  console.log(`   Con Rate Limiting: ${chalk.yellow(summary.withRateLimit)} (${Math.round(summary.withRateLimit / summary.totalTested * 100)}%)`);
  console.log(`   Tiempo promedio: ${chalk.cyan(Math.round(summary.averageResponseTime) + 'ms')}`);

  console.log('\n' + chalk.yellow('🎯 Viabilidad de Scraping:'));
  console.log(`   ${chalk.green('Excelente')}: ${summary.viabilityBreakdown.excellent} sitios`);
  console.log(`   ${chalk.blue('Buena')}: ${summary.viabilityBreakdown.good} sitios`);
  console.log(`   ${chalk.yellow('Difícil')}: ${summary.viabilityBreakdown.difficult} sitios`);
  console.log(`   ${chalk.red('Imposible')}: ${summary.viabilityBreakdown.impossible} sitios`);

  console.log('\n' + chalk.yellow('📋 Por Categorías:'));
  Object.entries(summary.categoryBreakdown).forEach(([category, stats]) => {
    const percentage = Math.round(stats.accessible / stats.total * 100);
    const color = percentage > 70 ? chalk.green : percentage > 40 ? chalk.yellow : chalk.red;
    console.log(`   ${category.toUpperCase()}: ${color(`${stats.accessible}/${stats.total}`)} accesibles (${color(percentage + '%')})`);
  });

  if (summary.recommendations.length > 0) {
    console.log('\n' + chalk.yellow('💡 Recomendaciones:'));
    summary.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
  }
}

/**
 * Muestra los resultados detallados organizados por viabilidad
 */
export function displayDetailedResults(results: DetectionResult[]): void {
  const groupedResults = {
    excellent: results.filter(r => r.scrapingViability === 'excellent'),
    good: results.filter(r => r.scrapingViability === 'good'),
    difficult: results.filter(r => r.scrapingViability === 'difficult'),
    impossible: results.filter(r => r.scrapingViability === 'impossible')
  };

  const colors = {
    excellent: chalk.green,
    good: chalk.blue,
    difficult: chalk.yellow,
    impossible: chalk.red
  };

  Object.entries(groupedResults).forEach(([viability, siteResults]) => {
    if (siteResults.length === 0) return;
    
    const color = colors[viability as keyof typeof colors];
    console.log('\n' + color(`🎯 ${viability.toUpperCase()} (${siteResults.length} sitios):`));
    
    siteResults.forEach(result => {
      console.log(`\n   • ${chalk.bold(result.website.name)} (${result.website.category})`);
      console.log(`     URL: ${chalk.gray(result.website.url)}`);
      console.log(`     ⏱️  Tiempo: ${result.responseTime}ms | Status: ${result.statusCode || 'N/A'}`);
      
      if (result.detectedProtections.length > 0) {
        console.log(`     🛡️  Protecciones: ${chalk.yellow(result.detectedProtections.join(', '))}`);
      }
      
      if (result.hasCloudflare) console.log(`     ☁️  Cloudflare detectado`);
      if (result.hasCaptcha) console.log(`     🤖 CAPTCHA detectado`);
      if (result.hasRateLimit) console.log(`     ⏳ Rate limiting detectado`);
      
      // Mostrar las 2 primeras notas más importantes
      const importantNotes = result.notes.filter(note => 
        note.includes('Cloudflare') || note.includes('CAPTCHA') || note.includes('bloqueo') || note.includes('Elementos esperados')
      ).slice(0, 2);
      
      if (importantNotes.length > 0) {
        console.log(`     📝 ${chalk.gray(importantNotes.join(' | '))}`);
      }
    });
  });
}

/**
 * Crea el directorio de screenshots si no existe
 */
export async function ensureScreenshotsDir(): Promise<void> {
  const fs = await import('fs/promises');
  try {
    await fs.access('screenshots');
  } catch {
    await fs.mkdir('screenshots', { recursive: true });
    console.log(chalk.gray('📁 Directorio screenshots/ creado'));
  }
} 