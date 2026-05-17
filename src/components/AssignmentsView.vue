<template>
  <div class="flex flex-col gap-6 p-4 md:p-6">
    <div
      v-if="isViewOnly"
      class="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-3 text-yellow-800"
    >
      <IconCircleAlert class="w-5 h-5 flex-shrink-0" />
      <span class="text-sm font-medium">
        {{ journal_assignments_view_only() }}
      </span>
    </div>

    <div
      class="flex flex-col md:flex-row justify-between items-center gap-4"
    >
      <div class="relative w-full md:w-80">
        <IconSearch
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
        />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="journal_assignments_search()"
          class="w-full pl-9 pr-3 py-2.5 text-sm bg-card border border-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <button
        v-if="!isViewOnly"
        type="button"
        @click="onCreateClick"
        class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-[15px] font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95"
      >
        <IconPlus class="w-4 h-4" stroke-width="2.5" />
        <span>{{ journal_assignments_create() }}</span>
      </button>
    </div>

    <div
      v-if="filteredAssignments.length === 0"
      class="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground"
    >
      <IconClipboardList class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="text-base font-semibold text-foreground">
        {{
          assignments.length === 0
            ? journal_assignments_empty_title()
            : journal_assignments_no_results()
        }}
      </p>
      <p class="text-sm mt-2">
        {{
          assignments.length === 0
            ? journal_assignments_empty_message()
            : journal_assignments_no_results_hint()
        }}
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="assignment in filteredAssignments"
        :key="assignment.id"
        class="group bg-card rounded-[20px] shadow-sm border border-border hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 p-6 cursor-pointer flex flex-col h-[260px] relative overflow-hidden"
        @click="$emit('open', assignment)"
      >
        <div class="flex justify-between items-start mb-4">
          <span
            :class="[
              'text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide',
              statusBadgeClass(assignment.status),
            ]"
          >
            {{ statusLabel(assignment.status) }}
          </span>
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground transition-colors bg-card p-1 rounded-full hover:bg-muted"
            @click.stop
          >
            <IconMoreHorizontal class="w-5 h-5" />
          </button>
        </div>

        <div class="mb-auto">
          <div
            class="text-[11px] font-bold text-foreground uppercase tracking-wide mb-1.5 truncate opacity-80"
          >
            {{ journal_assignments_topic_label() }} {{ assignment.topic }}
          </div>
          <h3
            class="font-bold text-foreground text-[19px] mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2"
          >
            {{ assignment.title }}
          </h3>
          <div
            class="flex items-center gap-4 text-[13px] text-muted-foreground font-medium mt-3"
          >
            <div class="flex items-center gap-1.5">
              <IconFileText class="w-3.5 h-3.5" />
              {{ journal_assignments_submissions({ count: assignment.submissionsCount, total: assignment.totalStudents }) }}
            </div>
          </div>
        </div>

        <div
          class="mt-4 pt-4 border-t border-border flex justify-between items-center"
        >
          <div
            class="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-lg"
          >
            <IconCalendar class="w-3.5 h-3.5 text-foreground" />
            <span>{{ journal_assignments_deadline_label({ deadline: assignment.deadline }) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import IconSearch from "~icons/lucide/search";
import IconPlus from "~icons/lucide/plus";
import IconCalendar from "~icons/lucide/calendar";
import IconFileText from "~icons/lucide/file-text";
import IconMoreHorizontal from "~icons/lucide/more-horizontal";
import IconClipboardList from "~icons/lucide/clipboard-list";
import IconCircleAlert from "~icons/lucide/circle-alert";
import {
  journal_assignments_view_only,
  journal_assignments_search,
  journal_assignments_create,
  journal_assignments_empty_title,
  journal_assignments_empty_message,
  journal_assignments_no_results,
  journal_assignments_no_results_hint,
  journal_assignments_topic_label,
  journal_assignments_submissions,
  journal_assignments_deadline_label,
  journal_assignments_status_active,
  journal_assignments_status_closed,
  journal_assignments_status_draft,
  journal_assignments_create_toast,
} from "@/paraglide/messages";

interface Assignment {
  id: string;
  topic: string;
  title: string;
  status: "active" | "closed" | "draft";
  submissionsCount: number;
  totalStudents: number;
  deadline: string;
}

const props = defineProps<{
  assignments?: Assignment[];
  isViewOnly?: boolean;
}>();

defineEmits<{
  open: [assignment: Assignment];
  create: [];
}>();

const assignments = computed<Assignment[]>(() => props.assignments ?? []);
const searchQuery = ref("");

const filteredAssignments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return assignments.value;
  return assignments.value.filter((a) =>
    (a.title + " " + a.topic).toLowerCase().includes(q),
  );
});

const statusLabel = (status: Assignment["status"]) => {
  if (status === "active") return journal_assignments_status_active();
  if (status === "closed") return journal_assignments_status_closed();
  return journal_assignments_status_draft();
};

const statusBadgeClass = (status: Assignment["status"]) => {
  if (status === "active") return "bg-muted text-foreground";
  if (status === "closed") return "bg-muted text-muted-foreground";
  return "bg-yellow-100 text-yellow-700";
};

const onCreateClick = () => {
  f7.toast
    .create({
      text: journal_assignments_create_toast(),
      closeTimeout: 2500,
      position: "bottom",
    })
    .open();
};
</script>
