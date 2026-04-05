<script setup>
import { computed } from 'vue'

const props = defineProps({
  priceHistory: { type: Array, required: true },
})

function sma(data, period) {
  if (data.length < period) return null
  const slice = data.slice(-period)
  return slice.reduce((s, v) => s + v, 0) / period
}

function ema(data, period) {
  if (data.length < period) return null
  const k = 2 / (period + 1)
  let emaVal = data.slice(0, period).reduce((s, v) => s + v, 0) / period
  for (let i = period; i < data.length; i++) {
    emaVal = data[i] * k + emaVal * (1 - k)
  }
  return emaVal
}

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  if (losses === 0) return 100
  const rs = (gains / period) / (losses / period)
  return 100 - (100 / (1 + rs))
}

function calcMACD(closes) {
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  if (ema12 === null || ema26 === null) return null
  const macdLine = ema12 - ema26
  // Signal approximation
  const macdHistory = []
  const k12 = 2 / 13, k26 = 2 / 27
  let e12 = closes.slice(0, 12).reduce((s, v) => s + v, 0) / 12
  let e26 = closes.slice(0, 26).reduce((s, v) => s + v, 0) / 26
  for (let i = 26; i < closes.length; i++) {
    e12 = closes[i] * k12 + e12 * (1 - k12)
    e26 = closes[i] * k26 + e26 * (1 - k26)
    macdHistory.push(e12 - e26)
  }
  const signal = macdHistory.length >= 9 ? ema(macdHistory, 9) : null
  return { line: macdLine, signal, histogram: signal !== null ? macdLine - signal : null }
}

function calcStochastic(history, period = 14) {
  if (history.length < period) return null
  const slice = history.slice(-period)
  const highs = slice.map(p => p.high)
  const lows = slice.map(p => p.low)
  const high = Math.max(...highs)
  const low = Math.min(...lows)
  const close = history[history.length - 1].close
  if (high === low) return { k: 50, d: 50 }
  const k = ((close - low) / (high - low)) * 100
  return { k, d: k }
}

function calcBollinger(closes, period = 20) {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  const mean = slice.reduce((s, v) => s + v, 0) / period
  const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period
  const std = Math.sqrt(variance)
  return { upper: mean + 2 * std, middle: mean, lower: mean - 2 * std }
}

function calcATR(history, period = 14) {
  if (history.length < period + 1) return null
  let sum = 0
  for (let i = history.length - period; i < history.length; i++) {
    const h = history[i].high, l = history[i].low
    const pc = history[i - 1].close
    const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc))
    sum += tr
  }
  return sum / period
}

function calcSupRes(history) {
  if (history.length < 30) return null
  const recent = history.slice(-90)
  const highs = recent.map(p => p.high)
  const lows = recent.map(p => p.low)
  return {
    resistance: Math.max(...highs),
    support: Math.min(...lows),
  }
}

const indicators = computed(() => {
  const h = props.priceHistory
  if (!h || h.length < 30) return null
  const closes = h.map(p => p.close)

  const rsi = calcRSI(closes)
  const macd = calcMACD(closes)
  const stoch = calcStochastic(h)
  const bollinger = calcBollinger(closes)
  const atr = calcATR(h)
  const supres = calcSupRes(h)
  const sma20 = sma(closes, 20)
  const sma50 = sma(closes, 50)
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const lastClose = closes[closes.length - 1]

  // Signal global
  let bullish = 0, bearish = 0
  if (rsi !== null) { if (rsi < 30) bullish++; else if (rsi > 70) bearish++; else bullish += 0.5 }
  if (macd?.histogram > 0) bullish++; else if (macd?.histogram < 0) bearish++
  if (lastClose > sma20) bullish++; else bearish++
  if (lastClose > sma50) bullish++; else bearish++
  if (stoch?.k < 20) bullish++; else if (stoch?.k > 80) bearish++

  const total = bullish + bearish
  const sentiment = total === 0 ? 'Neutre' : bullish > bearish ? 'Haussier' : bearish > bullish ? 'Baissier' : 'Neutre'

  return { rsi, macd, stoch, bollinger, atr, supres, sma20, sma50, ema12, ema26, sentiment, bullish, bearish }
})

