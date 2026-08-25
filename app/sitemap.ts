import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://trackmyworth.xyz";

  return [
    {
      url: siteUrl,
      lastModified: new Date("2026-08-24"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/features`,
      lastModified: new Date("2026-08-24"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/singapore-net-worth-tracker`,
      lastModified: new Date("2026-08-26"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/cpf-projection-calculator`,
      lastModified: new Date("2026-08-26"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/fire-calculator-singapore`,
      lastModified: new Date("2026-08-26"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date("2026-08-24"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date("2026-03-25"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/delete-account`,
      lastModified: new Date("2026-03-26"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
