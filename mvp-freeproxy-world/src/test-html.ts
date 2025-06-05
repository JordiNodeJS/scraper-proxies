import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

async function testFreeproxyWorldStructure() {
  console.log('🌐 Analizando estructura de freeproxy.world...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📡 Navegando a freeproxy.world...');
    await page.goto('https://www.freeproxy.world/?type=https&anonymity=&country=&speed=500&port=&page=1', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏳ Esperando contenido...');
    await page.waitForTimeout(3000);
    
    // Capturar HTML completo
    const html = await page.content();
    writeFileSync('freeproxy-world-html.html', html);
    console.log('💾 HTML guardado en freeproxy-world-html.html');
    
    // Buscar tabla de proxies
    const tableExists = await page.locator('table').count();
    console.log(`📊 Tablas encontradas: ${tableExists}`);
    
    if (tableExists > 0) {
      // Analizar filas de la tabla
      const rows = await page.locator('table tr').count();
      console.log(`📋 Filas de tabla: ${rows}`);
      
      // Intentar extraer algunos proxies de ejemplo
      const firstRowData = await page.locator('table tr').nth(1).textContent();
      console.log(`🔍 Primera fila: ${firstRowData}`);
      
      // Buscar patrones de IP
      const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
      const ips = html.match(ipPattern);
      console.log(`🌐 IPs encontradas: ${ips?.length || 0}`);
      if (ips && ips.length > 0) {
        console.log(`📍 Primeras 5 IPs: ${ips.slice(0, 5).join(', ')}`);
      }
    }
    
    // Buscar elementos específicos
    const selectors = [
      'table.layui-table',
      '.layui-table tbody tr',
      '[data-field="ip"]',
      '[data-field="port"]',
      '.proxy-list',
      '.proxy-item'
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`🎯 ${selector}: ${count} elementos`);
    }
    
    console.log('✅ Análisis completado');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testFreeproxyWorldStructure(); 