import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Track My Worth",
    short_name: "Track My Worth",
    description: "A personal dashboard for your wealth, investments, CPF, and FIRE goals.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f7fb",
    theme_color: "#12213c",
    icons: [
      {
        src: "/track-my-worth-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
