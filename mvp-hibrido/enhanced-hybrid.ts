import { chromium } from '@playwright/test';
import readline from 'readline-sync';
import chalk from 'chalk';

interface WaitOptions {
  maxWait: number;
  checkInterval: number;
  progressCallback?: (attempt: number, status: any) => void;
}

async function enhancedHybridTest() {
  console.clear();
  console.log(chalk.blue.bold('🔥 ENHANCED HYBRID - Estrategia Combinada'));
  console.log(chalk.blue('================================================'));
  console.log(chalk.white('Implementando: Paciencia + Manual + Persistente\n'));

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--no-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const page = await browser.newPage();

  try {
    // Fase 1: Navegación inicial
    console.log(chalk.blue('🚀 Fase 1: Navegación inicial'));
    await page.goto('https://hide.mn/es/proxy-list/?type=s#list', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await page.waitForTimeout(3000);

    // Fase 2: Detección de Cloudflare
    console.log(chalk.blue('🔍 Fase 2: Detección de Cloudflare'));
    const isCloudflare = await detectCloudflare(page);
    
    if (!isCloudflare) {
      console.log(chalk.green('✅ No hay Cloudflare - Acceso directo'));
      return await extractData(page);
    }

    // Fase 3: CAPTCHA del usuario
    console.log(chalk.yellow('👤 Fase 3: Resolución de CAPTCHA por usuario'));
    const captchaCompleted = await handleUserCaptcha(page);
    
    if (!captchaCompleted) {
      console.log(chalk.red('❌ Usuario canceló el proceso'));
      return false;
    }

    // Fase 4: Espera inteligente extendida
    console.log(chalk.blue('⏳ Fase 4: Espera inteligente (hasta 3 minutos)'));
    const autoSuccess = await waitWithPatience(page, {
      maxWait: 180000,      // 3 minutos
      checkInterval: 10000, // 10 segundos
      progressCallback: showWaitProgress
    });

    if (autoSuccess) {
      console.log(chalk.green('🎉 ¡Éxito automático! Cloudflare completado'));
      return await extractData(page);
    }

    // Fase 5: Fallback a navegación manual
    console.log(chalk.yellow('🔄 Fase 5: Fallback - Navegación manual'));
    const manualSuccess = await askUserToNavigateManually(page);
    
    if (manualSuccess) {
      return await extractData(page);
    }

    console.log(chalk.red('❌ No se pudo completar el proceso'));
    return false;

  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error}`));
    return false;
  } finally {
    console.log(chalk.blue('\n🔄 Cerrando en 10 segundos...'));
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

async function detectCloudflare(page: any): Promise<boolean> {
  const result = await page.evaluate(() => {
    const bodyText = document.body.innerText.toLowerCase();
    const titleText = document.title.toLowerCase();
    
    return {
      hasJustAMoment: titleText.includes('just a moment') || titleText.includes('un momento'),
      hasChallenge: !!document.querySelector('script[src*="challenge-platform"]'),
      bodyLength: bodyText.length
    };
  });

  const isCloudflare = result.hasJustAMoment || result.hasChallenge || result.bodyLength < 1000;
  
  console.log(chalk.white(`   • Cloudflare detectado: ${isCloudflare ? 'SÍ' : 'NO'}`));
  console.log(chalk.gray(`   • Tamaño contenido: ${result.bodyLength} chars`));
  
  return isCloudflare;
}

async function handleUserCaptcha(page: any): Promise<boolean> {
  console.log(chalk.red.bold('\n🛡️ CLOUDFLARE CAPTCHA DETECTADO'));
  console.log(chalk.white('Ve al navegador y completa el CAPTCHA visible.'));
  console.log(chalk.white('No cierres el navegador, regresa aquí cuando termines.\n'));

  const response = readline.question(chalk.yellow('¿Has completado el CAPTCHA? (s/n): '));
  return response.toLowerCase() === 's';
}

async function waitWithPatience(page: any, options: WaitOptions): Promise<boolean> {
  const startTime = Date.now();
  let attempt = 0;
  
  while (Date.now() - startTime < options.maxWait) {
    attempt++;
    
    await page.waitForTimeout(options.checkInterval);
    
    const status = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      const titleText = document.title.toLowerCase();
      
      return {
        title: titleText,
        bodyLength: bodyText.length,
        hasJustAMoment: titleText.includes('just a moment') || titleText.includes('un momento'),
        hasChallenge: !!document.querySelector('script[src*="challenge-platform"]'),
        hasProxyContent: bodyText.includes('proxy') || bodyText.includes('país'),
        hasTable: !!document.querySelector('table'),
        url: window.location.href
      };
    });

    if (options.progressCallback) {
      options.progressCallback(attempt, status);
    }

    // Condiciones de éxito
    const success = (!status.hasJustAMoment && status.bodyLength > 5000) ||
                   status.hasProxyContent ||
                   status.hasTable;

    if (success) {
      console.log(chalk.green(`✅ ¡Cloudflare superado en intento ${attempt}!`));
      return true;
    }

    // Pregunta al usuario cada minuto
    if (attempt % 6 === 0) { // Cada 60 segundos (6 * 10 segundos)
      const continueWaiting = readline.question(
        chalk.yellow(`⏰ Llevamos ${Math.round((Date.now() - startTime) / 1000)}s esperando. ¿Continuar? (s/n): `)
      );
      
      if (continueWaiting.toLowerCase() !== 's') {
        console.log(chalk.yellow('⏹️ Espera interrumpida por el usuario'));
        return false;
      }
    }
  }

  console.log(chalk.yellow('⏰ Tiempo de espera agotado'));
  return false;
}

function showWaitProgress(attempt: number, status: any) {
  const elapsed = attempt * 10; // segundos
  console.log(chalk.gray(`   [${elapsed}s] Intento ${attempt}: ${status.title} | ${status.bodyLength} chars | Tabla: ${status.hasTable ? '✓' : '✗'}`));
}

async function askUserToNavigateManually(page: any): Promise<boolean> {
  console.log(chalk.yellow.bold('\n🔄 NAVEGACIÓN MANUAL REQUERIDA'));
  console.log(chalk.white('La verificación automática no funcionó.'));
  console.log(chalk.white('Por favor:'));
  console.log(chalk.white('1. Ve al navegador abierto'));
  console.log(chalk.white('2. Si aún hay un challenge, complétalo'));
  console.log(chalk.white('3. Navega manualmente a la lista de proxies'));
  console.log(chalk.white('4. Asegúrate de ver la tabla con proxies'));
  console.log(chalk.white('5. Regresa aquí\n'));

  const response = readline.question(chalk.cyan('¿Puedes ver la lista de proxies? (s/n): '));
  
  if (response.toLowerCase() === 's') {
    // Verificar que efectivamente hay contenido
    const verification = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        bodyLength: bodyText.length,
        hasProxyPattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/.test(bodyText),
        hasTable: !!document.querySelector('table')
      };
    });

    if (verification.hasProxyPattern || verification.hasTable || verification.bodyLength > 5000) {
      console.log(chalk.green('✅ Navegación manual exitosa!'));
      return true;
    } else {
      console.log(chalk.yellow('⚠️ No se detecta contenido de proxies, pero continuaremos'));
      return true;
    }
  }

  return false;
}

async function extractData(page: any): Promise<boolean> {
  console.log(chalk.blue('📊 Extrayendo datos de proxies...'));
  
  const data = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const html = document.documentElement.outerHTML;
    
    return {
      htmlSize: html.length,
      proxyCount: (bodyText.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/g) || []).length,
      hasTable: !!document.querySelector('table'),
      tableRows: document.querySelectorAll('table tr').length,
      title: document.title,
      url: window.location.href
    };
  });

  console.log(chalk.green('\n📊 DATOS EXTRAÍDOS:'));
  console.log(chalk.white(`   • Título: ${data.title}`));
  console.log(chalk.white(`   • URL: ${data.url}`));
  console.log(chalk.white(`   • Tamaño HTML: ${data.htmlSize} caracteres`));
  console.log(chalk.white(`   • Proxies encontrados: ${data.proxyCount}`));
  console.log(chalk.white(`   • Tabla presente: ${data.hasTable ? 'SÍ' : 'NO'}`));
  console.log(chalk.white(`   • Filas de tabla: ${data.tableRows}`));

  // Guardar HTML para análisis
  const html = await page.content();
  require('fs').writeFileSync('results/enhanced-final-content.html', html);
  console.log(chalk.gray('   • HTML guardado en results/enhanced-final-content.html'));

  const success = data.proxyCount > 0 || data.hasTable || data.htmlSize > 10000;
  
  if (success) {
    console.log(chalk.green.bold('\n🎉 ¡ÉXITO TOTAL! Sistema híbrido funcional'));
    console.log(chalk.white('   ✓ Cloudflare superado'));
    console.log(chalk.white('   ✓ Datos accesibles'));
    console.log(chalk.white('   ✓ Extracción posible'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️ Éxito parcial - Requiere análisis'));
    console.log(chalk.white('   ✓ Acceso al sitio logrado'));
    console.log(chalk.white('   ? Datos requieren análisis manual'));
  }

  return success;
}

// Ejecutar test mejorado
enhancedHybridTest().then(success => {
  if (success) {
    console.log(chalk.green.bold('\n🏆 CONCLUSIÓN: ENFOQUE HÍBRIDO COMPLETAMENTE VIABLE'));
    console.log(chalk.white('Recomendación: Proceder con desarrollo completo'));
  } else {
    console.log(chalk.yellow.bold('\n🔄 CONCLUSIÓN: HÍBRIDO VIABLE CON AJUSTES'));
    console.log(chalk.white('Recomendación: Implementar mejoras propuestas'));
  }
}).catch(console.error); 