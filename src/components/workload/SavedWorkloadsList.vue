<template>
  <div class="mt-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div class="flex items-center gap-4 flex-1">
        <h2 class="text-2xl font-bold text-foreground flex items-center gap-3 shrink-0">
          <IconLayoutGrid class="w-6 h-6 text-primary" />
          Сохраненная нагрузка
        </h2>
        <SearchInput
          :model-value="searchQuery"
          @update:model-value="$emit('update:searchQuery', $event)"
          placeholder="Поиск по ФИО или дисциплине..."
          wrapperClass="flex-1 max-w-md"
        />
      </div>
      <button
        @click="$emit('download-all')"
        class="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all shadow-sm active:scale-95 w-fit"
      >
        <IconDownload class="w-[18px] h-[18px]" />
        <span class="hidden sm:inline">Скачать все</span>
      </button>
    </div>

    <div v-if="workloads.length > 0" class="flex flex-col gap-4">
      <div
        v-for="workload in workloads"
        :key="workload.id"
        class="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md hover:-translate-y-1 hover:border-primary/50 transition-all duration-300 group flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4 flex-1">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <IconUser class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-foreground leading-tight">{{ workload.teacherName }}</h3>
            <div class="flex items-center gap-2 text-muted-foreground text-xs font-bold mt-1 uppercase tracking-wider">
              <IconCalendar class="w-3 h-3" />
              {{ getAcademicYearName(workload.academicYearId) }}
            </div>
            <div v-if="workload.journalsCreated || workload.addedToSchedule" class="flex items-center gap-1.5 mt-2 flex-wrap">
              <span v-if="workload.journalsCreatedSemesters?.length" class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500">
                Журналы: {{ workload.journalsCreatedSemesters.join(', ') }} сем
              </span>
              <span v-else-if="workload.journalsCreated" class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500">
                Журналы созданы
              </span>
              <span v-if="workload.addedToSchedule" class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                В расписании
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-6 flex-1 justify-start md:justify-center">
          <div class="text-center">
            <div class="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Всего часов</div>
            <div class="text-3xl font-black text-foreground">{{ workload.totalHours }}</div>
          </div>
          <div class="w-px h-10 bg-border"></div>
          <div class="text-center">
            <div class="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Предметов</div>
            <div class="text-3xl font-black text-foreground">{{ disciplineCount(workload.items) }}</div>
          </div>
        </div>

        <div class="flex-1 flex flex-col gap-1.5 text-sm">
          <div v-for="(item, idx) in previewItems(workload.items).slice(0, 2)" :key="idx" class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground font-bold truncate max-w-[220px]">
              {{ item.description }}
            </span>
            <span class="text-muted-foreground/60 font-black">{{ item.totalHours }} ч.</span>
          </div>
          <div v-if="disciplineCount(workload.items) > 2" class="text-xs font-bold text-primary">
            + еще {{ disciplineCount(workload.items) - 2 }} предмета
          </div>
        </div>

        <DropdownMenu align="right" width="16rem" class="shrink-0">
          <template #trigger="{ toggle }">
            <button
              @click="toggle"
              class="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
              title="Действия"
            >
              <IconMoreVertical class="w-5 h-5" />
            </button>
          </template>
          <template #default="{ close }">
            <button
              @click="$emit('view', workload); close()"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
            >
              <IconEye class="w-[18px] h-[18px] text-primary shrink-0" />
              <span>Просмотр нагрузки</span>
            </button>
            <div class="my-1 border-t border-border" />
            <button
              @click="$emit('toggle-schedule', workload); close()"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
            >
              <IconCalendar class="w-[18px] h-[18px] text-emerald-500 shrink-0" />
              <span>{{ workload.addedToSchedule ? 'Убрать из расписания' : 'Добавить в управление расписанием' }}</span>
            </button>
            <button
              @click="$emit('generate-journals', workload); close()"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
            >
              <IconBookOpen class="w-[18px] h-[18px] text-blue-500 shrink-0" />
              <span>{{ workload.journalsCreatedSemesters?.length ? 'Журналы (создать/обновить)' : 'Создать журналы у преподавателя' }}</span>
            </button>
            <button
              @click="$emit('edit', workload); close()"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
            >
              <IconEdit class="w-[18px] h-[18px] text-muted-foreground shrink-0" />
              <span>Редактировать нагрузку</span>
            </button>
            <button
              @click="$emit('download', workload); close()"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
            >
              <IconDownload class="w-[18px] h-[18px] text-muted-foreground shrink-0" />
              <span>Скачать нагрузку</span>
            </button>
            <div class="my-1 border-t border-border" />
            <button
              @click="$emit('delete', workload); close()"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors text-left"
            >
              <IconTrash class="w-[18px] h-[18px] shrink-0" />
              <span>Удалить нагрузку</span>
            </button>
          </template>
        </DropdownMenu>
      </div>
    </div>
    <div v-else class="bg-card rounded-[40px] p-20 text-center border border-dashed border-border">
      <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground/30">
        <IconBookOpen class="w-8 h-8" />
      </div>
      <h3 class="text-2xl font-bold text-foreground mb-2">Нагрузка не найдена</h3>
      <p class="text-muted-foreground font-medium">В этом учебном году еще нет сохраненных записей</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconLayoutGrid from "~icons/lucide/layout-grid";
import IconDownload from "~icons/lucide/download";
import IconUser from "~icons/lucide/user";
import IconCalendar from "~icons/lucide/calendar";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconEye from "~icons/lucide/eye";
import IconBookOpen from "~icons/lucide/book-open";
import IconEdit from "~icons/lucide/pencil";
import IconTrash from "~icons/lucide/trash-2";
import SearchInput from "@/components/ui/SearchInput.vue";
import DropdownMenu from "@/components/ui/DropdownMenu.vue";
import type { Workload, WorkloadItem } from "@/types/workload";

defineProps<{
  workloads: Workload[];
  searchQuery: string;
  getAcademicYearName: (yearId: string) => string;
}>();

defineEmits<{
  (e: "update:searchQuery", val: string): void;
  (e: "download-all"): void;
  (e: "view", workload: Workload): void;
  (e: "toggle-schedule", workload: Workload): void;
  (e: "generate-journals", workload: Workload): void;
  (e: "edit", workload: Workload): void;
  (e: "download", workload: Workload): void;
  (e: "delete", workload: Workload): void;
}>();

function disciplineCount(items: WorkloadItem[]): number {
  return items.filter((i) => !i.id.endsWith("_ind")).length;
}

function previewItems(items: WorkloadItem[]): WorkloadItem[] {
  return items.filter((i) => !i.id.endsWith("_ind"));
}
</script>
