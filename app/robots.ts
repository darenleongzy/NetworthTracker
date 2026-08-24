import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // Public pages can be crawled; private routes redirect to a noindex login page.
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://trackmyworth.xyz/sitemap.xml",
  };
}
