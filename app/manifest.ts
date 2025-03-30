import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TimezonePulse",
    short_name: "TimezonePulse",
    description: "Effortlessly track, compare, and convert time across multiple timezones with TimezonePulse. Stay synchronized with the world, whether for work or travel.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    orientation: "portrait",
    scope: "/",
    id: "timezonepulse-app", // Updated ID
    categories: ["productivity", "utility"],
    lang: "en",
    dir: "ltr",
    icons: [ // Using the single logo for all sizes as discussed
      {
        src: "/timezonepulse.png",
        sizes: "192x192", // Keeping size definition
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/timezonepulse.png",
        sizes: "384x384", // Keeping size definition
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/timezonepulse.png",
        sizes: "512x512", // Keeping size definition
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
            src: "/timezonepulse.png", // Updated shortcut icon
            sizes: "96x96", // Keeping size definition
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
