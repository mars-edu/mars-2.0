<template>
  <f7-popup
    id="schedule-item-popup"
    :opened="!!lesson"
    @popup:closed="$emit('close')"
    class="rounded-3xl"
  >
    <f7-page>
      <f7-navbar :title="lesson?.subject || 'Занятие'">
        <f7-nav-right>
          <f7-link @click="$emit('close')">Закрыть</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <div class="p-6" v-if="lesson">
        <div class="flex justify-between items-start mb-6">
          <div :class="['p-3 rounded-2xl bg-primary/10 text-primary']">
            <IconPaperclip class="w-6 h-6" />
          </div>
        </div>

        <div class="mb-8">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
            {{ lessonTypeLabel }}
          </span>
          <h3 class="text-2xl font-bold text-foreground mb-3 leading-tight">
            {{ lesson.subject }}
          </h3>
          
          <div class="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div class="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
              <IconClock class="w-4 h-4" />
              {{ lesson.startTime }} - {{ lesson.endTime }}
            </div>
            <div class="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
              <IconUsers class="w-4 h-4" />
              {{ lesson.group }}
            </div>
          </div>
          
          <div class="mt-4 text-sm text-muted-foreground flex items-center gap-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Аудитория {{ lesson.room }}
          </div>
        </div>

        <div class="space-y-3">
          <f7-button
            large
            fill
            class="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
            @click="openJournal"
          >
            <IconFileText class="w-5 h-5" />
            Открыть журнал
          </f7-button>
          <f7-button
            large
            outline
            class="rounded-xl font-bold"
            @click="$emit('close')"
          >
            Закрыть
          </f7-button>
        </div>
      </div>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { f7Popup, f7Page, f7Navbar, f7NavRight, f7Link, f7Button, f7 } from 'framework7-vue';
import type { Lesson } from '@/stores/scheduleStore';
import IconPaperclip from "~icons/lucide/paperclip";
import IconClock from "~icons/lucide/clock";
import IconUsers from "~icons/lucide/users";
import IconFileText from "~icons/lucide/file-text";

const props = defineProps<{
  lesson: Lesson | null;
}>();

const emit = defineEmits(['close', 'openJournal']);

const lessonTypeLabel = computed(() => {
  if (!props.lesson) return '';
  switch (props.lesson.type) {
    case 'lecture': return 'Лекция';
    case 'seminar': return 'Семинар';
    case 'lab': return 'Лабораторная';
    default: return 'Занятие';
  }
});

const openJournal = () => {
  emit('openJournal', props.lesson);
  emit('close');
  // Navigation should be handled by the parent or store
};
</script>
