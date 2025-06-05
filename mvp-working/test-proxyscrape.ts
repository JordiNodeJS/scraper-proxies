// Test de ProxyScrape URLs gratuitas
console.log('🔍 TEST PROXYSCRAPE - URLs GRATUITAS');
console.log('==================================\n');

const testProxyScrapeURLs = async () => {
  const urls = [
    // URLs posiblemente gratuitas
    'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&format=textplain&country=all',
    'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
    'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
    'https://www.proxyscan.io/download?type=http&format=txt',
    'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt'
  ];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n🔍 [${i + 1}/${urls.length}] Probando: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`📊 Content length: ${text.length} caracteres`);
        
        if (text.length > 100) { // Si tiene contenido considerable
          const lines = text.trim().split('\n');
          const validProxies = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed && trimmed.match(/^\d+\.\d+\.\d+\.\d+:\d+$/);
          });
          
          console.log(`📊 Total líneas: ${lines.length}`);
          console.log(`📊 Proxies válidos: ${validProxies.length}`);
          
          if (validProxies.length > 0) {
            console.log(`✅ FUENTE FUNCIONAL: ${validProxies.length} proxies`);
            console.log(`🎯 Ejemplos (primeros 5):`);
            validProxies.slice(0, 5).forEach((proxy, j) => {
              console.log(`   ${j + 1}. ${proxy}`);
            });
            
            // Si es la primera fuente que funciona, guardamos una muestra
            if (i === 0 || validProxies.length > 50) {
              const fs = require('fs');
              try {
                fs.mkdirSync('results', { recursive: true });
              } catch (e) {}
              
              const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
              const sample = validProxies.slice(0, 50).join('\n');
              fs.writeFileSync(`results/proxyscrape-${i + 1}-${timestamp}.txt`, sample);
              console.log(`💾 Muestra guardada en: results/proxyscrape-${i + 1}-${timestamp}.txt`);
            }
          } else {
            console.log(`⚠️  Contenido recibido pero sin proxies válidos`);
            // Mostrar muestra del contenido
            console.log(`🔍 Muestra (primeros 200 chars):`);
            console.log(text.substring(0, 200));
          }
        } else {
          console.log(`⚠️  Contenido muy corto`);
          console.log(`🔍 Contenido completo: "${text}"`);
        }
      } else {
        console.log(`❌ Error HTTP: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
    
    console.log('─'.repeat(60));
    
    // Pausa entre requests para ser respetuosos
    if (i < urls.length - 1) {
      console.log('⏳ Esperando 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🏁 Test de fuentes ProxyScrape completado');
};

testProxyScrapeURLs(); 