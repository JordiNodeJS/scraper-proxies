import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')
  
  // Puerto del backend - usar variable de entorno o fallback
  const backendPort = env.VITE_BACKEND_PORT || env.BACKEND_PORT || '3001'
  const backendUrl = `http://localhost:${backendPort}`
  
  console.log(`🔧 Vite proxy configurado para backend: ${backendUrl}`)
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/health': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
