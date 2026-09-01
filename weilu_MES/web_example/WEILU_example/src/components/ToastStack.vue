<script setup lang="ts">
import { toasts } from '../toast'
</script>

<template>
  <div class="toast-stack" role="status" aria-live="polite">
    <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.tone">
      <i></i><span>{{ toast.text }}</span>
    </div>
  </div>
</template>
