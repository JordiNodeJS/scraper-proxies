// Test simple de una sola fuente para diagnosticar
console.log('🔬 TEST DIAGNÓSTICO: UNA SOLA FUENTE');
console.log('===================================\n');

const testSingleSource = async () => {
  try {
    console.log('⏳ Probando ProxyScrape API...');
    
    const response = await fetch('https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=5000&format=textplain&country=all', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const text = await response.text();
      console.log(`📊 Content length: ${text.length} characters`);
      
      // Mostrar primeras líneas
      const lines = text.trim().split('\n').slice(0, 10);
      console.log(`📊 Primeras 10 líneas:`);
      lines.forEach((line, i) => {
        console.log(`   ${i + 1}. ${line}`);
      });
      
      // Contar total de líneas válidas
      const allLines = text.trim().split('\n');
      const validLines = allLines.filter(line => {
        const trimmed = line.trim();
        return trimmed && trimmed.includes(':') && trimmed.match(/\d+\.\d+\.\d+\.\d+:\d+/);
      });
      
      console.log(`📊 Total líneas: ${allLines.length}`);
      console.log(`📊 Líneas válidas: ${validLines.length}`);
      
      if (validLines.length > 0) {
        console.log(`✅ FUENTE FUNCIONANDO: ${validLines.length} proxies encontrados`);
        
        // Guardar los primeros 20 para test
        const sample = validLines.slice(0, 20);
        console.log(`\n🎯 MUESTRA (primeros 20):`);
        sample.forEach((proxy, i) => {
          console.log(`   ${i + 1}. ${proxy}`);
        });
        
      } else {
        console.log(`❌ No se encontraron proxies válidos`);
      }
      
    } else {
      console.log(`❌ Error HTTP: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
};

testSingleSource(); 