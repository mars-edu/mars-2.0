<!-- src/components/AiAssistantFab.vue -->
<template>
  <f7-fab class="ai-assistant-fab" position="right-bottom" @click="openAssistant">
    <IconSparkles />
  </f7-fab>

  <GuardedPopover
    id="ai-assistant-popup"
    kind="popup"
    :guard-unsaved="false"
    :close-on-escape="true"
    @popup:open="isPanelOpened = true"
  >
    <template #default="{ requestClose }">
      <Suspense v-if="isPanelOpened">
        <template #default>
          <AiAssistantPanel @close="requestClose" />
        </template>
        <template #fallback>
          <div class="h-full flex items-center justify-center p-8 bg-card text-muted-foreground">
            <div class="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </template>
      </Suspense>
    </template>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';
import { f7, f7Fab } from 'framework7-vue';
import IconSparkles from '~icons/lucide/sparkles';
import GuardedPopover from '@/components/ui/GuardedPopover.vue';

const isPanelOpened = ref(false);
const AiAssistantPanel = defineAsyncComponent(() => import('./AiAssistantPanel.vue'));

function openAssistant() {
  isPanelOpened.value = true;
  f7.popup.open('#ai-assistant-popup');
}
</script>

<style>
/* Raise the FAB above F7's view layer */
.ai-assistant-fab.fab {
  z-index: 6000 !important;
}

@media (max-width: 767px) {
  .ai-assistant-fab.fab {
    bottom: calc(64px + 16px + env(safe-area-inset-bottom)) !important;
  }
}

/* Position as floating panel in the bottom-right */
#ai-assistant-popup.popup {
  width: 380px !important;
  height: min(560px, calc(100dvh - 80px)) !important;
  left: auto !important;
  right: 24px !important;
  top: auto !important;
  bottom: 24px !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  transform-origin: bottom right !important;
}

#ai-assistant-popup.popup.modal-in {
  transform: scale(1) !important;
  opacity: 1 !important;
}

#ai-assistant-popup.popup.modal-out {
  transform: scale(0.95) !important;
  opacity: 0 !important;
}

/* Panel root: full-height flex column — same pattern as KtpDetailPopup */
#ai-assistant-popup .ai-panel-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Fixed header */
#ai-assistant-popup .ai-panel-header {
  flex-shrink: 0;
  background-color: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
}

/* Scrollable body area */
#ai-assistant-popup .ai-panel-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Messages list scrolls; input stays pinned */
#ai-assistant-popup .ai-panel-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

#ai-assistant-popup .ai-panel-input {
  flex-shrink: 0;
  background-color: hsl(var(--card));
  border-top: 1px solid hsl(var(--border));
}
</style>
