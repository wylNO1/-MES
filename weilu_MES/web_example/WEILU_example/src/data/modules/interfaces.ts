import { defineTab } from '../helpers'
import type { ModuleConfig } from '../../types'

export const interfacesModule: ModuleConfig = {
  id: 'interfaces',
  title: '接口中心',
  code: 'I-01 — I-02',
  description: '中控接口、设备点位映射以及接收与异常日志',
  metrics: [
    { label: '接口总数', value: '12', hint: '启用 11 · 停用 1', tone: 'blue' },
    { label: '今日接收', value: '28.6 万', hint: '成功率 99.97%', tone: 'green' },
    { label: '重试报文', value: '16', hint: '均已自动恢复', tone: 'amber' },
    { label: '未处理异常', value: '2', hint: '字段校验失败', tone: 'red' },
  ],
  tabs: [
    defineTab({
      name: '接口清单',
      prefix: 'IF',
      createLabel: '新增接口',
      columns: 'id:接口编码, name:接口名称*, direction:方向, method:方式, frequency:频率, owner:责任人, last:最近通信, status:状态',
      data: [
        ['IF-PLC-STATUS', '设备运行状态接收', '中控 → MES', 'HTTP POST', '5 秒', '接口运维组', '8 秒前', '正常'],
        ['IF-PLC-COUNT', '点数机产量数据接收', '中控 → MES', 'HTTP POST', '10 秒', '接口运维组', '6 秒前', '正常'],
        ['IF-PLC-ALARM', '设备报警数据接收', '中控 → MES', 'HTTP POST', '事件触发', '接口运维组', '24 秒前', '正常'],
        ['IF-PLC-TEMP', '浸渍与烘箱温度接收', '中控 → MES', 'HTTP POST', '5 秒', '接口运维组', '8 秒前', '正常'],
        ['IF-AOI-QUALITY', 'AOI 质量结果接收', '中控 → MES', 'HTTP POST', '30 秒', '接口运维组', '3 分钟前', '异常'],
        ['IF-MES-TASK', '生产任务下发', 'MES → 中控', 'HTTP POST', '事件触发', '接口运维组', '35 分钟前', '正常'],
        ['IF-MES-RECIPE', '工艺参数下发', 'MES → 中控', 'HTTP POST', '事件触发', '接口运维组', '2 小时前', '正常'],
        ['IF-ERP-ORDER', 'ERP 订单同步', 'ERP → MES', 'HTTP POST', '15 分钟', '信息部', '12 分钟前', '停用'],
      ],
    }),
    defineTab({
      name: '点位映射',
      prefix: 'POINT',
      createLabel: '新增点位映射',
      columns: 'id:映射编号, point:点位编码, name:业务字段*, device:设备*, type:数据类型, unit:单位, freq:采集频率, interface:所属接口, status:状态',
      data: [
        ['POINT-D01-TEMP', 'PLC_D01_TEMP', '胶槽温度', 'EQ-DIP-001 · 浸渍设备 01', 'Float', '℃', '5 秒', 'IF-PLC-TEMP', '启用'],
        ['POINT-O01-TEMP', 'PLC_O01_TEMP', '烘箱温度', 'EQ-OVEN-001 · 主烘箱 01', 'Float', '℃', '5 秒', 'IF-PLC-TEMP', '启用'],
        ['POINT-P01-COUNT', 'PLC_P01_COUNT', '点数机累计产量', 'EQ-COUNT-001 · 点数机 01', 'Int', '只', '10 秒', 'IF-PLC-COUNT', '启用'],
        ['POINT-P02-COUNT', 'PLC_P02_COUNT', '点数机累计产量', 'EQ-COUNT-002 · 点数机 02', 'Int', '只', '10 秒', 'IF-PLC-COUNT', '启用'],
        ['POINT-K01-TEMP', 'PLC_K01_TEMP', '封口温度', 'EQ-PACK-001 · 包装机 01', 'Float', '℃', '5 秒', 'IF-PLC-TEMP', '启用'],
        ['POINT-K01-STATE', 'PLC_K01_STATE', '设备运行状态', 'EQ-PACK-001 · 包装机 01', 'Enum', '—', '5 秒', 'IF-PLC-STATUS', '启用'],
        ['POINT-A01-NG', 'PLC_A01_NG', '检出不良数', 'EQ-AOI-001 · AOI 检测机 01', 'Int', '只', '30 秒', 'IF-AOI-QUALITY', '待确认'],
      ],
    }),
    defineTab({
      name: '接收日志',
      prefix: 'MSG',
      createLabel: '登记接收记录',
      columns: 'id:报文编号, interface:所属接口, device:来源设备*, size:报文大小, time:接收时间, cost:处理耗时, retry:重试次数, status:处理结果',
      data: [
        ['MSG-202609010001', 'IF-PLC-STATUS', 'EQ-DIP-001 · 浸渍设备 01', '1.2 KB', '09-01 11:59:52', '38 ms', '0', '成功'],
        ['MSG-202609010002', 'IF-PLC-COUNT', 'EQ-COUNT-001 · 点数机 01', '0.8 KB', '09-01 11:59:50', '26 ms', '0', '成功'],
        ['MSG-202609010003', 'IF-PLC-TEMP', 'EQ-OVEN-001 · 主烘箱 01', '1.0 KB', '09-01 11:59:52', '31 ms', '0', '成功'],
        ['MSG-202609010004', 'IF-PLC-ALARM', 'EQ-PACK-001 · 包装机 01', '1.6 KB', '09-01 11:42:08', '52 ms', '1', '成功'],
        ['MSG-202609010005', 'IF-AOI-QUALITY', 'EQ-AOI-001 · AOI 检测机 01', '2.4 KB', '09-01 11:56:40', '—', '3', '失败'],
        ['MSG-202609010006', 'IF-MES-TASK', 'MES 生产任务下发', '3.1 KB', '09-01 11:25:16', '96 ms', '0', '成功'],
        ['MSG-202609010009', 'IF-PLC-COUNT', 'EQ-COUNT-002 · 点数机 02', '0.8 KB', '09-01 09:05:10', '—', '1', '失败'],
        ['MSG-202609010012', 'IF-PLC-STATUS', 'EQ-PACK-002 · 包装机 02', '1.2 KB', '09-01 10:18:21', '—', '1', '失败'],
        ['MSG-202608310144', 'IF-PLC-ALARM', 'EQ-DIP-002 · 浸渍设备 02', '1.5 KB', '08-31 22:47:02', '—', '0', '失败'],
      ],
    }),
    defineTab({
      name: '异常日志',
      prefix: 'ERR',
      createLabel: '登记异常记录',
      columns: 'id:异常编号, interface:所属接口, message:异常内容*, code:错误码, msgId:关联报文, time:发生时间, retry:重试次数, owner:处理人, status:状态',
      data: [
        ['ERR-20260901001', 'IF-AOI-QUALITY', 'AOI 质量结果字段 ng_count 缺失', 'E-4001', 'MSG-202609010005', '09-01 11:56:41', '3', '接口运维组', '未处理'],
        ['ERR-20260901002', 'IF-PLC-STATUS', '报文时间戳超过允许偏差 60 秒', 'E-4010', 'MSG-202609010012', '09-01 10:18:22', '1', '接口运维组', '未处理'],
        ['ERR-20260901003', 'IF-PLC-COUNT', '累计计数值小于上次上报值', 'E-4022', 'MSG-202609010009', '09-01 09:05:11', '1', '接口运维组', '已处理'],
        ['ERR-20260831004', 'IF-PLC-ALARM', '报警代码 E-999 未在字典中登记', 'E-4030', 'MSG-202608310144', '08-31 22:47:03', '0', '接口运维组', '已处理'],
      ],
    }),
  ],
}
