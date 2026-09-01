import { reactive } from 'vue'
import type { ModuleConfig, Row, TabConfig, TreeNode } from './types'

/**
 * 原型数据存放在前端内存中：新增、编辑、批量状态变更、导入、删除以及组织树调整都写入这里，
 * 并同步保存到 localStorage，刷新页面后仍然保留，可通过“重置样例数据”回到初始状态。
 */
const STORAGE_KEY = 'weilu-mes-prototype'
const STORAGE_VERSION = 'v2'

const tables = reactive<Record<string, Row[]>>({})
const trees = reactive<Record<string, TreeNode[]>>({})

export const storeState = reactive({ restored: false, lastSavedAt: '' })

let registered: ModuleConfig[] = []

export function tableKey(moduleId: string, tabName: string): string {
  return `${moduleId}::${tabName}`
}

function loadDefaults(): void {
  registered.forEach((module) => {
    module.tabs.forEach((tab) => {
      const key = tableKey(module.id, tab.name)
      tables[key] = tab.rows.map((row) => ({ ...row }))
      if (tab.tree) trees[key] = JSON.parse(JSON.stringify(tab.tree)) as TreeNode[]
    })
  })
}

/** 样例数据发生变化时（新增页签或调整样例记录），旧的本地存档不再适用，需要重新初始化。 */
function defaultsSignature(): string {
  const ids = registered.flatMap((module) => module.tabs.flatMap((tab) => [tab.name, ...tab.rows.map((row) => row.id)])).join('|')
  let hash = 0
  for (let index = 0; index < ids.length; index += 1) {
    hash = (hash * 31 + ids.charCodeAt(index)) | 0
  }
  return `${ids.length}:${hash}`
}

function persist(): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, signature: defaultsSignature(), tables, trees }),
    )
    storeState.restored = true
    storeState.lastSavedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  } catch {
    /* 隐私模式或存储受限时忽略，页面内存数据仍然可用 */
  }
}

export function initStore(modules: ModuleConfig[]): void {
  registered = modules
  loadDefaults()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as {
      version?: string
      signature?: string
      tables?: Record<string, Row[]>
      trees?: Record<string, TreeNode[]>
    }
    if (saved.version !== STORAGE_VERSION || saved.signature !== defaultsSignature()) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    Object.entries(saved.tables ?? {}).forEach(([key, rows]) => {
      if (tables[key] && Array.isArray(rows)) tables[key] = rows
    })
    Object.entries(saved.trees ?? {}).forEach(([key, nodes]) => {
      if (trees[key] && Array.isArray(nodes)) trees[key] = nodes
    })
    storeState.restored = true
  } catch {
    /* 存储内容损坏时回落到初始样例数据 */
  }
}

export function resetStore(): void {
  loadDefaults()
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 忽略存储异常 */
  }
  storeState.restored = false
  storeState.lastSavedAt = ''
}

export function rowsOfTab(moduleId: string, tab: TabConfig): Row[] {
  return tables[tableKey(moduleId, tab.name)] ?? tab.rows
}

export function addRow(moduleId: string, tabName: string, row: Row): void {
  tables[tableKey(moduleId, tabName)]?.unshift(row)
  persist()
}

export function addRows(moduleId: string, tabName: string, rows: Row[]): number {
  const table = tables[tableKey(moduleId, tabName)]
  if (!table) return 0
  table.unshift(...rows)
  persist()
  return rows.length
}

export function removeRows(moduleId: string, tabName: string, ids: string[]): number {
  const rows = tables[tableKey(moduleId, tabName)]
  if (!rows) return 0
  const removing = new Set(ids)
  const rest = rows.filter((row) => !removing.has(row.id))
  const removed = rows.length - rest.length
  rows.splice(0, rows.length, ...rest)
  persist()
  return removed
}

export function patchRows(moduleId: string, tabName: string, ids: string[], patch: Row): number {
  const rows = tables[tableKey(moduleId, tabName)]
  if (!rows) return 0
  const target = new Set(ids)
  let changed = 0
  rows.forEach((row, index) => {
    if (!target.has(row.id)) return
    rows[index] = { ...row, ...patch }
    changed += 1
  })
  if (changed) persist()
  return changed
}

export function hasId(moduleId: string, tabName: string, id: string): boolean {
  return Boolean(tables[tableKey(moduleId, tabName)]?.some((row) => row.id === id))
}

/** 遍历全部模块数据，供追溯链路和全局检索使用。 */
export function allTables(): { module: ModuleConfig; tab: TabConfig; rows: Row[] }[] {
  return registered.flatMap((module) =>
    module.tabs.map((tab) => ({ module, tab, rows: rowsOfTab(module.id, tab) })),
  )
}

/* ------------------------------ 组织层级树 ------------------------------ */

export function treeOfTab(moduleId: string, tab: TabConfig): TreeNode[] {
  return trees[tableKey(moduleId, tab.name)] ?? tab.tree ?? []
}

function walk(nodes: TreeNode[], visit: (node: TreeNode, parent: TreeNode[] ) => boolean): boolean {
  for (const node of nodes) {
    if (visit(node, nodes)) return true
    if (node.children && walk(node.children, visit)) return true
  }
  return false
}

export function addTreeNode(moduleId: string, tabName: string, parentId: string, node: TreeNode): boolean {
  const nodes = trees[tableKey(moduleId, tabName)]
  if (!nodes) return false
  if (!parentId) {
    nodes.push(node)
    persist()
    return true
  }
  const done = walk(nodes, (item) => {
    if (item.id !== parentId) return false
    item.children = [...(item.children ?? []), node]
    return true
  })
  if (done) persist()
  return done
}

export function renameTreeNode(moduleId: string, tabName: string, id: string, name: string): boolean {
  const nodes = trees[tableKey(moduleId, tabName)]
  if (!nodes) return false
  const done = walk(nodes, (item) => {
    if (item.id !== id) return false
    item.name = name
    return true
  })
  if (done) persist()
  return done
}

export function removeTreeNode(moduleId: string, tabName: string, id: string): boolean {
  const nodes = trees[tableKey(moduleId, tabName)]
  if (!nodes) return false
  let done = false
  const prune = (list: TreeNode[]): TreeNode[] =>
    list
      .filter((item) => {
        if (item.id !== id) return true
        done = true
        return false
      })
      .map((item) => (item.children ? { ...item, children: prune(item.children) } : item))
  const next = prune(nodes)
  if (done) {
    nodes.splice(0, nodes.length, ...next)
    persist()
  }
  return done
}

function stamp(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}${month}${day}`
}

/** 原型编号规则：前缀 + 日期 + 当日流水，仅用于展示自动编号的效果。 */
export function nextId(moduleId: string, tab: TabConfig, offset = 0): string {
  const rows = rowsOfTab(moduleId, tab)
  const head = `${tab.prefix}${tab.prefix.includes('-') ? '-' : ''}${stamp()}`
  let used = rows.filter((row) => row.id?.startsWith(head)).length + offset
  let candidate = `${head}-${String(used + 1).padStart(3, '0')}`
  while (rows.some((row) => row.id === candidate)) {
    used += 1
    candidate = `${head}-${String(used + 1).padStart(3, '0')}`
  }
  return candidate
}
