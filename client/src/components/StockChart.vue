<script setup>
import { ref, computed } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
)

const props = defineProps({
  priceHistory: { type: Array, required: true },
  compact: { type: Boolean, default: false },
})

const PERIODS = [
  { label: '1J', days: 1 },
  { label: '1S', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1A', days: 365 },
  { label: '5A', days: 365 * 5 },
]

const selectedPeriod = ref(90)
const chartMode = ref('line')
const showSma20 = ref(false)
const showSma50 = ref(false)

const filteredHistory = computed(() => {
  if (props.compact) return props.priceHistory
  const history = props.priceHistory
  if (history.length <= selectedPeriod.value) return history
  return history.slice(history.length - selectedPeriod.value - 1)
})

const isPositive = computed(() => {
  const h = filteredHistory.value
  if (h.length < 2) return true
  return h[h.length - 1].close >= h[0].close
})

function computeSMA(closes, period) {
  const result = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        sum += closes[j]
      }
      result.push(sum / period)
    }
  }
  return result
}

const dateLabels = computed(() => {
  const h = filteredHistory.value
  const dateFormat =
    selectedPeriod.value <= 7
      ? { day: '2-digit', month: 'short', hour: '2-digit' }
      : selectedPeriod.value <= 90
        ? { day: '2-digit', month: 'short' }
        : { month: 'short', year: 'numeric' }

  return h.map((p) =>
    new Date(p.date).toLocaleDateString('fr-FR', dateFormat),
  )
})

const closes = computed(() => filteredHistory.value.map((p) => p.close))
const sma20 = computed(() => computeSMA(closes.value, 20))
const sma50 = computed(() => computeSMA(closes.value, 50))

function buildSmaDatasets() {
  const datasets = []
  if (showSma20.value) {
    datasets.push({
      label: 'SMA 20',
      data: sma20.value,
      borderColor: '#f7931a',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderDash: [4, 3],
      pointRadius: 0,
      tension: 0.3,
      fill: false,
      order: 0,
    })
  }
  if (showSma50.value) {
    datasets.push({
      label: 'SMA 50',
      data: sma50.value,
      borderColor: '#42a5f5',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderDash: [6, 3],
      pointRadius: 0,
      tension: 0.3,
      fill: false,
      order: 0,
    })
  }
  return datasets
}

const lineChartData = computed(() => {
  const h = filteredHistory.value
  const data = h.map((p) => p.close)
  const color = isPositive.value ? '#26a69a' : '#ef5350'

  return {
    labels: dateLabels.value,
    datasets: [
      {
        label: 'Prix',
        data,
        borderColor: color,
        backgroundColor: isPositive.value
          ? 'rgba(38, 166, 154, 0.08)'
          : 'rgba(239, 83, 80, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: props.compact ? 1.5 : 2,
        order: 1,
      },
      ...buildSmaDatasets(),
    ],
  }
})

const candlestickChartData = computed(() => {
  const h = filteredHistory.value

  const bodyData = h.map((p) => {
    const low = Math.min(p.open, p.close)
    const high = Math.max(p.open, p.close)
    return [low, high]
  })

  const wickData = h.map((p) => [p.low, p.high])

  const bodyColors = h.map((p) =>
    p.close >= p.open ? '#26a69a' : '#ef5350',
  )

  const wickColors = h.map((p) =>
    p.close >= p.open ? 'rgba(38, 166, 154, 0.6)' : 'rgba(239, 83, 80, 0.6)',
  )

  return {
    labels: dateLabels.value,
    datasets: [
      {
        label: 'Mèche',
        data: wickData,
        backgroundColor: wickColors,
        borderColor: wickColors,
        borderWidth: 1,
        barPercentage: 0.1,
        categoryPercentage: 1,
        order: 2,
      },
      {
        label: 'Corps',
        data: bodyData,
        backgroundColor: bodyColors,
        borderColor: bodyColors,
        borderWidth: 1,
        barPercentage: 0.6,
        categoryPercentage: 0.9,
        order: 1,
      },
      ...buildSmaDatasets().map((ds) => ({
        ...ds,
        type: 'line',
      })),
    ],
  }
})

