/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // FQ_BASE lets one deploy mount the game under a path (foundersquest.ca/play
  // is FQ_BASE=/play/). Default '/' — every root deploy is byte-identical to
  // before this option existed. index.html URLs are rebased by Vite; sw.js and
  // the manifest resolve their own base at runtime (scope / relative URLs).
  base: process.env['FQ_BASE'] ?? '/',
  plugins: [react()],
  build: {
    // split the former single 3.6MB chunk so the world's heaviest engines load
    // in parallel and cache independently of app-code changes (BACKLOG E-0).
    // three/rapier dominate; react and the r3f glue get their own shelves.
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          rapier: ['@react-three/rapier', '@dimforge/rapier3d-compat'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
})
