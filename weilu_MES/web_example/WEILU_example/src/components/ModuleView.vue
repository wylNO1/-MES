<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CreateDrawer from './CreateDrawer.vue'
import FilterPanel from './FilterPanel.vue'
import GanttChart from './GanttChart.vue'
import ImportDrawer from './ImportDrawer.vue'
import OrgTree from './OrgTree.vue'
import RealtimeChart from './RealtimeChart.vue'
import RecordDrawer from './RecordDrawer.vue'
import {
  addRow,
  addRows,
  addTreeNode,
  nextId,
  patchRows,
  removeRows,
  removeTreeNode,
  renameTreeNode,
  rowsOfTab,
  treeOfTab,
} from '../store'
import { pushToast } from '../toast'
import { exportCsv, timestampSuffix } from '../utils/csv'
import { hasChain } from '../data/trace'
import type { FilterCondition, ModuleConfig, Row, TabConfig, TreeNode } from '../types'

const props = defineProps<{
  module: ModuleConfig
  query: string
  target: { tab?: string; id?: string } | null
}>()

const emit = defineEmits<{
  (event: 'update:query', value: string): void
  (event: 'trace', payload: { module: string; tab: string; row: Row }): void
}>()

const PAGE_SIZES = [10, 20, 50]
const CHILD_LEVEL: Record<string, string> = { 工厂: '车间', 车间: '产线', 产线: '设备' }

const activeTabName = ref(props.module.tabs[0].name)
const statusFilter = ref('全部状态')
const conditions = ref<FilterCondition[]>([])
const showFilter = ref(false)
const page = ref(1)
const pageSize = ref(10)
const selected = ref<string[]>([])
const treeNode = ref<TreeNode | null>(null)
const drawer = ref<'detail' | 'create' | 'import' | null>(null)
const detailRow = ref<Row | null>(null)
const highlightId = ref('')
const batchStatus = ref('')

const activeTab = computed<TabConfig>(
  () => props.module.tabs.find((tab) => tab.name === activeTabName.value) ?? props.module.tabs[0],
)
const sourceRows = computed<Row[]>(() => rowsOfTab(props.module.id, activeTab.value))
const treeNodes = computed<TreeNode[]>(() => treeOfTab(props.module.id, activeTab.value))
const detailHasChain = computed(() => hasChain(props.module.id, activeTab.value.name, detailRow.value))

function matches(row: Row, condition: FilterCondition): boolean {
  const value = (row[condition.field] ?? '').toLowerCase()
  const target = condition.value.trim().toLowerCase()
  switch (condition.op) {
    case 'equals':
      return value === target
    case 'exclude':
      return !value.includes(target)
    case 'empty':
      return !value || value === '—'
    default:
      return value.includes(target)
  }
}

