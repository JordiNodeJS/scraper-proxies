// Test simple para verificar conectividad a las fuentes
const testSources = async () => {
  console.log('🧪 PROBANDO CONECTIVIDAD A FUENTES DE PROXIES');
  console.log('=============================================\n');

  const sources = [
    'https://www.proxy-list.download/HTTP',
    'https://www.proxy-list.download/HTTPS', 
    'https://www.freeproxylist.net/',
    'https://www.sslproxies.org/',
    'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all'
  ];

  for (const url of sources) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });

      const responseTime = Date.now() - startTime;
      const size = parseInt(response.headers.get('content-length') || '0');
      
      if (response.ok) {
        console.log(`✅ ${url}`);
        console.log(`   Status: ${response.status} | Tiempo: ${responseTime}ms | Tamaño: ${size} bytes`);
        
        // Obtener una muestra del contenido
        const sample = (await response.text()).substring(0, 200);
        console.log(`   Muestra: ${sample.replace(/\n/g, ' ').trim()}...\n`);
      } else {
        console.log(`❌ ${url}`);
        console.log(`   Status: ${response.status} ${response.statusText}\n`);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ ${url}`);
      console.log(`   Error: ${error} | Tiempo: ${responseTime}ms\n`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🏁 Test de conectividad completado!');
};

testSources().catch(console.error); 