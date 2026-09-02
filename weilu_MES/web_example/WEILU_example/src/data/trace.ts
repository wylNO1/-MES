import { allTables } from '../store'
import type { Column, ModuleConfig, Row, TabConfig, TraceChain, TraceNode } from '../types'

/**
 * 业务链路追溯：不再使用写死的链路，而是扫描全部模块数据，
 * 按记录之间引用的业务编号（订单号、排产号、任务号、批次号、报文号、设备与接口编码）
 * 逐层展开，再按业务阶段排序，形成正向与反向追溯链路。
 */
const LINK_KEYS = ['id', 'order', 'task', 'schedule', 'batch', 'source', 'msgId', 'device', 'interface', 'point']

/** 阶段顺序：越小越靠前，未列出的按 90 处理。 */
const STAGE_ORDER: Record<string, number> = {
  'orders::销售订单': 10,
  'orders::库存订单': 10,
  'orders::包装信息': 12,
  'orders::终止记录': 14,
  'schedule::待排订单': 20,
  'schedule::排产计划': 22,
  'schedule::产线分配': 24,
  'schedule::排产甘特图': 26,
  'production::生产任务': 30,
  'production::生产组织': 32,
  'production::原料耗用': 34,
  'production::生产报工': 36,
  'production::成品入库': 50,
  'warehouse::入出库记录': 52,
  'warehouse::原料库存': 54,
  'warehouse::包材库存': 55,
  'warehouse::成品库存': 56,
  'warehouse::库存总览': 58,
  'equipment::设备台账': 60,
  'equipment::实时状态': 62,
  'equipment::报警记录': 64,
  'equipment::采集数据': 66,
  'interfaces::接口清单': 70,
  'interfaces::点位映射': 72,
  'interfaces::接收日志': 74,
  'interfaces::异常日志': 76,
}

const MAX_DEPTH = 4
const MAX_NODES = 20
const MAX_PER_STAGE = 2
/** 出现次数过多的编号会把链路拉散，展开时跳过。 */
const GENERIC_TOKEN_LIMIT = 24

interface Entry {
  key: string
  module: ModuleConfig
  tab: TabConfig
  row: Row
  tokens: string[]
}

const CODE_PATTERN = /^[A-Za-z][A-Za-z0-9]*(?:[-_][A-Za-z0-9]+)*$/

function isBusinessCode(value: string): boolean {
  const text = value.trim()
  if (text.length < 5 || text.length > 40) return false
  if (!/\d/.test(text)) return false
  return CODE_PATTERN.test(text)
}

function tokensOf(row: Row): string[] {
  const tokens = new Set<string>()
  LINK_KEYS.forEach((key) => {
    const value = row[key]
    if (!value || value === '—') return
    value.split('·').forEach((part) => {
      const candidate = part.trim()
      if (isBusinessCode(candidate)) tokens.add(candidate)
    })
  })
  return Array.from(tokens)
}

function buildIndex(): { entries: Entry[]; byToken: Map<string, Entry[]> } {
  const entries: Entry[] = []
  const byToken = new Map<string, Entry[]>()
  allTables().forEach(({ module, tab, rows }) => {
    rows.forEach((row) => {
      const entry: Entry = {
        key: `${module.id}::${tab.name}::${row.id}`,
        module,
        tab,
        row,
        tokens: tokensOf(row),
      }
      entries.push(entry)
      entry.tokens.forEach((token) => {
        const list = byToken.get(token) ?? []
        list.push(entry)
        byToken.set(token, list)
      })
    })
  })
  return { entries, byToken }
}

function stageOf(entry: Entry): number {
  return STAGE_ORDER[`${entry.module.id}::${entry.tab.name}`] ?? 90
}

function summaryOf(entry: Entry): string {
  const skip = new Set(['id', 'status'])
  const preferred = entry.tab.columns.filter((column: Column) => !skip.has(column.key))
  const wide = preferred.filter((column) => column.wide)
  const picked = [...wide, ...preferred.filter((column) => !column.wide)].slice(0, 3)
  return picked
    .map((column) => entry.row[column.key])
    .filter((value) => value && value !== '—')
    .join(' · ')
}

function toNode(entry: Entry): TraceNode {
  return {
    stage: entry.tab.name,
    id: entry.row.id,
    module: entry.module.id,
    tab: entry.tab.name,
    summary: summaryOf(entry) || entry.row.id,
    status: entry.row.status ?? '—',
  }
}

