// Verificar que los proxies realmente cambien la IP visible
import { chromium } from '@playwright/test';

const testIPVerification = async () => {
  console.log('🔍 VERIFICACIÓN DE IPs - ¿Los proxies realmente funcionan?');
  console.log('=======================================================\n');

  // Primero obtener IP real sin proxy
  console.log('1️⃣ Obteniendo IP real (sin proxy)...');
  const realIP = await getIPAddress(null);
  console.log(`   🏠 IP real: ${realIP}\n`);

  // Proxies más prometedores para probar
  const testProxies = [
    '47.76.144.139:80',
    '139.59.1.14:80', 
    '103.154.87.12:80',
    '158.255.77.168:80',
    '167.160.89.37:8080',
    '8.213.128.6:4006',
    '57.129.81.201:8081'
  ];

  console.log('2️⃣ Probando proxies...\n');
  
  const workingProxies: any[] = [];
  
  for (let i = 0; i < testProxies.length; i++) {
    const proxy = testProxies[i];
    console.log(`🔍 [${i + 1}/${testProxies.length}] Probando ${proxy}...`);
    
    const result = await getIPAddress(proxy);
    
    if (result.success) {
      const ipChanged = result.ip !== realIP;
      if (ipChanged) {
        console.log(`   ✅ FUNCIONA: ${result.ip} (${result.responseTime}ms) - IP CAMBIADA`);
        workingProxies.push({
          proxy,
          newIP: result.ip,
          responseTime: result.responseTime,
          location: await getIPLocation(result.ip)
        });
      } else {
        console.log(`   ⚠️  PROBLEMA: ${result.ip} (misma IP que real)`);
      }
    } else {
      console.log(`   ❌ FALLA: ${result.error}`);
    }
  }

  // Resumen final
  console.log('\n🏆 RESUMEN DE VERIFICACIÓN');
  console.log('==========================');
  console.log(`🏠 IP original: ${realIP}`);
  console.log(`✅ Proxies funcionando: ${workingProxies.length}/${testProxies.length}`);
  
  if (workingProxies.length > 0) {
    console.log('\n🌍 PROXIES VERIFICADOS (con nuevas IPs):');
    workingProxies.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.proxy} → ${p.newIP} (${p.responseTime}ms)`);
      if (p.location) {
        console.log(`      📍 ${p.location}`);
      }
    });
    
    // Guardar proxies verificados
    const fs = require('fs');
    try {
      fs.mkdirSync('results', { recursive: true });
    } catch (e) {}
    
    const verifiedList = workingProxies.map(p => p.proxy).join('\n');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    fs.writeFileSync(`results/verified-proxies-${timestamp}.txt`, verifiedList);
    
    console.log(`\n💾 Proxies verificados guardados en: results/verified-proxies-${timestamp}.txt`);
  } else {
    console.log('\n❌ No se encontraron proxies funcionando correctamente');
  }
};

const getIPAddress = async (proxy: string | null) => {
  const startTime = Date.now();
  
  try {
    const args = ['--no-sandbox', '--disable-setuid-sandbox'];
    if (proxy) {
      args.push(`--proxy-server=http://${proxy}`);
    }

    const browser = await chromium.launch({
      headless: true,
      args
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(15000);

    const response = await page.goto('https://httpbin.org/ip', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    const responseTime = Date.now() - startTime;
    const content = await page.textContent('body');
    await browser.close();

    if (response?.status() === 200 && content) {
      try {
        const data = JSON.parse(content);
        return {
          success: true,
          ip: data.origin,
          responseTime,
          error: null
        };
      } catch (e) {
        return {
          success: false,
          ip: null,
          responseTime,
          error: 'No se pudo parsear JSON'
        };
      }
    } else {
      return {
        success: false,
        ip: null,
        responseTime,
        error: `HTTP ${response?.status() || 'unknown'}`
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      ip: null,
      responseTime,
      error: error instanceof Error ? error.message.substring(0, 50) : 'Error desconocido'
    };
  }
};

const getIPLocation = async (ip: string): Promise<string | null> => {
  try {
    // Usar un servicio gratuito para obtener ubicación aproximada
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (response.ok) {
      const data = await response.json();
      return `${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`;
    }
  } catch (error) {
    // Si falla el servicio de geolocalización, no es crítico
  }
  return null;
};

testIPVerification().catch(console.error); 