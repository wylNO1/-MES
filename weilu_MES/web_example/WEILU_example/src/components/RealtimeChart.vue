<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import type { ChartSeries } from '../types'

const props = defineProps<{ series: ChartSeries[] }>()

const WIDTH = 720
const HEIGHT = 210
const PAD = { top: 16, right: 16, bottom: 24, left: 46 }
const MAX_POINTS = 24

const activeKey = ref(props.series[0]?.key ?? '')
const live = ref(false)
/** 模拟推送产生的点单独存放，避免污染原始样例数据。 */
const simulated = reactive<Record<string, number[]>>({})
let timer: number | undefined

watch(
  () => props.series,
  (list) => {
    if (!list.some((item) => item.key === activeKey.value)) activeKey.value = list[0]?.key ?? ''
  },
)

const active = computed(() => props.series.find((item) => item.key === activeKey.value) ?? props.series[0])

const points = computed(() => {
  if (!active.value) return [] as number[]
  const extra = simulated[active.value.key] ?? []
  return [...active.value.values, ...extra].slice(-MAX_POINTS)
})

const bounds = computed(() => {
  const series = active.value
  if (!series || !points.value.length) return { min: 0, max: 1 }
  const min = Math.min(series.lower, ...points.value)
  const max = Math.max(series.upper, ...points.value)
  const padding = (max - min) * 0.12 || 1
  return { min: min - padding, max: max + padding }
})

function toX(index: number): number {
  const count = Math.max(points.value.length - 1, 1)
  return PAD.left + (index / count) * (WIDTH - PAD.left - PAD.right)
}

function toY(value: number): number {
  const { min, max } = bounds.value
  const ratio = (value - min) / (max - min || 1)
  return HEIGHT - PAD.bottom - ratio * (HEIGHT - PAD.top - PAD.bottom)
}

const linePath = computed(() => points.value.map((value, index) => `${index === 0 ? 'M' : 'L'} ${toX(index).toFixed(1)} ${toY(value).toFixed(1)}`).join(' '))
const areaPath = computed(() => {
  if (!points.value.length) return ''
  return `${linePath.value} L ${toX(points.value.length - 1).toFixed(1)} ${HEIGHT - PAD.bottom} L ${toX(0).toFixed(1)} ${HEIGHT - PAD.bottom} Z`
})

const ticks = computed(() => {
  const { min, max } = bounds.value
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = max - (max - min) * ratio
    return { value, y: PAD.top + ratio * (HEIGHT - PAD.top - PAD.bottom) }
  })
})

const latest = computed(() => points.value[points.value.length - 1] ?? 0)
const outOfRange = computed(() => {
  const series = active.value
  if (!series) return false
  return latest.value > series.upper || latest.value < series.lower
})

function tick() {
  const series = active.value
  if (!series) return
  const base = points.value[points.value.length - 1] ?? series.lower
  const span = (series.upper - series.lower) || 1
  const next = Number((base + (Math.random() - 0.5) * span * 0.12).toFixed(2))
  const list = simulated[series.key] ?? (simulated[series.key] = [])
  list.push(next)
  if (list.length > MAX_POINTS) list.shift()
}

function toggleLive() {
  live.value = !live.value
  if (live.value) timer = window.setInterval(tick, 3000)
  else if (timer) window.clearInterval(timer)
}

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})

function format(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
</script>

<template>
  <div v-if="active" class="rt-chart">
    <div class="rt-head">
      <div class="rt-series">
        <button
          v-for="item in props.series"
          :key="item.key"
          type="button"
          :class="{ active: item.key === activeKey }"
          @click="activeKey = item.key"
        >{{ item.device.split(' · ')[1] ?? item.device }} · {{ item.point }}</button>
      </div>
      <button class="rt-live" type="button" :class="{ on: live }" @click="toggleLive">
        <i></i>{{ live ? '模拟推送中（3 秒）' : '开启模拟推送' }}
      </button>
    </div>

    <div class="rt-body">
      <div class="rt-value">
        <small>{{ active.device }}</small>
        <strong :class="{ warn: outOfRange }">{{ format(latest) }}<i>{{ active.unit }}</i></strong>
        <span>标准范围 {{ active.lower }} — {{ active.upper }} {{ active.unit }}</span>
        <span class="rt-flag" :class="outOfRange ? 'warn' : 'ok'">{{ outOfRange ? '超出标准范围' : '范围内' }}</span>
      </div>

      <svg class="rt-svg" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" role="img" aria-label="设备采集数据曲线">
        <g class="rt-axis">
          <line v-for="tick in ticks" :key="tick.y" :x1="PAD.left" :x2="WIDTH - PAD.right" :y1="tick.y" :y2="tick.y" />
          <text v-for="tick in ticks" :key="`t-${tick.y}`" :x="PAD.left - 8" :y="tick.y + 3">{{ format(tick.value) }}</text>
        </g>
        <rect
          class="rt-band"
          :x="PAD.left"
          :y="toY(active.upper)"
          :width="WIDTH - PAD.left - PAD.right"
          :height="Math.max(toY(active.lower) - toY(active.upper), 1)"
        />
        <path class="rt-area" :d="areaPath" />
        <path class="rt-line" :d="linePath" />
        <circle
          v-for="(value, index) in points"
          :key="index"
          :cx="toX(index)"
          :cy="toY(value)"
          r="2.4"
          :class="{ warn: value > active.upper || value < active.lower }"
        />
        <text class="rt-axis-label" :x="PAD.left" :y="HEIGHT - 6">较早</text>
        <text class="rt-axis-label" :x="WIDTH - PAD.right" :y="HEIGHT - 6" text-anchor="end">最新</text>
      </svg>
    </div>
  </div>
</template>
