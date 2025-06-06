import { test, expect, Page, Browser } from '@playwright/test';
import { createSSEHelper, SSE_TEST_CONFIGS, TEST_EVENTS } from './helpers/sse-helper';

test.describe('SSE Basic Connection Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set extended timeout for SSE connections
    page.setDefaultTimeout(30000);
    
    // Enable console logs
    page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
    page.on('pageerror', error => console.error(`[PAGE ERROR] ${error.message}`));
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should establish SSE connection successfully', async () => {
    console.log('🧪 Testing SSE basic connection...');
    
    const sseHelper = createSSEHelper(page);
    
    // Initialize SSE capture
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    // Navigate to frontend app
    await page.goto('http://localhost:5173');
    
    // Wait for SSE connection to be established
    const connected = await sseHelper.waitForConnection(15000);
    expect(connected).toBe(true);
    
    // Verify connection state
    const connectionState = await sseHelper.getConnectionState();
    expect(connectionState).toBe('connected');
    
    console.log('✅ SSE connection established successfully');
  });

  test('should receive heartbeat events', async () => {
    console.log('🧪 Testing heartbeat events...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    // Wait for at least one heartbeat event (they come every 30 seconds)
    // For testing, we'll trigger a manual heartbeat
    const heartbeatResponse = await page.request.post('http://localhost:3002/api/events/heartbeat');
    expect(heartbeatResponse.ok()).toBe(true);
    
    // Wait for heartbeat event
    const heartbeatEvent = await sseHelper.waitForEvent('heartbeat', 10000);
    expect(heartbeatEvent).not.toBeNull();
    
    if (heartbeatEvent) {
      expect(sseHelper.validateHeartbeatEvent(heartbeatEvent)).toBe(true);
      console.log('✅ Heartbeat event received and validated');
    }
  });

  test('should receive log events in real-time', async () => {
    console.log('🧪 Testing log events...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    // Clear existing events
    await sseHelper.clearEvents();
    
    // Trigger a test log event
    const logResponse = await page.request.post('http://localhost:3002/api/events/test', {
      data: TEST_EVENTS.LOG_EVENT
    });
    expect(logResponse.ok()).toBe(true);
    
    // Wait for log event
    const logEvent = await sseHelper.waitForEvent('log', 5000);
    expect(logEvent).not.toBeNull();
    
    if (logEvent) {
      expect(sseHelper.validateLogEvent(logEvent)).toBe(true);
      
      const eventData = JSON.parse(logEvent.data);
      expect(eventData.message).toBe(TEST_EVENTS.LOG_EVENT.message);
      expect(eventData.level).toBe(TEST_EVENTS.LOG_EVENT.level);
      
      console.log('✅ Log event received and validated');
    }
  });

  test('should receive scraping progress events', async () => {
    console.log('🧪 Testing scraping events...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    await sseHelper.clearEvents();
    
    // Trigger a test scraping event
    const scrapingResponse = await page.request.post('http://localhost:3002/api/events/test', {
      data: TEST_EVENTS.SCRAPING_EVENT
    });
    expect(scrapingResponse.ok()).toBe(true);
    
    // Wait for scraping event
    const scrapingEvent = await sseHelper.waitForEvent('scraping_progress', 5000);
    expect(scrapingEvent).not.toBeNull();
    
    if (scrapingEvent) {
      expect(sseHelper.validateScrapingEvent(scrapingEvent)).toBe(true);
      
      const eventData = JSON.parse(scrapingEvent.data);
      expect(eventData.progress).toBe(TEST_EVENTS.SCRAPING_EVENT.progress);
      expect(eventData.proxiesFound).toBe(TEST_EVENTS.SCRAPING_EVENT.proxiesFound);
      expect(eventData.status).toBe(TEST_EVENTS.SCRAPING_EVENT.status);
      
      console.log('✅ Scraping event received and validated');
    }
  });

  test('should handle multiple event types simultaneously', async () => {
    console.log('🧪 Testing multiple event types...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    await sseHelper.clearEvents();
    
    // Send multiple events in sequence
    await page.request.post('http://localhost:3002/api/events/test', {
      data: TEST_EVENTS.LOG_EVENT
    });
    
    await page.request.post('http://localhost:3002/api/events/test', {
      data: TEST_EVENTS.SCRAPING_EVENT
    });
    
    await page.request.post('http://localhost:3002/api/events/test', {
      data: TEST_EVENTS.SYSTEM_EVENT
    });
    
    // Wait for all events
    await page.waitForTimeout(2000);
    
    const stats = await sseHelper.getEventStats();
    expect(stats.log).toBeGreaterThanOrEqual(1);
    expect(stats.scraping_progress).toBeGreaterThanOrEqual(1);
    expect(stats.system).toBeGreaterThanOrEqual(1);
    
    console.log('✅ Multiple event types received:', stats);
  });

  test('should show connection status in UI', async () => {
    console.log('🧪 Testing UI connection indicator...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    // Check for SSE connection indicator in UI
    const connectionIndicator = page.locator('[class*="text-green"]').first();
    await expect(connectionIndicator).toBeVisible({ timeout: 10000 });
    
    // Check for the success message about real-time events
    const realtimeMessage = page.locator('text=Eventos en tiempo real activos');
    await expect(realtimeMessage).toBeVisible({ timeout: 5000 });
    
    console.log('✅ UI connection indicator working correctly');
  });
}); 