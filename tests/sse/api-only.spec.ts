import { test, expect } from '@playwright/test';

// Extend Window interface for test functions
declare global {
  interface Window {
    getConnectionState(): string;
    getEvents(): any[];
    clearEvents(): void;
    connect(): void;
  }
}

test.describe('SSE API Tests (Backend Only)', () => {
  
  test('should respond to SSE clients endpoint', async ({ request }) => {
    console.log('🧪 Testing SSE API endpoints...');
    
    const response = await request.get('http://localhost:3002/api/events/clients');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalClients');
    expect(data.data).toHaveProperty('clients');
    
    console.log('✅ SSE clients endpoint working');
  });

  test('should accept test events', async ({ request }) => {
    console.log('🧪 Testing SSE test events endpoint...');
    
    const testEvent = {
      type: 'log',
      level: 'info',
      message: 'Test message from Playwright'
    };
    
    const response = await request.post('http://localhost:3002/api/events/test', {
      data: testEvent
    });
    
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    
    console.log('✅ Test events endpoint working');
  });

  test('should respond to heartbeat endpoint', async ({ request }) => {
    console.log('🧪 Testing heartbeat endpoint...');
    
    const response = await request.post('http://localhost:3002/api/events/heartbeat');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    
    console.log('✅ Heartbeat endpoint working');
  });

  test('should establish SSE stream connection', async ({ page }) => {
    console.log('🧪 Testing SSE stream connection...');
    
    // Create a simple page that connects to SSE
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SSE Test</title>
      </head>
      <body>
        <div id="status">disconnected</div>
        <div id="events"></div>
        
        <script>
          const statusEl = document.getElementById('status');
          const eventsEl = document.getElementById('events');
          
          let eventSource = null;
          let events = [];
          
          function connect() {
            eventSource = new EventSource('http://localhost:3002/api/events/stream');
            
            eventSource.onopen = function(event) {
              statusEl.textContent = 'connected';
              console.log('SSE connected');
            };
            
            eventSource.onerror = function(event) {
              statusEl.textContent = 'error';
              console.log('SSE error:', event);
            };
            
            eventSource.onmessage = function(event) {
              events.push({ type: 'message', data: event.data, timestamp: Date.now() });
              eventsEl.textContent = 'Events: ' + events.length;
            };
            
            // Listen for specific event types
            eventSource.addEventListener('log', function(event) {
              events.push({ type: 'log', data: event.data, timestamp: Date.now() });
              eventsEl.textContent = 'Events: ' + events.length;
              console.log('Log event:', event.data);
            });
            
            eventSource.addEventListener('heartbeat', function(event) {
              events.push({ type: 'heartbeat', data: event.data, timestamp: Date.now() });
              eventsEl.textContent = 'Events: ' + events.length;
              console.log('Heartbeat event:', event.data);
            });
          }
          
          // Expose functions for testing
          window.connect = connect;
          window.getEvents = () => events;
          window.getConnectionState = () => statusEl.textContent;
          
          // Auto-connect
          connect();
        </script>
      </body>
      </html>
    `);
    
    // Wait for connection
    await page.waitForFunction(() => {
      return window.getConnectionState() === 'connected';
    }, { timeout: 15000 });
    
    const connectionState = await page.evaluate(() => window.getConnectionState());
    expect(connectionState).toBe('connected');
    
    console.log('✅ SSE stream connection established');
  });

  test('should receive events through SSE stream', async ({ page, request }) => {
    console.log('🧪 Testing SSE event reception...');
    
    // Setup the same test page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SSE Test</title>
      </head>
      <body>
        <div id="status">disconnected</div>
        <div id="events"></div>
        
        <script>
          const statusEl = document.getElementById('status');
          const eventsEl = document.getElementById('events');
          
          let eventSource = null;
          let events = [];
          
          function connect() {
            eventSource = new EventSource('http://localhost:3002/api/events/stream');
            
            eventSource.onopen = function(event) {
              statusEl.textContent = 'connected';
              console.log('SSE connected');
            };
            
            eventSource.onerror = function(event) {
              statusEl.textContent = 'error';
              console.log('SSE error:', event);
            };
            
            eventSource.onmessage = function(event) {
              events.push({ type: 'message', data: event.data, timestamp: Date.now() });
              eventsEl.textContent = 'Events: ' + events.length;
            };
            
            eventSource.addEventListener('log', function(event) {
              events.push({ type: 'log', data: event.data, timestamp: Date.now() });
              eventsEl.textContent = 'Events: ' + events.length;
              console.log('Log event:', event.data);
            });
            
            eventSource.addEventListener('heartbeat', function(event) {
              events.push({ type: 'heartbeat', data: event.data, timestamp: Date.now() });
              eventsEl.textContent = 'Events: ' + events.length;
              console.log('Heartbeat event:', event.data);
            });
          }
          
          window.connect = connect;
          window.getEvents = () => events;
          window.getConnectionState = () => statusEl.textContent;
          window.clearEvents = () => { events = []; eventsEl.textContent = 'Events: 0'; };
          
          connect();
        </script>
      </body>
      </html>
    `);
    
    // Wait for connection
    await page.waitForFunction(() => {
      return window.getConnectionState() === 'connected';
    }, { timeout: 15000 });
    
    // Clear any existing events
    await page.evaluate(() => window.clearEvents());
    
    // Send a test event
    const testEvent = {
      type: 'log',
      level: 'info', 
      message: 'Test event from Playwright'
    };
    
    await request.post('http://localhost:3002/api/events/test', {
      data: testEvent
    });
    
    // Wait for the event to be received
    await page.waitForFunction(() => {
      const events = window.getEvents();
      return events.some(event => event.type === 'log');
    }, { timeout: 10000 });
    
    const events = await page.evaluate(() => window.getEvents());
    const logEvents = events.filter((event: any) => event.type === 'log');
    
    expect(logEvents.length).toBeGreaterThan(0);
    
    console.log('✅ SSE events received successfully');
    console.log(`📊 Total events received: ${events.length}`);
  });

  test('should handle multiple events simultaneously', async ({ page, request }) => {
    console.log('🧪 Testing multiple SSE events...');
    
    // Setup test page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head><title>SSE Multi-Event Test</title></head>
      <body>
        <div id="status">disconnected</div>
        <script>
          const statusEl = document.getElementById('status');
          let events = [];
          
          const eventSource = new EventSource('http://localhost:3002/api/events/stream');
          
          eventSource.onopen = () => statusEl.textContent = 'connected';
          eventSource.onerror = () => statusEl.textContent = 'error';
          
          ['log', 'heartbeat', 'system', 'scraping_progress'].forEach(eventType => {
            eventSource.addEventListener(eventType, function(event) {
              events.push({ type: eventType, data: event.data, timestamp: Date.now() });
            });
          });
          
          window.getEvents = () => events;
          window.getConnectionState = () => statusEl.textContent;
          window.clearEvents = () => { events = []; };
        </script>
      </body>
      </html>
    `);
    
    await page.waitForFunction(() => window.getConnectionState() === 'connected', { timeout: 15000 });
    await page.evaluate(() => window.clearEvents());
    
    // Send multiple different events
    const events = [
      { type: 'log', level: 'info', message: 'Log event 1' },
      { type: 'log', level: 'error', message: 'Log event 2' },
      { type: 'system', event: 'test_event', data: { test: true } },
      { type: 'scraping', progress: 50, proxiesFound: 25, currentSource: 'test', status: 'progress' }
    ];
    
    // Send all events
    for (const event of events) {
      await request.post('http://localhost:3002/api/events/test', { data: event });
      await page.waitForTimeout(500); // Small delay between events
    }
    
    // Wait for all events to be received
    await page.waitForTimeout(3000);
    
    const receivedEvents = await page.evaluate(() => window.getEvents());
    expect(receivedEvents.length).toBeGreaterThan(0);
    
    console.log(`✅ Multiple events test completed. Received: ${receivedEvents.length} events`);
  });
}); 