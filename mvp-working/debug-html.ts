// Debug del HTML de proxy-list.download
console.log('🔍 ANÁLISIS HTML DE PROXY-LIST.DOWNLOAD');
console.log('======================================\n');

import { load } from 'cheerio';

const debugHTML = async () => {
  try {
    console.log('⏳ Obteniendo HTML de proxy-list.download...');
    
    const response = await fetch('https://www.proxy-list.download/HTTP', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      console.log(`📊 HTML length: ${html.length} characters`);
      
      const $ = load(html);
      
      // Buscar tablas
      const tables = $('table');
      console.log(`📊 Tablas encontradas: ${tables.length}`);
      
      tables.each((i, table) => {
        const rows = $(table).find('tr');
        console.log(`📊 Tabla ${i + 1}: ${rows.length} filas`);
        
        // Analizar primera fila como encabezados
        const headerRow = $(rows[0]);
        const headers = headerRow.find('th, td');
        console.log(`📊 Encabezados (${headers.length}):`);
        headers.each((j, header) => {
          console.log(`   ${j + 1}. "${$(header).text().trim()}"`);
        });
        
        // Analizar primeras filas de datos
        console.log(`📊 Primeras 5 filas de datos:`);
        rows.slice(1, 6).each((j, row) => {
          const cells = $(row).find('td');
          if (cells.length > 0) {
            console.log(`   Fila ${j + 1} (${cells.length} celdas):`);
            cells.each((k, cell) => {
              const text = $(cell).text().trim();
              console.log(`     ${k + 1}. "${text}"`);
            });
          }
        });
        
        console.log('─'.repeat(30));
      });
      
      // Buscar patrones directos de IP en el HTML
      const ipMatches = html.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g);
      if (ipMatches) {
        const uniqueIPs = [...new Set(ipMatches)];
        console.log(`📊 IPs encontradas en HTML: ${uniqueIPs.length} únicas`);
        console.log(`🎯 Ejemplos de IPs:`);
        uniqueIPs.slice(0, 10).forEach((ip, i) => {
          console.log(`   ${i + 1}. ${ip}`);
        });
      }
      
      // Buscar patrones de puerto
      const portMatches = html.match(/:\d{2,5}\b/g);
      if (portMatches) {
        const uniquePorts = [...new Set(portMatches)];
        console.log(`📊 Puertos encontrados: ${uniquePorts.length} únicos`);
        console.log(`🎯 Ejemplos de puertos:`);
        uniquePorts.slice(0, 10).forEach((port, i) => {
          console.log(`   ${i + 1}. ${port}`);
        });
      }
      
    } else {
      console.log(`❌ Error HTTP: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

debugHTML(); 