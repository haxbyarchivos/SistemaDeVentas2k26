import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // <<< habilita acceso desde el celular
    port: 5173,       // <<< podés cambiarlo si querés
  }
})
