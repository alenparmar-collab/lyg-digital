import type { MetadataRoute } from "next";

/**
 * What a phone needs to keep LYG on a home screen.
 *
 * Deliberately modest: this is the parish's registration site, not an app.
 * It opens on the cover, on the same warm paper the site uses, so adding it
 * to a home screen feels like keeping the zine rather than installing
 * something.
 *
 * Next links this automatically; app/apple-icon.png covers iOS, which ignores
 * the manifest's icons.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lourdes Youth Group · CTM Parish",
    short_name: "LYG",
    description:
      "Register with Lourdes Youth Group, the Catholic youth group of CTM Parish, Ahmedabad.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4EFE4",
    theme_color: "#F4EFE4",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        // Android crops to a circle, so this one carries the safe margin.
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
