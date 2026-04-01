import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.VITE_RIOT_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/asia': {
          target: 'https://asia.api.riotgames.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/asia/, ''),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              proxyReq.setHeader('X-Riot-Token', apiKey)
            })
          },
        },
        '/api/kr': {
          target: 'https://kr.api.riotgames.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/kr/, ''),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              proxyReq.setHeader('X-Riot-Token', apiKey)
            })
          },
        },
      },
    },
  }
})
