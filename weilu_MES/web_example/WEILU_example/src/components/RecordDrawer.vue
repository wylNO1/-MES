<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Column, FormField, Row } from '../types'

const props = defineProps<{
  row: Row
  columns: Column[]
  form: FormField[]
  code: string
  hasChain: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'trace'): void
  (event: 'save', values: Row): void
}>()

const editing = ref(false)
const values = ref<Row>({ ...props.row })
const errors = ref<string[]>([])

watch(
  () => props.row,
  (row) => {
    values.value = { ...row }
    editing.value = false
    errors.value = []
  },
)

function startEdit() {
  values.value = { ...props.row }
  errors.value = []
  editing.value = true
}

function save() {
  const missing = props.form.filter((field) => field.required && !values.value[field.key]?.trim())
  errors.value = missing.map((field) => `${field.label}为必填项`)
  if (errors.value.length) return

  const patch: Row = {}
  props.form.forEach((field) => {
    patch[field.key] = values.value[field.key]?.trim() || '—'
  })
  emit('save', patch)
  editing.value = false
}
</script>

<template>
  <section class="detail-drawer" role="dialog" aria-modal="true" aria-label="记录详情">
    <header>
      <div><span>{{ code }}</span><h3>{{ editing ? '编辑记录' : '记录详情' }}</h3></div>
      <div class="drawer-tools">
        <button v-if="!editing" type="button" class="drawer-edit" @click="startEdit">✎ 编辑</button>
        <button type="button" aria-label="关闭" @click="emit('close')">×</button>
      </div>
    </header>

    <div class="detail-body">
      <div class="record-identity">
        <small>业务主键</small>
        <strong>{{ row.id }}</strong>
        <span class="data-status" :data-status="row.status">{{ row.status }}</span>
      </div>

      <template v-if="!editing">
        <dl>
          <template v-for="column in columns" :key="column.key">
            <div>
              <dt>{{ column.label }}</dt>
              <dd>{{ row[column.key] }}</dd>
            </div>
          </template>
        </dl>

        <div class="trace-box">
          <b>关联与追溯</b>
          <p v-if="hasChain">该记录已按业务编号关联到其他模块数据，可查看订单、排产、生产任务、报工、检验与库存批次的完整流转。</p>
          <p v-else>该记录暂未检索到关联的业务编号，可从订单、排产计划或生产任务记录进入完整链路。</p>
          <button type="button" @click="emit('trace')">查看完整业务链路 →</button>
        </div>
      </template>

      <form v-else class="edit-form" @submit.prevent="save">
        <ul v-if="errors.length" class="form-errors">
          <li v-for="message in errors" :key="message">{{ message }}</li>
        </ul>

        <label>
          <span>业务编号</span>
          <input :value="row.id" readonly aria-readonly="true" />
          <small class="field-hint">编号在原型中不可修改，正式系统应由编号服务与唯一约束保证。</small>
        </label>

        <label v-for="field in form" :key="field.key">
          <span>{{ field.label }} <b v-if="field.required">*</b></span>
          <select v-if="field.type === 'select'" v-model="values[field.key]">
            <option value="" disabled>请选择{{ field.label }}</option>
            <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
          </select>
          <textarea v-else-if="field.type === 'textarea'" v-model="values[field.key]" rows="3"></textarea>
          <input v-else v-model="values[field.key]" :placeholder="field.placeholder" />
        </label>

        <footer>
          <button type="button" @click="editing = false">取消</button>
          <button class="primary" type="submit">保存修改</button>
        </footer>
      </form>
    </div>
  </section>
</template>
