import { ProxyTester } from './testers/ProxyTester.js';
import type { ProxyData } from './types/proxy.types.js';
import { readFileSync } from 'fs';
import chalk from 'chalk';

/**
 * Tester simple para validar proxies rápidamente
 */

async function main(): Promise<void> {
  console.log(chalk.blue('🧪 SIMPLE PROXY TESTER'));
  console.log(chalk.blue('========================'));
  console.log(chalk.gray('Validando proxies extraídos\n'));

  // Cargar proxies desde archivo
  let proxies: ProxyData[] = [];

  try {
    const fileContent = readFileSync('data/combined-proxies-2025-06-05T21-08-53.json', 'utf-8');
    const data = JSON.parse(fileContent);
    proxies = data.proxies || [];
  } catch (error) {
    console.error(chalk.red('❌ Error cargando proxies:'), error);
    console.log(chalk.yellow('💡 Ejecuta primero: bun start:both'));
    return;
  }

  if (proxies.length === 0) {
    console.error(chalk.red('❌ No hay proxies para testear'));
    return;
  }

  console.log(`🔗 Proxies cargados: ${proxies.length}`);

  // Crear tester
  const tester = new ProxyTester({
    headless: false,
    timeout: 10000,
    maxRetries: 1,
    delayBetweenTests: 2000,
    logLevel: 'info',
    testSites: ['httpbin'],
    validateConnectivity: true,
    checkAnonymity: true,
    measureSpeed: true
  });

  try {
    // Testear solo los primeros 3 proxies
    const proxiesToTest = proxies.slice(0, 3);
    console.log(`\n🎯 Testing ${proxiesToTest.length} proxies (muestra)...`);
    console.log('━'.repeat(50));

    const results = await tester.testMultipleProxies(proxiesToTest);

    // Mostrar resultados
    console.log('\n' + '═'.repeat(50));
    console.log('📊 RESULTADOS');
    console.log('═'.repeat(50));

    const workingProxies = results.filter(r => r.isWorking);
    console.log(`✅ Proxies funcionales: ${workingProxies.length}/${results.length}`);

    if (workingProxies.length > 0) {
      console.log('\n🎯 PROXIES QUE FUNCIONAN:');
      workingProxies.forEach((result, index) => {
        const proxy = result.proxy;
        console.log(`${index + 1}. ${proxy.ip}:${proxy.port} (${result.responseTime}ms) [${result.anonymityLevel}]`);
      });

      console.log('\n✅ TEST EXITOSO - Algunos proxies funcionan');
      console.log('💡 Siguiente paso: Probar en Amazon con diferentes proxies');
    } else {
      console.log('\n⚠️ Ningún proxy funcionó en este test');
      console.log('💡 Esto puede ser normal, algunos proxies pueden tener restricciones');
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