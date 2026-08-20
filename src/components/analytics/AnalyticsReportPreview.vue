<template>
  <div
    v-if="hasGeneratedReport && sheetType === 'успеваемость'"
    class="mt-6 space-y-3 border-t border-border pt-4"
  >
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-lg font-semibold">{{ analytics_report_preview() }}</h2>
        <p class="text-xs text-muted-foreground">
          {{ analytics_report_meta({ students: reportSummary.studentCount, disciplines: reportSummary.disciplineCount }) }}
          <span v-if="reportGeneratedAtLabel">
            {{ analytics_report_updated({ time: reportGeneratedAtLabel }) }}
          </span>
        </p>
      </div>
      <f7-button
        small
        outline
        @click="$emit('hide')"
        class="text-muted-foreground hover:text-foreground"
      >
        <IconEyeOff class="w-4 h-4 mr-2" />
        {{ common_hide() }}
      </f7-button>
    </div>
    <Accordion>
      <AccordionItem
        v-for="courseGroup in reportGroupsByCourse"
        :key="`course-group-${courseGroup.course}`"
        :id="`course-${courseGroup.course}`"
      >
        <template #title>
          {{
            courseGroup.course === "—"
              ? analytics_no_course()
              : analytics_course_label({ course: courseGroup.course })
          }}
        </template>
        <div
          v-for="specialtyGroup in courseGroup.specialtyGroups"
          :key="`specialty-group-${courseGroup.course}-${specialtyGroup.specialtyCode}`"
          class="space-y-2 mb-4"
        >
          <div class="text-sm font-medium text-muted-foreground pl-4">
            {{ analytics_specialty_label() }} {{ specialtyGroup.specialtyName }}
          </div>
          <AnalyticsReportTable
            :rows="specialtyGroup.rows"
            :disciplines-semester="specialtyGroup.disciplinesSemester"
            :disciplines-without-final="specialtyGroup.disciplinesWithoutFinal"
            :disciplines-by-form="specialtyGroup.disciplinesByForm"
            :final-forms="reportFinalForms"
            :is-loading="false"
          />
        </div>
      </AccordionItem>
    </Accordion>
    <p class="text-xs text-muted-foreground">
      {{ analytics_data_note() }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { f7Button } from "framework7-vue";
import IconEyeOff from "~icons/lucide/eye-off";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import AnalyticsReportTable from "@/components/AnalyticsReportTable.vue";
import {
  analytics_report_preview,
  analytics_report_meta,
  analytics_report_updated,
  analytics_no_course,
  analytics_course_label,
  analytics_specialty_label,
  analytics_data_note,
  common_hide,
} from "@/paraglide/messages";

defineProps<{
  hasGeneratedReport: boolean;
  sheetType: "успеваемость" | "посещаемость";
  reportSummary: { studentCount: number; disciplineCount: number };
  reportGeneratedAtLabel: string;
  reportGroupsByCourse: Array<{
    course: string;
    specialtyGroups: Array<{
      specialtyCode: string;
      specialtyName: string;
      rows: any[];
      disciplinesSemester: any[];
      disciplinesWithoutFinal: any[];
      disciplinesByForm: Record<string, any[]>;
    }>;
  }>;
  reportFinalForms: Array<{ id: string; title: string }>;
}>();

defineEmits<{
  (e: "hide"): void;
}>();
</script>
