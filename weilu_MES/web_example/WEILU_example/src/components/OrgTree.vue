<script setup lang="ts">
import { ref } from 'vue'
import type { TreeNode } from '../types'

const props = defineProps<{ nodes: TreeNode[]; selected: string }>()
const emit = defineEmits<{
  (event: 'select', node: TreeNode | null): void
  (event: 'add', node: TreeNode): void
  (event: 'rename', node: TreeNode): void
  (event: 'remove', node: TreeNode): void
}>()

const collapsed = ref<Set<string>>(new Set())

function toggle(node: TreeNode) {
  const next = new Set(collapsed.value)
  if (next.has(node.id)) next.delete(node.id)
  else next.add(node.id)
  collapsed.value = next
}

function select(node: TreeNode) {
  emit('select', props.selected === node.id ? null : node)
}

function flatten(nodes: TreeNode[], depth = 0): { node: TreeNode; depth: number }[] {
  return nodes.flatMap((node) => {
    const self = { node, depth }
    if (!node.children?.length || collapsed.value.has(node.id)) return [self]
    return [self, ...flatten(node.children, depth + 1)]
  })
}
</script>

<template>
  <div class="org-tree">
    <div class="org-tree-head">
      <b>组织层级</b>
      <div class="org-tree-tools">
        <small>节点可新增、重命名和删除，调整结果保存在原型数据中</small>
        <button v-if="selected" type="button" @click="emit('select', null)">清除节点筛选 ×</button>
      </div>
    </div>
    <div class="org-tree-body">
      <div
        v-for="item in flatten(props.nodes)"
        :key="item.node.id"
        class="org-node"
        :class="{ active: selected === item.node.id }"
        :style="{ paddingLeft: `${12 + item.depth * 22}px` }"
      >
        <button
          v-if="item.node.children?.length"
          class="org-toggle"
          type="button"
          :aria-label="collapsed.has(item.node.id) ? '展开' : '收起'"
          @click="toggle(item.node)"
        >{{ collapsed.has(item.node.id) ? '▸' : '▾' }}</button>
        <span v-else class="org-toggle placeholder">·</span>

        <button class="org-label" type="button" @click="select(item.node)">
          <span class="org-name">
            <b>{{ item.node.name }}</b>
            <small class="mono">{{ item.node.id }}</small>
          </span>
          <small class="org-summary">{{ item.node.summary }}</small>
        </button>

        <span class="org-level">{{ item.node.level }}</span>
        <span class="data-status" :data-status="item.node.status">{{ item.node.status }}</span>

        <span class="org-actions">
          <button type="button" title="新增子节点" @click="emit('add', item.node)">＋</button>
          <button type="button" title="重命名" @click="emit('rename', item.node)">✎</button>
          <button type="button" title="删除节点" @click="emit('remove', item.node)">×</button>
        </span>
      </div>
    </div>
  </div>
</template>
