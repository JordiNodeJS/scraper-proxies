import { Router } from 'express';
import { ProxyListDownloadScraper } from '../../../packages/proxy-scraper/scrapers/ProxyListDownloadScraper';
import { ProxyListHTTPScraper } from '../../../packages/proxy-scraper/scrapers/ProxyListHTTPScraper';

const router = Router();

// Scrape proxies from all sources
router.post('/all', async (req, res) => {
  try {
    console.log('🚀 Starting proxy scraping from all sources...');
    
    const httpsScraperPromise = new ProxyListDownloadScraper().scrapeProxies();
    const httpScraperPromise = new ProxyListHTTPScraper().scrapeProxies();
    
    const [httpsProxies, httpProxies] = await Promise.all([
      httpsScraperPromise,
      httpScraperPromise
    ]);
    
    const allProxies = [...httpsProxies, ...httpProxies];
    
    console.log(`✅ Scraped ${allProxies.length} proxies total`);
    
    res.json({
      success: true,
      data: {
        total: allProxies.length,
        https: httpsProxies.length,
        http: httpProxies.length,
        proxies: allProxies
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape proxies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Scrape HTTPS proxies only
router.post('/https', async (req, res) => {
  try {
    console.log('🔒 Starting HTTPS proxy scraping...');
    
    const scraper = new ProxyListDownloadScraper();
    const proxies = await scraper.scrapeProxies();
    
    console.log(`✅ Scraped ${proxies.length} HTTPS proxies`);
    
    res.json({
      success: true,
      data: {
        total: proxies.length,
        type: 'https',
        proxies
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ HTTPS scraping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape HTTPS proxies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Scrape HTTP proxies only
router.post('/http', async (req, res) => {
  try {
    console.log('🌐 Starting HTTP proxy scraping...');
    
    const scraper = new ProxyListHTTPScraper();
    const proxies = await scraper.scrapeProxies();
    
    console.log(`✅ Scraped ${proxies.length} HTTP proxies`);
    
    res.json({
      success: true,
      data: {
        total: proxies.length,
        type: 'http',
        proxies
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ HTTP scraping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape HTTP proxies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as scrapeRoutes }; 