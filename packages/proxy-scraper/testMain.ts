import { ProxyTester } from './testers/ProxyTester.js';
import { exportToJSON, exportToCSV } from './utils/DataExporter.js';
import type { ProxyData, ProxyTestResult } from './types/proxy.types.js';
import { readFileSync } from 'fs';
import chalk from 'chalk';

/**
 * MVP Proxy Tester - Valida proxies en sitios reales
 * Fase 2: Testing y validación
 */

async function displayHeader(): Promise<void> {
  console.log(chalk.blue('🧪 MVP PROXY TESTER - FASE 2'));
  console.log(chalk.blue('========================================'));
  console.log(chalk.gray('Validando proxies en sitios web reales\n'));
}

/**
 * Cargar proxies desde archivo JSON
 */
function loadProxiesFromFile(filePath: string): ProxyData[] {
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Si es un ScrapingResult, extraer los proxies
    if (data.proxies && Array.isArray(data.proxies)) {
      return data.proxies;
    }
    
    // Si es un array directo de proxies
    if (Array.isArray(data)) {
      return data;
    }
    
    throw new Error('Formato de archivo no válido');
  } catch (error) {
    console.error(chalk.red(`❌ Error cargando proxies desde ${filePath}:`), error);
    return [];
  }
}

/**
 * Test básico de conectividad (httpbin.org)
 */
async function testBasicConnectivity(): Promise<void> {
  await displayHeader();
  
  console.log('🔗 Modo: Test básico de conectividad...\n');

  // Buscar el archivo más reciente de proxies combinados
  const dataFiles = [
    'data/combined-proxies-2025-06-05T21-08-53.json',
    'data/http-proxies-2025-06-05T21-08-32.json',
    'data/https-proxies-2025-06-05T21-08-32.json'
  ];

  let proxies: ProxyData[] = [];
  let usedFile = '';

  for (const file of dataFiles) {
    try {
      proxies = loadProxiesFromFile(file);
      if (proxies.length > 0) {
        usedFile = file;
        break;
      }
    } catch (error) {
      // Continuar con el siguiente archivo
    }
  }

  if (proxies.length === 0) {
    console.error(chalk.red('❌ No se encontraron proxies para testear.'));
    console.log(chalk.yellow('💡 Ejecuta primero: bun start:both'));
    return;
  }

  console.log(`📁 Usando archivo: ${usedFile}`);
  console.log(`🔗 Proxies cargados: ${proxies.length}`);

  // Configurar tester con test básico
  const tester = new ProxyTester({
    headless: false,
    timeout: 10000,
    maxRetries: 1,
    delayBetweenTests: 2000,
    logLevel: 'info',
    testSites: ['httpbin'], // Solo test básico
    validateConnectivity: true,
    checkAnonymity: true,
    measureSpeed: true
  });

  try {
    console.log('\n🚀 Iniciando test básico de conectividad...');
    console.log('━'.repeat(50));

    // Testear solo los primeros 5 proxies para empezar
    const proxiesToTest = proxies.slice(0, 5);
    console.log(`🎯 Testing ${proxiesToTest.length} proxies (muestra)...`);

    const results = await tester.testMultipleProxies(proxiesToTest);

    // Analizar resultados
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESULTADOS DEL TESTING BÁSICO');
    console.log('═'.repeat(60));

    const workingProxies = results.filter(r => r.isWorking);
    const averageResponseTime = workingProxies.length > 0 
      ? Math.round(workingProxies.reduce((sum, r) => sum + r.responseTime, 0) / workingProxies.length)
      : 0;

    console.log(`🔗 Proxies testeados: ${results.length}`);
    console.log(`✅ Proxies funcionales: ${workingProxies.length} (${((workingProxies.length / results.length) * 100).toFixed(1)}%)`);
    console.log(`⚡ Tiempo de respuesta promedio: ${averageResponseTime}ms`);

    // Mostrar detalles de proxies funcionales
    if (workingProxies.length > 0) {
      console.log('\n🎯 PROXIES FUNCIONALES:');
      workingProxies.forEach((result, index) => {
        const proxy = result.proxy;
        const anonBadge = result.anonymityLevel === 'elite' ? '⭐' : 
                         result.anonymityLevel === 'anonymous' ? '👤' : 
                         result.anonymityLevel === 'transparent' ? '👁️' : '❓';
        
        console.log(`${index + 1}. ${proxy.ip}:${proxy.port} ${anonBadge} ${result.anonymityLevel} (${result.responseTime}ms)`);
      });
    }

    // Exportar resultados
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    // Crear ScrapingResult compatible para export
    const exportData = {
      success: workingProxies.length > 0,
      proxies: results.map(r => r.proxy),
      totalFound: results.length,
      errors: results.flatMap(r => r.errors),
      timestamp: new Date(),
      executionTime: results.reduce((sum, r) => sum + r.testDuration, 0),
      source: {
        name: 'Basic Connectivity Test',
        url: 'Multiple test sites',
        scrapedAt: new Date()
      },
      testResults: results
    };
    
    await exportToJSON(exportData as any, `data/basic-test-results-${timestamp}.json`);
    
    console.log(`\n📁 Resultados exportados:`);
    console.log(`📄 JSON: data/basic-test-results-${timestamp}.json`);

    if (workingProxies.length > 0) {
      console.log('\n✅ Test básico completado - Algunos proxies son funcionales');
      console.log('💡 Ejecuta testing avanzado con: bun test:amazon');
    } else {
      console.log('\n⚠️ Ningún proxy pasó el test básico');
      console.log('💡 Intenta con más proxies o verifica la conectividad');
    }

  } catch (error) {
    console.error(chalk.red('💥 Error durante el testing:'), error);
  } finally {
    await tester.close();
  }
}

