<template>
  <f7-page name="testing" class="flex flex-col h-screen bg-background text-foreground">
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />
    <Sidebar v-model:activeNavItem="activeNavItem" />

    <!-- Outer padding area -->
    <div
      class="flex flex-1 overflow-hidden p-2 md:p-4 transition-all duration-200"
      :class="contentMargin"
    >
      <!-- Big outer card -->
      <div class="flex-1 flex flex-col min-h-0 rounded-2xl border border-border/10 overflow-hidden bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        
        <!-- Title row -->
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-6 pb-2 shrink-0 gap-4">
          <h1 class="text-xl font-bold text-foreground whitespace-nowrap">{{ nav_testing() }}</h1>
          
          <div class="flex bg-muted p-1 rounded-lg">
            <button 
              @click="activeTab = 'library'" 
              class="px-4 py-1.5 rounded-md text-sm font-medium transition-all" 
              :class="activeTab === 'library' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
            >
              Библиотека
            </button>
            <button 
              @click="activeTab = 'history'" 
              class="px-4 py-1.5 rounded-md text-sm font-medium transition-all" 
              :class="activeTab === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
            >
              История
            </button>
          </div>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-6 pb-16 md:pb-6">
          <div class="w-full space-y-6 pb-8">
            
            <!-- Controls Card -->
            <div class="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-lg shadow-sm border border-border bg-card">
              <div class="flex flex-1 flex-col md:flex-row items-center gap-4 w-full">
                <!-- Search could go here -->
              </div>

              <div class="flex items-center gap-3 w-full md:w-auto justify-end">
                <AddTestButton v-if="activeTab === 'library'" @save="onSaveTest" />
              </div>
            </div>

            <!-- Table Card: Library -->
            <div v-if="activeTab === 'library'" class="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-muted/50 border-b border-border">
                    <tr>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тест</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Предмет</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-32">Вопросов</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-32">Время (мин)</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-48">Действия</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <tr v-if="!tests || tests.length === 0">
                      <td colspan="5" class="px-8 py-24 text-center text-muted-foreground/40 text-sm italic">
                        Нет созданных тестов
                      </td>
                    </tr>
                    <tr
                      v-for="test in tests"
                      :key="test._id"
                      class="group hover:bg-muted/40 transition-colors cursor-pointer"
                      @click="viewTest(test)"
                    >
                      <td class="px-6 py-4">
                        <span class="text-sm font-bold text-foreground">{{ test.title }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-muted-foreground">{{ test.subject }}</span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="text-sm font-medium text-muted-foreground">{{ test.questionsCount }}</span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="text-sm font-medium text-muted-foreground">{{ test.duration }}</span>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            @click.stop="assignTest(test)"
                            class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Назначить"
                          ><IconCalendarPlus class="w-4 h-4" /></button>
                          <button
                            @click.stop="editTest(test)"
                            class="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Редактировать"
                          ><IconEdit class="w-4 h-4" /></button>
                          <button
                            @click.stop="deleteTest(test._id)"
                            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Удалить"
                          ><IconTrash class="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Table Card: History -->
            <div v-else class="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-muted/50 border-b border-border">
                    <tr>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тест</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Предмет</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Группа</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Студентов</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Дата</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Средний балл</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <tr v-if="!history || history.length === 0">
                      <td colspan="6" class="px-8 py-24 text-center text-muted-foreground/40 text-sm italic">
                        История тестов пуста
                      </td>
                    </tr>
                    <tr
                      v-for="h in history"
                      :key="h.id"
                      class="hover:bg-muted/40 transition-colors"
                    >
                      <td class="px-6 py-4">
                        <span class="text-sm font-bold text-foreground">{{ h.testTitle }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-muted-foreground">{{ h.subject }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-muted-foreground">{{ h.group }}</span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="text-sm font-medium text-muted-foreground">{{ h.studentsCount }}</span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="text-sm text-muted-foreground">{{ formatDate(h.date) }}</span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="text-sm font-bold" :class="h.averageResult >= 50 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                          {{ h.averageResult }}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Modals -->
    <EditTestModal 
      v-model:opened="isEditModalOpen"
      :initial-data="selectedTest"
      @save="onSaveTest"
    />

    <TestViewModal
      v-model:opened="isViewModalOpen"
      :test="selectedTest"
      @edit="editTest"
      @delete="deleteTest"
    />

    <AssignTestModal
      v-model:opened="isAssignModalOpen"
      :test="selectedTest"
      @assign="onAssignTest"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useConvexQuery as useQuery, useConvexMutation as useMutation } from 'convex-vue';
import { api } from '@convex/_generated/api';
import { f7 } from 'framework7-vue';
import dayjs from 'dayjs';

import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { useSidebar } from "@/composables/useSidebar";
import { nav_testing } from '@/paraglide/messages';

import IconPlus from "~icons/lucide/plus";
import IconEdit from "~icons/lucide/edit";
import IconTrash from "~icons/lucide/trash-2";
import IconCalendarPlus from "~icons/lucide/calendar-plus";

import AddTestButton from '@/components/AddTestButton.vue';
import EditTestModal from '@/components/tests/EditTestModal.vue';
import TestViewModal from '@/components/tests/TestViewModal.vue';
import AssignTestModal from '@/components/tests/AssignTestModal.vue';

const { contentMargin } = useSidebar();
const activeNavItem = ref("testing");
const activeTab = ref<'library' | 'history'>('library');

const { data: tests } = useQuery(api.tests.queries.getTests, {});
const { data: history } = useQuery(api.tests.queries.getTestHistory, {});

const { mutate: createTest } = useMutation(api.tests.mutations.createTest);
const { mutate: updateTest } = useMutation(api.tests.mutations.updateTest);
const { mutate: deleteTestMutation } = useMutation(api.tests.mutations.deleteTest);
const { mutate: assignTestMutation } = useMutation(api.tests.mutations.assignTest);

const isEditModalOpen = ref(false);
const isViewModalOpen = ref(false);
const isAssignModalOpen = ref(false);
const selectedTest = ref<any>(null);

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('DD.MM.YYYY');
}

