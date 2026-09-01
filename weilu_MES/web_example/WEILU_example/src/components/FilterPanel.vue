<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Column, FilterCondition, Row } from '../types'

const props = defineProps<{ columns: Column[]; rows: Row[]; conditions: FilterCondition[] }>()
const emit = defineEmits<{
  (event: 'apply', conditions: FilterCondition[]): void
  (event: 'close'): void
}>()

const OPS: { value: FilterCondition['op']; label: string }[] = [
  { value: 'contains', label: '包含' },
  { value: 'equals', label: '等于' },
  { value: 'exclude', label: '不包含' },
  { value: 'empty', label: '为空' },
]

function blank(): FilterCondition {
  return { field: props.columns[0]?.key ?? 'id', op: 'contains', value: '' }
}

const draft = ref<FilterCondition[]>(props.conditions.length ? props.conditions.map((item) => ({ ...item })) : [blank()])

watch(
  () => props.conditions,
  (list) => {
    draft.value = list.length ? list.map((item) => ({ ...item })) : [blank()]
  },
)

function suggestions(field: string): string[] {
  return Array.from(new Set(props.rows.map((row) => row[field]).filter((value) => value && value !== '—'))).slice(0, 20)
}

function apply() {
  emit('apply', draft.value.filter((item) => item.op === 'empty' || item.value.trim() !== ''))
}
</script>

<template>
  <section class="filter-panel" aria-label="高级筛选条件">
    <header>
      <div>
        <b>高级筛选</b>
        <small>条件之间为“并且”关系，作用于当前 Tab 的全部数据</small>
      </div>
      <button type="button" aria-label="关闭高级筛选" @click="emit('close')">×</button>
    </header>

    <div class="filter-rows">
      <div v-for="(condition, index) in draft" :key="index" class="filter-row">
        <span class="filter-join">{{ index === 0 ? '当' : '并且' }}</span>
        <select v-model="condition.field" aria-label="筛选字段">
          <option v-for="column in props.columns" :key="column.key" :value="column.key">{{ column.label }}</option>
        </select>
        <select v-model="condition.op" aria-label="筛选方式">
          <option v-for="op in OPS" :key="op.value" :value="op.value">{{ op.label }}</option>
        </select>
        <input
          v-model="condition.value"
          :disabled="condition.op === 'empty'"
          :list="`filter-options-${index}`"
          type="search"
          placeholder="输入或选择值"
          aria-label="筛选值"
        />
        <datalist :id="`filter-options-${index}`">
          <option v-for="value in suggestions(condition.field)" :key="value" :value="value" />
        </datalist>
        <button
          type="button"
          class="filter-remove"
          :disabled="draft.length === 1"
          aria-label="删除该条件"
          @click="draft.splice(index, 1)"
        >×</button>
      </div>
    </div>

    <footer>
      <button type="button" class="filter-add" @click="draft.push(blank())">＋ 增加条件</button>
      <div>
        <button type="button" @click="draft = [blank()]; emit('apply', [])">重置</button>
        <button type="button" class="primary" @click="apply">应用筛选</button>
      </div>
    </footer>
  </section>
</template>