const chartData = computed(() => {
  if (props.compact) return lineChartData.value
  return chartMode.value === 'line'
    ? lineChartData.value
    : candlestickChartData.value
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      enabled: !props.compact,
      mode: 'index',
      intersect: false,
      callbacks:
        chartMode.value === 'candlestick' && !props.compact
          ? {
              label(ctx) {
                const i = ctx.dataIndex
                const p = filteredHistory.value[i]
                if (!p) return ''
                if (ctx.dataset.label === 'Corps') {
                  return [
                    `O: ${p.open.toFixed(2)}`,
                    `H: ${p.high.toFixed(2)}`,
                    `L: ${p.low.toFixed(2)}`,
                    `C: ${p.close.toFixed(2)}`,
                  ]
                }
                if (
                  ctx.dataset.label === 'SMA 20' ||
                  ctx.dataset.label === 'SMA 50'
                ) {
                  const val = ctx.parsed.y
                  return val != null
                    ? `${ctx.dataset.label}: ${val.toFixed(2)}`
                    : ''
                }
                return ''
              },
            }
          : undefined,
    },
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      display: !props.compact,
      grid: { color: 'rgba(42, 46, 57, 0.5)' },
      ticks: { color: '#787b86', maxTicksLimit: 8 },
    },
    y: {
      display: !props.compact,
      grid: { color: 'rgba(42, 46, 57, 0.5)' },
      ticks: { color: '#787b86' },
    },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
}))

const currentComponent = computed(() =>
  chartMode.value === 'line' || props.compact ? Line : Bar,
)
</script>

<template>
  <div>
    <div v-if="!compact" class="chart-controls">
      <div class="period-tabs">
        <button
          v-for="p in PERIODS"
          :key="p.days"
          class="period-btn"
          :class="{ active: selectedPeriod === p.days }"
          @click="selectedPeriod = p.days"
        >
          {{ p.label }}
        </button>
      </div>

      <div class="mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: chartMode === 'line' }"
          @click="chartMode = 'line'"
        >
          Ligne
        </button>
        <button
          class="mode-btn"
          :class="{ active: chartMode === 'candlestick' }"
          @click="chartMode = 'candlestick'"
        >
          Bougies
        </button>
      </div>

      <div class="sma-checkboxes">
        <label class="sma-label">
          <input v-model="showSma20" type="checkbox" />
          <span class="sma-indicator sma20"></span>
          SMA 20
        </label>
        <label class="sma-label">
          <input v-model="showSma50" type="checkbox" />
          <span class="sma-indicator sma50"></span>
          SMA 50
        </label>
      </div>
    </div>

    <div class="chart-wrapper" :class="{ compact }">
      <component :is="currentComponent" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.period-tabs {
  display: flex;
  gap: 4px;
}

.period-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.period-btn:hover {
  color: var(--text-primary);
  border-color: var(--text-secondary);
}

.period-btn.active {
  background: rgba(247, 147, 26, 0.12);
  border-color: var(--accent);
  color: var(--accent);
}

.mode-toggle {
  display: flex;
  gap: 2px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px;
}

.mode-btn {
  padding: 5px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-btn:hover {
  color: var(--text-primary);
}

.mode-btn.active {
  background: rgba(247, 147, 26, 0.12);
  color: var(--accent);
}

.sma-checkboxes {
  display: flex;
  gap: 14px;
  margin-left: auto;
}

.sma-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.sma-label input[type='checkbox'] {
  display: none;
}

.sma-indicator {
  width: 18px;
  height: 3px;
  border-radius: 2px;
}

.sma-indicator.sma20 {
  background: #f7931a;
  border-top: 1px dashed #f7931a;
}

.sma-indicator.sma50 {
  background: #42a5f5;
  border-top: 1px dashed #42a5f5;
}

.sma-label input:checked ~ .sma-indicator {
  box-shadow: 0 0 6px currentColor;
}

.sma-label input:checked ~ .sma20 {
  box-shadow: 0 0 6px #f7931a;
}

.sma-label input:checked ~ .sma50 {
  box-shadow: 0 0 6px #42a5f5;
}

.sma-label:hover {
  color: var(--text-primary);
}

.chart-wrapper {
  width: 100%;
  height: 300px;
}

.chart-wrapper.compact {
  height: 60px;
}
</style>
