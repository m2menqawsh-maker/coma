import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Coma System',
    short_name: 'Coma',
    description: 'Gaming Lounge and PS5 Cafe Management System',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d14',
    theme_color: '#0d0d14',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
