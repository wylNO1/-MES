<script setup lang="ts">
import type { TraceChain, TraceNode } from '../types'

defineProps<{ chain: TraceChain | null; origin: string }>()
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'jump', node: TraceNode): void
}>()
</script>

<template>
  <div class="dialog-backdrop center" @click.self="emit('close')">
    <section class="trace-modal" role="dialog" aria-modal="true" aria-label="业务链路追溯">
      <header>
        <div>
          <span>业务链路追溯</span>
          <h3>{{ chain ? chain.title : '未找到关联链路' }}</h3>
          <p>{{ chain ? chain.description : `记录 ${origin} 中没有可用于关联的业务编号，可从订单、排产计划或生产任务记录进入链路。` }}</p>
        </div>
        <button type="button" aria-label="关闭" @click="emit('close')">×</button>
      </header>

      <div v-if="chain" class="trace-flow">
        <article
          v-for="(node, index) in chain.nodes"
          :key="node.id"
          class="trace-node"
          :class="{ current: node.id === origin }"
        >
          <div class="trace-line"><i>{{ index + 1 }}</i></div>
          <div class="trace-card">
            <div class="trace-card-head">
              <b>{{ node.stage }}</b>
              <span class="data-status" :data-status="node.status">{{ node.status }}</span>
            </div>
            <strong class="mono">{{ node.id }}</strong>
            <p>{{ node.summary }}</p>
            <button type="button" @click="emit('jump', node)">在{{ node.tab }}中查看 →</button>
          </div>
        </article>
      </div>

      <footer>
        <small>链路由页面数据中的订单号、排产号、任务号、批次号与设备编码自动关联生成；正式系统需由后端按业务关系与权限生成正反向追溯。</small>
        <button type="button" class="primary" @click="emit('close')">关闭</button>
      </footer>
    </section>
  </div>
</template>
