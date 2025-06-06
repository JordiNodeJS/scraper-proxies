/**
 * Store principal para gestión de estado de proxies con Zustand
 */

import { create } from 'zustand';
import type { ProxyData, ScrapingSession, ProgressUpdate } from '../types/proxy.types';
import type { ScrapingRequest } from '../types/api.types';
import { apiService } from '../services/api.service';

interface ProxyStore {
  // Estado de scraping
  currentSession: ScrapingSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Datos de proxies
  proxies: ProxyData[];
  filteredProxies: ProxyData[];
  
  // Filtros y configuración
  filters: {
    protocol: string;
    country: string;
    workingOnly: boolean;
    searchTerm: string;
  };
  
  // Acciones de scraping
  startScraping: (request?: ScrapingRequest) => Promise<void>;
  stopScraping: () => void;
  pollProgress: () => void;
  
  // Acciones de datos
  setProxies: (proxies: ProxyData[]) => void;
  addProxy: (proxy: ProxyData) => void;
  updateProxy: (ip: string, port: number, updates: Partial<ProxyData>) => void;
  removeProxy: (ip: string, port: number) => void;
  
  // Acciones de filtros
  setFilter: (key: keyof ProxyStore['filters'], value: string | boolean) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  
  // Acciones de UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const useProxyStore = create<ProxyStore>((set, get) => ({
  // Estado inicial
  currentSession: null,
  isLoading: false,
  error: null,
  proxies: [],
  filteredProxies: [],
  
  filters: {
    protocol: '',
    country: '',
    workingOnly: false,
    searchTerm: '',
  },

  // Acciones de scraping
  startScraping: async (request = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.startScraping(request);
      
      if (response.success && response.data) {
        set({ currentSession: response.data });
        
        // Iniciar polling del progreso
        get().pollProgress();
      } else {
        set({ error: response.error || 'Error al iniciar scraping' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      set({ isLoading: false });
    }
  },

  stopScraping: () => {
    set({ currentSession: null, isLoading: false });
  },

  pollProgress: async () => {
    const { currentSession } = get();
    if (!currentSession || currentSession.status === 'completed' || currentSession.status === 'error') {
      return;
    }

    try {
      const response = await apiService.getProgress(currentSession.id);
      
      if (response.success && response.data) {
        const progress = response.data;
        
        // Actualizar sesión con nuevo progreso
        set({
          currentSession: {
            ...currentSession,
            progress: progress.progress,
            currentPhase: progress.phase,
            proxiesFound: progress.proxiesFound,
          }
        });

        // Si completado, obtener resultados
        if (progress.progress >= 100) {
          const resultsResponse = await apiService.getResults(currentSession.id);
          if (resultsResponse.success && resultsResponse.data) {
            get().setProxies(resultsResponse.data);
            set({
              currentSession: {
                ...currentSession,
                status: 'completed',
                endTime: new Date(),
              }
            });
          }
        } else {
          // Continuar polling
          setTimeout(() => get().pollProgress(), 2000);
        }
      }
    } catch (error) {
      console.error('Error polling progress:', error);
      set({ error: 'Error obteniendo progreso' });
    }
  },

  // Acciones de datos
  setProxies: (proxies) => {
    set({ proxies });
    get().applyFilters();
  },

  addProxy: (proxy) => {
    const { proxies } = get();
    const exists = proxies.some(p => p.ip === proxy.ip && p.port === proxy.port);
    
    if (!exists) {
      set({ proxies: [...proxies, proxy] });
      get().applyFilters();
    }
  },

  updateProxy: (ip, port, updates) => {
    const { proxies } = get();
    const updatedProxies = proxies.map(proxy => 
      proxy.ip === ip && proxy.port === port 
        ? { ...proxy, ...updates }
        : proxy
    );
    set({ proxies: updatedProxies });
    get().applyFilters();
  },

  removeProxy: (ip, port) => {
    const { proxies } = get();
    const filteredProxies = proxies.filter(proxy => 
      !(proxy.ip === ip && proxy.port === port)
    );
    set({ proxies: filteredProxies });
    get().applyFilters();
  },

  // Acciones de filtros
  setFilter: (key, value) => {
    set(state => ({
      filters: { ...state.filters, [key]: value }
    }));
    get().applyFilters();
  },

  clearFilters: () => {
    set({
      filters: {
        protocol: '',
        country: '',
        workingOnly: false,
        searchTerm: '',
      }
    });
    get().applyFilters();
  },

  applyFilters: () => {
    const { proxies, filters } = get();
    
    let filtered = [...proxies];

    // Filtro por protocolo
    if (filters.protocol) {
      filtered = filtered.filter(proxy => proxy.protocol === filters.protocol);
    }

    // Filtro por país
    if (filters.country) {
      filtered = filtered.filter(proxy => 
        proxy.country?.toLowerCase().includes(filters.country.toLowerCase()) ||
        proxy.countryCode?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Filtro por proxies funcionando
    if (filters.workingOnly) {
      filtered = filtered.filter(proxy => proxy.isWorking === true);
    }

    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(proxy => 
        proxy.ip.includes(term) ||
        proxy.port.toString().includes(term) ||
        proxy.country?.toLowerCase().includes(term) ||
        proxy.city?.toLowerCase().includes(term)
      );
    }

    set({ filteredProxies: filtered });
  },

  // Acciones de UI
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

export default useProxyStore; 