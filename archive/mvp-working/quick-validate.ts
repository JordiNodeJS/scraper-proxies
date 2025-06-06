// Validador simple de proxies
import { chromium } from '@playwright/test';

const testProxies = async () => {
  console.log('🧪 VALIDACIÓN RÁPIDA DE PROXIES');
  console.log('===============================\n');

  // Algunos proxies del último resultado para probar
  const sampleProxies = [
    '47.76.144.139:80',
    '8.213.128.6:4006', 
    '181.78.19.142:999',
    '139.59.1.14:80',
    '57.129.81.201:8081',
    '103.154.87.12:80',
    '8.213.195.191:37',
    '167.160.89.37:8080',
    '158.255.77.168:80'
  ];

  const results: any[] = [];
  
  for (let i = 0; i < sampleProxies.length; i++) {
    const proxy = sampleProxies[i];
    console.log(`🔍 [${i + 1}/${sampleProxies.length}] Probando ${proxy}...`);
    
    const result = await testProxy(proxy);
    results.push(result);
    
    if (result.working) {
      console.log(`   ✅ FUNCIONA - ${result.site} (${result.time}ms)`);
    } else {
      console.log(`   ❌ Falla - ${result.error}`);
    }
  }

  const working = results.filter(r => r.working);
  console.log(`\n🏆 RESULTADO: ${working.length}/${results.length} proxies funcionando`);
  
  if (working.length > 0) {
    console.log('\n🚀 Proxies que funcionan:');
    working.forEach(r => {
      console.log(`   ${r.proxy} → ${r.site} (${r.time}ms)`);
    });
  }
};

const testProxy = async (proxy: string) => {
  const startTime = Date.now();
  
  try {
    const browser = await chromium.launch({
      headless: true,
      args: [
        `--proxy-server=http://${proxy}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(10000);

    // Probar con HTTPBin que es más permisivo
    const response = await page.goto('https://httpbin.org/ip', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    const time = Date.now() - startTime;
    await browser.close();

    return {
      proxy,
      working: response?.status() === 200,
      site: 'HTTPBin',
      time,
      error: null
    };

  } catch (error) {
    const time = Date.now() - startTime;
    return {
      proxy,
      working: false,
      site: 'HTTPBin', 
      time,
      error: error instanceof Error ? error.message.substring(0, 50) : 'Error desconocido'
    };
  }
};

testProxies().catch(console.error); 