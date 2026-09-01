import { reactive } from 'vue'

export type ToastTone = 'success' | 'info' | 'warn'
export interface ToastItem { id: number; text: string; tone: ToastTone }

export const toasts = reactive<ToastItem[]>([])
let seed = 0

export function pushToast(text: string, tone: ToastTone = 'success'): void {
  const id = (seed += 1)
  toasts.push({ id, text, tone })
  window.setTimeout(() => {
    const index = toasts.findIndex((item) => item.id === id)
    if (index >= 0) toasts.splice(index, 1)
  }, 2800)
}
