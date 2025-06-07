import { test, expect, Page } from '@playwright/test';
import { createSSEHelper, SSE_TEST_CONFIGS } from './helpers/sse-helper';

test.describe('SSE Resilience Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(45000);
    
    page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
    page.on('pageerror', error => console.error(`[PAGE ERROR] ${error.message}`));
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should reconnect automatically after connection loss', async () => {
    console.log('🧪 Testing SSE auto-reconnection...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    console.log('✅ Initial connection established');
    
    // Simulate connection loss by temporarily blocking the SSE endpoint
    await page.route('**/api/events/stream', route => {
      console.log('🔌 Simulating connection loss...');
      route.abort();
    });
    
    // Wait a bit for the disconnection to be detected
    await page.waitForTimeout(3000);
    
    // Remove the route blocking to allow reconnection
    await page.unroute('**/api/events/stream');
    console.log('🔄 Allowing reconnection...');
    
    // Wait for reconnection (our service retries every 3 seconds)
    await page.waitForTimeout(8000);
    
    // Verify reconnection happened
    const connectionState = await sseHelper.getConnectionState();
    expect(connectionState).toBe('connected');
    
    console.log('✅ Auto-reconnection successful');
  });

  test('should handle network interruptions gracefully', async () => {
    console.log('🧪 Testing network interruption handling...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    // Simulate slow/intermittent network
    await page.route('**/api/events/stream', async route => {
      // Add delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    // Clear events and trigger a test event
    await sseHelper.clearEvents();
    await page.request.post('http://localhost:3002/api/events/test', {
      data: { type: 'log', level: 'info', message: 'Network test message' }
    });
    
    // Should still receive the event despite network delays
    const logEvent = await sseHelper.waitForEvent('log', 15000);
    expect(logEvent).not.toBeNull();
    
    console.log('✅ Network interruption handled gracefully');
  });

  test('should maintain connection state across page navigation', async () => {
    console.log('🧪 Testing connection state persistence...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    // Navigate to a different route (if available) or reload the page
    await page.reload();
    
    // Wait for reconnection after page reload
    const reconnected = await sseHelper.waitForConnection(15000);
    expect(reconnected).toBe(true);
    
    console.log('✅ Connection state maintained across navigation');
  });

  test('should handle server restart scenario', async () => {
    console.log('🧪 Testing server restart scenario...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    // Simulate server restart by returning 503 temporarily
    let blockRequests = true;
    await page.route('**/api/events/stream', route => {
      if (blockRequests) {
        route.fulfill({
          status: 503,
          body: 'Service Temporarily Unavailable'
        });
      } else {
        route.continue();
      }
    });
    
    // Wait for disconnection detection
    await page.waitForTimeout(3000);
    
    // "Restart" server by unblocking requests
    blockRequests = false;
    console.log('🔄 Server "restarted", allowing connections...');
    
    // Wait for auto-reconnection
    await page.waitForTimeout(10000);
    
    const connectionState = await sseHelper.getConnectionState();
    expect(connectionState).toBe('connected');
    
    console.log('✅ Server restart scenario handled successfully');
  });

  test('should display correct connection status in UI during disconnection', async () => {
    console.log('🧪 Testing UI status during disconnection...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    await sseHelper.waitForConnection();
    
    // Verify initial connected state in UI
    const connectedIndicator = page.locator('[class*="text-green"]').first();
    await expect(connectedIndicator).toBeVisible();
    
    // Simulate disconnection
    await page.route('**/api/events/stream', route => route.abort());
    
    // Wait for disconnection to be detected
    await page.waitForTimeout(5000);
    
    // Check for disconnected state indicators in UI
    const disconnectedIndicator = page.locator('[class*="text-red"], [class*="text-yellow"]').first();
    await expect(disconnectedIndicator).toBeVisible({ timeout: 10000 });
    
    console.log('✅ UI correctly shows disconnection status');
  });

  test('should handle multiple rapid connection attempts', async () => {
    console.log('🧪 Testing multiple rapid connection attempts...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    await page.goto('http://localhost:5173');
    
    // Simulate unstable connection with rapid connect/disconnect cycles
    let shouldBlock = false;
    await page.route('**/api/events/stream', route => {
      if (shouldBlock) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Rapidly toggle connection state
    for (let i = 0; i < 5; i++) {
      shouldBlock = true;
      await page.waitForTimeout(1000);
      shouldBlock = false;
      await page.waitForTimeout(1000);
    }
    
    // Wait for final connection stabilization
    await page.waitForTimeout(5000);
    
    const finalState = await sseHelper.getConnectionState();
    expect(finalState).toBe('connected');
    
    console.log('✅ Multiple rapid connection attempts handled correctly');
  });

  test('should respect connection timeout settings', async () => {
    console.log('🧪 Testing connection timeout settings...');
    
    const sseHelper = createSSEHelper(page);
    await sseHelper.startSSECapture(SSE_TEST_CONFIGS.LOCAL_DEV);
    
    // Block all SSE requests to test timeout
    await page.route('**/api/events/stream', route => {
      // Don't respond to simulate timeout
      // route.abort() would be immediate, we want to test timeout
    });
    
    await page.goto('http://localhost:5173');
    
    // Attempt connection with shorter timeout
    const startTime = Date.now();
    const connected = await sseHelper.waitForConnection(5000);
    const duration = Date.now() - startTime;
    
    expect(connected).toBe(false);
    expect(duration).toBeGreaterThan(4000); // Should respect the 5s timeout
    expect(duration).toBeLessThan(7000); // But not exceed it by much
    
    console.log(`✅ Connection timeout respected: ${duration}ms`);
  });
}); 