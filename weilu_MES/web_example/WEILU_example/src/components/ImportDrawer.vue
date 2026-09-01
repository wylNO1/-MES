<script setup lang="ts">
import { ref } from 'vue'
import { nextId } from '../store'
import { exportTemplate, parseCsv } from '../utils/csv'
import type { Row, TabConfig } from '../types'

const props = defineProps<{
  tab: TabConfig
  moduleId: string
  moduleTitle: string
  rows: Row[]
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'submit', rows: Row[]): void
}>()

interface ParsedRow {
  line: number
  row: Row
  errors: string[]
}

const fileName = ref('')
const fileError = ref('')
const parsed = ref<ParsedRow[]>([])
const parsedOnce = ref(false)

const requiredFields = props.tab.form.filter((field) => field.required)

function downloadTemplate() {
  exportTemplate(`${props.moduleTitle}-${props.tab.name}-导入模板.csv`, props.tab.columns, props.rows[0])
}

function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  fileName.value = file.name
  fileError.value = ''
  parsed.value = []
  parsedOnce.value = false

  const reader = new FileReader()
  reader.onload = () => {
    validate(String(reader.result ?? ''))
    input.value = ''
  }
  reader.onerror = () => {
    fileError.value = '文件读取失败，请确认文件未被占用后重试。'
  }
  reader.readAsText(file, 'utf-8')
}

function validate(text: string) {
  const table = parseCsv(text)
  parsedOnce.value = true
  if (table.length < 2) {
    fileError.value = '文件中没有数据行，请先下载模板并按列填写。'
    return
  }

  const header = table[0].map((cell) => cell.trim())
  const mapping = header.map((label) => props.tab.columns.find((column) => column.label === label)?.key ?? '')
  const matched = mapping.filter(Boolean)
  if (!matched.length) {
    fileError.value = '表头与当前页签的列名不匹配，请使用“下载导入模板”生成的文件。'
    return
  }

  const missingRequired = requiredFields.filter((field) => !matched.includes(field.key))
  if (missingRequired.length) {
    fileError.value = `模板缺少必填列：${missingRequired.map((field) => field.label).join('、')}`
    return
  }

  const existingIds = new Set(props.rows.map((row) => row.id))
  const fileIds = new Set<string>()
  let generated = 0

  parsed.value = table.slice(1).map((cells, index) => {
    const row: Row = {}
    mapping.forEach((key, position) => {
      if (key) row[key] = (cells[position] ?? '').trim()
    })

    const errors: string[] = []
    requiredFields.forEach((field) => {
      if (!row[field.key]) errors.push(`${field.label}为空`)
    })

    const id = row.id?.trim() ?? ''
    if (id) {
      if (existingIds.has(id)) errors.push(`编号 ${id} 已存在`)
      else if (fileIds.has(id)) errors.push(`编号 ${id} 在文件中重复`)
      fileIds.add(id)
    } else {
      row.id = nextId(props.moduleId, props.tab, generated)
      generated += 1
    }

    props.tab.columns.forEach((column) => {
      if (!row[column.key]) row[column.key] = column.key === 'id' ? row.id : '—'
    })

    return { line: index + 2, row, errors }
  })
}

function submit() {
  const valid = parsed.value.filter((item) => !item.errors.length).map((item) => item.row)
  if (!valid.length) return
  emit('submit', valid)
}
</script>

<template>
  <section class="detail-drawer" role="dialog" aria-modal="true" aria-label="导入数据">
    <header>
      <div><span>{{ moduleTitle }}</span><h3>导入{{ tab.name }}</h3></div>
      <button type="button" aria-label="关闭" @click="emit('close')">×</button>
    </header>

    <div class="import-body">
      <p class="import-intro">
        按模板列名导入 CSV：逐行校验必填项与编号重复，错误行会列出原因并被跳过，正确行仍然可以导入。
        导入结果写入页面数据，正式系统需要 Excel 模板、服务端校验与导入权限。
      </p>

      <div class="import-actions">
        <button type="button" @click="downloadTemplate">⇩ 下载导入模板</button>
        <label class="import-file">
          选择 CSV 文件
          <input type="file" accept=".csv,text/csv" @change="handleFile" />
        </label>
      </div>

      <p v-if="fileName" class="import-file-name">已选择：{{ fileName }}</p>
      <p v-if="fileError" class="import-error">{{ fileError }}</p>

      <template v-if="parsed.length">
        <div class="import-summary">
          <span class="ok">可导入 {{ parsed.filter((item) => !item.errors.length).length }} 行</span>
          <span class="bad">错误 {{ parsed.filter((item) => item.errors.length).length }} 行</span>
        </div>

        <div class="import-rows">
          <div v-for="item in parsed" :key="item.line" class="import-row" :class="{ bad: item.errors.length }">
            <b>第 {{ item.line }} 行</b>
            <span class="mono">{{ item.row.id }}</span>
            <small v-if="item.errors.length">{{ item.errors.join('；') }}</small>
            <small v-else>校验通过</small>
          </div>
        </div>
      </template>

      <p v-else-if="parsedOnce && !fileError" class="import-error">文件中没有可解析的数据行。</p>
    </div>

    <footer class="import-footer">
      <button type="button" @click="emit('close')">取消</button>
      <button
        class="primary"
        type="button"
        :disabled="!parsed.some((item) => !item.errors.length)"
        @click="submit"
      >导入有效行</button>
    </footer>
  </section>
</template>
