export type Row = Record<string, string>

export interface Column {
  key: string
  label: string
  wide?: boolean
}

export type FieldType = 'text' | 'select' | 'textarea'

export interface FormField {
  key: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
  placeholder?: string
}

export interface TreeNode {
  id: string
  name: string
  level: string
  summary: string
  status: string
  children?: TreeNode[]
}

export interface ChartSeries {
  key: string
  device: string
  point: string
  unit: string
  lower: number
  upper: number
  values: number[]
}

export type TabKind = 'table' | 'gantt' | 'tree' | 'chart'

export interface TabConfig {
  name: string
  kind: TabKind
  prefix: string
  columns: Column[]
  rows: Row[]
  form: FormField[]
  statusOptions: string[]
  createLabel: string
  tree?: TreeNode[]
  series?: ChartSeries[]
  note?: string
}

export interface Metric {
  label: string
  value: string
  hint: string
  tone: string
}

export interface ModuleConfig {
  id: string
  title: string
  code: string
  description: string
  metrics: Metric[]
  tabs: TabConfig[]
}

export interface TraceNode {
  stage: string
  id: string
  module: string
  tab: string
  summary: string
  status: string
}

export interface TraceChain {
  key: string
  title: string
  description: string
  nodes: TraceNode[]
}

export interface FilterCondition {
  field: string
  op: 'contains' | 'equals' | 'exclude' | 'empty'
  value: string
}
