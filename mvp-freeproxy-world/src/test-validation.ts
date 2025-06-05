#!/usr/bin/env node

import { ProxyValidator } from './validator.js';
import { ProxyData } from './types.js';

async function testValidation() {
  console.log('🧪 TEST VALIDACIÓN DE PROXIES');
  console.log('==============================\n');

  // Proxies de ejemplo para probar
  const testProxies: ProxyData[] = [
    {
      ip: '138.199.35.204',
      port: 9002,
      country: 'United States',
      anonymity: 'High',
      speed: 334,
      uptime: '',
      lastCheck: '',
      protocol: 'HTTPS'
    },
    {
      ip: '65.49.68.84',
      port: 38835,
      country: 'United States',
      anonymity: 'High',
      speed: 161,
      uptime: '',
      lastCheck: '',
      protocol: 'HTTPS'
    },
    {
      ip: '8.8.8.8', // IP público que NO es proxy
      port: 80,
      country: 'Test',
      anonymity: 'Test',
      speed: 0,
      uptime: '',
      lastCheck: '',
      protocol: 'HTTP'
    }
  ];

  const validator = new ProxyValidator();

  try {
    await validator.initialize();
    
    console.log(`📡 Probando ${testProxies.length} proxies...`);
    const result = await validator.validateProxies(testProxies, 3);

    console.log('\n✅ Test de validación completado');

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await validator.close();
  }
}

testValidation().catch(console.error); 