/**
 * Test avanzado en Amazon
 */
async function testAmazon(): Promise<void> {
  await displayHeader();
  
  console.log('🛒 Modo: Test en Amazon...\n');

  // Cargar proxies desde el archivo más reciente
  const dataFiles = [
    'data/combined-proxies-2025-06-05T21-08-53.json'
  ];

  let proxies: ProxyData[] = [];
  let usedFile = '';

  for (const file of dataFiles) {
    try {
      proxies = loadProxiesFromFile(file);
      if (proxies.length > 0) {
        usedFile = file;
        break;
      }
    } catch (error) {
      // Continuar
    }
  }

  if (proxies.length === 0) {
    console.error(chalk.red('❌ No se encontraron proxies para testear.'));
    return;
  }

  console.log(`📁 Usando archivo: ${usedFile}`);
  console.log(`🔗 Proxies cargados: ${proxies.length}`);

  // Configurar tester para Amazon
  const tester = new ProxyTester({
    headless: false,
    timeout: 20000,
    maxRetries: 2,
    delayBetweenTests: 5000,
    logLevel: 'info',
    testSites: ['amazon', 'google'], // Amazon + Google como control
    validateConnectivity: true,
    checkAnonymity: true,
    measureSpeed: true
  });

  try {
    console.log('\n🚀 Iniciando test en Amazon...');
    console.log('━'.repeat(50));

    // Testear solo los primeros 3 proxies para Amazon (es más lento)
    const proxiesToTest = proxies.slice(0, 3);
    console.log(`🎯 Testing ${proxiesToTest.length} proxies en Amazon...`);

    const results = await tester.testMultipleProxies(proxiesToTest);

    // Analizar resultados específicos de Amazon
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESULTADOS DEL TESTING EN AMAZON');
    console.log('═'.repeat(60));

    const amazonWorkingProxies = results.filter(r => 
      r.testResults.amazon && r.testResults.amazon.success
    );

    console.log(`🛒 Proxies que funcionan en Amazon: ${amazonWorkingProxies.length}/${results.length}`);
    console.log(`🔍 Proxies que funcionan en Google: ${results.filter(r => r.testResults.google && r.testResults.google.success).length}/${results.length}`);

    // Mostrar detalles específicos
    results.forEach((result, index) => {
      const proxy = result.proxy;
      const amazonResult = result.testResults.amazon;
      const googleResult = result.testResults.google;
      
      console.log(`\n${index + 1}. ${proxy.ip}:${proxy.port}`);
      console.log(`   Amazon: ${amazonResult?.success ? '✅' : '❌'} ${amazonResult?.error || ''}`);
      console.log(`   Google: ${googleResult?.success ? '✅' : '❌'} ${googleResult?.error || ''}`);
      console.log(`   Anonimato: ${result.anonymityLevel}`);
    });

    // Exportar resultados
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    const exportData = {
      success: amazonWorkingProxies.length > 0,
      proxies: results.map(r => r.proxy),
      totalFound: results.length,
      errors: results.flatMap(r => r.errors),
      timestamp: new Date(),
      executionTime: results.reduce((sum, r) => sum + r.testDuration, 0),
      source: {
        name: 'Amazon Test Results',
        url: 'Amazon and Google',
        scrapedAt: new Date()
      },
      testResults: results
    };
    
    await exportToJSON(exportData as any, `data/amazon-test-results-${timestamp}.json`);
    
    console.log(`\n📁 Resultados exportados:`);
    console.log(`📄 JSON: data/amazon-test-results-${timestamp}.json`);

    if (amazonWorkingProxies.length > 0) {
      console.log('\n✅ Algunos proxies funcionan en Amazon');
      console.log('💡 Ejecuta testing en redes sociales con: bun test:social');
    } else {
      console.log('\n⚠️ Ningún proxy funcionó en Amazon');
      console.log('💡 Amazon tiene bloqueos fuertes, esto es normal');
    }

  } catch (error) {
    console.error(chalk.red('💥 Error durante el testing:'), error);
  } finally {
    await tester.close();
  }
}

/**
 * Test en redes sociales
 */