const filteredRows = computed(() => {
  const keyword = props.query.trim().toLowerCase()
  const node = treeNode.value
  return sourceRows.value.filter((row) => {
    if (keyword && !Object.values(row).some((value) => value.toLowerCase().includes(keyword))) return false
    if (statusFilter.value !== '全部状态' && row.status !== statusFilter.value) return false
    if (node && !Object.values(row).some((value) => value.includes(node.id) || value.includes(node.name))) return false
    return conditions.value.every((condition) => matches(row, condition))
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1))
const rangeStart = computed(() => (filteredRows.value.length === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const rangeEnd = computed(() => Math.min(page.value * pageSize.value, filteredRows.value.length))

const pageSelectedAll = computed(
  () => pagedRows.value.length > 0 && pagedRows.value.every((row) => selected.value.includes(row.id)),
)
const pageSelectedSome = computed(
  () => !pageSelectedAll.value && pagedRows.value.some((row) => selected.value.includes(row.id)),
)

function resetView(keepTab = true) {
  if (!keepTab) activeTabName.value = props.module.tabs[0].name
  highlightId.value = ''
  statusFilter.value = '全部状态'
  conditions.value = []
  showFilter.value = false
  page.value = 1
  selected.value = []
  treeNode.value = null
  batchStatus.value = ''
  drawer.value = null
  detailRow.value = null
  emit('update:query', '')
}

watch(() => props.module.id, () => resetView(false))
watch([filteredRows, pageSize], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

watch(
  () => props.target,
  (target) => {
    if (!target) return
    if (target.tab && props.module.tabs.some((tab) => tab.name === target.tab)) {
      activeTabName.value = target.tab
    }
    resetView(true)
    highlightId.value = target.id ?? ''
    if (target.id) {
      const index = sourceRows.value.findIndex((row) => row.id === target.id)
      page.value = index >= 0 ? Math.floor(index / pageSize.value) + 1 : 1
    } else {
      page.value = 1
    }
  },
  { immediate: true, flush: 'post' },
)

function setTab(name: string) {
  activeTabName.value = name
  resetView(true)
}

function openTrace() {
  if (detailRow.value) {
    emit('trace', { module: props.module.id, tab: activeTab.value.name, row: detailRow.value })
  }
}

function toggleRow(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id]
}

function togglePage() {
  const ids = pagedRows.value.map((row) => row.id)
  selected.value = pageSelectedAll.value
    ? selected.value.filter((id) => !ids.includes(id))
    : Array.from(new Set([...selected.value, ...ids]))
}

function fileName(scope: string) {
  return `${props.module.title}-${activeTab.value.name}-${scope}-${timestampSuffix()}.csv`
}

function exportAll() {
  if (!filteredRows.value.length) {
    pushToast('当前筛选条件下没有可导出的数据', 'warn')
    return
  }
  exportCsv(fileName('查询结果'), activeTab.value.columns, filteredRows.value)
  pushToast(`已导出 ${filteredRows.value.length} 条记录为 CSV`)
}

function exportSelected() {
  const rows = filteredRows.value.filter((row) => selected.value.includes(row.id))
  if (!rows.length) return
  exportCsv(fileName('所选记录'), activeTab.value.columns, rows)
  pushToast(`已导出所选 ${rows.length} 条记录`)
}

function applyBatchStatus() {
  if (!batchStatus.value) return
  const changed = patchRows(props.module.id, activeTab.value.name, selected.value, { status: batchStatus.value })
  pushToast(`已将 ${changed} 条记录状态更新为「${batchStatus.value}」`)
  batchStatus.value = ''
  selected.value = []
}

function deleteSelected() {
  const count = selected.value.length
  if (!count) return
  if (!window.confirm(`确认从当前原型数据中移除所选 ${count} 条记录？`)) return
  const removed = removeRows(props.module.id, activeTab.value.name, selected.value)
  selected.value = []
  pushToast(`已移除 ${removed} 条记录`, 'info')
}

function openDetail(row: Row) {
  detailRow.value = row
  drawer.value = 'detail'
}

function saveDetail(patch: Row) {
  if (!detailRow.value) return
  patchRows(props.module.id, activeTab.value.name, [detailRow.value.id], patch)
  const updated = sourceRows.value.find((row) => row.id === detailRow.value?.id) ?? null
  detailRow.value = updated
  highlightId.value = updated?.id ?? ''
  pushToast(`记录 ${updated?.id ?? ''} 已保存`)
}

function submitCreate(row: Row) {
  addRow(props.module.id, activeTab.value.name, row)
  // 清除当前筛选，保证新记录在表格首行可见。
  resetView(true)
  highlightId.value = row.id
  pushToast(`${activeTab.value.createLabel}已保存：${row.id}`)
}

function submitImport(rows: Row[]) {
  const count = addRows(props.module.id, activeTab.value.name, rows)
  resetView(true)
  highlightId.value = rows[0]?.id ?? ''
  pushToast(`已导入 ${count} 条${activeTab.value.name}记录`)
}

function rescheduleBar(payload: { row: Row; days: number }) {
  const shift = (value: string) => {
    const matched = /(\d{4})-(\d{2})-(\d{2})/.exec(value)
    if (!matched) return value
    const time = Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3])) + payload.days * 86400000
    return new Date(time).toISOString().slice(0, 10)
  }
  const start = shift(payload.row.start)
  const end = shift(payload.row.end)
  patchRows(props.module.id, activeTab.value.name, [payload.row.id], { start, end })
  pushToast(`${payload.row.id} 计划调整为 ${start} — ${end}`)
}

function addNode(parent: TreeNode) {
  const name = window.prompt(`在「${parent.name}」下新增节点名称`, '')?.trim()
  if (!name) return
  const level = CHILD_LEVEL[parent.level] ?? '节点'
  const id = `${parent.id}-${String((parent.children?.length ?? 0) + 1).padStart(2, '0')}`
  addTreeNode(props.module.id, activeTab.value.name, parent.id, {
    id,
    name,
    level,
    summary: '新增节点，暂无汇总数据',
    status: '待机',
  })
  pushToast(`已在「${parent.name}」下新增${level}：${name}`)
}

function renameNode(node: TreeNode) {
  const name = window.prompt('重命名节点', node.name)?.trim()
  if (!name || name === node.name) return
  renameTreeNode(props.module.id, activeTab.value.name, node.id, name)
  pushToast(`节点已重命名为「${name}」`)
}

function removeNode(node: TreeNode) {
  if (!window.confirm(`确认删除节点「${node.name}」及其下级节点？`)) return
  removeTreeNode(props.module.id, activeTab.value.name, node.id)
  if (treeNode.value?.id === node.id) treeNode.value = null
  pushToast(`已删除节点「${node.name}」`, 'info')
}

function removeCondition(index: number) {
  conditions.value = conditions.value.filter((_, position) => position !== index)
}

function conditionLabel(condition: FilterCondition): string {
  const column = activeTab.value.columns.find((item) => item.key === condition.field)
  const op = { contains: '包含', equals: '等于', exclude: '不包含', empty: '为空' }[condition.op]
  return `${column?.label ?? condition.field} ${op} ${condition.op === 'empty' ? '' : condition.value}`.trim()
}
</script>

<template>
  <div class="content module-content">
    <section class="module-intro">
      <div>
        <div class="module-code">{{ module.code }}</div>
        <h2>{{ module.title }}</h2>
        <p>{{ module.description }}</p>
      </div>
      <div class="module-actions">
        <button type="button" @click="drawer = 'import'">⇧ 导入</button>
        <button type="button" @click="exportAll">⇩ 导出 CSV</button>
        <button class="primary" type="button" @click="drawer = 'create'">＋ {{ activeTab.createLabel }}</button>
      </div>
    </section>

    <section class="module-metrics">
      <article v-for="metric in module.metrics" :key="metric.label" class="module-metric" :class="`metric-${metric.tone}`">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.hint }}</small>
      </article>
    </section>

    <section class="data-panel">
      <div class="module-tabs">
        <button
          v-for="tab in module.tabs"
          :key="tab.name"
          type="button"
          :class="{ active: tab.name === activeTab.name }"
          @click="setTab(tab.name)"
        >{{ tab.name }}</button>
      </div>

      <div class="filter-bar">
        <label class="table-search">
          <span>⌕</span>
          <input
            :value="query"
            type="search"
            :placeholder="`搜索${activeTab.name}数据`"
            @input="emit('update:query', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <select v-model="statusFilter" aria-label="按状态筛选">
          <option>全部状态</option>
          <option v-for="status in activeTab.statusOptions" :key="status">{{ status }}</option>
        </select>
        <button class="filter-button" type="button" :class="{ on: showFilter || conditions.length }" @click="showFilter = !showFilter">
          筛选条件 <span>{{ conditions.length ? conditions.length : '＋' }}</span>
        </button>
        <span class="result-count">共 {{ filteredRows.length }} 条记录 · 第 {{ page }} / {{ totalPages }} 页</span>
      </div>

      <FilterPanel
        v-if="showFilter"
        :columns="activeTab.columns"
        :rows="sourceRows"
        :conditions="conditions"
        @apply="conditions = $event; page = 1; showFilter = false"
        @close="showFilter = false"
      />

      <div v-if="conditions.length" class="condition-chips">
        <span v-for="(condition, index) in conditions" :key="index">
          {{ conditionLabel(condition) }}
          <button type="button" aria-label="移除该条件" @click="removeCondition(index)">×</button>
        </span>
        <button type="button" class="chip-clear" @click="conditions = []">清空条件</button>
      </div>

      <p v-if="activeTab.note" class="panel-note">{{ activeTab.note }}</p>

      <GanttChart
        v-if="activeTab.kind === 'gantt'"
        :rows="filteredRows"
        @select="openDetail"
        @reschedule="rescheduleBar"
      />

      <OrgTree
        v-else-if="activeTab.kind === 'tree'"
        :nodes="treeNodes"
        :selected="treeNode?.id ?? ''"
        @select="treeNode = $event; page = 1"
        @add="addNode"
        @rename="renameNode"
        @remove="removeNode"
      />

      <RealtimeChart v-else-if="activeTab.kind === 'chart' && activeTab.series" :series="activeTab.series" />

      <div v-if="selected.length" class="batch-bar">
        <b>已选择 {{ selected.length }} 条</b>
        <button type="button" @click="exportSelected">导出所选</button>
        <label>
          批量状态
          <select v-model="batchStatus" @change="applyBatchStatus">
            <option value="">选择状态</option>
            <option v-for="status in activeTab.statusOptions" :key="status" :value="status">{{ status }}</option>
          </select>
        </label>
        <button type="button" class="danger" @click="deleteSelected">移除所选</button>
        <button type="button" class="ghost" @click="selected = []">取消选择</button>
      </div>

      <div class="business-table-wrap">
        <table class="business-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="全选当前页"
                  :checked="pageSelectedAll"
                  :indeterminate.prop="pageSelectedSome"
                  @change="togglePage"
                />
              </th>
              <th v-for="column in activeTab.columns" :key="column.key" :class="{ wide: column.wide }">{{ column.label }}</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pagedRows"
              :key="row.id"
              :class="{ highlight: row.id === highlightId, picked: selected.includes(row.id) }"
              @click="openDetail(row)"
            >
              <td @click.stop>
                <input
                  type="checkbox"
                  :aria-label="`选择 ${row.id}`"
                  :checked="selected.includes(row.id)"
                  @change="toggleRow(row.id)"
                />
              </td>
              <td
                v-for="column in activeTab.columns"
                :key="column.key"
                :class="{ 'mono-cell': column.key === 'id', wide: column.wide }"
              >
                <span v-if="column.key === 'status'" class="data-status" :data-status="row[column.key]">{{ row[column.key] }}</span>
                <span v-else>{{ row[column.key] }}</span>
              </td>
              <td><button class="row-action" type="button" @click.stop="openDetail(row)">查看 ›</button></td>
            </tr>
            <tr v-if="pagedRows.length === 0">
              <td :colspan="activeTab.columns.length + 2" class="empty-cell">没有符合当前条件的数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="table-footer">
        <span>显示 {{ rangeStart }} — {{ rangeEnd }} 条，共 {{ filteredRows.length }} 条</span>
        <div class="pager">
          <label class="page-size">
            每页
            <select v-model.number="pageSize">
              <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
            </select>
            条
          </label>
          <button type="button" :disabled="page === 1" @click="page -= 1">‹</button>
          <button
            v-for="number in pageNumbers"
            :key="number"
            type="button"
            :class="{ active: number === page }"
            @click="page = number"
          >{{ number }}</button>
          <button type="button" :disabled="page === totalPages" @click="page += 1">›</button>
        </div>
      </footer>
    </section>

    <div v-if="drawer" class="dialog-backdrop" @click.self="drawer = null">
      <RecordDrawer
        v-if="drawer === 'detail' && detailRow"
        :row="detailRow"
        :columns="activeTab.columns"
        :form="activeTab.form"
        :code="module.code"
        :has-chain="detailHasChain"
        @close="drawer = null"
        @trace="openTrace"
        @save="saveDetail"
      />
      <CreateDrawer
        v-else-if="drawer === 'create'"
        :tab="activeTab"
        :code="module.code"
        :next-id="nextId(module.id, activeTab)"
        @close="drawer = null"
        @submit="submitCreate"
      />
      <ImportDrawer
        v-else-if="drawer === 'import'"
        :tab="activeTab"
        :module-id="module.id"
        :module-title="module.title"
        :rows="sourceRows"
        @close="drawer = null"
        @submit="submitImport"
      />
    </div>
  </div>
</template>
