// Test de las fuentes que sabemos que funcionaron
console.log('🔍 TEST DE FUENTES QUE FUNCIONARON ANTES');
console.log('======================================\n');

const testWorkingSources = async () => {
  const sources = [
    {
      name: 'Proxy List Download HTTP',
      url: 'https://www.proxy-list.download/HTTP'
    },
    {
      name: 'Proxy List Download HTTPS', 
      url: 'https://www.proxy-list.download/HTTPS'
    },
    {
      name: 'ProxyScrape HTTP (formato correcto)',
      url: 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&format=textplain'
    }
  ];

  for (const source of sources) {
    console.log(`\n🔍 Probando: ${source.name}`);
    console.log(`📡 URL: ${source.url}`);
    
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.ok) {
        const content = await response.text();
        console.log(`📊 Content length: ${content.length} characters`);
        
        // Para texto plano (ProxyScrape)
        if (content.includes(':') && !content.includes('<html>')) {
          const lines = content.trim().split('\n');
          const validProxies = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed && trimmed.match(/^\d+\.\d+\.\d+\.\d+:\d+$/);
          });
          
          console.log(`📊 Total líneas: ${lines.length}`);
          console.log(`📊 Proxies válidos: ${validProxies.length}`);
          
          if (validProxies.length > 0) {
            console.log(`✅ ÉXITO: ${validProxies.length} proxies encontrados`);
            console.log(`🎯 Ejemplos:`);
            validProxies.slice(0, 5).forEach((proxy, i) => {
              console.log(`   ${i + 1}. ${proxy}`);
            });
          }
        }
        // Para HTML (proxy-list.download)
        else if (content.includes('<table>') || content.includes('<tbody>')) {
          console.log(`📊 Es HTML, contiene tabla: ${content.includes('<table>')}`);
          console.log(`📊 Contiene tbody: ${content.includes('<tbody>')}`);
          
          // Buscar patrones básicos de IP:Puerto en HTML
          const ipPortMatches = content.match(/\d+\.\d+\.\d+\.\d+:\d+/g);
          if (ipPortMatches) {
            console.log(`✅ ÉXITO: ${ipPortMatches.length} patrones IP:Puerto encontrados en HTML`);
            console.log(`🎯 Ejemplos:`);
            ipPortMatches.slice(0, 5).forEach((match, i) => {
              console.log(`   ${i + 1}. ${match}`);
            });
          } else {
            console.log(`⚠️  HTML recibido pero sin patrones IP:Puerto visibles`);
            // Mostrar parte del HTML para debug
            console.log(`🔍 Muestra HTML (primeros 500 chars):`);
            console.log(content.substring(0, 500) + '...');
          }
        }
        else {
          console.log(`⚠️  Contenido no reconocido`);
          console.log(`🔍 Muestra (primeros 200 chars):`);
          console.log(content.substring(0, 200));
        }
        
      } else {
        console.log(`❌ Error HTTP: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
    
    console.log('─'.repeat(50));
  }
};

testWorkingSources(); 