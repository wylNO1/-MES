<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { Row } from '../types'

const props = defineProps<{ rows: Row[] }>()
const emit = defineEmits<{
  (event: 'select', row: Row): void
  (event: 'reschedule', payload: { row: Row; days: number }): void
}>()

const DAY = 24 * 60 * 60 * 1000

function parseDate(value: string): number | null {
  const matched = /(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '')
  if (!matched) return null
  return Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
}

const bars = computed(() =>
  props.rows
    .map((row) => ({ row, start: parseDate(row.start), end: parseDate(row.end) }))
    .filter((item): item is { row: Row; start: number; end: number } => item.start !== null && item.end !== null),
)

const range = computed(() => {
  if (!bars.value.length) return null
  const start = Math.min(...bars.value.map((item) => item.start))
  const end = Math.max(...bars.value.map((item) => item.end))
  const days: { key: string; label: string; weekend: boolean }[] = []
  for (let time = start; time <= end; time += DAY) {
    const date = new Date(time)
    const weekday = date.getUTCDay()
    days.push({
      key: date.toISOString().slice(0, 10),
      label: `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`,
      weekend: weekday === 0 || weekday === 6,
    })
  }
  return { start, end, days }
})

const lines = computed(() => {
  const grouped = new Map<string, { row: Row; start: number; end: number }[]>()
  bars.value.forEach((item) => {
    const line = item.row.line || '未分配产线'
    if (!grouped.has(line)) grouped.set(line, [])
    grouped.get(line)!.push(item)
  })
  return Array.from(grouped.entries()).map(([line, items]) => ({ line, items }))
})

const todayIndex = computed(() => {
  if (!range.value) return -1
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  if (today < range.value.start || today > range.value.end) return -1
  return Math.round((today - range.value.start) / DAY)
})

function barStyle(item: { start: number; end: number }) {
  const total = range.value?.days.length ?? 1
  const offset = Math.round((item.start - (range.value?.start ?? 0)) / DAY)
  const span = Math.round((item.end - item.start) / DAY) + 1
  return { left: `${(offset / total) * 100}%`, width: `${(span / total) * 100}%` }
}

function progressOf(row: Row): number {
  const value = Number.parseFloat((row.progress ?? '').replace('%', ''))
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
}

/* ------------------------------ 拖拽改期 ------------------------------ */

const drag = ref<{ id: string; offset: number; days: number } | null>(null)
let dragContext: { row: Row; startX: number; dayWidth: number } | null = null

function onMove(event: MouseEvent) {
  if (!dragContext || !drag.value) return
  const offset = event.clientX - dragContext.startX
  drag.value = {
    id: drag.value.id,
    offset,
    days: Math.round(offset / dragContext.dayWidth),
  }
}

function onUp() {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
  const context = dragContext
  const state = drag.value
  dragContext = null
  drag.value = null
  if (!context || !state) return

  if (Math.abs(state.offset) < 4) {
    emit('select', context.row)
    return
  }
  if (state.days !== 0) emit('reschedule', { row: context.row, days: state.days })
}

function onDown(event: MouseEvent, row: Row) {
  const track = (event.currentTarget as HTMLElement).parentElement
  const width = track?.getBoundingClientRect().width ?? 0
  const dayCount = range.value?.days.length ?? 1
  dragContext = { row, startX: event.clientX, dayWidth: width / dayCount || 1 }
  drag.value = { id: row.id, offset: 0, days: 0 }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
})

function dragStyle(row: Row) {
  return drag.value?.id === row.id ? { transform: `translateX(${drag.value.offset}px)`, zIndex: 3 } : {}
}
</script>

<template>
  <div v-if="range" class="gantt">
    <div class="gantt-legend">
      <span><i class="running"></i>执行中</span>
      <span><i class="planned"></i>已下达 / 待执行</span>
      <span><i class="draft"></i>草稿</span>
      <span class="gantt-hint">条内填充为累计报工进度 · 左右拖拽甘特条可整体改期</span>
    </div>

    <div class="gantt-scroll">
      <div class="gantt-grid" :style="{ '--days': range.days.length }">
        <div class="gantt-head">
          <span class="gantt-line-cell">产线</span>
          <div class="gantt-days">
            <span v-for="day in range.days" :key="day.key" :class="{ weekend: day.weekend }">{{ day.label }}</span>
          </div>
        </div>

        <div v-for="group in lines" :key="group.line" class="gantt-row">
          <span class="gantt-line-cell">
            <b>{{ group.line }}</b>
            <small>{{ group.items.length }} 项计划</small>
          </span>
          <div class="gantt-track">
            <span v-for="day in range.days" :key="day.key" class="gantt-cell" :class="{ weekend: day.weekend }"></span>
            <i v-if="todayIndex >= 0" class="gantt-today" :style="{ left: `${((todayIndex + 0.5) / range.days.length) * 100}%` }"></i>
            <button
              v-for="item in group.items"
              :key="item.row.id"
              type="button"
              class="gantt-bar"
              :class="[
                item.row.status === '执行中' ? 'running' : item.row.status === '草稿' ? 'draft' : 'planned',
                { dragging: drag?.id === item.row.id },
              ]"
              :style="{ ...barStyle(item), ...dragStyle(item.row) }"
              :title="`${item.row.order} · ${item.row.start} — ${item.row.end}`"
              @mousedown.prevent="onDown($event, item.row)"
            >
              <b :style="{ width: `${progressOf(item.row)}%` }"></b>
              <span>{{ item.row.order }} · {{ item.row.qty }}</span>
              <em v-if="drag?.id === item.row.id && drag.days !== 0">{{ drag.days > 0 ? `+${drag.days}` : drag.days }} 天</em>
              <em v-else>{{ item.row.progress }}</em>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <p v-else class="gantt-empty">当前筛选条件下没有可绘制的排产计划。</p>
</template>
