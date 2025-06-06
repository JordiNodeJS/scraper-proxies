import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { ScrapeConfig, ValidationConfig } from '../types/api.types';

// Query keys para React Query
export const QUERY_KEYS = {
  health: ['health'],
  test: ['test'],
  proxies: ['proxies'],
  stats: ['stats'],
} as const;

// Hook para health check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: apiService.healthCheck,
    refetchInterval: 30000, // cada 30 segundos
    retry: 3,
  });
};

// Hook para test de conectividad
export const useTestConnection = () => {
  return useQuery({
    queryKey: QUERY_KEYS.test,
    queryFn: apiService.testConnection,
    enabled: false, // solo ejecutar manualmente
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

// Hook para obtener el estado general del sistema
export const useSystemStatus = () => {
  const healthQuery = useHealthCheck();
  const testQuery = useTestConnection();
  
  return {
    isHealthy: healthQuery.isSuccess && healthQuery.data?.status === 'ok',
    isConnected: testQuery.isSuccess && testQuery.data?.status === 'functional',
    isLoading: healthQuery.isLoading,
    healthData: healthQuery.data,
    testData: testQuery.data,
    refetchTest: testQuery.refetch,
  };
}; 