<script setup>
import { computed } from 'vue'
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

const isPositive = computed(() => {
  if (props.priceHistory.length < 2) return true
  const first = props.priceHistory[0].close
  const last = props.priceHistory[props.priceHistory.length - 1].close
  return last >= first
})

const chartData = computed(() => {
  const labels = props.priceHistory.map((p) =>
    new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
  )
  const data = props.priceHistory.map((p) => p.close)
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
  <div class="chart-wrapper" :class="{ compact }">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 300px;
}

.chart-wrapper.compact {
  height: 60px;
}
</style>
