<template>
  <div class="error-display-container">
    <div class="error-card animate-in fade-in zoom-in duration-300">
      <div class="error-icon-wrapper">
        <IconTriangleAlert class="w-8 h-8" />
      </div>
      
      <h2 class="error-title">Ошибка</h2>
      <p class="error-message">{{ message }}</p>
      
      <div class="error-actions">
        <button 
          v-if="onRetry" 
          class="btn-retry" 
          @click="onRetry"
        >
          <IconRefreshCcw class="w-4 h-4 mr-2" />
          Попробовать снова
        </button>
        
        <button 
          v-if="onDismiss" 
          class="btn-dismiss" 
          @click="onDismiss"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconTriangleAlert from "~icons/lucide/triangle-alert";
import IconRefreshCcw from "~icons/lucide/refresh-ccw";

defineProps<{
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}>();
</script>

<style scoped>
.error-display-container {
  @apply w-full flex justify-center items-center p-6;
}

.error-card {
  @apply w-full max-w-[380px] bg-card rounded-[32px] p-8 text-center;
  @apply shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-border;
}

.error-icon-wrapper {
  @apply w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6;
}

.error-title {
  @apply text-xl font-bold text-foreground mb-2 tracking-tight;
}

.error-message {
  @apply text-muted-foreground mb-8 leading-relaxed text-sm;
}

.error-actions {
  @apply flex flex-col gap-3;
}

.btn-retry {
  @apply w-full flex items-center justify-center px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-200 active:scale-[0.98];
}

.btn-dismiss {
  @apply w-full px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-2xl transition-all active:scale-[0.98];
}
</style>
