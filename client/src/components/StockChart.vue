<script setup>
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

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

const chartData = computed(() => {
  const h = filteredHistory.value
  const dateFormat = selectedPeriod.value <= 7
    ? { day: '2-digit', month: 'short', hour: '2-digit' }
    : selectedPeriod.value <= 90
      ? { day: '2-digit', month: 'short' }
      : { month: 'short', year: 'numeric' }

  const labels = h.map((p) =>
    new Date(p.date).toLocaleDateString('fr-FR', dateFormat),
  )
  const data = h.map((p) => p.close)
  const color = isPositive.value ? '#26a69a' : '#ef5350'

  return {
    labels,
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: isPositive.value
        ? 'rgba(38, 166, 154, 0.08)'
        : 'rgba(239, 83, 80, 0.08)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: props.compact ? 1.5 : 2,
    }],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      enabled: !props.compact,
      mode: 'index',
      intersect: false,
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
</script>

<template>
  <div>
    <div v-if="!compact" class="period-tabs">
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
    <div class="chart-wrapper" :class="{ compact }">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.period-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
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

.chart-wrapper {
  width: 100%;
  height: 300px;
}

.chart-wrapper.compact {
  height: 60px;
}
</style>
