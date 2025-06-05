# Prompt: Servicio de Validación con Playwright

## 🎯 Objetivo

Implementar validación robusta y concurrente de proxies usando Playwright para verificar su funcionalidad real.

## 📋 Especificaciones Técnicas

### Criterios de Validación

- **Test Endpoint**: https://example.com (o httpbin.org para más detalles)
- **Timeout**: 10 segundos por proxy
- **Reintentos**: 2 intentos por proxy
- **Concurrencia**: Máximo 5 conexiones simultáneas
- **Métricas**: Latencia, código de respuesta, estado de conexión

### Stack Tecnológico

- **Testing Framework**: Playwright
- **Concurrencia**: Promise.allSettled con semáforo
- **Métricas**: Performance timing API

## 🔧 Implementación Base

```typescript
interface ValidationConfig {
  timeout: number;
  retries: number;
  concurrency: number;
  testUrl: string;
  userAgent: string;
}

interface ValidationResult {
  proxy: Proxy;
  isValid: boolean;
  latency: number;
  httpStatus?: number;
  error?: string;
  timestamp: Date;
}

interface ValidationProgress {
  completed: number;
  total: number;
  successful: number;
  failed: number;
  percentage: number;
  averageLatency: number;
}

class ProxyValidatorService {
  private config: ValidationConfig;
  private semaphore: Semaphore;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      timeout: 10000,
      retries: 2,
      concurrency: 5,
      testUrl: "https://httpbin.org/ip",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ...config,
    };

    this.semaphore = new Semaphore(this.config.concurrency);
  }
}
```

## 🔄 Flujo de Validación

### 1. Validación Individual

```typescript
async validateProxy(proxy: Proxy, attempt = 1): Promise<ValidationResult> {
  const startTime = performance.now();
  let browser;

  try {
    // Configurar browser con proxy
    browser = await playwright.chromium.launch({
      headless: true,
      proxy: {
        server: `${proxy.protocol}://${proxy.ip}:${proxy.port}`
      }
    });

    const context = await browser.newContext({
      userAgent: this.config.userAgent,
      timeout: this.config.timeout
    });

    const page = await context.newPage();

    // Realizar request de prueba
    const response = await page.goto(this.config.testUrl, {
      waitUntil: 'networkidle',
      timeout: this.config.timeout
    });

    const endTime = performance.now();
    const latency = endTime - startTime;

    // Verificar respuesta exitosa
    const isValid = response?.ok() && response.status() < 400;

    return {
      proxy,
      isValid,
      latency,
      httpStatus: response?.status(),
      timestamp: new Date()
    };

  } catch (error) {
    const endTime = performance.now();
    const latency = endTime - startTime;

    // Retry lógico
    if (attempt < this.config.retries && this.shouldRetry(error)) {
      await this.delay(Math.pow(2, attempt) * 1000); // Backoff exponencial
      return this.validateProxy(proxy, attempt + 1);
    }

    return {
      proxy,
      isValid: false,
      latency,
      error: error.message,
      timestamp: new Date()
    };

  } finally {
    await browser?.close();
  }
}
```

### 2. Validación Concurrente

```typescript
async validateProxies(
  proxies: Proxy[],
  onProgress?: (progress: ValidationProgress) => void
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const total = proxies.length;
  let completed = 0;
  let successful = 0;

  // Procesar en lotes concurrentes
  const validationPromises = proxies.map(async (proxy) => {
    return this.semaphore.acquire(async () => {
      const result = await this.validateProxy(proxy);

      completed++;
      if (result.isValid) successful++;

      results.push(result);

      // Reportar progreso
      if (onProgress) {
        const averageLatency = this.calculateAverageLatency(results);
        onProgress({
          completed,
          total,
          successful,
          failed: completed - successful,
          percentage: (completed / total) * 100,
          averageLatency
        });
      }

      return result;
    });
  });

  // Esperar todas las validaciones
  await Promise.allSettled(validationPromises);

  return results.sort((a, b) => a.latency - b.latency);
}
```

### 3. Semáforo para Control de Concurrencia

```typescript
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.permits > 0) {
        this.permits--;
        this.executeTask(task, resolve, reject);
      } else {
        this.queue.push(() => {
          this.permits--;
          this.executeTask(task, resolve, reject);
        });
      }
    });
  }

  private async executeTask<T>(
    task: () => Promise<T>,
    resolve: (value: T) => void,
    reject: (reason: any) => void
  ): Promise<void> {
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.release();
    }
  }

  private release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}
```

## 🔍 Detección de Tipos de Error

### Clasificación de Errores

```typescript
enum ValidationErrorType {
  TIMEOUT = 'timeout',
  CONNECTION_REFUSED = 'connection_refused',
  INVALID_PROXY = 'invalid_proxy',
  AUTH_REQUIRED = 'auth_required',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown'
}

private classifyError(error: Error): ValidationErrorType {
  const message = error.message.toLowerCase();

  if (message.includes('timeout')) {
    return ValidationErrorType.TIMEOUT;
  }

  if (message.includes('econnrefused') || message.includes('connection refused')) {
    return ValidationErrorType.CONNECTION_REFUSED;
  }

  if (message.includes('proxy') && message.includes('invalid')) {
    return ValidationErrorType.INVALID_PROXY;
  }

  if (message.includes('407') || message.includes('authentication')) {
    return ValidationErrorType.AUTH_REQUIRED;
  }

  if (message.includes('network') || message.includes('dns')) {
    return ValidationErrorType.NETWORK_ERROR;
  }

  return ValidationErrorType.UNKNOWN;
}

