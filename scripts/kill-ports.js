#!/usr/bin/env node

/**
 * Script para matar puertos específicos en desarrollo
 * Útil para limpiar puertos ocupados antes de iniciar el desarrollo
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Puertos que usa el proyecto
const PORTS = [
  3001, // Backend
  5173, // Frontend (Vite)
  3002, // Backend testing (Playwright)
  4173, // Frontend preview
  6006, // Storybook (si se usa)
];

/**
 * Mata un proceso en un puerto específico
 */
async function killPort(port) {
  try {
    console.log(`🔍 Verificando puerto ${port}...`);
    
    // En Windows
    if (process.platform === 'win32') {
      // Buscar proceso en el puerto
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      
      if (stdout.trim()) {
        console.log(`📍 Puerto ${port} está ocupado`);
        
        // Extraer PID del proceso
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          
          if (pid && pid !== '0') {
            try {
              await execAsync(`taskkill /PID ${pid} /F`);
              console.log(`✅ Proceso ${pid} en puerto ${port} terminado`);
            } catch (error) {
              console.log(`⚠️  No se pudo terminar proceso ${pid}: ${error.message}`);
            }
          }
        }
      } else {
        console.log(`✅ Puerto ${port} está libre`);
      }
    } 
    // En Unix/Linux/macOS
    else {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        console.log(`📍 Puerto ${port} está ocupado por PID(s): ${pids.join(', ')}`);
        
        for (const pid of pids) {
          if (pid) {
            try {
              await execAsync(`kill -9 ${pid}`);
              console.log(`✅ Proceso ${pid} en puerto ${port} terminado`);
            } catch (error) {
              console.log(`⚠️  No se pudo terminar proceso ${pid}: ${error.message}`);
            }
          }
        }
      } else {
        console.log(`✅ Puerto ${port} está libre`);
      }
    }
  } catch (error) {
    if (error.message.includes('No such file or directory') || 
        error.message.includes('command not found')) {
      console.log(`✅ Puerto ${port} está libre`);
    } else {
      console.log(`❌ Error verificando puerto ${port}: ${error.message}`);
    }
  }
}

/**
 * Mata todos los puertos del proyecto
 */
async function killAllPorts() {
  console.log('🚀 Iniciando limpieza de puertos...\n');
  
  for (const port of PORTS) {
    await killPort(port);
    console.log(''); // Línea en blanco para separar
  }
  
  console.log('🎉 Limpieza de puertos completada!');
  console.log('💡 Ahora puedes ejecutar "bun run dev" sin conflictos');
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Matar puertos específicos
    const portsToKill = args.map(arg => parseInt(arg)).filter(port => !isNaN(port));
    
    if (portsToKill.length === 0) {
      console.log('❌ Por favor proporciona números de puerto válidos');
      console.log('Ejemplo: node scripts/kill-ports.js 3001 5173');
      process.exit(1);
    }
    
    console.log(`🎯 Matando puertos específicos: ${portsToKill.join(', ')}\n`);
    
    for (const port of portsToKill) {
      await killPort(port);
      console.log('');
    }
  } else {
    // Matar todos los puertos del proyecto
    await killAllPorts();
  }
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Error no manejado:', error);
  process.exit(1);
});

// Ejecutar script
main().catch(console.error); 