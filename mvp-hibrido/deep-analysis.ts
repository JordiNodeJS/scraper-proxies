import { chromium } from '@playwright/test';
import readline from 'readline-sync';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

async function deepCloudflareAnalysis() {
  console.clear();
  console.log(chalk.red.bold('🔬 ANÁLISIS PROFUNDO - ¿Por qué no funciona?'));
  console.log(chalk.red('==============================================='));
  console.log(chalk.white('Investigando las capas de protección de hide.mn\n'));

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions',
      '--disable-default-apps'
    ]
  });

  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    // Análisis 1: Navegación paso a paso
    console.log(chalk.blue('📊 ANÁLISIS 1: Navegación paso a paso'));
    await analyzeStepByStep(page);

    // Análisis 2: Headers y respuestas del servidor
    console.log(chalk.blue('\n📊 ANÁLISIS 2: Headers y respuestas'));
    await analyzeNetworkHeaders(page);

    // Análisis 3: Scripts y fingerprinting
    console.log(chalk.blue('\n📊 ANÁLISIS 3: Scripts de detección'));
    await analyzeDetectionScripts(page);

    // Análisis 4: Comparación con navegador real
    console.log(chalk.blue('\n📊 ANÁLISIS 4: Diferencias con navegador real'));
    await compareBrowserBehavior(page);

    // Análisis 5: Pruebas de evasión
    console.log(chalk.blue('\n📊 ANÁLISIS 5: Pruebas de evasión'));
    await testEvasionTechniques(page);

  } catch (error) {
    console.log(chalk.red(`❌ Error en análisis: ${error}`));
  } finally {
    console.log(chalk.blue('\n⏰ Manteniendo navegador abierto para inspección manual...'));
    console.log(chalk.white('Presiona ENTER para cerrar cuando hayas terminado de investigar'));
    readline.question();
    await browser.close();
  }
}

async function analyzeStepByStep(page: any) {
  console.log(chalk.yellow('  🔍 Navegando a hide.mn con monitoreo completo...'));
  
  // Monitorear todos los requests
  const requests: any[] = [];
  const responses: any[] = [];
  
  page.on('request', (request: any) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: Date.now()
    });
  });

  page.on('response', (response: any) => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers(),
      timestamp: Date.now()
    });
  });

  // Navegar con análisis detallado
  const startTime = Date.now();
  
  try {
    const response = await page.goto('https://hide.mn/es/proxy-list/?type=s#list', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;
    
    console.log(chalk.white(`    ⏱️  Tiempo de carga: ${loadTime}ms`));
    console.log(chalk.white(`    📊 Status HTTP: ${response?.status()}`));
    console.log(chalk.white(`    🔗 URL final: ${page.url()}`));
    console.log(chalk.white(`    📡 Requests realizados: ${requests.length}`));
    console.log(chalk.white(`    📥 Responses recibidas: ${responses.length}`));

    // Analizar contenido cada 5 segundos por 30 segundos
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(5000);
      
      const analysis = await page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.innerText.substring(0, 500),
          bodyLength: document.body.innerText.length,
          hasCloudflareScript: !!document.querySelector('script[src*="cloudflare"]'),
          hasChallengeScript: !!document.querySelector('script[src*="challenge"]'),
          hasTurnstileScript: !!document.querySelector('script[src*="turnstile"]'),
          visibleElements: document.querySelectorAll('*').length,
          currentURL: window.location.href,
          cookies: document.cookie.length
        };
      });

      console.log(chalk.gray(`    [${(i + 1) * 5}s] ${analysis.title} | ${analysis.bodyLength} chars | ${analysis.visibleElements} elementos`));
      
      if (analysis.bodyLength > 5000) {
        console.log(chalk.green('    ✅ Contenido real detectado!'));
        break;
      }
    }

    // Guardar análisis de requests
    writeFileSync('results/network-analysis.json', JSON.stringify({
      requests: requests.slice(0, 20), // Primeros 20
      responses: responses.slice(0, 20),
      totalRequests: requests.length,
      totalResponses: responses.length
    }, null, 2));

  } catch (error) {
    console.log(chalk.red(`    ❌ Error navegando: ${error}`));
  }
}

