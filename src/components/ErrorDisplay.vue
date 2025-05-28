<template>
  <div class="error-display">
    <f7-card class="error-card margin-horizontal">
      <f7-card-content class="text-align-center">
        <div class="error-icon-container">
          <f7-icon
            f7="exclamationmark_triangle_fill"
            size="50"
            color="red"
          ></f7-icon>
        </div>
        <h3 class="error-title">Ошибка</h3>
        <p class="error-message">{{ message }}</p>
        <f7-button v-if="onDismiss" fill color="red" @click="onDismiss"
          >Закрыть</f7-button
        >
      </f7-card-content>
    </f7-card>
  </div>
</template>

<script setup lang="ts">
import { f7Button, f7Card, f7CardContent, f7Icon } from "framework7-vue";

defineProps<{
  message: string;
  onDismiss?: () => void;
}>();
</script>

<style scoped>
.error-display {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 16px;
}

.error-card {
  width: 100%;
  max-width: 350px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.error-icon-container {
  margin: 8px 0;
}

.error-title {
  margin: 8px 0;
  font-weight: 600;
  color: #ff3b30;
}

.error-message {
  margin: 12px 0 20px;
  color: #666;
  line-height: 1.5;
}
</style>
