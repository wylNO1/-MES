import { defineTab } from '../helpers'
import type { ChartSeries, ModuleConfig, TreeNode } from '../../types'

const equipmentTree: TreeNode[] = [
  {
    id: 'FAC-WEILU',
    name: '唯律制造工厂',
    level: '工厂',
    summary: '设备 45 台 · 运行 38 · 报警 1',
    status: '运行',
    children: [
      {
        id: 'WS-DIP',
        name: '一车间（浸渍）',
        level: '车间',
        summary: '设备 18 台 · 运行 16 · 报警 0',
        status: '运行',
        children: [
          {
            id: 'LINE-DIP-01',
            name: '浸渍线 01',
            level: '产线',
            summary: '设备 9 台 · 运行 9',
            status: '运行',
            children: [
              { id: 'EQ-DIP-001', name: '浸渍设备 01', level: '设备', summary: '胶槽温度 28.2 ℃ · 8 秒前同步', status: '运行' },
              { id: 'EQ-OVEN-001', name: '主烘箱 01', level: '设备', summary: '烘箱温度 134.6 ℃ · 8 秒前同步', status: '运行' },
            ],
          },
          {
            id: 'LINE-DIP-02',
            name: '浸渍线 02',
            level: '产线',
            summary: '设备 9 台 · 运行 7',
            status: '运行',
            children: [
              { id: 'EQ-DIP-002', name: '浸渍设备 02', level: '设备', summary: '胶槽温度 29.1 ℃ · 11 秒前同步', status: '运行' },
            ],
          },
        ],
      },
      {
        id: 'WS-PKG',
        name: '二车间（包装）',
        level: '车间',
        summary: '设备 27 台 · 运行 22 · 报警 1',
        status: '报警',
        children: [
          {
            id: 'LINE-PKG-01',
            name: '包装线 01',
            level: '产线',
            summary: '设备 11 台 · 运行 9 · 报警 1',
            status: '报警',
            children: [
              { id: 'EQ-COUNT-001', name: '点数机 01', level: '设备', summary: '累计计数 45,000 只 · 6 秒前同步', status: '运行' },
              { id: 'EQ-PACK-001', name: '包装机 01', level: '设备', summary: 'E-203 主烘箱温度超限', status: '报警' },
            ],
          },
          {
            id: 'LINE-PKG-02',
            name: '包装线 02',
            level: '产线',
            summary: '设备 8 台 · 运行 7',
            status: '运行',
            children: [
              { id: 'EQ-PACK-002', name: '包装机 02', level: '设备', summary: '设备运行正常 · 10 秒前同步', status: '运行' },
            ],
          },
          {
            id: 'LINE-PKG-03',
            name: '包装线 03',
            level: '产线',
            summary: '设备 8 台 · 运行 6',
            status: '运行',
            children: [
              { id: 'EQ-COUNT-002', name: '点数机 02', level: '设备', summary: '累计计数 7,200 只 · 9 秒前同步', status: '运行' },
            ],
          },
        ],
      },
    ],
  },
]

const equipmentSeries: ChartSeries[] = [
  {
    key: 'EQ-DIP-001-TEMP',
    device: 'EQ-DIP-001 · 浸渍设备 01',
    point: '胶槽温度',
    unit: '℃',
    lower: 26,
    upper: 30,
    values: [27.9, 28.1, 28.0, 28.3, 28.2, 27.8, 28.0, 28.4, 28.6, 28.3, 28.1, 27.9, 28.2, 28.5, 28.7, 28.4, 28.2, 28.0, 28.1, 28.3, 28.2, 28.4, 28.3, 28.2],
  },
  {
    key: 'EQ-OVEN-001-TEMP',
    device: 'EQ-OVEN-001 · 主烘箱 01',
    point: '烘箱温度',
    unit: '℃',
    lower: 130,
    upper: 140,
    values: [134.2, 134.6, 135.1, 135.4, 134.9, 134.5, 134.8, 135.6, 136.2, 135.8, 135.2, 134.7, 134.4, 134.9, 135.5, 136.1, 135.7, 135.0, 134.6, 134.3, 134.8, 135.2, 134.9, 134.6],
  },
  {
    key: 'EQ-PACK-001-TEMP',
    device: 'EQ-PACK-001 · 包装机 01',
    point: '封口温度',
    unit: '℃',
    lower: 120,
    upper: 138,
    values: [128.4, 129.1, 130.2, 131.6, 132.8, 133.9, 135.2, 136.4, 137.1, 138.3, 139.2, 140.1, 139.6, 138.8, 137.9, 137.2, 136.6, 136.1, 135.8, 136.4, 137.2, 138.1, 139.0, 139.8],
  },
  {
    key: 'EQ-COUNT-001-RATE',
    device: 'EQ-COUNT-001 · 点数机 01',
    point: '每分钟计数',
    unit: '只 / 分',
    lower: 240,
    upper: 320,
    values: [286, 292, 288, 295, 301, 298, 290, 284, 279, 286, 293, 299, 304, 297, 291, 288, 294, 300, 296, 289, 285, 292, 298, 295],
  },
]

