import { Router } from 'express';
import { ProxyTester } from '../../../packages/proxy-validator/ProxyTester';

const router = Router();

// Validate proxies
router.post('/', async (req, res) => {
  try {
    const { proxies, sites = ['google.com'] } = req.body;
    
    if (!proxies || !Array.isArray(proxies)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Proxies array is required'
      });
    }
    
    console.log(`🧪 Starting validation of ${proxies.length} proxies on ${sites.length} sites...`);
    
    const tester = new ProxyTester();
    const results = [];
    
    for (const proxy of proxies) {
      try {
        const result = await tester.testProxy(proxy, sites);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error testing proxy ${proxy.ip}:${proxy.port}:`, error);
        results.push({
          proxy,
          isWorking: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          testedSites: [],
          anonymityLevel: 'unknown',
          responseTime: null
        });
      }
    }
    
    const workingProxies = results.filter(r => r.isWorking);
    
    console.log(`✅ Validation complete: ${workingProxies.length}/${proxies.length} working`);
    
    res.json({
      success: true,
      data: {
        total: proxies.length,
        working: workingProxies.length,
        successRate: ((workingProxies.length / proxies.length) * 100).toFixed(2) + '%',
        results
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate proxies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Quick connectivity test
router.post('/quick', async (req, res) => {
  try {
    const { proxies } = req.body;
    
    if (!proxies || !Array.isArray(proxies)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Proxies array is required'
      });
    }
    
    console.log(`⚡ Quick connectivity test for ${proxies.length} proxies...`);
    
    const tester = new ProxyTester();
    const results = [];
    
    // Test only first 5 proxies for quick response
    const testProxies = proxies.slice(0, 5);
    
    for (const proxy of testProxies) {
      try {
        const result = await tester.testBasicConnectivity(proxy);
        results.push(result);
      } catch (error) {
        results.push({
          proxy,
          isWorking: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const workingProxies = results.filter(r => r.isWorking);
    
    res.json({
      success: true,
      data: {
        tested: testProxies.length,
        working: workingProxies.length,
        results
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Quick test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test proxies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as validateRoutes }; 