async function testSocial(): Promise<void> {
  await displayHeader();
  
  console.log('📱 Modo: Test en redes sociales...\n');

  // Cargar proxies
  const dataFiles = [
    'data/combined-proxies-2025-06-05T21-08-53.json'
  ];

  let proxies: ProxyData[] = [];
  let usedFile = '';

  for (const file of dataFiles) {
    try {
      proxies = loadProxiesFromFile(file);
      if (proxies.length > 0) {
        usedFile = file;
        break;
      }
    } catch (error) {
      // Continuar
    }
  }

  if (proxies.length === 0) {
    console.error(chalk.red('❌ No se encontraron proxies para testear.'));
    return;
  }

  console.log(`📁 Usando archivo: ${usedFile}`);
  console.log(`🔗 Proxies cargados: ${proxies.length}`);

  // Configurar tester para redes sociales
  const tester = new ProxyTester({
    headless: false,
    timeout: 15000,
    maxRetries: 2,
    delayBetweenTests: 4000,
    logLevel: 'info',
    testSites: ['twitter', 'instagram', 'youtube'],
    validateConnectivity: true,
    checkAnonymity: true,
    measureSpeed: true
  });

  try {
    console.log('\n🚀 Iniciando test en redes sociales...');
    console.log('━'.repeat(50));

    // Testear primeros 3 proxies
    const proxiesToTest = proxies.slice(0, 3);
    console.log(`🎯 Testing ${proxiesToTest.length} proxies en redes sociales...`);

    const results = await tester.testMultipleProxies(proxiesToTest);

    // Analizar resultados por red social
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESULTADOS EN REDES SOCIALES');
    console.log('═'.repeat(60));

    const socialStats = {
      twitter: results.filter(r => r.testResults.twitter && r.testResults.twitter.success).length,
      instagram: results.filter(r => r.testResults.instagram && r.testResults.instagram.success).length,
      youtube: results.filter(r => r.testResults.youtube && r.testResults.youtube.success).length
    };

    console.log(`🐦 Twitter: ${socialStats.twitter}/${results.length} proxies funcionales`);
    console.log(`📸 Instagram: ${socialStats.instagram}/${results.length} proxies funcionales`);
    console.log(`🎥 YouTube: ${socialStats.youtube}/${results.length} proxies funcionales`);

    // Mostrar detalles por proxy
    results.forEach((result, index) => {
      const proxy = result.proxy;
      
      console.log(`\n${index + 1}. ${proxy.ip}:${proxy.port} [${result.anonymityLevel}]`);
      console.log(`   🐦 Twitter: ${result.testResults.twitter?.success ? '✅' : '❌'} ${result.testResults.twitter?.error || ''}`);
      console.log(`   📸 Instagram: ${result.testResults.instagram?.success ? '✅' : '❌'} ${result.testResults.instagram?.error || ''}`);
      console.log(`   🎥 YouTube: ${result.testResults.youtube?.success ? '✅' : '❌'} ${result.testResults.youtube?.error || ''}`);
    });

    // Exportar resultados
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    const totalSuccessful = Object.values(socialStats).reduce((sum, count) => sum + count, 0);
    const exportData = {
      success: totalSuccessful > 0,
      proxies: results.map(r => r.proxy),
      totalFound: results.length,
      errors: results.flatMap(r => r.errors),
      timestamp: new Date(),
      executionTime: results.reduce((sum, r) => sum + r.testDuration, 0),
      source: {
        name: 'Social Media Test Results',
        url: 'Twitter, Instagram, YouTube',
        scrapedAt: new Date()
      },
      testResults: results,
      socialStats
    };
    
    await exportToJSON(exportData as any, `data/social-test-results-${timestamp}.json`);
    
    console.log(`\n📁 Resultados exportados:`);
    console.log(`📄 JSON: data/social-test-results-${timestamp}.json`);

    const totalSuccessful = Object.values(socialStats).reduce((sum, count) => sum + count, 0);
    
    if (totalSuccessful > 0) {
      console.log('\n✅ Algunos proxies funcionan en redes sociales');
      console.log('🎯 FASE 2 COMPLETADA - Sistema de testing funcional');
    } else {
      console.log('\n⚠️ Las redes sociales tienen bloqueos muy fuertes');
      console.log('💡 Los proxies podrían funcionar con técnicas más avanzadas');
    }

  } catch (error) {
    console.error(chalk.red('💥 Error durante el testing:'), error);
  } finally {
    await tester.close();
  }
}

async function main(): Promise<void> {
  // Determinar modo según argumentos
  const args = process.argv.slice(2);
  
  if (args.includes('--amazon')) {
    await testAmazon();
  } else if (args.includes('--social')) {
    await testSocial();
  } else {
    // Modo por defecto: test básico
    await testBasicConnectivity();
  }
}

// Ejecutar programa principal
main().catch(error => {
  console.error(chalk.red('💥 Error fatal:'), error);
  process.exit(1);
}); 