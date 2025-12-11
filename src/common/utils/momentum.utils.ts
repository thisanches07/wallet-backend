export interface PriceHistory {
  date: string;
  price: number;
}

export function calculateMomentum(
  prices: PriceHistory[],
  periodDays: number,
): number {
  if (prices.length < 2) return 0;

  const sortedPrices = prices.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const latestPrice = sortedPrices[sortedPrices.length - 1].price;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);

  const pricesInPeriod = sortedPrices.filter(
    (p) => new Date(p.date) >= cutoffDate,
  );

  if (pricesInPeriod.length === 0) return 0;

  const oldestPriceInPeriod = pricesInPeriod[0].price;

  return ((latestPrice - oldestPriceInPeriod) / oldestPriceInPeriod) * 100;
}

export function calculateVolatility(prices: PriceHistory[]): number {
  if (prices.length < 2) return 0;

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1].price;
    const currentPrice = prices[i].price;
    returns.push((currentPrice - prevPrice) / prevPrice);
  }

  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    returns.length;

  return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility %
}