function fmt(v, d = 2) {
  return v !== null && v !== undefined ? v.toFixed(d) : '—'
}
</script>

<template>
  <div class="indicators" v-if="indicators">
    <h2>Indicateurs techniques</h2>

    <div class="signal-bar">
      <span class="signal-label">Signal global</span>
      <span class="signal-value" :class="indicators.sentiment.toLowerCase()">{{ indicators.sentiment }}</span>
    </div>

    <div class="ind-grid">
      <div class="ind-card">
        <span class="ind-name">RSI (14)</span>
        <span class="ind-value" :class="{ oversold: indicators.rsi < 30, overbought: indicators.rsi > 70 }">{{ fmt(indicators.rsi) }}</span>
        <span class="ind-hint">{{ indicators.rsi < 30 ? 'Survendu' : indicators.rsi > 70 ? 'Surachete' : 'Neutre' }}</span>
      </div>

      <div class="ind-card">
        <span class="ind-name">Stochastic %K</span>
        <span class="ind-value">{{ fmt(indicators.stoch?.k) }}</span>
        <span class="ind-hint">{{ indicators.stoch?.k < 20 ? 'Survendu' : indicators.stoch?.k > 80 ? 'Surachete' : 'Neutre' }}</span>
      </div>

      <div class="ind-card">
        <span class="ind-name">MACD</span>
        <span class="ind-value" :class="{ positive: indicators.macd?.line > 0, negative: indicators.macd?.line < 0 }">{{ fmt(indicators.macd?.line) }}</span>
        <span class="ind-hint">Signal: {{ fmt(indicators.macd?.signal) }}</span>
      </div>

      <div class="ind-card">
        <span class="ind-name">ATR (14)</span>
        <span class="ind-value">{{ fmt(indicators.atr) }}</span>
        <span class="ind-hint">Volatilite</span>
      </div>

      <div class="ind-card">
        <span class="ind-name">SMA 20</span>
        <span class="ind-value">${{ fmt(indicators.sma20) }}</span>
      </div>

      <div class="ind-card">
        <span class="ind-name">SMA 50</span>
        <span class="ind-value">${{ fmt(indicators.sma50) }}</span>
      </div>

      <div class="ind-card">
        <span class="ind-name">EMA 12</span>
        <span class="ind-value">${{ fmt(indicators.ema12) }}</span>
      </div>

      <div class="ind-card">
        <span class="ind-name">EMA 26</span>
        <span class="ind-value">${{ fmt(indicators.ema26) }}</span>
      </div>

      <div class="ind-card wide">
        <span class="ind-name">Bollinger (20)</span>
        <div class="bollinger-row">
          <span>Sup: ${{ fmt(indicators.bollinger?.upper) }}</span>
          <span>Moy: ${{ fmt(indicators.bollinger?.middle) }}</span>
          <span>Inf: ${{ fmt(indicators.bollinger?.lower) }}</span>
        </div>
      </div>

      <div class="ind-card wide">
        <span class="ind-name">Support / Resistance</span>
        <div class="bollinger-row">
          <span class="support">Support: ${{ fmt(indicators.supres?.support) }}</span>
          <span class="resistance">Resistance: ${{ fmt(indicators.supres?.resistance) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.indicators {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
  margin-top: 24px;
}

.indicators h2 {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.signal-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 16px;
}

.signal-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.signal-value {
  font-size: 15px;
  font-weight: 700;
}

.signal-value.haussier { color: var(--green); }
.signal-value.baissier { color: var(--red); }
.signal-value.neutre { color: var(--text-secondary); }

.ind-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.ind-card {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.ind-card.wide {
  grid-column: span 2;
}

.ind-name {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
}

.ind-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.ind-value.oversold, .ind-value.positive { color: var(--green); }
.ind-value.overbought, .ind-value.negative { color: var(--red); }

.ind-hint {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.bollinger-row {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-primary);
  margin-top: 4px;
}

.support { color: var(--green); }
.resistance { color: var(--red); }
</style>