private shouldRetry(error: Error): boolean {
  const errorType = this.classifyError(error);

  // No reintentar para errores definitivos
  const nonRetryableErrors = [
    ValidationErrorType.INVALID_PROXY,
    ValidationErrorType.AUTH_REQUIRED
  ];

  return !nonRetryableErrors.includes(errorType);
}
```

## 📊 Métricas Avanzadas

### Análisis de Performance

```typescript
interface ValidationMetrics {
  totalValidated: number;
  successfulProxies: number;
  failedProxies: number;
  successRate: number;
  averageLatency: number;
  medianLatency: number;
  p95Latency: number;
  errorBreakdown: Record<ValidationErrorType, number>;
  validationDuration: number;
}

private calculateMetrics(results: ValidationResult[]): ValidationMetrics {
  const successful = results.filter(r => r.isValid);
  const failed = results.filter(r => !r.isValid);
  const latencies = successful.map(r => r.latency).sort((a, b) => a - b);

  // Percentiles
  const p95Index = Math.floor(latencies.length * 0.95);
  const medianIndex = Math.floor(latencies.length * 0.5);

  // Breakdown de errores
  const errorBreakdown: Record<ValidationErrorType, number> = {};
  failed.forEach(result => {
    if (result.error) {
      const errorType = this.classifyError(new Error(result.error));
      errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
    }
  });

  return {
    totalValidated: results.length,
    successfulProxies: successful.length,
    failedProxies: failed.length,
    successRate: (successful.length / results.length) * 100,
    averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
    medianLatency: latencies[medianIndex] || 0,
    p95Latency: latencies[p95Index] || 0,
    errorBreakdown,
    validationDuration: 0 // Calcular basado en timestamps
  };
}
```

### Health Check Inteligente

```typescript
async performHealthCheck(): Promise<boolean> {
  try {
    // Test con proxy conocido funcional o sin proxy
    const testProxy: Proxy = {
      ip: '8.8.8.8', // Placeholder - usar proxy test conocido
      port: 3128,
      protocol: 'http'
    };

    const result = await this.validateProxy(testProxy);
    return result.isValid && result.latency < 5000;

  } catch (error) {
    console.warn('Health check failed:', error.message);
    return false;
  }
}
```

## ⚡ Optimizaciones

### 1. Browser Pool Reutilizable

```typescript
class BrowserPool {
  private browsers: playwright.Browser[] = [];
  private available: boolean[] = [];
  private maxPoolSize: number;

  constructor(maxPoolSize = 5) {
    this.maxPoolSize = maxPoolSize;
  }

  async getBrowser(): Promise<playwright.Browser> {
    // Buscar browser disponible
    const availableIndex = this.available.findIndex((a) => a);

    if (availableIndex !== -1) {
      this.available[availableIndex] = false;
      return this.browsers[availableIndex];
    }

    // Crear nuevo browser si hay espacio
    if (this.browsers.length < this.maxPoolSize) {
      const browser = await playwright.chromium.launch({ headless: true });
      this.browsers.push(browser);
      this.available.push(false);
      return browser;
    }

    // Esperar por browser disponible
    return new Promise((resolve) => {
      const checkAvailable = setInterval(() => {
        const index = this.available.findIndex((a) => a);
        if (index !== -1) {
          clearInterval(checkAvailable);
          this.available[index] = false;
          resolve(this.browsers[index]);
        }
      }, 100);
    });
  }

  releaseBrowser(browser: playwright.Browser): void {
    const index = this.browsers.indexOf(browser);
    if (index !== -1) {
      this.available[index] = true;
    }
  }

  async cleanup(): Promise<void> {
    await Promise.all(this.browsers.map((browser) => browser.close()));
    this.browsers = [];
    this.available = [];
  }
}
```

### 2. Adaptive Timeout

```typescript
private calculateAdaptiveTimeout(previousResults: ValidationResult[]): number {
  if (previousResults.length === 0) {
    return this.config.timeout;
  }

  const successfulResults = previousResults.filter(r => r.isValid);
  if (successfulResults.length === 0) {
    return this.config.timeout;
  }

  const averageLatency = successfulResults.reduce((sum, r) => sum + r.latency, 0) / successfulResults.length;

  // Timeout = promedio + 2 desviaciones estándar + buffer
  return Math.min(averageLatency * 3 + 2000, this.config.timeout);
}
```

## 🧪 Testing

### Setup de Testing

```bash
# Instalar dependencias de testing
bun add -D vitest @testing-library/react jsdom

# Ejecutar tests
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

### Configuración Vitest

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "c8",
    },
  },
});
```

### Mocks y Fixtures

```typescript
// Mock para testing sin proxies reales
class MockValidatorService extends ProxyValidatorService {
  async validateProxy(proxy: Proxy): Promise<ValidationResult> {
    // Simular latencia variable
    const latency = Math.random() * 5000 + 500;
    await this.delay(latency);

    // Simular tasa de éxito del 30%
    const isValid = Math.random() < 0.3;

    return {
      proxy,
      isValid,
      latency,
      httpStatus: isValid ? 200 : 500,
      timestamp: new Date(),
    };
  }
}
```

## 🚨 Error Recovery

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(private failureThreshold = 5, private recoveryTimeout = 30000) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailTime > this.recoveryTimeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }
}
```
