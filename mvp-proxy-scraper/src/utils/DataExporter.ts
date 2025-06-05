import type { ProxyData, ScrapingResult } from '../types/proxy.types.js';
import { writeFileSync } from 'fs';

/**
 * Utilidades para exportar datos de proxies
 */

/**
 * Exportar resultado completo a JSON
 */
export async function exportToJSON(result: ScrapingResult, filePath: string): Promise<void> {
  try {
    const jsonData = JSON.stringify(result, null, 2);
    writeFileSync(filePath, jsonData, 'utf8');
    console.log(`📄 JSON exportado a: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error exportando JSON: ${error}`);
    throw error;
  }
}

/**
 * Exportar proxies a CSV
 */
export async function exportToCSV(proxies: ProxyData[], filePath: string): Promise<void> {
  try {
    // Header CSV
    const headers = [
      'IP',
      'Port', 
      'Protocol',
      'Country',
      'Country Code',
      'City',
      'Anonymity',
      'Speed (ms)',
      'Uptime (%)',
      'Last Checked',
      'Source',
      'Is Working'
    ];

    // Convertir datos a filas CSV
    const rows = proxies.map(proxy => [
      proxy.ip,
      proxy.port.toString(),
      proxy.protocol,
      proxy.country || '',
      proxy.countryCode || '',
      proxy.city || '',
      proxy.anonymity || '',
      proxy.speed?.toString() || '',
      proxy.uptime?.toString() || '',
      proxy.lastChecked?.toISOString() || '',
      proxy.source,
      proxy.isWorking?.toString() || ''
    ]);

    // Combinar header y filas
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        // Escapar comillas y comas en los valores
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(','))
    ].join('\n');

    writeFileSync(filePath, csvContent, 'utf8');
    console.log(`📊 CSV exportado a: ${filePath} (${proxies.length} proxies)`);
  } catch (error) {
    console.error(`❌ Error exportando CSV: ${error}`);
    throw error;
  }
}

/**
 * Exportar solo proxies funcionales a JSON
 */
export async function exportWorkingProxiesOnly(result: ScrapingResult, filePath: string): Promise<void> {
  const workingProxies = result.proxies.filter(proxy => proxy.isWorking === true);
  
  const workingResult: ScrapingResult = {
    ...result,
    proxies: workingProxies,
    totalFound: workingProxies.length
  };

  await exportToJSON(workingResult, filePath);
}

/**
 * Exportar estadísticas resumidas
 */
export async function exportStats(result: ScrapingResult, filePath: string): Promise<void> {
  const stats = {
    summary: {
      totalProxies: result.totalFound,
      successfulScraping: result.success,
      executionTime: result.executionTime,
      source: result.source,
      timestamp: result.timestamp
    },
    byProtocol: getCountByField(result.proxies, 'protocol'),
    byCountry: getCountByField(result.proxies, 'country'),
    byAnonymity: getCountByField(result.proxies, 'anonymity'),
    errors: result.errors
  };

  await exportToJSON(stats as any, filePath);
}

/**
 * Contar elementos por campo
 */
function getCountByField(proxies: ProxyData[], field: keyof ProxyData): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const proxy of proxies) {
    const value = String(proxy[field] || 'unknown');
    counts[value] = (counts[value] || 0) + 1;
  }
  
  return counts;
} 