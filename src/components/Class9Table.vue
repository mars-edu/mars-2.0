<template>
  <div class="class9-table">
    <div v-if="class9List.length" class="space-y-0.5">
      <div v-for="(item, idx) in class9List" :key="item.id" class="overflow-hidden bg-card border-b border-gray-200" @click="openEditPopup(item)">
        <div class="flex items-stretch w-full">
          <div class="w-8 bg-muted flex items-center justify-center text-sm font-medium border-r border-border">
            {{ idx + 1 }}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-4 p-2">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <div class="text-sm font-medium">{{ item.moduleIndex }}</div>
                  <div class="text-sm">{{ item.moduleName }}</div>
                </div>
                <div v-if="item.learningOutcome" class="text-xs text-muted-foreground mt-1">
                  {{ item.learningOutcome }}
                </div>
              </div>
              <div v-if="item.examEnabled || item.creditEnabled || item.controlLessonEnabled" class="flex items-center gap-3 px-3 py-1.5 bg-orange-500 text-white rounded-lg">
                <div v-if="item.examEnabled" class="flex items-center gap-1.5">
                  <span class="text-xs font-medium">Экзамен</span>
                  <div class="flex gap-0.5">
                    <span v-for="(enabled, i) in item.examSemesters" :key="'exam' + i" class="w-5 h-5 flex items-center justify-center text-xs rounded" :class="enabled ? 'bg-white text-orange-500' : 'bg-orange-400/50'">
                      {{ i + 1 }}
                    </span>
                  </div>
                </div>
                <div v-if="item.creditEnabled" class="flex items-center gap-1.5">
                  <span class="text-xs font-medium">Зачет</span>
                  <div class="flex gap-0.5">
                    <span v-for="(enabled, i) in item.creditSemesters" :key="'credit' + i" class="w-5 h-5 flex items-center justify-center text-xs rounded" :class="enabled ? 'bg-white text-orange-500' : 'bg-orange-400/50'">
                      {{ i + 1 }}
                    </span>
                  </div>
                </div>
                <div v-if="item.controlLessonEnabled" class="flex items-center gap-1.5">
                  <span class="text-xs font-medium">Контр.</span>
                  <div class="flex gap-0.5">
                    <span v-for="(enabled, i) in item.controlLessonSemesters" :key="'control' + i" class="w-5 h-5 flex items-center justify-center text-xs rounded" :class="enabled ? 'bg-white text-orange-500' : 'bg-orange-400/50'">
                      {{ i + 1 }}
                    </span>
                  </div>
                </div>
                <div v-if="item.totalHours" class="flex items-center gap-1 ml-2 pl-2 border-l border-orange-400">
                  <span class="text-xs">{{ item.totalHours }}</span>
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
    <Class9Popup
      v-if="popupOpen"
      :specialty-id="specialtyId"
      :course-id="courseId"
      :initial-data="initialData"
      :edit-mode="editMode"
      @close="closePopup"
      @submit="handlePopupSubmit"
    />
    <button style="display:none" ref="addBtn" @click="openAddPopup"></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { useClass9Store, type Class9Data } from "@/stores/class9Store";
import { f7 } from "framework7-vue";
import Class9Popup from "@/components/Class9Popup.vue";

const props = defineProps<{
  specialtyId: string;
  courseId: string;
}>();

const class9Store = useClass9Store();

const class9List = computed(() => {
  return class9Store.getAllClass9Items.filter(
    (item) => item.courseId === props.courseId && item.specialtyId === props.specialtyId
  );
});

const popupOpen = ref(false);
const editMode = ref(false);
const initialData = ref<Class9Data | null>(null);

function openEditPopup(item: Class9Data) {
  editMode.value = true;
  initialData.value = { ...item };
  popupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#class9-popover");
  });
}

function openAddPopup() {
  editMode.value = false;
  initialData.value = null;
  popupOpen.value = true;
  nextTick(() => {
  f7.popover.open("#class9-popover");
  });
}

function closePopup() {
  popupOpen.value = false;
  editMode.value = false;
  initialData.value = null;
  f7.popover.close("#class9-popover");
}

function handlePopupSubmit() {
  closePopup();
}
</script>

<style scoped>
.class9-table {
  border: 1px solid rgb(209 213 219);
  border-radius: 8px;
  overflow: hidden;
}

.class9-table > div > div:hover {
  background-color: rgb(218, 220, 223) !important;
  cursor: pointer;
}
</style>
