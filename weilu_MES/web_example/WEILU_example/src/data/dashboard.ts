export interface NavItem { id: string; label: string; icon: string; badge?: string }

export const navItems: NavItem[] = [
  { id: 'dashboard', label: '运营总览', icon: '⌂' },
  { id: 'orders', label: '订单管理', icon: '▤', badge: '3' },
  { id: 'schedule', label: '人工排产', icon: '▥', badge: '2' },
  { id: 'production', label: '生产执行', icon: '◉' },
  { id: 'warehouse', label: '仓库管理', icon: '▦' },
  { id: 'products', label: '产品库', icon: '◇' },
  { id: 'quality', label: '品质管理', icon: '✓' },
  { id: 'equipment', label: '设备管理', icon: '⚙' },
  { id: 'interfaces', label: '接口中心', icon: '⇄' },
]

export const kpis = [
  { label: '今日计划产量', value: '108,000', unit: '只', delta: '较昨日 +8.2%', tone: 'blue', progress: 76 },
  { label: '今日已完成', value: '82,460', unit: '只', delta: '计划达成 76.4%', tone: 'green', progress: 76 },
  { label: '在制订单', value: '12', unit: '单', delta: '2 单临近交期', tone: 'amber', progress: 58 },
  { label: '设备综合效率', value: '91.8', unit: '%', delta: '较昨日 +1.6%', tone: 'violet', progress: 92 },
]

export interface FlowStep {
  label: string
  value: number
  detail: string
  state: string
  module: string
  tab: string
}

export const flowSteps: FlowStep[] = [
  { label: '订单审核', value: 18, detail: '3 待处理', state: 'warning', module: 'orders', tab: '销售订单' },
  { label: '库存校验', value: 15, detail: '1 单缺料', state: 'danger', module: 'warehouse', tab: '库存总览' },
  { label: '人工排产', value: 14, detail: '2 待分配', state: 'warning', module: 'schedule', tab: '排产计划' },
  { label: '生产执行', value: 12, detail: '8 条线运行', state: 'success', module: 'production', tab: '生产任务' },
  { label: '品质检验', value: 9, detail: '1 批待判', state: 'warning', module: 'quality', tab: '待检任务' },
  { label: '成品入库', value: 8, detail: '44,300 只', state: 'success', module: 'production', tab: '成品入库' },
]

export interface AttentionTask {
  level: string
  title: string
  meta: string
  owner: string
  module: string
  tab: string
  target: string
}

export const attentionTasks: AttentionTask[] = [
  { level: '紧急', title: '销售订单临近交期', meta: 'SO20260831001 · 还有 2 天', owner: '订单中心', module: 'orders', tab: '销售订单', target: 'SO20260831001' },
  { level: '缺料', title: 'M 码专用纸盒库存不足', meta: '缺口 400 个 · 影响包装线 01', owner: '仓库中心', module: 'warehouse', tab: '包材库存', target: 'INV-PK-001' },
  { level: '待审', title: '生产报工等待审核', meta: 'REPORT20260901002 · 26,760 只合格', owner: '生产中心', module: 'production', tab: '生产报工', target: 'REPORT20260901002' },
]

export interface NotificationItem {
  id: string
  level: '报警' | '预警' | '待办'
  title: string
  meta: string
  time: string
  module: string
  tab: string
  target: string
}

export const notifications: NotificationItem[] = [
  { id: 'N-001', level: '报警', title: '包装机 01 主烘箱温度超限', meta: 'ALARM20260901001 · E-203 · 影响包装线 01', time: '11:42', module: 'equipment', tab: '报警记录', target: 'ALARM20260901001' },
  { id: 'N-002', level: '报警', title: 'AOI 检测机 01 通信中断', meta: 'ALARM20260901002 · E-501 · 3 分钟未更新', time: '11:20', module: 'equipment', tab: '报警记录', target: 'ALARM20260901002' },
  { id: 'N-003', level: '预警', title: 'AOI 质量结果接口异常', meta: 'ERR-20260901001 · 字段校验失败 · 重试 3 次', time: '11:56', module: 'interfaces', tab: '异常日志', target: 'ERR-20260901001' },
  { id: 'N-004', level: '待办', title: '生产报工等待审核', meta: 'REPORT20260901002 · 合格 26,760 只', time: '10:05', module: 'production', tab: '生产报工', target: 'REPORT20260901002' },
  { id: 'N-005', level: '待办', title: '成品批次待质量判定', meta: 'FQC20260901019 · 批次 FG260901B', time: '10:50', module: 'quality', tab: '成品检验', target: 'FQC20260901019' },
]

export const dashboardLines = [
  { code: 'LINE-PKG-01', name: '包装线 01', order: 'SO20260831001', product: '黑色 M 码丁腈手套', progress: 75, status: '运行', output: '45,000 / 60,000' },
  { code: 'LINE-DIP-01', name: '浸渍线 01', order: 'SO20260831002', product: '蓝色 L 码丁腈手套', progress: 34, status: '运行', output: '27,200 / 80,000' },
  { code: 'LINE-PKG-02', name: '包装线 02', order: 'IO20260831001', product: '白色 M 码乳胶手套', progress: 18, status: '待机', output: '9,000 / 50,000' },
  { code: 'LINE-DIP-02', name: '浸渍线 02', order: 'SO20260829003', product: '蓝色 M 码丁腈手套', progress: 62, status: '运行', output: '31,000 / 50,000' },
]
