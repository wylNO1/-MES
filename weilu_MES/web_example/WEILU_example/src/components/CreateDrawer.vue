<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { Row, TabConfig } from '../types'

const props = defineProps<{ tab: TabConfig; code: string; nextId: string }>()
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'submit', row: Row): void
}>()

const values = reactive<Row>(Object.fromEntries(props.tab.form.map((field) => [field.key, ''])))
const errors = ref<string[]>([])

function submit() {
  const missing = props.tab.form.filter((field) => field.required && !values[field.key]?.trim())
  errors.value = missing.map((field) => `${field.label}为必填项`)
  if (errors.value.length) return

  const row: Row = { id: props.nextId }
  props.tab.columns.forEach((column) => {
    if (column.key === 'id') return
    row[column.key] = values[column.key]?.trim() || '—'
  })
  emit('submit', row)
}
</script>

<template>
  <section class="detail-drawer" role="dialog" aria-modal="true" :aria-label="tab.createLabel">
    <header>
      <div><span>{{ code }}</span><h3>{{ tab.createLabel }}</h3></div>
      <button type="button" aria-label="关闭" @click="emit('close')">×</button>
    </header>

    <form class="create-form" @submit.prevent="submit">
      <p>保存后记录写入当前页面的内存数据，可在表格、搜索、筛选和导出中立即看到；刷新页面会回到初始样例数据。</p>

      <ul v-if="errors.length" class="form-errors">
        <li v-for="message in errors" :key="message">{{ message }}</li>
      </ul>

      <label>
        <span>业务编号</span>
        <input :value="nextId" readonly aria-readonly="true" />
        <small class="field-hint">原型按“前缀 + 日期 + 流水”自动生成，正式系统需由编号服务保证并发唯一。</small>
      </label>

      <label v-for="field in tab.form" :key="field.key">
        <span>{{ field.label }} <b v-if="field.required">*</b></span>
        <select v-if="field.type === 'select'" v-model="values[field.key]" :required="field.required">
          <option value="" disabled>请选择{{ field.label }}</option>
          <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
        </select>
        <textarea v-else-if="field.type === 'textarea'" v-model="values[field.key]" rows="3" :placeholder="field.placeholder"></textarea>
        <input v-else v-model="values[field.key]" :placeholder="field.placeholder" />
      </label>

      <footer>
        <button type="button" @click="emit('close')">取消</button>
        <button class="primary" type="submit">保存记录</button>
      </footer>
    </form>
  </section>
</template>