export const equipmentModule: ModuleConfig = {
  id: 'equipment',
  title: '设备管理',
  code: 'EQ-01 — EQ-08',
  description: '工厂—车间—产线—设备四级结构与实时运行状态',
  metrics: [
    { label: '设备总数', value: '45', hint: '关键设备 17 台', tone: 'blue' },
    { label: '运行设备', value: '38', hint: '运行率 82.6%', tone: 'green' },
    { label: '当前报警', value: '1', hint: '影响包装线 01', tone: 'red' },
    { label: '维护设备', value: '1', hint: '码垛机维护中', tone: 'amber' },
  ],
  tabs: [
    defineTab({
      name: '设备台账',
      prefix: 'EQ',
      createLabel: '新增设备',
      columns: 'id:设备编号, name:设备名称*, type:类别, model:型号, line:所属产线, workshop:所属车间, owner:责任人, freshness:数据新鲜度, status:状态',
      data: [
        ['EQ-DIP-001', '浸渍设备 01', '浸渍设备', 'DIP-2000', 'LINE-DIP-01', '一车间（浸渍）', '陈杰', '8 秒前', '运行'],
        ['EQ-DIP-002', '浸渍设备 02', '浸渍设备', 'DIP-2000', 'LINE-DIP-02', '一车间（浸渍）', '陈杰', '11 秒前', '运行'],
        ['EQ-OVEN-001', '主烘箱 01', '烘干设备', 'OVEN-1500', 'LINE-DIP-01', '一车间（浸渍）', '陈杰', '8 秒前', '运行'],
        ['EQ-COUNT-001', '点数机 01', '点数机', 'COUNT-800', 'LINE-PKG-01', '二车间（包装）', '刘洋', '6 秒前', '运行'],
        ['EQ-COUNT-002', '点数机 02', '点数机', 'COUNT-800', 'LINE-PKG-03', '二车间（包装）', '刘洋', '9 秒前', '运行'],
        ['EQ-PACK-001', '包装机 01', '包装机', 'PACK-1000', 'LINE-PKG-01', '二车间（包装）', '刘洋', '12 秒前', '报警'],
        ['EQ-PACK-002', '包装机 02', '包装机', 'PACK-1000', 'LINE-PKG-02', '二车间（包装）', '刘洋', '10 秒前', '运行'],
        ['EQ-SORT-001', '分拣机 01', '分拣设备', 'SORT-600', 'LINE-PKG-03', '二车间（包装）', '刘洋', '7 秒前', '运行'],
        ['EQ-CART-001', '装箱码垛机 01', '装箱码垛', 'CART-900', 'LINE-PKG-01', '二车间（包装）', '刘洋', '14 秒前', '维护'],
        ['EQ-FEED-001', '上料线 01', '上料线', 'FEED-300', 'LINE-DIP-01', '一车间（浸渍）', '陈杰', '9 秒前', '运行'],
        ['EQ-BUCK-001', '扣合机 01', '扣合机', 'BUCK-400', 'LINE-PKG-02', '二车间（包装）', '刘洋', '22 秒前', '停用'],
      ],
    }),
    defineTab({
      name: '组织层级',
      prefix: 'ORG-EQ',
      kind: 'tree',
      tree: equipmentTree,
      createLabel: '新增组织节点',
      note: '点击工厂、车间、产线或设备节点，可筛选下方节点汇总数据；设备明细见“设备台账”页签。',
      columns: 'id:节点编号, name:节点名称*, level:层级, parent:上级节点, count:设备数量, running:运行数量, owner:责任人, status:状态',
      data: [
        ['FAC-WEILU', '唯律制造工厂', '工厂', '—', '45', '38', '张伟', '运行'],
        ['WS-DIP', '一车间（浸渍）', '车间', 'FAC-WEILU', '18', '16', '陈杰', '运行'],
        ['WS-PKG', '二车间（包装）', '车间', 'FAC-WEILU', '27', '22', '刘洋', '报警'],
        ['LINE-DIP-01', '浸渍线 01', '产线', 'WS-DIP', '9', '9', '陈杰', '运行'],
        ['LINE-DIP-02', '浸渍线 02', '产线', 'WS-DIP', '9', '7', '陈杰', '运行'],
        ['LINE-PKG-01', '包装线 01', '产线', 'WS-PKG', '11', '9', '刘洋', '报警'],
        ['LINE-PKG-02', '包装线 02', '产线', 'WS-PKG', '8', '7', '刘洋', '运行'],
        ['LINE-PKG-03', '包装线 03', '产线', 'WS-PKG', '8', '6', '刘洋', '运行'],
      ],
    }),
    defineTab({
      name: '实时状态',
      prefix: 'RT',
      kind: 'chart',
      series: equipmentSeries,
      createLabel: '新增实时监控项',
      note: '曲线为近 24 个采集周期的样例数据；打开“模拟推送”后按 3 秒生成新的模拟点，仅用于演示实时刷新效果。',
      columns: 'id:监控编号, device:设备*, point:采集点位, value:当前值, range:标准范围*, freshness:数据新鲜度, line:所属产线, status:状态',
      data: [
        ['RT-DIP-001-TEMP', 'EQ-DIP-001 · 浸渍设备 01', '胶槽温度', '28.2 ℃', '26 — 30 ℃', '8 秒前', 'LINE-DIP-01', '运行'],
        ['RT-OVEN-001-TEMP', 'EQ-OVEN-001 · 主烘箱 01', '烘箱温度', '134.6 ℃', '130 — 140 ℃', '8 秒前', 'LINE-DIP-01', '运行'],
        ['RT-PACK-001-TEMP', 'EQ-PACK-001 · 包装机 01', '封口温度', '139.8 ℃', '120 — 138 ℃', '12 秒前', 'LINE-PKG-01', '报警'],
        ['RT-COUNT-001-RATE', 'EQ-COUNT-001 · 点数机 01', '每分钟计数', '295 只 / 分', '240 — 320 只 / 分', '6 秒前', 'LINE-PKG-01', '运行'],
      ],
    }),
    defineTab({
      name: '报警记录',
      prefix: 'ALARM',
      createLabel: '登记报警记录',
      columns: 'id:报警编号, device:设备*, code:报警代码, message:报警内容*, level:级别, start:发生时间, end:结束时间, owner:处理人, status:状态',
      data: [
        ['ALARM20260901001', 'EQ-PACK-001 · 包装机 01', 'E-203', '主烘箱温度超过上限 138 ℃', '高', '09-01 11:42', '—', '刘洋', '待处理'],
        ['ALARM20260901003', 'EQ-COUNT-001 · 点数机 01', 'W-102', '计数速率短时低于下限', '低', '09-01 08:36', '09-01 08:41', '刘洋', '已关闭'],
        ['ALARM20260831004', 'EQ-DIP-002 · 浸渍设备 02', 'E-108', '胶槽液位低于下限', '中', '08-31 21:14', '08-31 21:35', '陈杰', '已关闭'],
        ['ALARM20260831005', 'EQ-CART-001 · 装箱码垛机 01', 'E-330', '气压不足，进入维护状态', '中', '08-31 14:02', '08-31 16:40', '刘洋', '已关闭'],
      ],
    }),
    defineTab({
      name: '采集数据',
      prefix: 'DATA',
      createLabel: '新增采集记录',
      columns: 'id:采集编号, device:设备*, point:点位编码, name:业务字段*, value:采集值, unit:单位, freq:采集频率, time:采集时间, status:采集状态',
      data: [
        ['DATA20260901001', 'EQ-DIP-001 · 浸渍设备 01', 'PLC_D01_TEMP', '胶槽温度', '28.2', '℃', '5 秒', '09-01 11:59:52', '正常'],
        ['DATA20260901002', 'EQ-COUNT-001 · 点数机 01', 'PLC_P01_COUNT', '累计计数值', '45,000', '只', '10 秒', '09-01 11:59:50', '正常'],
        ['DATA20260901003', 'EQ-OVEN-001 · 主烘箱 01', 'PLC_O01_TEMP', '烘箱温度', '134.6', '℃', '5 秒', '09-01 11:59:52', '正常'],
        ['DATA20260901004', 'EQ-PACK-001 · 包装机 01', 'PLC_K01_TEMP', '封口温度', '139.8', '℃', '5 秒', '09-01 11:59:48', '超限'],
        ['DATA20260901005', 'EQ-COUNT-002 · 点数机 02', 'PLC_P02_COUNT', '累计计数值', '7,200', '只', '10 秒', '09-01 11:59:49', '正常'],
      ],
    }),
  ],
}
