<template>
  <DropdownMenu align="right" class="flex-shrink-0 mt-1">
    <template #trigger="{ toggle, isOpen }">
      <button
        class="p-2.5 bg-card rounded-xl shadow-sm border border-border hover:border-primary hover:text-primary transition-all flex items-center justify-center"
        :class="{ 'border-primary text-primary': isOpen }"
        @click="toggle"
      >
        <IconMoreVertical class="w-5 h-5" />
      </button>
    </template>
    <template #default="{ close }">
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
        @click="$emit('download'); close()"
      >
        <IconArrowDownToLine class="w-4 h-4 flex-shrink-0" />
        {{ journal_download() }}
      </button>
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
        @click="$emit('merge'); close()"
      >
        <IconGitMerge class="w-4 h-4 flex-shrink-0" />
        {{ journal_merge() }}
      </button>
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
        @click="$emit('split'); close()"
      >
        <IconUngroup class="w-4 h-4 flex-shrink-0" />
        {{ journal_split() }}
      </button>
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
        @click="$emit('close-journal'); close()"
      >
        <IconCircleX class="w-4 h-4 flex-shrink-0" />
        {{ journal_close() }}
      </button>
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
        @click="$emit('open-journal'); close()"
      >
        <IconLockOpen class="w-4 h-4 flex-shrink-0" />
        {{ journal_open() }}
      </button>
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-3"
        @click="$emit('delete'); close()"
      >
        <IconTrash2 class="w-4 h-4 flex-shrink-0" />
        {{ journal_delete() }}
      </button>
      <div class="h-px bg-border my-1" />
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
        @click="$emit('replace'); close()"
      >
        <IconRefreshCw class="w-4 h-4 flex-shrink-0" />
        {{ journal_replace() }}
      </button>
      <button
        class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
        @click="$emit('settings'); close()"
      >
        <IconSettings2 class="w-4 h-4 flex-shrink-0" />
        {{ journal_settings() }}
      </button>
    </template>
  </DropdownMenu>
</template>

<script setup lang="ts">
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconArrowDownToLine from "~icons/lucide/arrow-down-to-line";
import IconGitMerge from "~icons/lucide/git-merge";
import IconUngroup from "~icons/lucide/ungroup";
import IconCircleX from "~icons/lucide/circle-x";
import IconLockOpen from "~icons/lucide/lock-open";
import IconTrash2 from "~icons/lucide/trash-2";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconSettings2 from "~icons/lucide/settings-2";
import DropdownMenu from "@/components/ui/DropdownMenu.vue";
import {
  journal_download,
  journal_merge,
  journal_split,
  journal_close,
  journal_open,
  journal_delete,
  journal_replace,
  journal_settings,
} from "@/paraglide/messages";

defineEmits<{
  (e: "download"): void;
  (e: "merge"): void;
  (e: "split"): void;
  (e: "close-journal"): void;
  (e: "open-journal"): void;
  (e: "delete"): void;
  (e: "replace"): void;
  (e: "settings"): void;
}>();
</script>
