<template>
  <div class="class9-table">
    <div v-if="class9Data" class="space-y-0.5">
      <div v-for="(step, index) in class9Data.steps" :key="index" 
           class="overflow-hidden bg-card">
        <div class="flex items-stretch w-full">
          <div class="w-8 bg-muted flex items-center justify-center text-sm font-medium border-r border-border">
            {{ index + 1 }}
          </div>
          
          <div class="flex-1">
            <div class="bg-muted/50 px-3 py-1.5 border-b border-border">
              <div class="text-sm font-medium text-muted-foreground">
                {{ getModulePrefix(step.moduleIndex) }}
              </div>
            </div>

            <div class="flex items-center gap-4 p-2">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <div class="text-sm font-medium">{{ step.moduleIndex }}</div>
                  <div class="text-sm">{{ step.moduleName }}</div>
                </div>
                <div v-if="step.learningOutcome" class="text-xs text-muted-foreground mt-1">
                  {{ step.learningOutcome }}
                </div>
              </div>

              <div v-if="step.examEnabled || step.creditEnabled || step.controlLessonEnabled" 
                   class="flex items-center gap-3 px-3 py-1.5 bg-orange-500 text-white rounded-lg">
                <div v-if="step.examEnabled" class="flex items-center gap-1.5">
                  <span class="text-xs font-medium">Экзамен</span>
                  <div class="flex gap-0.5">
                    <span v-for="(enabled, i) in step.examSemesters" 
                          :key="'exam' + i"
                          class="w-5 h-5 flex items-center justify-center text-xs rounded"
                          :class="enabled ? 'bg-white text-orange-500' : 'bg-orange-400/50'">
                      {{ i + 1 }}
                    </span>
                  </div>
                </div>
                <div v-if="step.creditEnabled" class="flex items-center gap-1.5">
                  <span class="text-xs font-medium">Зачет</span>
                  <div class="flex gap-0.5">
                    <span v-for="(enabled, i) in step.creditSemesters" 
                          :key="'credit' + i"
                          class="w-5 h-5 flex items-center justify-center text-xs rounded"
                          :class="enabled ? 'bg-white text-orange-500' : 'bg-orange-400/50'">
                      {{ i + 1 }}
                    </span>
                  </div>
                </div>
                <div v-if="step.controlLessonEnabled" class="flex items-center gap-1.5">
                  <span class="text-xs font-medium">Контр.</span>
                  <div class="flex gap-0.5">
                    <span v-for="(enabled, i) in step.controlLessonSemesters" 
                          :key="'control' + i"
                          class="w-5 h-5 flex items-center justify-center text-xs rounded"
                          :class="enabled ? 'bg-white text-orange-500' : 'bg-orange-400/50'">
                      {{ i + 1 }}
                    </span>
                  </div>
                </div>

                <div v-if="step.totalHours" class="flex items-center gap-1 ml-2 pl-2 border-l border-orange-400">
                  <span class="text-xs">{{ step.totalHours }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-muted-foreground py-4">
      Нет данных для отображения
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useClass9Store } from '@/stores/class9Store';

const props = defineProps<{
  specialtyId: string;
  courseId: string;
}>();

const class9Store = useClass9Store();

const class9Data = computed(() => {
  return class9Store.getClass9ByCourseId(props.courseId, props.specialtyId);
});

function getModulePrefix(moduleIndex: string): string {
  const parts = moduleIndex.split('.');
  return parts[0] || '';
}
</script>

<style scoped>
.class9-table {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}
</style> 