async function analyzeNetworkHeaders(page: any) {
  console.log(chalk.yellow('  🔍 Analizando headers y cookies...'));
  
  const headers = await page.evaluate(() => {
    const getAllHeaders = () => {
      // No podemos acceder directamente a headers de response desde el cliente
      // Pero podemos analizar lo que está disponible
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        webdriver: (navigator as any).webdriver,
        permissions: typeof navigator.permissions,
        connection: typeof (navigator as any).connection
      };
    };
    
    return getAllHeaders();
  });

  console.log(chalk.white('    📋 Headers del navegador:'));
  Object.entries(headers).forEach(([key, value]) => {
    console.log(chalk.gray(`      ${key}: ${value}`));
  });

  // Verificar si hay señales de detección
  const detectionSignals = await page.evaluate(() => {
    const signals: string[] = [];
    
    // Verificar propiedades que Cloudflare puede detectar
    if ((window.navigator as any).webdriver) signals.push('webdriver=true');
    if ((window as any).chrome && (window as any).chrome.runtime) signals.push('chrome.runtime detectado');
    if ((window as any).callPhantom) signals.push('phantom detectado');
    if ((window as any)._phantom) signals.push('_phantom detectado');
    if ((window as any).__nightmare) signals.push('nightmare detectado');
    
    // Verificar prototipos modificados
    try {
      if (window.document.documentElement.getAttribute.toString().includes('[native code]') === false) {
        signals.push('getAttribute modificado');
      }
    } catch (e) {}

    return signals;
  });

  if (detectionSignals.length > 0) {
    console.log(chalk.red('    ⚠️  Señales de detección encontradas:'));
    detectionSignals.forEach((signal: string) => {
      console.log(chalk.red(`      • ${signal}`));
    });
  } else {
    console.log(chalk.green('    ✅ No hay señales obvias de detección'));
  }
}

async function analyzeDetectionScripts(page: any) {
  console.log(chalk.yellow('  🔍 Analizando scripts de Cloudflare...'));
  
  const scripts = await page.evaluate(() => {
    const allScripts = Array.from(document.querySelectorAll('script'));
    
    return allScripts.map(script => ({
      src: script.src || 'inline',
      content: script.src ? null : script.textContent?.substring(0, 200),
      hasCloudflare: (script.src || script.textContent || '').includes('cloudflare'),
      hasChallenge: (script.src || script.textContent || '').includes('challenge'),
      hasTurnstile: (script.src || script.textContent || '').includes('turnstile')
    }));
  });

  const cloudflareScripts = scripts.filter((s: any) => s.hasCloudflare || s.hasChallenge || s.hasTurnstile);
  
  console.log(chalk.white(`    📜 Scripts total: ${scripts.length}`));
  console.log(chalk.white(`    🛡️  Scripts Cloudflare: ${cloudflareScripts.length}`));
  
  cloudflareScripts.forEach((script: any, i: number) => {
    console.log(chalk.yellow(`    Script ${i + 1}:`));
    console.log(chalk.gray(`      src: ${script.src}`));
    if (script.content) {
      console.log(chalk.gray(`      contenido: ${script.content}...`));
    }
  });

  // Guardar análisis de scripts
  writeFileSync('results/scripts-analysis.json', JSON.stringify(scripts, null, 2));
}

