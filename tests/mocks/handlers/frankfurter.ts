import { http, HttpResponse } from "msw";

// Mock exchange rates data
export const mockExchangeRates = {
  EUR: 0.92,
  GBP: 0.79,
  SGD: 1.35,
  JPY: 149.5,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  HKD: 7.82,
};

export const frankfurterHandlers = [
  // GET /latest - fetch exchange rates
  http.get("https://api.frankfurter.app/latest", ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") || "USD";
    const to = url.searchParams.get("to");

    // Filter rates based on requested currencies
    const rates: Record<string, number> = {};
    const requestedCurrencies = to ? to.split(",") : Object.keys(mockExchangeRates);

    for (const currency of requestedCurrencies) {
      if (currency !== from && currency in mockExchangeRates) {
        rates[currency] = mockExchangeRates[currency as keyof typeof mockExchangeRates];
      }
    }

    return HttpResponse.json({
      amount: 1,
      base: from,
      date: new Date().toISOString().split("T")[0],
      rates,
    });
  }),
];
