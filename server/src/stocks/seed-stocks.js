import Stock from './stock-schema.js'

const STOCKS_DATA = [
  // Actions US
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technologie', type: 'stock', basePrice: 178, logo: 'https://assets.parqet.com/logos/symbol/AAPL?format=png' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technologie', type: 'stock', basePrice: 415, logo: 'https://assets.parqet.com/logos/symbol/MSFT?format=png' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technologie', type: 'stock', basePrice: 141, logo: 'https://assets.parqet.com/logos/symbol/GOOGL?format=png' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-commerce', type: 'stock', basePrice: 185, logo: 'https://assets.parqet.com/logos/symbol/AMZN?format=png' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automobile', type: 'stock', basePrice: 245, logo: 'https://assets.parqet.com/logos/symbol/TSLA?format=png' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semi-conducteurs', type: 'stock', basePrice: 880, logo: 'https://assets.parqet.com/logos/symbol/NVDA?format=png' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technologie', type: 'stock', basePrice: 505, logo: 'https://assets.parqet.com/logos/symbol/META?format=png' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance', type: 'stock', basePrice: 198, logo: 'https://assets.parqet.com/logos/symbol/JPM?format=png' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance', type: 'stock', basePrice: 280, logo: 'https://assets.parqet.com/logos/symbol/V?format=png' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Sante', type: 'stock', basePrice: 156, logo: 'https://assets.parqet.com/logos/symbol/JNJ?format=png' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Distribution', type: 'stock', basePrice: 165, logo: 'https://assets.parqet.com/logos/symbol/WMT?format=png' },
  { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Divertissement', type: 'stock', basePrice: 95, logo: 'https://assets.parqet.com/logos/symbol/DIS?format=png' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Divertissement', type: 'stock', basePrice: 450, logo: 'https://assets.parqet.com/logos/symbol/NFLX?format=png' },
  { symbol: 'AMD', name: 'AMD Inc.', sector: 'Semi-conducteurs', type: 'stock', basePrice: 120, logo: 'https://assets.parqet.com/logos/symbol/AMD?format=png' },
  { symbol: 'PYPL', name: 'PayPal Holdings', sector: 'Finance', type: 'stock', basePrice: 62, logo: 'https://assets.parqet.com/logos/symbol/PYPL?format=png' },
  // Crypto
  { symbol: 'BTC', name: 'Bitcoin', sector: 'Crypto', type: 'crypto', basePrice: 42000, logo: 'https://assets.parqet.com/logos/symbol/BTC?format=png' },
  { symbol: 'ETH', name: 'Ethereum', sector: 'Crypto', type: 'crypto', basePrice: 2300, logo: 'https://assets.parqet.com/logos/symbol/ETH?format=png' },
  { symbol: 'SOL', name: 'Solana', sector: 'Crypto', type: 'crypto', basePrice: 95, logo: 'https://assets.parqet.com/logos/symbol/SOL?format=png' },
  { symbol: 'BNB', name: 'BNB', sector: 'Crypto', type: 'crypto', basePrice: 310, logo: 'https://assets.parqet.com/logos/symbol/BNB?format=png' },
  { symbol: 'XRP', name: 'Ripple', sector: 'Crypto', type: 'crypto', basePrice: 0.55, logo: 'https://assets.parqet.com/logos/symbol/XRP?format=png' },
  { symbol: 'ADA', name: 'Cardano', sector: 'Crypto', type: 'crypto', basePrice: 0.45, logo: 'https://assets.parqet.com/logos/symbol/ADA?format=png' },
  { symbol: 'DOGE', name: 'Dogecoin', sector: 'Crypto', type: 'crypto', basePrice: 0.08, logo: 'https://assets.parqet.com/logos/symbol/DOGE?format=png' },
  // Indices / ETF
  { symbol: 'SPY', name: 'S&P 500 ETF', sector: 'Indice', type: 'etf', basePrice: 475, logo: 'https://assets.parqet.com/logos/symbol/SPY?format=png' },
  { symbol: 'QQQ', name: 'NASDAQ 100 ETF', sector: 'Indice', type: 'etf', basePrice: 405, logo: 'https://assets.parqet.com/logos/symbol/QQQ?format=png' },
  { symbol: 'DIA', name: 'Dow Jones ETF', sector: 'Indice', type: 'etf', basePrice: 380, logo: 'https://assets.parqet.com/logos/symbol/DIA?format=png' },
  { symbol: 'EWQ', name: 'CAC 40 ETF', sector: 'Indice', type: 'etf', basePrice: 34, logo: 'https://assets.parqet.com/logos/symbol/EWQ?format=png' },
  { symbol: 'EWG', name: 'DAX ETF', sector: 'Indice', type: 'etf', basePrice: 30, logo: 'https://assets.parqet.com/logos/symbol/EWG?format=png' },
  { symbol: 'EWJ', name: 'Nikkei ETF', sector: 'Indice', type: 'etf', basePrice: 68, logo: 'https://assets.parqet.com/logos/symbol/EWJ?format=png' },
]

function generatePriceHistory(basePrice, days = 365 * 5) {
  const history = []
  let price = basePrice * 0.85
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    // Mouvement aléatoire réaliste (entre -3% et +3%)
    const change = (Math.random() - 0.48) * 0.03
    price = price * (1 + change)

    const dayVolatility = price * 0.02
    const open = price + (Math.random() - 0.5) * dayVolatility
    const close = price + (Math.random() - 0.5) * dayVolatility
    const high = Math.max(open, close) + Math.random() * dayVolatility * 0.5
    const low = Math.min(open, close) - Math.random() * dayVolatility * 0.5

    history.push({
      date,
      open: Math.round(open * 100) / 100,
      close: Math.round(close * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
    })
  }

  return history
}

export async function seedStocks() {
  const count = await Stock.countDocuments()
  // Re-seed si on a changé le nombre d'actifs
  if (count === STOCKS_DATA.length) return
  await Stock.deleteMany({})

  const stocks = STOCKS_DATA.map((data) => {
    const history = generatePriceHistory(data.basePrice)
    const lastDay = history[history.length - 1]
    const prevDay = history[history.length - 2]

    return {
      symbol: data.symbol,
      name: data.name,
      sector: data.sector,
      type: data.type || 'stock',
      logo: data.logo,
      currentPrice: lastDay.close,
      previousClose: prevDay.close,
      priceHistory: history,
    }
  })

  await Stock.insertMany(stocks)
  console.log(`Seed: ${stocks.length} actions insérées`)
}