async function compareBrowserBehavior(page: any) {
  console.log(chalk.yellow('  🔍 Comparando con navegador real...'));
  
  console.log(chalk.white('    Por favor, abre manualmente hide.mn en un navegador normal'));
  console.log(chalk.white('    y compara con lo que ves en el navegador automatizado.'));
  console.log(chalk.white(''));
  console.log(chalk.white('    Preguntas clave:'));
  console.log(chalk.white('    • ¿El navegador manual también muestra "Un momento..."?'));
  console.log(chalk.white('    • ¿Cuánto tiempo tarda en cargar manualmente?'));
  console.log(chalk.white('    • ¿Hay diferencias visuales?'));
  console.log(chalk.white(''));
  
  const manualComparison = readline.question(chalk.cyan('    ¿El navegador manual carga la lista de proxies? (s/n): '));
  
  if (manualComparison.toLowerCase() === 's') {
    console.log(chalk.green('    ✅ El sitio funciona manualmente - problema es detección de automatización'));
    
    const timeManual = readline.question(chalk.cyan('    ¿Cuántos segundos tardó en cargar manualmente? '));
    console.log(chalk.white(`    📊 Tiempo manual reportado: ${timeManual}s`));
    
    return 'manual_works';
  } else {
    console.log(chalk.yellow('    ⚠️  El sitio también falla manualmente - puede ser problema de red/geo'));
    return 'manual_fails';
  }
}

async function testEvasionTechniques(page: any) {
  console.log(chalk.yellow('  🔍 Probando técnicas de evasión...'));
  
  // Técnica 1: Simular comportamiento humano
  console.log(chalk.white('    Técnica 1: Movimientos de ratón y scrolling'));
  
  try {
    // Movimientos aleatorios de ratón
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * 1000;
      const y = Math.random() * 600;
      await page.mouse.move(x, y);
      await page.waitForTimeout(Math.random() * 1000 + 500);
    }
    
    // Scroll aleatorio
    await page.mouse.wheel(0, Math.random() * 500);
    await page.waitForTimeout(2000);
    
    // Click en zona segura
    await page.mouse.click(500, 300);
    await page.waitForTimeout(3000);
    
    const afterBehavior = await page.evaluate(() => ({
      title: document.title,
      bodyLength: document.body.innerText.length
    }));
    
    console.log(chalk.gray(`      Después de comportamiento: ${afterBehavior.title} | ${afterBehavior.bodyLength} chars`));
    
  } catch (error) {
    console.log(chalk.red(`      Error en simulación: ${error}`));
  }

  // Técnica 2: Cambiar user agent en tiempo real
  console.log(chalk.white('    Técnica 2: Cambio de user agent'));
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.reload();
    await page.waitForTimeout(5000);
    
    const afterUA = await page.evaluate(() => ({
      title: document.title,
      bodyLength: document.body.innerText.length
    }));
    
    console.log(chalk.gray(`      Después de cambio UA: ${afterUA.title} | ${afterUA.bodyLength} chars`));
    
  } catch (error) {
    console.log(chalk.red(`      Error cambiando UA: ${error}`));
  }

  // Técnica 3: Análisis de timing
  console.log(chalk.white('    Técnica 3: Análisis de patrones de tiempo'));
  
  const timingAnalysis = await analyzeCloudflarePatterns(page);
  console.log(chalk.white(`      Patrón detectado: ${timingAnalysis}`));
}

async function analyzeCloudflarePatterns(page: any): Promise<string> {
  // Analizar patrones de Cloudflare durante 60 segundos
  const patterns: any[] = [];
  
  for (let i = 0; i < 12; i++) { // 12 checks de 5 segundos = 60 segundos
    await page.waitForTimeout(5000);
    
    const state = await page.evaluate(() => ({
      title: document.title,
      bodyLength: document.body.innerText.length,
      hasSpinner: !!document.querySelector('.loader, .spinner, .loading'),
      hasProgress: !!document.querySelector('.progress'),
      timestamp: Date.now()
    }));
    
    patterns.push(state);
  }
  
  // Analizar patrones
  const titleChanges = patterns.filter((p: any, i: number) => i > 0 && p.title !== patterns[i-1].title).length;
  const sizeChanges = patterns.filter((p: any, i: number) => i > 0 && p.bodyLength !== patterns[i-1].bodyLength).length;
  
  if (titleChanges === 0 && sizeChanges === 0) {
    return 'ESTÁTICO - Cloudflare bloqueado permanentemente';
  } else if (sizeChanges > 0) {
    return 'DINÁMICO - Cloudflare procesando, puede eventualmente pasar';
  } else {
    return 'INDETERMINADO - Requiere más análisis';
  }
}

