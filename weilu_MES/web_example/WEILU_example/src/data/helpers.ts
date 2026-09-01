import type { ChartSeries, Column, FieldType, FormField, Row, TabConfig, TabKind, TreeNode } from '../types'

/** 列定义使用紧凑写法：`key:标题`，标题后加 `*` 表示宽列。 */
export function cols(spec: string): Column[] {
  return spec
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [key, rawLabel] = item.split(':')
      const wide = rawLabel.endsWith('*')
      return { key: key.trim(), label: wide ? rawLabel.slice(0, -1) : rawLabel, wide }
    })
}

/** 行数据按列顺序书写，缺省值补 `—`。 */
export function rowsOf(columns: Column[], data: string[][]): Row[] {
  return data.map((values) => {
    const row: Row = {}
    columns.forEach((column, index) => {
      row[column.key] = values[index] ?? '—'
    })
    return row
  })
}

const SELECT_KEYS = [
  'status', 'priority', 'owner', 'inspector', 'type', 'line', 'warehouse', 'location',
  'direction', 'method', 'level', 'result', 'category', 'unit', 'quality', 'source', 'action',
]
const TEXTAREA_KEYS = ['remark', 'reason', 'detail', 'note', 'summary', 'message']

function distinct(rows: Row[], key: string): string[] {
  return Array.from(new Set(rows.map((row) => row[key]).filter((value) => value && value !== '—')))
}

/** 新增表单字段由列定义推导，避免逐个模块重复书写。 */
function buildForm(columns: Column[], rows: Row[]): FormField[] {
  return columns
    .filter((column) => column.key !== 'id')
    .map((column, index) => {
      const options = distinct(rows, column.key)
      const useSelect = SELECT_KEYS.includes(column.key) && options.length > 0 && options.length <= 8
      const type: FieldType = TEXTAREA_KEYS.includes(column.key) ? 'textarea' : useSelect ? 'select' : 'text'
      return {
        key: column.key,
        label: column.label,
        type,
        options: useSelect ? options : undefined,
        required: index < 2,
        placeholder: type === 'textarea' ? '补充业务说明或备注' : `请输入${column.label}`,
      }
    })
}

export interface TabInput {
  name: string
  prefix: string
  columns: string
  data: string[][]
  kind?: TabKind
  createLabel?: string
  tree?: TreeNode[]
  series?: ChartSeries[]
  note?: string
}

export function defineTab(input: TabInput): TabConfig {
  const columns = cols(input.columns)
  const rows = rowsOf(columns, input.data)
  return {
    name: input.name,
    kind: input.kind ?? 'table',
    prefix: input.prefix,
    columns,
    rows,
    form: buildForm(columns, rows),
    statusOptions: distinct(rows, 'status'),
    createLabel: input.createLabel ?? `新增${input.name}`,
    tree: input.tree,
    series: input.series,
    note: input.note,
  }
}
