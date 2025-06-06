// Test directo del parser
console.log('🧪 TEST DIRECTO DEL PARSER');
console.log('=========================\n');

import { ProxyParsers } from './src/parsers.ts';

const testParser = async () => {
  try {
    console.log('⏳ Obteniendo datos de proxy-list.download...');
    
    const response = await fetch('https://www.proxy-list.download/HTTP', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      console.log(`📊 HTML recibido: ${html.length} caracteres`);
      
      console.log('🔧 Parseando con ProxyParsers.proxyListDownload...');
      const proxies = ProxyParsers.proxyListDownload(html, 'HTTP', 'Proxy List Download HTTP');
      
      console.log(`📊 Proxies parseados: ${proxies.length}`);
      
      if (proxies.length > 0) {
        console.log(`✅ PARSER FUNCIONANDO! ${proxies.length} proxies encontrados`);
        console.log(`\n🎯 Primeros 5 proxies:`);
        
        proxies.slice(0, 5).forEach((proxy, i) => {
          console.log(`   ${i + 1}. ${proxy.ip}:${proxy.port} (${proxy.anonymity}, ${proxy.country}, ${proxy.speed}ms)`);
        });
        
        // Guardar resultado
        const fs = require('fs');
        try {
          fs.mkdirSync('results', { recursive: true });
        } catch (e) {}
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const proxyList = proxies.map(p => `${p.ip}:${p.port}`).join('\n');
        fs.writeFileSync(`results/parser-test-${timestamp}.txt`, proxyList);
        
        console.log(`\n💾 Proxies guardados en: results/parser-test-${timestamp}.txt`);
        
        // Test de validación básica
        console.log(`\n🔍 VALIDACIÓN BÁSICA:`);
        const validIPs = proxies.filter(p => /^\d+\.\d+\.\d+\.\d+$/.test(p.ip));
        const validPorts = proxies.filter(p => p.port > 0 && p.port <= 65535);
        
        console.log(`   ✅ IPs válidas: ${validIPs.length}/${proxies.length}`);
        console.log(`   ✅ Puertos válidos: ${validPorts.length}/${proxies.length}`);
        
        // Estadísticas
        const countries = [...new Set(proxies.map(p => p.country))];
        const anonymities = [...new Set(proxies.map(p => p.anonymity))];
        
        console.log(`   📊 Países únicos: ${countries.length}`);
        console.log(`   📊 Tipos anonymity: ${anonymities.join(', ')}`);
        
      } else {
        console.log(`❌ Parser no encontró proxies`);
      }
      
    } else {
      console.log(`❌ Error HTTP: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
};

testParser(); 