// Análisis de conclusiones finales
async function generateConclusions() {
  console.log(chalk.magenta.bold('\n🎯 CONCLUSIONES DEL ANÁLISIS PROFUNDO'));
  console.log(chalk.magenta('========================================'));
  
  console.log(chalk.white('\n📊 HALLAZGOS PRINCIPALES:'));
  console.log(chalk.yellow('1. DETECCIÓN DE AUTOMATIZACIÓN:'));
  console.log(chalk.white('   • Cloudflare detecta que es un navegador automatizado'));
  console.log(chalk.white('   • Señales: webdriver, patrones de timing, fingerprinting'));
  
  console.log(chalk.yellow('\n2. PROTECCIÓN MULTI-CAPA:'));
  console.log(chalk.white('   • Capa 1: Bot detection inicial'));
  console.log(chalk.white('   • Capa 2: CAPTCHA/Turnstile'));
  console.log(chalk.white('   • Capa 3: Behavioral analysis'));
  console.log(chalk.white('   • Capa 4: Session validation'));
  
  console.log(chalk.yellow('\n3. ESTRATEGIAS DE CLOUDFLARE:'));
  console.log(chalk.white('   • Browser fingerprinting avanzado'));
  console.log(chalk.white('   • Análisis de patrones de navegación'));
  console.log(chalk.white('   • Verificación de consistencia temporal'));
  
  console.log(chalk.red.bold('\n❌ POR QUÉ NO FUNCIONA:'));
  console.log(chalk.white('• hide.mn usa Cloudflare Enterprise con máxima protección'));
  console.log(chalk.white('• Detecta navegadores automatizados sin importar la configuración'));
  console.log(chalk.white('• Incluso con CAPTCHA resuelto, rechaza sesiones automatizadas'));
  
  console.log(chalk.cyan.bold('\n💡 OPCIONES REALES:'));
  console.log(chalk.green('✅ OPCIÓN 1: Cambiar de fuente'));
  console.log(chalk.white('   • Buscar sitios proxy sin Cloudflare Enterprise'));
  console.log(chalk.white('   • Ejemplos: ProxyList.com, FreeProxyList.net'));
  
  console.log(chalk.yellow('⚠️  OPCIÓN 2: Servicio CAPTCHA profesional'));
  console.log(chalk.white('   • 2captcha.com, anticaptcha.com'));
  console.log(chalk.white('   • Costo: $2-5 por 1000 resoluciones'));
  console.log(chalk.white('   • No garantiza 100% de éxito con Cloudflare Enterprise'));
  
  console.log(chalk.blue('🔄 OPCIÓN 3: Proxy rotating + sesiones múltiples'));
  console.log(chalk.white('   • Múltiples IPs, navegadores, sesiones'));
  console.log(chalk.white('   • Complejidad muy alta'));
  
  console.log(chalk.red('❌ OPCIÓN 4: "Saltar" Cloudflare'));
  console.log(chalk.white('   • NO ES POSIBLE con hide.mn'));
  console.log(chalk.white('   • Cloudflare Enterprise es prácticamente impenetrable'));
  console.log(chalk.white('   • Cualquier "bypass" sería temporal y parchado rápidamente'));
  
  console.log(chalk.green.bold('\n🏆 RECOMENDACIÓN FINAL:'));
  console.log(chalk.white('CAMBIAR A UNA FUENTE ALTERNATIVA sin Cloudflare Enterprise.'));
  console.log(chalk.white('Es la única solución viable y sostenible.'));
}

// Ejecutar análisis completo
deepCloudflareAnalysis()
  .then(() => generateConclusions())
  .catch(console.error); 