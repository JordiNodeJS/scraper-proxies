import { chromium } from '@playwright/test';
import readline from 'readline-sync';
import chalk from 'chalk';

async function testHybridConcept() {
  console.clear();
  console.log(chalk.blue.bold('🧪 TEST RÁPIDO - CONCEPTO HÍBRIDO'));
  console.log(chalk.blue('====================================='));
  console.log(chalk.white('Probando si podemos detectar Cloudflare y dar control al usuario\n'));

  console.log(chalk.blue('🚀 Iniciando navegador...'));
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log(chalk.blue('🔍 Navegando a hide.mn...'));
    
    await page.goto('https://hide.mn/es/proxy-list/?type=s#list', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await page.waitForTimeout(3000);

    const title = await page.title();
    console.log(chalk.white(`📄 Título de página: ${title}`));

    // Detectar Cloudflare (mejorado)
    const hasCloudflare = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      const titleText = document.title.toLowerCase();
      
      return {
        title: titleText,
        hasJustAMoment: titleText.includes('just a moment') || titleText.includes('un momento'),
        hasVerifyHuman: bodyText.includes('verify you are human') || bodyText.includes('verificar que eres humano'),
        hasTurnstile: bodyText.includes('turnstile'),
        hasCloudflare: bodyText.includes('cloudflare'),
        hasChallenge: !!document.querySelector('script[src*="challenge-platform"]'),
        hasHideMnText: bodyText.includes('hide.mn necesit'),
        bodyLength: bodyText.length,
        sample: bodyText.substring(0, 200)
      };
    });

    console.log(chalk.yellow('🔍 Análisis de Cloudflare:'));
    console.log(`   Título: ${hasCloudflare.title}`);
    console.log(`   "Just a moment/Un momento": ${hasCloudflare.hasJustAMoment}`);
    console.log(`   "Verify human": ${hasCloudflare.hasVerifyHuman}`);
    console.log(`   Turnstile: ${hasCloudflare.hasTurnstile}`);
    console.log(`   Cloudflare text: ${hasCloudflare.hasCloudflare}`);
    console.log(`   Challenge script: ${hasCloudflare.hasChallenge}`);
    console.log(`   Hide.mn text: ${hasCloudflare.hasHideMnText}`);
    console.log(`   Body length: ${hasCloudflare.bodyLength}`);
    console.log(`   Muestra: ${hasCloudflare.sample}`);

    const isCloudflareChallenge = hasCloudflare.hasJustAMoment || 
                                  hasCloudflare.hasVerifyHuman || 
                                  hasCloudflare.hasTurnstile ||
                                  hasCloudflare.hasChallenge ||
                                  (hasCloudflare.hasHideMnText && hasCloudflare.bodyLength < 500);

    if (isCloudflareChallenge) {
      console.log(chalk.red.bold('\n🛡️ CLOUDFLARE DETECTADO'));
      console.log(chalk.white('El navegador permanece abierto. Ve al navegador y completa el CAPTCHA.'));
      
      const response = readline.question(chalk.yellow('\n¿Has completado el CAPTCHA? (s/n): '));
      
             if (response.toLowerCase() === 's') {
         console.log(chalk.green('✅ Usuario reporta CAPTCHA completado'));
         
         // Proceso de verificación mejorado con múltiples intentos
         console.log(chalk.blue('🔄 Iniciando verificación automática...'));
         
         let attempts = 0;
         const maxAttempts = 15; // Hasta 30 segundos de espera
         let cloudflareCleared = false;
         
         while (attempts < maxAttempts && !cloudflareCleared) {
           attempts++;
           console.log(chalk.gray(`   Intento ${attempts}/${maxAttempts} - Esperando 2 segundos...`));
           
           await page.waitForTimeout(2000);
           
           const verification = await page.evaluate(() => {
             const bodyText = document.body.innerText.toLowerCase();
             const titleText = document.title.toLowerCase();
             
             return {
               title: titleText,
               hasJustAMoment: titleText.includes('just a moment') || titleText.includes('un momento'),
               hasVerifying: bodyText.includes('verificando') || bodyText.includes('verifying'),
               hasWaiting: bodyText.includes('esperando') || bodyText.includes('waiting'),
               hasChallenge: !!document.querySelector('script[src*="challenge-platform"]'),
               bodyLength: bodyText.length,
               hasProxyContent: bodyText.includes('proxy') && bodyText.includes('país'),
               hasTable: !!document.querySelector('table'),
               url: window.location.href
             };
           });
           
           console.log(chalk.gray(`      • Título: ${verification.title}`));
           console.log(chalk.gray(`      • Tamaño: ${verification.bodyLength} chars`));
           console.log(chalk.gray(`      • Tabla: ${verification.hasTable ? 'SÍ' : 'NO'}`));
           console.log(chalk.gray(`      • Contenido proxy: ${verification.hasProxyContent ? 'SÍ' : 'NO'}`));
           
           // Múltiples condiciones para determinar si Cloudflare fue superado
           const indicators = {
             noJustMoment: !verification.hasJustAMoment,
             noVerifying: !verification.hasVerifying,
             noWaiting: !verification.hasWaiting,
             noChallenge: !verification.hasChallenge,
             hasContent: verification.bodyLength > 5000,
             hasProxyData: verification.hasProxyContent || verification.hasTable
           };
           
           console.log(chalk.gray(`      • Indicadores: ${Object.entries(indicators).map(([k,v]) => `${k}:${v?'✓':'✗'}`).join(' ')}`));
           
           // Consideramos que Cloudflare fue superado si se cumplen varias condiciones
           if ((indicators.noJustMoment && indicators.hasContent) || 
               indicators.hasProxyData ||
               (indicators.noChallenge && indicators.hasContent && indicators.noVerifying)) {
             
             cloudflareCleared = true;
             console.log(chalk.green.bold('🎉 ¡ÉXITO! Cloudflare completamente superado'));
             break;
           }
           
           // Si llevamos mucho tiempo, preguntar al usuario
           if (attempts === 8) {
             console.log(chalk.yellow('\n⏰ La verificación está tomando más tiempo del esperado...'));
             const waitMore = readline.question(chalk.yellow('¿Continuar esperando? (s/n): '));
             if (waitMore.toLowerCase() !== 's') {
               console.log(chalk.yellow('⏭️ Verificación interrumpida por el usuario'));
               break;
             }
           }
         }
         
         if (cloudflareCleared) {
           // Obtener datos finales
           const finalCheck = await page.evaluate(() => {
             const html = document.documentElement.outerHTML;
             const bodyText = document.body.innerText;
             return {
               htmlSize: html.length,
               hasProxyPattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/.test(bodyText),
               proxyCount: (bodyText.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/g) || []).length,
               hasTable: !!document.querySelector('table'),
               tableRows: document.querySelectorAll('table tr').length
             };
           });
           
           console.log(chalk.white(`📊 Datos de proxy detectados: ${finalCheck.hasProxyPattern ? 'SÍ' : 'NO'}`));
           console.log(chalk.white(`📄 Tamaño HTML: ${finalCheck.htmlSize} caracteres`));
           console.log(chalk.white(`🎯 Proxies encontrados: ${finalCheck.proxyCount}`));
           console.log(chalk.white(`📋 Tabla presente: ${finalCheck.hasTable ? 'SÍ' : 'NO'} (${finalCheck.tableRows} filas)`));
           
           console.log(chalk.green.bold('\n✅ CONCLUSIÓN: ENFOQUE HÍBRIDO COMPLETAMENTE VIABLE'));
           console.log(chalk.white('• Usuario resuelve CAPTCHA manualmente ✓'));
           console.log(chalk.white('• Sistema espera verificación automáticamente ✓'));
           console.log(chalk.white('• Detección inteligente de finalización ✓'));
           console.log(chalk.white('• Datos extraíbles exitosamente ✓'));
           
         } else {
           console.log(chalk.yellow.bold('⚠️ Verificación no completada en tiempo esperado'));
           console.log(chalk.white('• El sitio puede requerir más tiempo'));
           console.log(chalk.white('• Considerar aumentar timeouts en producción'));
           console.log(chalk.white('• Verificar manualmente en el navegador'));
         }
        
      } else {
        console.log(chalk.yellow('⏭️ Prueba cancelada por el usuario'));
      }
      
    } else {
      console.log(chalk.green.bold('✅ NO HAY CLOUDFLARE'));
      console.log(chalk.white('El sitio permite acceso directo - ideal para scraping automático'));
    }

  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error}`));
  } finally {
    console.log(chalk.blue('\n🔄 Cerrando navegador en 5 segundos...'));
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testHybridConcept().catch(console.error); 