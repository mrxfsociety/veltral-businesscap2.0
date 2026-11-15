import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Veltral — rehearse the hard minute",
    short_name: "Veltral",
    description:
      "A paper stage to practise a hard parenting moment and try another take.",
    start_url: "/play",
    scope: "/",
    display: "standalone",
    background_color: "#F4ECDD",
    theme_color: "#F4ECDD",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
