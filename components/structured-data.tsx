export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TrackMyWorth",
    url: "https://trackmyworth.xyz",
    logo: "https://trackmyworth.xyz/og-image.png",
    description:
      "Track your net worth, savings, and investment portfolio in one simple dashboard.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TrackMyWorth",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: "https://trackmyworth.xyz",
    description:
      "Net worth tracker app for monitoring savings, investments, and portfolio growth with live stock prices.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Net worth tracking",
      "Cash account management",
      "Stock portfolio tracking",
      "Live stock price updates",
      "Multi-currency support",
      "Visual charts and graphs",
      "Secure row-level data isolation",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
