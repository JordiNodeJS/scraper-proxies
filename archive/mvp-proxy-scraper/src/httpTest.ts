import { ProxyTester } from './testers/ProxyTester.js';
import type { ProxyData } from './types/proxy.types.js';
import { readFileSync } from 'fs';
import chalk from 'chalk';

/**
 * Tester específico para proxies HTTP
 */

async function main(): Promise<void> {
  console.log(chalk.blue('🌐 HTTP PROXY TESTER'));
  console.log(chalk.blue('======================'));
  console.log(chalk.gray('Testing proxies HTTP (mejor compatibilidad)\n'));

  // Cargar proxies HTTP específicamente
  let allProxies: ProxyData[] = [];

  try {
    const fileContent = readFileSync('data/combined-proxies-2025-06-05T21-08-53.json', 'utf-8');
    const data = JSON.parse(fileContent);
    allProxies = data.proxies || [];
  } catch (error) {
    console.error(chalk.red('❌ Error cargando proxies:'), error);
    return;
  }

  // Filtrar solo proxies HTTP
  const httpProxies = allProxies.filter(p => p.protocol === 'http');
  
  if (httpProxies.length === 0) {
    console.error(chalk.red('❌ No hay proxies HTTP para testear'));
    return;
  }

  console.log(`🔗 Proxies HTTP encontrados: ${httpProxies.length}/${allProxies.length}`);
  console.log(`🎯 Seleccionando los mejores para test...`);

  // Seleccionar los mejores proxies HTTP (Elite y con buena velocidad)
  const bestHttpProxies = httpProxies
    .filter(p => p.anonymity === 'elite' || p.anonymity === 'anonymous')
    .sort((a, b) => (a.speed || 999) - (b.speed || 999))
    .slice(0, 5); // Top 5

  if (bestHttpProxies.length === 0) {
    console.log(`⚠️ No hay proxies HTTP Elite/Anonymous, usando cualquiera...`);
    const anyHttpProxies = httpProxies.slice(0, 5);
    bestHttpProxies.push(...anyHttpProxies);
  }

  console.log(`🎯 Testing ${bestHttpProxies.length} proxies HTTP seleccionados...`);

  // Mostrar proxies seleccionados
  console.log('\n📋 PROXIES SELECCIONADOS:');
  bestHttpProxies.forEach((proxy, index) => {
    const anonBadge = proxy.anonymity === 'elite' ? '⭐' : 
                     proxy.anonymity === 'anonymous' ? '👤' : '👁️';
    const speed = proxy.speed ? `(${proxy.speed}ms)` : '';
    const country = proxy.country ? `[${proxy.country}]` : '';
    console.log(`${index + 1}. ${proxy.ip}:${proxy.port} ${anonBadge} ${proxy.anonymity || 'N/A'} ${country} ${speed}`);
  });

  // Crear tester con configuración optimizada para HTTP
  const tester = new ProxyTester({
    headless: false,
    timeout: 8000, // Timeout más corto
    maxRetries: 1,
    delayBetweenTests: 1500, // Delay más corto
    logLevel: 'info',
    testSites: ['httpbin'], // Solo test básico inicial
    validateConnectivity: true,
    checkAnonymity: true,
    measureSpeed: true
  });

  try {
    console.log('\n🚀 Iniciando test de proxies HTTP...');
    console.log('━'.repeat(50));

    const results = await tester.testMultipleProxies(bestHttpProxies);

    // Analizar resultados
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESULTADOS HTTP PROXY TEST');
    console.log('═'.repeat(60));

    const workingProxies = results.filter(r => r.isWorking);
    const averageSpeed = workingProxies.length > 0 
      ? Math.round(workingProxies.reduce((sum, r) => sum + r.responseTime, 0) / workingProxies.length)
      : 0;

    console.log(`🔗 Proxies testeados: ${results.length}`);
    console.log(`✅ Proxies funcionales: ${workingProxies.length} (${((workingProxies.length / results.length) * 100).toFixed(1)}%)`);
    console.log(`⚡ Velocidad promedio: ${averageSpeed}ms`);

    if (workingProxies.length > 0) {
      console.log('\n🎯 PROXIES HTTP FUNCIONALES:');
      workingProxies.forEach((result, index) => {
        const proxy = result.proxy;
        const anonBadge = result.anonymityLevel === 'elite' ? '⭐' : 
                         result.anonymityLevel === 'anonymous' ? '👤' : 
                         result.anonymityLevel === 'transparent' ? '👁️' : '❓';
        const country = proxy.country ? `[${proxy.country}]` : '';
        
        console.log(`${index + 1}. ${proxy.ip}:${proxy.port} ${anonBadge} ${result.anonymityLevel} ${country}`);
        console.log(`   ⚡ Velocidad: ${result.responseTime}ms`);
        
        // Mostrar detalles de conectividad si están disponibles
        const connectivity = result.testResults.connectivity;
        if (connectivity && connectivity.success) {
          console.log(`   🌐 IP detectada: ${connectivity.detectedIP}`);
        }
      });

      console.log('\n✅ GRAN ÉXITO - Proxies HTTP funcionando correctamente!');
      console.log('🎯 Ahora podemos testear en sitios reales como Amazon');
      
      // Mostrar el mejor proxy para usar
      const bestProxy = workingProxies[0];
      console.log(`\n⭐ MEJOR PROXY: ${bestProxy.proxy.ip}:${bestProxy.proxy.port}`);
      console.log(`   Velocidad: ${bestProxy.responseTime}ms`);
      console.log(`   Anonimato: ${bestProxy.anonymityLevel}`);
      console.log(`   País: ${bestProxy.proxy.country || 'Unknown'}`);

    } else {
      console.log('\n⚠️ Ningún proxy HTTP funcionó');
      console.log('💡 Posibles causas:');
      console.log('   • Los proxies pueden estar caídos');
      console.log('   • Restricciones de red local');
      console.log('   • Necesidad de autenticación');
      
      // Mostrar errores comunes
      const commonErrors = results.flatMap(r => r.errors)
        .reduce((acc, error) => {
          acc[error] = (acc[error] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      if (Object.keys(commonErrors).length > 0) {
        console.log('\n🔍 ERRORES DETECTADOS:');
        Object.entries(commonErrors).forEach(([error, count]) => {
          console.log(`   • ${error} (${count} veces)`);
        });
      }
    }

  } catch (error) {
    console.error(chalk.red('💥 Error durante el testing:'), error);
  } finally {
    await tester.close();
  }
}

main().catch(error => {
  console.error(chalk.red('💥 Error fatal:'), error);
  process.exit(1);
}); 