<!-- src/components/AiAssistantFab.vue -->
<template>
  <f7-fab class="ai-assistant-fab" position="right-bottom" @click="openPanel">
    <f7-icon ios="f7:sparkles" md="material:smart_toy" />
  </f7-fab>

  <f7-popup
    id="ai-assistant-popup"
    class="ai-assistant-popup"
    :backdrop="false"
    :close-by-backdrop-click="false"
    :close-on-escape="true"
  >
    <AiAssistantPanel @close="closePanel" />
  </f7-popup>
</template>

<script setup lang="ts">
import { f7, f7Fab, f7Icon, f7Popup } from 'framework7-vue';
import AiAssistantPanel from './AiAssistantPanel.vue';

function openPanel() {
  f7.popup.open('#ai-assistant-popup');
}

function closePanel() {
  f7.popup.close('#ai-assistant-popup');
}
</script>

<style>
/* Raise the FAB above F7's view layer (z-index: 5000) */
.ai-assistant-fab.fab {
  z-index: 6000 !important;
}

/* Solid card background for popup content */
.ai-assistant-popup .page,
.ai-assistant-popup .page-content {
  background-color: hsl(var(--card)) !important;
}

/* Position as a floating panel in the bottom-right, not full-screen */
.ai-assistant-popup.popup {
  width: 380px !important;
  height: 560px !important;
  left: auto !important;
  right: 24px !important;
  top: auto !important;
  bottom: 104px !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  transform-origin: bottom right !important;
}

.ai-assistant-popup.popup.modal-in {
  transform: scale(1) !important;
  opacity: 1 !important;
}

.ai-assistant-popup.popup.modal-out {
  transform: scale(0.95) !important;
  opacity: 0 !important;
}
</style>
