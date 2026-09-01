<script setup lang="ts">
import { attentionTasks, dashboardLines, flowSteps, kpis } from '../data'

const emit = defineEmits<{
  (event: 'navigate', payload: { module: string; tab?: string; id?: string }): void
  (event: 'trace', key: string): void
}>()
</script>

<template>
  <div class="content">
    <section class="welcome-row">
      <div>
        <p class="eyebrow">2026 年 9 月 1 日 · 周二</p>
        <h2>早上好，张伟</h2>
        <p>今日 8 条产线运行，3 项业务需要你关注。</p>
      </div>
      <div class="quick-actions">
        <button type="button" @click="emit('navigate', { module: 'orders', tab: '销售订单' })">＋ 新建订单</button>
        <button class="primary" type="button" @click="emit('navigate', { module: 'schedule', tab: '排产计划' })">开始排产 <span>→</span></button>
      </div>
    </section>

    <section class="kpi-grid" aria-label="关键指标">
      <article v-for="item in kpis" :key="item.label" class="kpi-card" :class="`tone-${item.tone}`">
        <div class="kpi-top"><span>{{ item.label }}</span><i>↗</i></div>
        <div class="kpi-value">{{ item.value }} <small>{{ item.unit }}</small></div>
        <div class="kpi-foot">
          <span>{{ item.delta }}</span>
          <div class="mini-progress"><b :style="{ width: `${item.progress}%` }"></b></div>
        </div>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel flow-panel">
        <div class="panel-head">
          <div><h3>订单生产链路</h3><p>从订单审核到成品入库的今日流转，点击节点进入对应业务页面</p></div>
          <button type="button" @click="emit('trace', 'SO20260831001')">查看全链路 →</button>
        </div>
        <div class="flow-track">
          <button
            v-for="(step, index) in flowSteps"
            :key="step.label"
            type="button"
            class="flow-step"
            @click="emit('navigate', { module: step.module, tab: step.tab })"
          >
            <div class="flow-node" :class="step.state"><span>{{ index + 1 }}</span></div>
            <div><b>{{ step.label }}</b><strong>{{ step.value }}</strong><small>{{ step.detail }}</small></div>
          </button>
        </div>
      </article>

      <article class="panel attention-panel">
        <div class="panel-head"><div><h3>待办与预警</h3><p>按影响程度排序</p></div><span class="count-pill">3 项</span></div>
        <div class="task-list">
          <button
            v-for="task in attentionTasks"
            :key="task.title"
            type="button"
            class="task-item"
            @click="emit('navigate', { module: task.module, tab: task.tab, id: task.target })"
          >
            <span class="task-level" :class="task.level">{{ task.level }}</span>
            <span class="task-copy"><b>{{ task.title }}</b><small>{{ task.meta }}</small></span>
            <span class="task-owner">{{ task.owner }} ›</span>
          </button>
        </div>
      </article>

      <article class="panel lines-panel">
        <div class="panel-head">
          <div><h3>产线实时进度</h3><p>计划、报工与设备状态综合视图</p></div>
          <div class="legend"><span><i class="green"></i>运行 8</span><span><i class="amber"></i>待机 2</span><span><i class="red"></i>报警 1</span></div>
        </div>
        <div class="line-table">
          <div class="table-row table-head"><span>产线</span><span>当前订单 / 产品</span><span>完成进度</span><span>产出</span><span>状态</span></div>
          <button
            v-for="line in dashboardLines"
            :key="line.code"
            type="button"
            class="table-row line-row"
            @click="emit('navigate', { module: 'production', tab: '生产组织', id: line.code })"
          >
            <span class="line-name"><i></i><b>{{ line.name }}</b><small>{{ line.code }}</small></span>
            <span class="order-cell"><b>{{ line.order }}</b><small>{{ line.product }}</small></span>
            <span class="progress-cell"><span><b :style="{ width: `${line.progress}%` }"></b></span><small>{{ line.progress }}%</small></span>
            <span class="output-cell">{{ line.output }}</span>
            <span><em class="status-chip" :class="line.status === '运行' ? 'running' : 'idle'">{{ line.status }}</em></span>
          </button>
        </div>
      </article>
    </section>
  </div>
</template>
