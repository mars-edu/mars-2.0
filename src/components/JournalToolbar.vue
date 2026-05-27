<template>
  <div class="mb-3 flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center bg-muted p-1 rounded-lg">
      <button
        type="button"
        @click="$emit('update:viewMode', 'general')"
        :class="[
          'px-4 py-1.5 rounded-[6px] text-[13px] font-medium transition-all',
          viewMode === 'general'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        ]"
      >
        {{ journal_view_general() }}
      </button>
      <button
        type="button"
        @click="$emit('update:viewMode', 'monitoring')"
        :class="[
          'px-4 py-1.5 rounded-[6px] text-[13px] font-medium transition-all',
          viewMode === 'monitoring'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        ]"
      >
        {{ journal_view_monitoring() }}
      </button>
    </div>
    <div class="flex items-center gap-3">
      <template v-if="viewMode === 'monitoring'">
        <button
          type="button"
          @click="$emit('download')"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-foreground hover:bg-muted rounded-lg text-[13px] font-medium transition-all shadow-sm"
        >
          <IconFileSpreadsheet class="w-4 h-4" />
          <span>{{ journal_export() }}</span>
        </button>
        <button
          type="button"
          @click="$emit('open-retake')"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-[13px] font-medium transition-all"
        >
          <IconRefreshCw class="w-4 h-4" />
          <span>Пересдача</span>
        </button>
        <div class="w-px h-6 bg-border mx-1" />
      </template>
      <DropdownMenu align="right" width="18rem" @click.stop>
        <template #trigger="{ toggle, isOpen }">
          <button
            id="journal-tools-button"
            type="button"
            @click="toggle"
            class="w-12 h-12 bg-card rounded-2xl border border-border flex items-center justify-center text-muted-foreground hover:text-yellow-600 hover:border-yellow-200 hover:bg-yellow-50 transition-all shadow-sm"
            :class="{ 'text-yellow-600 border-yellow-200 bg-yellow-50': isOpen }"
          >
            <IconMoreVertical class="w-7 h-7" />
          </button>
        </template>
        <template #default="{ close }">
          <button
            type="button"
            class="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            @click="close(); $emit('open-rup')"
          >
            <IconFileText class="w-4 h-4" />
            РУП
          </button>
          <button
            id="journal-history-button"
            type="button"
            class="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            @click="close(); $emit('open-history')"
          >
            <IconClock class="w-4 h-4" />
            {{ journal_history_changes() }}
          </button>
          <button
            id="journal-settings-button"
            type="button"
            :disabled="isViewOnly"
            class="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="close(); $emit('open-settings')"
          >
            <IconSettings class="w-4 h-4" />
            Настройки
          </button>
          <button
            type="button"
            class="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            @click="close(); $emit('download')"
          >
            <IconArrowDownToLine class="w-4 h-4" />
            Скачать журнал
          </button>
          <button
            id="recalc-button"
            type="button"
            :disabled="isViewOnly"
            class="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            @click.stop="close(); $emit('open-recalc')"
          >
            <IconCalculator class="w-4 h-4" />
            {{ journal_recalc_controls() }}
          </button>
          <button
            type="button"
            class="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            @click="close(); $emit('open-makeup-hours')"
          >
            <IconClock class="w-4 h-4" />
            {{ makeup_hours_title() }}
          </button>
          <div class="h-px bg-border my-1" />
          <button
            v-if="!isViewOnly"
            type="button"
            class="w-full text-left px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-3"
            @click="close(); $emit('close-journal')"
          >
            <IconCircleX class="w-4 h-4" />
            Закрыть журнал
          </button>
          <button
            v-else
            type="button"
            class="w-full text-left px-4 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors flex items-center gap-3"
            @click="close(); $emit('open-journal')"
          >
            <IconLockOpen class="w-4 h-4" />
            Открыть журнал
          </button>
        </template>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import DropdownMenu from "@/components/ui/DropdownMenu.vue";
import IconFileText from "~icons/lucide/file-text";
import IconSettings from "~icons/lucide/settings";
import IconClock from "~icons/lucide/clock";
import IconCircleX from "~icons/lucide/circle-x";
import IconLockOpen from "~icons/lucide/lock-open";
import IconArrowDownToLine from "~icons/lucide/arrow-down-to-line";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconCalculator from "~icons/lucide/calculator";
import IconFileSpreadsheet from "~icons/lucide/file-spreadsheet";

import {
  journal_view_general,
  journal_view_monitoring,
  journal_export,
  journal_history_changes,
  journal_recalc_controls,
  makeup_hours_title,
} from "@/paraglide/messages";

defineProps<{
  viewMode: 'general' | 'monitoring';
  isViewOnly: boolean;
}>();

defineEmits<{
  'update:viewMode': [mode: 'general' | 'monitoring'];
  'download': [];
  'open-retake': [];
  'open-rup': [];
  'open-history': [];
  'open-settings': [];
  'open-recalc': [];
  'open-makeup-hours': [];
  'close-journal': [];
  'open-journal': [];
}>();
</script>
