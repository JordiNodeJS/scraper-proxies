/**
 * 🚀 Quick Test - Conectividad hide.mn
 * 
 * Script rápido para probar si podemos acceder a hide.mn
 * antes de implementar el MVP completo.
 * 
 * Uso: bun run quick-test.js
 */

const TEST_URL = 'https://hide.mn/es/proxy-list/?type=s#list';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

console.log('🔍 Test de conectividad rápida a hide.mn\n');

async function testConnectivity() {
  const startTime = Date.now();
  
  try {
    const response = await fetch(TEST_URL, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive'
      },
      signal: AbortSignal.timeout(10000)
    });

    const responseTime = Date.now() - startTime;
    
    console.log(`📊 RESULTADOS DEL TEST:`);
    console.log(`=======================`);
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Tiempo de respuesta: ${responseTime}ms`);
    console.log(`📋 Headers relevantes:`);
    
    // Headers importantes para detectar protecciones
    const relevantHeaders = [
      'server',
      'x-powered-by',
      'cf-ray',
      'set-cookie',
      'content-type',
      'content-length'
    ];
    
    relevantHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        console.log(`   ${header}: ${value}`);
      }
    });

    const data = await response.text();
    console.log(`\n📄 Contenido recibido: ${data.length} caracteres`);
    
    // Análisis básico del contenido
    const analysis = analyzeContent(data);
    
    console.log(`\n🔍 ANÁLISIS BÁSICO:`);
    console.log(`==================`);
    console.log(`Contiene 'proxy': ${analysis.hasProxy ? '✅ SÍ' : '❌ NO'}`);
    console.log(`Contiene tabla: ${analysis.hasTable ? '✅ SÍ' : '❌ NO'}`);
    console.log(`Contiene Cloudflare: ${analysis.hasCloudflare ? '⚠️ SÍ' : '✅ NO'}`);
    console.log(`Contiene JavaScript heavy: ${analysis.hasHeavyJS ? '⚠️ SÍ' : '✅ NO'}`);
    
    console.log(`\n🎯 CONCLUSIÓN:`);
    console.log(`==============`);
    
    if (response.ok && analysis.hasProxy && analysis.hasTable && !analysis.hasCloudflare) {
      console.log(`✅ EXCELENTE: La página es accesible y scrapeable`);
      console.log(`✅ Recomendación: Proceder con el MVP completo`);
    } else if (response.ok && analysis.hasProxy) {
      console.log(`🟡 POSIBLE: La página es accesible pero puede requerir estrategias especiales`);
      console.log(`🟡 Recomendación: Implementar MVP con precauciones`);
    } else {
      console.log(`❌ PROBLEMÁTICO: Pueden existir bloqueos o protecciones`);
      console.log(`❌ Recomendación: Investigar alternativas o usar Playwright desde el inicio`);
    }

  } catch (error) {
    console.error(`❌ Error de conectividad:`, error.message);
    console.log(`\n🔧 Posibles soluciones:`);
    console.log(`- Verificar conexión a internet`);
    console.log(`- Probar desde otro IP/red`);
    console.log(`- Usar proxy para la conexión inicial`);
    console.log(`- Implementar delay antes del scraping`);
    
    if (error.name === 'TimeoutError') {
      console.log(`- La página es lenta, aumentar timeout`);
    }
  }
}

function analyzeContent(html) {
  const content = html.toLowerCase();
  
  return {
    hasProxy: content.includes('proxy') || content.includes('ip') && content.includes('port'),
    hasTable: content.includes('<table') || content.includes('table'),
    hasCloudflare: content.includes('cloudflare') || content.includes('cf-ray') || content.includes('__cf_bm'),
    hasHeavyJS: content.includes('react') || content.includes('angular') || content.includes('vue') || 
                content.match(/<script[^>]*>/g)?.length > 5
  };
}

// Ejecutar test
testConnectivity().catch(console.error); 