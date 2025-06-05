// Test específico para Amazon y Google con los mejores proxies
import { chromium } from '@playwright/test';

const testRealSites = async () => {
  console.log('🌐 PRUEBAS REALES: AMAZON y GOOGLE');
  console.log('==================================\n');

  // Los proxies más rápidos del scraping anterior
  const bestProxies = [
    '47.76.144.139:80',     // Estados Unidos
    '139.59.1.14:80',       // India
    '103.154.87.12:80',     // Indonesia
    '158.255.77.168:80',    // UAE
    '167.160.89.37:8080'    // Estados Unidos
  ];

  const sites = [
    { 
      name: 'Amazon', 
      url: 'https://www.amazon.com', 
      checkTitle: (title: string) => title.toLowerCase().includes('amazon')
    },
    { 
      name: 'Google', 
      url: 'https://www.google.com', 
      checkTitle: (title: string) => title.toLowerCase().includes('google')
    }
  ];

  const results: any[] = [];

  for (const proxy of bestProxies) {
    console.log(`\n🔍 Probando proxy: ${proxy}`);
    
    for (const site of sites) {
      console.log(`   → ${site.name}...`);
      
      const result = await testProxyOnSite(proxy, site);
      results.push(result);
      
      if (result.success) {
        console.log(`   ✅ ${site.name}: OK (${result.responseTime}ms) - "${result.title}"`);
      } else {
        console.log(`   ❌ ${site.name}: ${result.error}`);
      }
      
      // Esperar entre tests para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Resumen final
  console.log('\n🏆 RESUMEN DE PRUEBAS REALES');
  console.log('============================');
  
  const amazonResults = results.filter(r => r.site === 'Amazon');
  const googleResults = results.filter(r => r.site === 'Google');
  
  const amazonWorking = amazonResults.filter(r => r.success);
  const googleWorking = googleResults.filter(r => r.success);
  
  console.log(`🛒 Amazon: ${amazonWorking.length}/${amazonResults.length} proxies funcionando`);
  console.log(`🔍 Google: ${googleWorking.length}/${googleResults.length} proxies funcionando`);
  
  if (amazonWorking.length > 0) {
    console.log('\n🛒 Proxies que funcionan con Amazon:');
    amazonWorking.forEach(r => {
      console.log(`   ${r.proxy} (${r.responseTime}ms)`);
    });
  }
  
  if (googleWorking.length > 0) {
    console.log('\n🔍 Proxies que funcionan con Google:');
    googleWorking.forEach(r => {
      console.log(`   ${r.proxy} (${r.responseTime}ms)`);
    });
  }

  // Proxies universales (funcionan en ambos)
  const universalProxies = bestProxies.filter(proxy => {
    const amazonWorks = amazonWorking.some(r => r.proxy === proxy);
    const googleWorks = googleWorking.some(r => r.proxy === proxy);
    return amazonWorks && googleWorks;
  });

  if (universalProxies.length > 0) {
    console.log('\n🌟 PROXIES UNIVERSALES (Amazon + Google):');
    universalProxies.forEach(proxy => {
      console.log(`   ${proxy} ⭐`);
    });
  }
};

const testProxyOnSite = async (proxy: string, site: any) => {
  const startTime = Date.now();
  
  try {
    const browser = await chromium.launch({
      headless: true,
      args: [
        `--proxy-server=http://${proxy}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page.setDefaultTimeout(20000); // 20 segundos para sitios grandes

    const response = await page.goto(site.url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    const responseTime = Date.now() - startTime;
    const title = await page.title();
    const statusCode = response?.status() || 0;

    await browser.close();

    // Verificar si la respuesta es válida
    const success = statusCode >= 200 && statusCode < 400 && site.checkTitle(title);

    return {
      proxy,
      site: site.name,
      success,
      responseTime,
      title: title.substring(0, 50),
      statusCode,
      error: null
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      proxy,
      site: site.name,
      success: false,
      responseTime,
      title: null,
      statusCode: null,
      error: error instanceof Error ? error.message.substring(0, 100) : 'Error desconocido'
    };
  }
};

testRealSites().catch(console.error); 