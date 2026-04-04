import Stock from './stock-schema.js'

const STOCKS_DATA = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technologie', basePrice: 178, logo: 'https://assets.parqet.com/logos/symbol/AAPL?format=png' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technologie', basePrice: 415, logo: 'https://assets.parqet.com/logos/symbol/MSFT?format=png' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technologie', basePrice: 141, logo: 'https://assets.parqet.com/logos/symbol/GOOGL?format=png' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-commerce', basePrice: 185, logo: 'https://assets.parqet.com/logos/symbol/AMZN?format=png' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automobile', basePrice: 245, logo: 'https://assets.parqet.com/logos/symbol/TSLA?format=png' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semi-conducteurs', basePrice: 880, logo: 'https://assets.parqet.com/logos/symbol/NVDA?format=png' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technologie', basePrice: 505, logo: 'https://assets.parqet.com/logos/symbol/META?format=png' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance', basePrice: 198, logo: 'https://assets.parqet.com/logos/symbol/JPM?format=png' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance', basePrice: 280, logo: 'https://assets.parqet.com/logos/symbol/V?format=png' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Santé', basePrice: 156, logo: 'https://assets.parqet.com/logos/symbol/JNJ?format=png' },
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
  const existing = await Stock.findOne()
  if (existing && existing.logo && existing.priceHistory.length > 100) return
  await Stock.deleteMany({})

  const stocks = STOCKS_DATA.map((data) => {
    const history = generatePriceHistory(data.basePrice)
    const lastDay = history[history.length - 1]
    const prevDay = history[history.length - 2]

    return {
      symbol: data.symbol,
      name: data.name,
      sector: data.sector,
      logo: data.logo,
      currentPrice: lastDay.close,
      previousClose: prevDay.close,
      priceHistory: history,
    }
  })

  await Stock.insertMany(stocks)
  console.log(`Seed: ${stocks.length} actions insérées`)
}
