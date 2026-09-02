<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import DashboardView from './components/DashboardView.vue'
import ModuleView from './components/ModuleView.vue'
import ToastStack from './components/ToastStack.vue'
import TraceModal from './components/TraceModal.vue'
import { moduleMap, modules, navItems, notifications } from './data'
import { buildChain, buildChainById } from './data/trace'
import { initStore, resetStore, storeState } from './store'
import { pushToast } from './toast'
import type { NotificationItem } from './data/dashboard'
import type { Row, TraceChain, TraceNode } from './types'

initStore(modules)

const activeNav = ref('dashboard')
const query = ref('')
const target = ref<{ tab?: string; id?: string } | null>(null)
const traceChain = ref<TraceChain | null>(null)
const traceOrigin = ref('')
const traceOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
const openMenu = ref<'notify' | 'user' | null>(null)
const readIds = ref<string[]>([])

const currentModule = computed(() => moduleMap[activeNav.value] ?? null)
const currentLabel = computed(() => (activeNav.value === 'dashboard' ? '运营总览' : currentModule.value?.title ?? '运营总览'))
const unread = computed(() => notifications.filter((item) => !readIds.value.includes(item.id)).length)

function navigate(payload: { module: string; tab?: string; id?: string }) {
  activeNav.value = payload.module
  query.value = ''
  target.value = payload.module === 'dashboard' ? null : { tab: payload.tab, id: payload.id }
  openMenu.value = null
}

function openTrace(payload: { module: string; tab: string; row: Row }) {
  traceChain.value = buildChain(payload.module, payload.tab, payload.row)
  traceOrigin.value = payload.row.id
  traceOpen.value = true
}

function openTraceByKey(key: string) {
  traceChain.value = buildChainById(key)
  traceOrigin.value = key
  traceOpen.value = true
}

function jumpTo(node: TraceNode) {
  traceOpen.value = false
  navigate({ module: node.module, tab: node.tab, id: node.id })
}

function readNotification(item: NotificationItem) {
  if (!readIds.value.includes(item.id)) readIds.value = [...readIds.value, item.id]
  navigate({ module: item.module, tab: item.tab, id: item.target })
}

function readAll() {
  readIds.value = notifications.map((item) => item.id)
}

function resetData() {
  if (!window.confirm('确认重置为初始样例数据？页面中新增、编辑、导入和删除的内容都会丢失。')) return
  resetStore()
  openMenu.value = null
  target.value = null
  query.value = ''
  pushToast('已重置为初始样例数据', 'info')
}

function toggleMenu(menu: 'notify' | 'user') {
  openMenu.value = openMenu.value === menu ? null : menu
}

function onWindowClick(event: MouseEvent) {
  const element = event.target as HTMLElement
  if (!element.closest('.top-menu-anchor')) openMenu.value = null
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchInput.value?.focus()
  }
  if (event.key === 'Escape') openMenu.value = null
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('click', onWindowClick)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('click', onWindowClick)
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark"><span></span><span></span><span></span></div>
        <div><strong>唯律智造</strong><small>WEILU MES</small></div>
      </div>

      <nav class="nav-list" aria-label="主导航">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: activeNav === item.id }"
          type="button"
          @click="navigate({ module: item.id })"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="system-health"><span class="pulse"></span><div><b>系统运行正常</b><small>中控数据 8 秒前同步</small></div></div>
        <div class="version">MES 一期参考原型 · V0.3</div>
      </div>
    </aside>

    <main class="main-panel">
      <header class="topbar">
        <div>
          <div class="breadcrumb">唯律制造工厂 <span>/</span> {{ currentLabel }}</div>
          <h1>{{ activeNav === 'dashboard' ? '生产运营驾驶舱' : currentLabel }}</h1>
        </div>
        <div class="top-actions">
          <label class="search-box">
            <span>⌕</span>
            <input ref="searchInput" v-model="query" type="search" placeholder="搜索订单、任务、批次" />
            <kbd>⌘ K</kbd>
          </label>

          <div class="top-menu-anchor">
            <button class="icon-button" type="button" aria-label="通知" @click="toggleMenu('notify')">
              ♢<span v-if="unread" class="notify-dot"></span>
            </button>
            <section v-if="openMenu === 'notify'" class="top-menu notify-menu" aria-label="通知列表">
              <header>
                <b>通知与报警</b>
                <button type="button" :disabled="!unread" @click="readAll">全部标记已读</button>
              </header>
              <button
                v-for="item in notifications"
                :key="item.id"
                type="button"
                class="notify-item"
                :class="{ read: readIds.includes(item.id) }"
                @click="readNotification(item)"
              >
                <span class="notify-level" :class="item.level">{{ item.level }}</span>
                <span class="notify-copy"><b>{{ item.title }}</b><small>{{ item.meta }}</small></span>
                <span class="notify-time">{{ item.time }}</span>
              </button>
              <footer>通知为页面样例数据，正式系统应由中控接口与生产事件推送。</footer>
            </section>
          </div>

          <div class="top-menu-anchor">
            <button class="user-card" type="button" aria-haspopup="menu" @click="toggleMenu('user')">
              <span class="avatar">张</span>
              <span class="user-copy"><b>张伟</b><small>生产计划员</small></span>
              <span>⌄</span>
            </button>
            <section v-if="openMenu === 'user'" class="top-menu user-menu" aria-label="用户菜单">
              <div class="user-menu-head">
                <b>张伟 · 生产计划员</b>
                <small>唯律制造工厂 / 计划部</small>
              </div>
              <div class="user-menu-state">
                <span>原型数据</span>
                <b>{{ storeState.restored ? '已保存在本机浏览器' : '当前为初始样例数据' }}</b>
                <small v-if="storeState.lastSavedAt">最近保存 {{ storeState.lastSavedAt }}</small>
              </div>
              <button type="button" @click="resetData">重置样例数据</button>
              <button type="button" @click="pushToast('角色、权限与登录需由后端实现，原型固定为生产计划员视角', 'info')">切换角色 / 权限</button>
              <button type="button" @click="pushToast('唯律 MES 一期参考原型 V0.3 · 数据仅保存在本机浏览器', 'info')">关于本原型</button>
            </section>
          </div>
        </div>
      </header>

      <DashboardView v-if="activeNav === 'dashboard'" @navigate="navigate" @trace="openTraceByKey" />

      <ModuleView
        v-else-if="currentModule"
        :key="currentModule.id"
        v-model:query="query"
        :module="currentModule"
        :target="target"
        @trace="openTrace"
      />
    </main>

    <TraceModal
      v-if="traceOpen"
      :chain="traceChain"
      :origin="traceOrigin"
      @close="traceOpen = false"
      @jump="jumpTo"
    />

    <ToastStack />
  </div>
</template>
