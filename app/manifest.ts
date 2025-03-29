import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "World Clock",
    short_name: "World Clock",
    description: "Track and manage time across multiple timezones with our intuitive World Clock app.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    orientation: "portrait",
    scope: "/",
    id: "worldclock-app",
    categories: ["productivity", "utility"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ],
    shortcuts: [
      {
        name: "Add Timezone",
        short_name: "Add",
        description: "Add a new timezone to your collection",
        url: "/?action=add",
        icons: [
          {
            src: "/shortcuts/add-timezone.png",
            sizes: "96x96",
            type: "image/png"
          }
        ]
      }
    ],
    screenshots: [
      {
        src: "/screenshots/digital-view.png",
        sizes: "1280x720",
        type: "image/png",
        platform: "windows",
        label: "Digital Clock View"
      },
      {
        src: "/screenshots/analog-view.png",
        sizes: "1280x720",
        type: "image/png",
        platform: "windows",
        label: "Analog Clock View"
      }
    ]
  };
} 