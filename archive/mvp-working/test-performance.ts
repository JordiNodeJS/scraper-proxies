// Test de performance y escalabilidad del sistema
import { ProxyScraper } from './src/proxy-scraper';

const performanceTest = async () => {
  console.log('⚡ TEST DE PERFORMANCE Y ESCALABILIDAD');
  console.log('=====================================\n');

  const scraper = new ProxyScraper();
  
  // Test 1: Scraping masivo con todas las fuentes
  console.log('🔥 TEST 1: SCRAPING MASIVO (todas las fuentes)');
  console.log('----------------------------------------------');
  
  const startTime = Date.now();
  
  try {
    const session = await scraper.scrapeAllSources();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Extraer todos los proxies de las fuentes
    const allProxies = session.sources.flatMap(source => source.proxies);
    
    console.log(`\n📊 RESULTADOS DEL SCRAPING MASIVO:`);
    console.log(`   ⏱️  Tiempo total: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
    console.log(`   📦 Total de proxies: ${allProxies.length}`);
    console.log(`   🚀 Velocidad: ${(allProxies.length / (duration/1000)).toFixed(2)} proxies/segundo`);
    
    // Análisis por fuente
    console.log(`\n📈 ANÁLISIS POR FUENTE:`);
    const bySource = allProxies.reduce((acc: any, proxy) => {
      acc[proxy.source] = (acc[proxy.source] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(bySource).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} proxies`);
    });
    
    // Test 2: Análisis de uniqueness
    console.log(`\n🔍 TEST 2: ANÁLISIS DE CALIDAD DE DATOS`);
    console.log('-------------------------------------');
    
    const uniqueIPs = new Set(allProxies.map(p => p.ip));
    const uniqueEndpoints = new Set(allProxies.map(p => `${p.ip}:${p.port}`));
    
    console.log(`   🎯 IPs únicas: ${uniqueIPs.size}`);
    console.log(`   🎯 Endpoints únicos: ${uniqueEndpoints.size}`);
    console.log(`   📊 Ratio de unicidad: ${((uniqueEndpoints.size / allProxies.length) * 100).toFixed(1)}%`);
    
    // Análisis por país
    const byCountry = allProxies.reduce((acc: any, proxy) => {
      const country = proxy.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n🌍 TOP 10 PAÍSES:`);
    Object.entries(byCountry)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .forEach(([country, count], index) => {
        console.log(`   ${index + 1}. ${country}: ${count} proxies`);
      });
    
    // Test 3: Memory usage
    console.log(`\n💾 TEST 3: USO DE MEMORIA`);
    console.log('------------------------');
    
    const memUsage = process.memoryUsage();
    console.log(`   📊 Memoria RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📊 Heap usado: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📊 Heap total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📊 Memoria por proxy: ${((memUsage.heapUsed / 1024) / allProxies.length).toFixed(2)} KB`);
    
    // Test 4: Rate limiting efectivo
    console.log(`\n🚦 TEST 4: VERIFICACIÓN DE RATE LIMITING`);
    console.log('---------------------------------------');
    
    // Scraping múltiple para verificar que no nos bloquean
    console.log('   🔄 Ejecutando 3 scraping consecutivos...');
    
         for (let i = 1; i <= 3; i++) {
       const testStart = Date.now();
       try {
         const testSession = await scraper.scrapeAllSources();
         const testProxies = testSession.sources.flatMap(source => source.proxies);
         const testDuration = Date.now() - testStart;
         console.log(`   ✅ Scraping ${i}: ${testProxies.length} proxies en ${testDuration}ms`);
       } catch (error) {
         console.log(`   ❌ Scraping ${i}: ERROR - ${error}`);
       }
      
      // Esperar entre tests
      if (i < 3) {
        console.log('      ⏳ Esperando 10 segundos...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    // Test 5: Estimación de capacidad
    console.log(`\n🎯 TEST 5: ESTIMACIÓN DE CAPACIDAD`);
    console.log('----------------------------------');
    
    const proxiesPerSecond = allProxies.length / (duration / 1000);
    const dailyCapacity = proxiesPerSecond * 60 * 60 * 24; // Si corriera 24/7
    const practicalDaily = proxiesPerSecond * 60 * 10; // 10 minutos diarios
    
    console.log(`   📈 Velocidad actual: ${proxiesPerSecond.toFixed(2)} proxies/segundo`);
    console.log(`   📅 Capacidad teórica diaria: ${dailyCapacity.toFixed(0)} proxies`);
    console.log(`   📅 Capacidad práctica (10 min/día): ${practicalDaily.toFixed(0)} proxies`);
    
    // Guardar resultados del performance test
    const performanceResults = {
      timestamp: new Date().toISOString(),
      duration,
      totalProxies: allProxies.length,
      proxiesPerSecond,
      memoryUsage: memUsage,
      sourceBreakdown: bySource,
      countryBreakdown: byCountry,
      uniqueness: {
        uniqueIPs: uniqueIPs.size,
        uniqueEndpoints: uniqueEndpoints.size,
        ratio: (uniqueEndpoints.size / allProxies.length) * 100
      }
    };
    
    const fs = require('fs');
    try {
      fs.mkdirSync('results', { recursive: true });
    } catch (e) {}
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    fs.writeFileSync(
      `results/performance-test-${timestamp}.json`, 
      JSON.stringify(performanceResults, null, 2)
    );
    
    console.log(`\n💾 Resultados guardados en: results/performance-test-${timestamp}.json`);
    
  } catch (error) {
    console.error('❌ Error en test de performance:', error);
  }
  
  console.log('\n🏁 Performance test completado');
};

performanceTest().catch(console.error); 