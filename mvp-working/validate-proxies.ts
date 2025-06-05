import { ProxyValidator } from './src/proxy-validator.ts';
import { readdirSync } from 'fs';

async function main() {
  console.log('🎯 VALIDADOR DE PROXIES - AMAZON, GOOGLE, HTTPBIN');
  console.log('================================================\n');

  // Buscar el archivo de proxies más reciente
  try {
    const files = readdirSync('results/');
    const proxyFiles = files
      .filter(f => f.startsWith('proxies-') && f.endsWith('.txt'))
      .sort();
    
    if (proxyFiles.length === 0) {
      throw new Error('No proxy files found');
    }
    
    const latestFile = `results/${proxyFiles[proxyFiles.length - 1]}`;
  } catch (error) {
    console.error('❌ No se encontraron archivos de proxies en results/');
    console.log('💡 Ejecuta primero: bun demo.ts');
    return;
  }

  const latestFile = `results/${readdirSync('results/').filter(f => f.startsWith('proxies-') && f.endsWith('.txt')).sort().pop()}`;
  console.log(`📂 Usando archivo: ${latestFile}\n`);

  const validator = new ProxyValidator();

  // Primero una validación rápida
  console.log('1️⃣ FASE 1: Validación rápida (primeros 20 proxies)\n');
  const quickResults = await validator.quickValidation(latestFile);
  
  if (quickResults.length === 0) {
    console.log('❌ No se encontraron proxies funcionando en la validación rápida');
    console.log('💡 Los proxies obtenidos pueden ser de baja calidad o estar obsoletos');
    return;
  }

  console.log(`\n2️⃣ FASE 2: Validación completa (primeros 30 proxies) contra Amazon, Google y HTTPBin\n`);
  
  // Validación completa con menos proxies para evitar bloqueos
  const results = await validator.validateProxies(latestFile, 30);
  
  console.log('\n🎉 ¡VALIDACIÓN COMPLETADA!');
  console.log(`📊 De ${results.totalTested} proxies probados:`);
  console.log(`   ✅ ${results.workingProxies} funcionan (${results.successRate.toFixed(1)}%)`);
  console.log(`   ⏱️  Tiempo promedio: ${results.avgResponseTime}ms`);
}

main().catch(console.error); 