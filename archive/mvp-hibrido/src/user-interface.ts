import readline from 'readline-sync';
import chalk from 'chalk';
import type { UserAction } from './types.js';

export class UserInterface {
  
  static showWelcome(): void {
    console.clear();
    console.log(chalk.blue.bold('🤖 SCRAPER HÍBRIDO - HIDE.MN'));
    console.log(chalk.blue('====================================='));
    console.log(chalk.white('Modo: Usuario + Automatización'));
    console.log(chalk.gray('El bot detectará Cloudflare y te dará el control\n'));
  }

  static showStatus(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    };
    
    const icons = {
      info: '🔍',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    console.log(`${icons[type]} ${colors[type](message)}`);
  }

  static showCloudflareDetected(): void {
    console.log('\n' + chalk.red.bold('🛡️  CLOUDFLARE DETECTADO'));
    console.log(chalk.red('========================'));
    console.log(chalk.white('Se ha detectado un challenge de Cloudflare que requiere intervención humana.'));
    console.log(chalk.white('El navegador permanecerá abierto para que puedas completar la verificación.\n'));
  }

  static waitForUserAction(): UserAction {
    console.log(chalk.yellow.bold('👤 ACCIÓN REQUERIDA:'));
    console.log(chalk.white('1. Completa el CAPTCHA en el navegador abierto'));
    console.log(chalk.white('2. Espera a que cargue la página de proxies'));
    console.log(chalk.white('3. Regresa aquí cuando esté listo\n'));

    const options = [
      chalk.green('✅ He completado el CAPTCHA y veo la lista de proxies'),
      chalk.yellow('🔄 Necesito más tiempo / hay problemas'),
      chalk.red('❌ Cancelar y abortar la sesión')
    ];

    console.log(chalk.cyan.bold('¿Qué quieres hacer?'));
    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option}`);
    });

    const choice = readline.questionInt(chalk.blue('\nIngresa tu opción (1-3): '));

    switch (choice) {
      case 1:
        return {
          type: 'CAPTCHA_COMPLETED',
          timestamp: Date.now(),
          message: 'Usuario reporta CAPTCHA completado'
        };
      case 2:
        console.log(chalk.yellow('\n⏳ Esperando... El navegador permanece abierto.'));
        console.log(chalk.white('Presiona ENTER cuando hayas completado la verificación...'));
        readline.question();
        return {
          type: 'MANUAL_NAVIGATION',
          timestamp: Date.now(),
          message: 'Usuario indica completado después de tiempo adicional'
        };
      case 3:
        return {
          type: 'ABORT_SESSION',
          timestamp: Date.now(),
          message: 'Usuario canceló la sesión'
        };
      default:
        console.log(chalk.red('Opción inválida, se asume cancelación.'));
        return {
          type: 'ABORT_SESSION',
          timestamp: Date.now(),
          message: 'Opción inválida'
        };
    }
  }

  static showProgress(message: string): void {
    process.stdout.write(chalk.blue(`🔄 ${message}... `));
  }

  static clearProgress(): void {
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
  }

  static showResults(session: import('./types.js').ScrapingSession): void {
    console.log('\n' + chalk.blue.bold('📊 RESULTADOS DE LA SESIÓN'));
    console.log(chalk.blue('============================'));
    
    console.log(`${session.success ? '✅' : '❌'} Estado: ${session.success ? chalk.green('ÉXITO') : chalk.red('FALLÓ')}`);
    console.log(`🛡️  Cloudflare detectado: ${session.cloudflareDetected ? chalk.yellow('SÍ') : chalk.green('NO')}`);
    console.log(`👤 Intervención manual: ${session.userInteractionRequired ? chalk.yellow('REQUERIDA') : chalk.green('NO NECESARIA')}`);
    console.log(`🎯 Proxies encontrados: ${chalk.white.bold(session.proxiesFound.toString())}`);
    console.log(`⏱️  Duración total: ${chalk.white(Math.round(session.sessionDuration / 1000))} segundos`);
    
    if (session.pageStructure.hasTable) {
      console.log(`📋 Estructura de tabla: ${chalk.green('ENCONTRADA')}`);
      console.log(`   - Filas: ${session.pageStructure.tableRows}`);
      if (session.pageStructure.paginationFound) {
        console.log(`   - Paginación: ${chalk.green('SÍ')} ${session.pageStructure.totalPages ? `(${session.pageStructure.totalPages} páginas)` : ''}`);
      }
    }

    if (session.data.length > 0) {
      console.log(`\n${chalk.cyan.bold('🔍 MUESTRA DE PROXIES EXTRAÍDOS:')}`);
      console.log(chalk.cyan('====================================='));
      session.data.slice(0, 5).forEach((proxy, i) => {
        console.log(`${i + 1}. ${chalk.white(proxy.ip)}:${chalk.white(proxy.port.toString())} (${chalk.green(proxy.protocol)})`);
        if (proxy.country) console.log(`   📍 País: ${proxy.country}`);
        if (proxy.anonymity) console.log(`   🔒 Anonimato: ${proxy.anonymity}`);
      });
      
      if (session.data.length > 5) {
        console.log(`   ... y ${session.data.length - 5} proxies más`);
      }
    }

    if (session.errors.length > 0) {
      console.log(`\n${chalk.red.bold('❌ ERRORES ENCONTRADOS:')}`);
      session.errors.forEach(error => {
        console.log(`   ${chalk.red('•')} ${error}`);
      });
    }
  }

  static showConclusion(session: import('./types.js').ScrapingSession): void {
    console.log(`\n${chalk.magenta.bold('🎯 CONCLUSIÓN DEL MVP HÍBRIDO:')}`);
    console.log(chalk.magenta('================================'));

    if (session.success && session.userInteractionRequired) {
      console.log(chalk.green('✅ VIABLE: Enfoque híbrido funciona correctamente'));
      console.log(chalk.white('   • Usuario puede resolver CAPTCHAs manualmente'));
      console.log(chalk.white('   • Automatización continúa después de intervención'));
      console.log(chalk.white('   • Datos extraídos exitosamente'));
    } else if (session.cloudflareDetected && !session.manualStepsCompleted) {
      console.log(chalk.yellow('🟡 PARCIAL: Cloudflare detectado pero no completado'));
      console.log(chalk.white('   • Requiere ajustes en el flujo de usuario'));
      console.log(chalk.white('   • Mejorar instrucciones o timing'));
    } else if (!session.cloudflareDetected && session.success) {
      console.log(chalk.blue('🔵 AUTOMÁTICO: No se requirió intervención'));
      console.log(chalk.white('   • El sitio permitió acceso directo'));
      console.log(chalk.white('   • Considerar este sitio para scraping puro'));
    } else {
      console.log(chalk.red('❌ PROBLEMAS: Requiere investigación adicional'));
      console.log(chalk.white('   • Revisar estrategias de detección'));
      console.log(chalk.white('   • Evaluar estructura del sitio'));
    }
  }
} 