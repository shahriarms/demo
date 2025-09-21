import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StockPilot',
    short_name: 'StockPilot',
    description: 'A modern PWA for inventory management.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0F4F5',
    theme_color: '#79A3B1',
    icons: [
       {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
