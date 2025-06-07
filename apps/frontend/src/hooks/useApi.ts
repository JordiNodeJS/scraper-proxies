import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { ScrapeConfig, ValidationConfig } from '../types/api.types';

// Query keys para React Query
export const QUERY_KEYS = {
  health: ['health'],
  test: ['test'],
  proxies: ['proxies'],
  stats: ['stats'],
  logs: ['logs'],
} as const;

// Hook para health check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: apiService.healthCheck,
    staleTime: 30000, // 30 segundos
    refetchInterval: 30000, // Refetch cada 30 segundos
    retry: 3,
  });
};

// Hook para test de conectividad
export const useTestConnection = () => {
  return useQuery({
    queryKey: ['test-connection'],
    queryFn: apiService.testConnection,
    staleTime: 60000, // 1 minuto
    enabled: false, // Solo ejecutar manualmente
    retry: 2,
  });
};

// Hook para scraping de proxies
export const useScrapeProxies = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config?: ScrapeConfig) => 
      apiService.scrapeProxies(config?.sources),
    onSuccess: () => {
      // Invalidar stats después de un scraping exitoso
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      // Invalidar logs para obtener nuevos logs del backend
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs });
    },
  });
};

// Hook para validación de proxies
export const useValidateProxies = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { 
      proxies: Array<{ ip: string; port: number; type: string }>;
      config?: ValidationConfig;
    }) => apiService.validateProxies(data.proxies),
    onSuccess: () => {
      // Invalidar stats después de una validación exitosa
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      // Invalidar logs para obtener nuevos logs del backend
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs });
    },
  });
};

// Hook para obtener estadísticas
export const useStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: apiService.getStats,
    refetchInterval: 60000, // cada minuto
    retry: 2,
  });
};

// Hook para obtener logs del backend
export const useBackendLogs = (limit: number = 100) => {
  return useQuery({
    queryKey: ['backend-logs', limit],
    queryFn: () => apiService.getLogs(limit),
    staleTime: 5000, // 5 segundos
    refetchInterval: 5000, // Refetch cada 5 segundos
    retry: 1,
  });
};

// Hook para verificación completa del estado del servidor
export const useServerHealthCheck = () => {
  return useQuery({
    queryKey: ['server-health'],
    queryFn: async () => {
      const startTime = Date.now();
      
      try {
        // Verificar múltiples endpoints para un chequeo completo
        const [healthResult, testResult] = await Promise.allSettled([
          apiService.healthCheck(),
          apiService.testConnection()
        ]);
        
        const responseTime = Date.now() - startTime;
        
        const healthStatus = healthResult.status === 'fulfilled' && healthResult.value?.status === 'ok';
        const apiStatus = testResult.status === 'fulfilled' && testResult.value?.status === 'functional';
        
        // Determinar el estado general del servidor
        let serverStatus: 'healthy' | 'degraded' | 'down' = 'down';
        let statusMessage = '';
        
        if (healthStatus && apiStatus) {
          serverStatus = 'healthy';
          statusMessage = 'Servidor completamente operativo';
        } else if (healthStatus && !apiStatus) {
          serverStatus = 'degraded';
          statusMessage = 'Servidor conectado pero API con problemas';
        } else if (!healthStatus && apiStatus) {
          serverStatus = 'degraded';
          statusMessage = 'API funcional pero health check falló';
        } else {
          serverStatus = 'down';
          statusMessage = 'Servidor no disponible';
        }
        
        return {
          status: serverStatus,
          message: statusMessage,
          responseTime,
          healthCheck: {
            success: healthStatus,
            data: healthResult.status === 'fulfilled' ? healthResult.value : null,
            error: healthResult.status === 'rejected' ? healthResult.reason?.message : null
          },
          apiTest: {
            success: apiStatus,
            data: testResult.status === 'fulfilled' ? testResult.value : null,
            error: testResult.status === 'rejected' ? testResult.reason?.message : null
          },
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
          status: 'down' as const,
          message: 'Error durante la verificación del servidor',
          responseTime,
          healthCheck: {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Error desconocido'
          },
          apiTest: {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Error desconocido'
          },
          timestamp: new Date().toISOString()
        };
      }
    },
    staleTime: 15000, // 15 segundos
    refetchInterval: 15000, // Verificar cada 15 segundos
    retry: 2,
    retryDelay: 5000, // Esperar 5 segundos entre reintentos
  });
};

// Hook para obtener el estado general del sistema (versión mejorada)
export const useSystemStatus = () => {
  const serverHealth = useServerHealthCheck();
  const healthQuery = useHealthCheck();
  const testQuery = useTestConnection();
  
  return {
    // Estados individuales (compatibilidad hacia atrás)
    isHealthy: healthQuery.isSuccess && healthQuery.data?.status === 'ok',
    isConnected: testQuery.isSuccess && testQuery.data?.status === 'functional',
    isLoading: healthQuery.isLoading,
    healthData: healthQuery.data,
    testData: testQuery.data,
    refetchTest: testQuery.refetch,
    
    // Estado completo del servidor (nuevo)
    serverHealth: {
      status: serverHealth.data?.status || 'down',
      message: serverHealth.data?.message || 'Verificando...',
      responseTime: serverHealth.data?.responseTime,
      isLoading: serverHealth.isLoading,
      lastCheck: serverHealth.data?.timestamp,
      details: {
        healthCheck: serverHealth.data?.healthCheck,
        apiTest: serverHealth.data?.apiTest
      },
      refetch: serverHealth.refetch
    }
  };
}; 