/** 逐层展开关联记录，并记录每条记录与起点的距离，用于挑选最贴近的节点。 */
function collect(origin: Entry, byToken: Map<string, Entry[]>): Map<string, { entry: Entry; depth: number }> {
  const visited = new Map<string, { entry: Entry; depth: number }>([[origin.key, { entry: origin, depth: 0 }]])
  let frontier = [origin]
  for (let depth = 1; depth <= MAX_DEPTH && frontier.length; depth += 1) {
    const next: Entry[] = []
    frontier.forEach((entry) => {
      entry.tokens.forEach((token) => {
        const related = byToken.get(token) ?? []
        if (related.length > GENERIC_TOKEN_LIMIT) return
        related.forEach((candidate) => {
          if (visited.has(candidate.key)) return
          visited.set(candidate.key, { entry: candidate, depth })
          next.push(candidate)
        })
      })
    })
    frontier = next
  }
  return visited
}

/**
 * 先保证每个业务阶段至少保留一条最贴近起点的记录，再按距离补充同阶段的第二条，
 * 避免链路被前段的关联记录占满而看不到入库和库存环节。
 */
function orderNodes(found: Map<string, { entry: Entry; depth: number }>, origin: Entry): Entry[] {
  const stages = new Map<number, { entry: Entry; depth: number }[]>()
  found.forEach((item) => {
    const stage = stageOf(item.entry)
    const list = stages.get(stage) ?? []
    list.push(item)
    stages.set(stage, list)
  })

  const picked: { entry: Entry; depth: number }[] = []
  const extras: { entry: Entry; depth: number }[] = []
  stages.forEach((list) => {
    const sorted = [...list].sort((left, right) => {
      if (left.entry.key === origin.key) return -1
      if (right.entry.key === origin.key) return 1
      const delta = left.depth - right.depth
      return delta !== 0 ? delta : left.entry.row.id.localeCompare(right.entry.row.id)
    })
    picked.push(sorted[0])
    extras.push(...sorted.slice(1, MAX_PER_STAGE))
  })

  extras.sort((left, right) => left.depth - right.depth)
  const combined = [...picked, ...extras.slice(0, Math.max(MAX_NODES - picked.length, 0))]
  return combined
    .sort((left, right) => {
      const delta = stageOf(left.entry) - stageOf(right.entry)
      return delta !== 0 ? delta : left.entry.row.id.localeCompare(right.entry.row.id)
    })
    .slice(0, MAX_NODES)
    .map((item) => item.entry)
}

function chainOf(origin: Entry, byToken: Map<string, Entry[]>): TraceChain {
  const nodes = orderNodes(collect(origin, byToken), origin)
  if (!nodes.some((entry) => entry.key === origin.key)) nodes.unshift(origin)
  return {
    key: origin.row.id,
    title: `${origin.module.title} · ${origin.tab.name} · ${origin.row.id}`,
    description: summaryOf(origin) || origin.module.description,
    nodes: nodes.map(toNode),
  }
}

/** 依据模块、页签和记录构建链路；没有任何关联记录时返回 null。 */
export function buildChain(moduleId: string, tabName: string, row: Row | null): TraceChain | null {
  if (!row) return null
  const { entries, byToken } = buildIndex()
  const origin = entries.find(
    (entry) => entry.module.id === moduleId && entry.tab.name === tabName && entry.row.id === row.id,
  )
  if (!origin) return null
  const chain = chainOf(origin, byToken)
  return chain.nodes.length > 1 ? chain : null
}

/** 只知道业务编号时（如驾驶舱链路入口）在全部模块中查找起点。 */
export function buildChainById(id: string): TraceChain | null {
  const { entries, byToken } = buildIndex()
  const origin =
    entries.find((entry) => entry.row.id === id) ??
    entries.find((entry) => entry.tokens.includes(id))
  if (!origin) return null
  const chain = chainOf(origin, byToken)
  return chain.nodes.length > 1 ? chain : null
}

/** 详情抽屉用于判断是否存在可展开的链路。 */
export function hasChain(moduleId: string, tabName: string, row: Row | null): boolean {
  return Boolean(buildChain(moduleId, tabName, row))
}