function viewTest(test: any) {
  selectedTest.value = test;
  isViewModalOpen.value = true;
}

function editTest(test: any) {
  selectedTest.value = test;
  isViewModalOpen.value = false;
  isEditModalOpen.value = true;
}

function assignTest(test: any) {
  selectedTest.value = test;
  isAssignModalOpen.value = true;
}

function deleteTest(id: string) {
  f7.dialog.confirm('Вы действительно хотите удалить этот тест?', async () => {
    try {
      await deleteTestMutation({ id: id as any });
      isViewModalOpen.value = false;
      f7.toast.create({ text: 'Тест удален', position: 'bottom', closeTimeout: 2000 }).open();
    } catch (e: any) {
      f7.dialog.alert('Ошибка при удалении теста: ' + e.message);
    }
  });
}

async function onSaveTest(payload: any) {
  try {
    f7.preloader.show();
    if (payload._id) {
      const id = payload._id;
      delete payload._id;
      delete payload._creationTime;
      await updateTest({ id, ...payload });
      f7.toast.create({ text: 'Тест обновлен', position: 'bottom', closeTimeout: 2000 }).open();
    } else {
      await createTest(payload);
      f7.toast.create({ text: 'Тест создан', position: 'bottom', closeTimeout: 2000 }).open();
    }
  } catch (e: any) {
    f7.dialog.alert('Ошибка: ' + e.message);
  } finally {
    f7.preloader.hide();
  }
}

async function onAssignTest(data: { testId: string; journalId: string; date: string }) {
  try {
    f7.preloader.show();
    await assignTestMutation({ testId: data.testId as any, journalId: data.journalId as any, date: data.date });
    f7.toast.create({ text: 'Тест назначен', position: 'bottom', closeTimeout: 2000 }).open();
    activeTab.value = 'history'; // Switch to history tab to see the assignment
  } catch (e: any) {
    f7.dialog.alert('Ошибка при назначении: ' + e.message);
  } finally {
    f7.preloader.hide();
  }
}
</script>
