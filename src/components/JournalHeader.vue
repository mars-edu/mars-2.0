<template>
  <div
    class="bg-card/80 backdrop-blur-md border border-border rounded-2xl shadow-sm"
  >
    <div class="p-4">
      <div class="flex flex-wrap justify-between items-start gap-4">
        <div class="flex items-start gap-3 min-w-0 flex-1">
          <f7-link
            @click="$emit('back')"
            class="back-button mt-1 flex items-center justify-center w-9 h-9 rounded-full text-foreground hover:bg-muted transition-colors cursor-pointer flex-shrink-0"
          >
            <IconChevronLeft class="w-6 h-6" stroke-width="3" />
          </f7-link>
          <div class="space-y-0.5 min-w-0">
            <div class="text-[13px] text-muted-foreground font-medium">
              {{ journal_header_discipline_eyebrow() }}
            </div>
            <div
              class="text-[17px] font-semibold text-foreground tracking-tight leading-snug break-words"
            >
              {{ disciplineText }}
            </div>
            <div
              class="flex flex-wrap items-center gap-2 text-[14px] text-muted-foreground"
            >
              <template v-if="group">
                <span>{{ group }}</span>
              </template>
              <template v-if="course !== undefined && course !== null">
                <span class="text-border">•</span>
                <span>{{ course }} {{ journal_header_course_suffix() }}</span>
              </template>
              <template v-if="teacherName">
                <span class="text-border">•</span>
                <span>{{ journal_header_teacher_prefix() }} {{ teacherName }}</span>
              </template>
              <template v-if="groupLanguage">
                <span class="text-border">•</span>
                <span
                  class="text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-md"
                >
                  {{ groupLanguage }}
                </span>
              </template>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <div
            class="flex items-center gap-2 bg-card border border-border shadow-sm px-4 py-2 rounded-full"
          >
            <IconCalendar class="w-4 h-4 text-foreground" />
            <span
              class="text-[14px] font-semibold text-foreground tracking-tight"
            >
              {{ academicYear }}
            </span>
            <span
              class="text-[12px] font-medium text-muted-foreground uppercase tracking-wider ml-1"
            >
              {{ journal_header_academic_year_eyebrow() }}
            </span>
          </div>
          <div
            class="flex items-center gap-2 bg-card border border-border shadow-sm px-4 py-2 rounded-full"
          >
            <IconClock class="w-4 h-4 text-foreground" />
            <span
              class="text-[14px] font-semibold text-foreground tracking-tight"
            >
              {{ semester }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7Link } from "framework7-vue";
import IconChevronLeft from "~icons/lucide/chevron-left";
import IconCalendar from "~icons/lucide/calendar";
import IconClock from "~icons/lucide/clock";
import {
  journal_header_discipline_eyebrow,
  journal_header_academic_year_eyebrow,
  journal_header_course_suffix,
  journal_header_teacher_prefix,
} from "@/paraglide/messages";

defineProps<{
  disciplineText: string;
  group?: string;
  groupLanguage?: string;
  course?: number | string | null;
  teacherName?: string;
  academicYear: string;
  semester: string;
}>();

defineEmits<{
  back: [];
}>();
</script>
