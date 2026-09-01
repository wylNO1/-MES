import type { Column, Row } from '../types'

function escapeCell(value: string): string {
  const text = value ?? ''
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function download(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** 导出表格：UTF-8 BOM + CSV，Excel 直接打开不乱码。 */
export function exportCsv(filename: string, columns: Column[], rows: Row[]): void {
  const header = columns.map((column) => escapeCell(column.label)).join(',')
  const body = rows.map((row) => columns.map((column) => escapeCell(row[column.key])).join(','))
  download(filename, `\uFEFF${[header, ...body].join('\r\n')}\r\n`)
}

/** 导入模板：表头 + 一行示例，帮助现场按列填写。 */
export function exportTemplate(filename: string, columns: Column[], sample?: Row): void {
  const header = columns.map((column) => escapeCell(column.label)).join(',')
  const example = columns.map((column) => escapeCell(sample?.[column.key] ?? '')).join(',')
  download(filename, `\uFEFF${[header, example].join('\r\n')}\r\n`)
}

/** 解析 CSV 文本，支持引号包裹、转义引号、CRLF 与 BOM。 */
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((item) => item.some((value) => value.trim() !== ''))
}

export function timestampSuffix(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`
}
