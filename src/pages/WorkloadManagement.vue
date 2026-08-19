<template>
  <f7-page
    name="workload-management"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div class="flex flex-1 overflow-hidden">
      <div
        class="flex-1 overflow-y-auto px-4 py-6 md:p-8 bg-background pb-20 transition-all duration-200"
        :class="contentMargin"
      >
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 class="text-3xl font-bold text-foreground tracking-tight">Управление нагрузкой</h1>
            <p class="text-muted-foreground mt-1 font-medium">Планирование и учет учебных часов</p>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <!-- Teacher Selection -->
            <div class="flex items-center gap-4 bg-card p-2 rounded-2xl shadow-sm border border-border w-full sm:w-auto">
              <Select
                :model-value="selectedTeacherId"
                @update:model-value="onSelectTeacher(($event as string | null))"
                :options="teacherOptions"
                placeholder="Выберите преподавателя"
                search-placeholder="Поиск преподавателя..."
                class="w-full sm:w-[250px]"
              />
            </div>

            <div class="flex items-center gap-4 bg-card p-2 rounded-2xl shadow-sm border border-border w-full sm:w-auto">
              <Select
                v-model="selectedAcademicYearId"
                :options="academicYearOptions"
                placeholder="Учебный год"
                class="w-full sm:w-[200px]"
              />
            </div>
          </div>
        </div>

        <div v-if="selectedAcademicYearId" class="mb-12">
          <div class="flex flex-col md:flex-row justify-end items-center mb-6 gap-4">
            <div v-if="selectedTeacherId" class="flex items-center gap-3">
              <button
                @click="isAddingSubject = true"
                class="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-green-500/20 active:scale-95"
              >
                <IconPlus class="w-5 h-5" />
                Добавить предмет
              </button>
            </div>
          </div>

          <div v-if="selectedTeacherId" class="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left border-collapse">
                <thead class="text-[11px] text-muted-foreground uppercase bg-muted/30 border-b border-border">
                  <tr>
                    <th rowspan="2" class="px-4 py-3 font-bold border-r border-border min-w-[240px]">Дисциплина</th>
                    <th rowspan="2" class="px-3 py-3 font-bold border-r border-border min-w-[180px]">Специальность / Язык</th>
                    <th rowspan="2" class="px-2 py-3 font-bold text-center border-r border-border w-16">Курс</th>
                    <th rowspan="2" class="px-2 py-3 font-bold text-center border-r border-border w-16 whitespace-nowrap">Студенты</th>
                    <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold bg-orange-50/10 text-orange-600">Недели по семестрам</th>
                    <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold bg-slate-50/10 text-slate-600">Часы на дисциплину</th>
                    <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold bg-green-50/10 text-green-600">Часы в группе</th>
                    <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold">Количество групп</th>
                    <th rowspan="2" class="px-4 py-3 text-center font-bold border-r border-border w-20">Всего</th>
                    <th rowspan="2" class="px-4 py-3 text-center w-16 font-bold">Удалить</th>
                  </tr>
                  <tr class="bg-muted/10">
                    <template v-for="ref in yearSemesterRefs" :key="`weeks-h-${ref.semesterId}`">
                      <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border">{{ ref.number }}</th>
                    </template>
                    <template v-for="ref in yearSemesterRefs" :key="`hours-h-${ref.semesterId}`">
                      <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border">{{ ref.number }}</th>
                    </template>
                    <template v-for="ref in yearSemesterRefs" :key="`pergroup-h-${ref.semesterId}`">
                      <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border w-16">{{ ref.number }}</th>
                    </template>
                    <template v-for="ref in yearSemesterRefs" :key="`groups-h-${ref.semesterId}`">
                      <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border">{{ ref.number }}</th>
                    </template>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <template v-for="item in currentWorkloadItems" :key="item.id">
                  <tr
                    class="hover:bg-muted/20 transition-colors group"
                    :class="{
                      'bg-amber-500/5': item.id.endsWith('_ind'),
                      '!border-t-0': item.id.endsWith('_ind'),
                    }"
                  >
                    <td class="px-4 py-2.5 font-bold text-foreground border-r border-border">
                      <template v-if="item.id.endsWith('_ind')">
                        <!-- Individual sub-row: name only, indented + amber badge; parent's code + spec/lang chips still visible above. -->
                        <div class="flex items-center gap-2 pl-4">
                          <span class="text-[9px] font-black text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase shrink-0">инд.</span>
                          <span class="text-sm text-foreground">Индивидуальные</span>
                        </div>
                      </template>
                      <template v-else>
                        <!-- Discipline: learningOutcome as title (falls back to moduleName), moduleIndex as subtitle — matches concept. -->
                        <template v-for="entry in [rupEntryStore.getRupEntryById(item.subjectId)]" :key="item.id">
                          <div class="truncate max-w-[320px]" :title="entry?.learningOutcome || item.description">
                            {{ entry?.learningOutcome || item.description }}
                          </div>
                          <div class="text-[10px] text-muted-foreground font-medium mt-0.5">{{ item.index }}</div>
                        </template>
                      </template>
                    </td>
                    <td class="px-2 py-2.5 border-r border-border">
                      <template v-if="item.id.endsWith('_ind')">
                        <!-- Empty: chips already shown on the parent row directly above. -->
                      </template>
                      <template v-else>
                        <div class="flex flex-wrap items-center gap-1">
                          <!-- Language chip -->
                          <span
                            v-if="item.language"
                            class="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-amber-500/15 text-amber-600 border border-amber-500/30"
                          >{{ item.language }}</span>
                          <!-- Specialty chips -->
                          <span
                            v-for="sid in (item.specialtyIds || [])"
                            :key="sid"
                            class="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                          >{{ specialtyStore.getSpecialtyById(sid)?.codeName || specShortLabel(sid) }}</span>
                        </div>
                      </template>
                    </td>
                    <td class="px-1 py-2.5 border-r border-border">
                      <input
                        type="text"
                        v-model="item.course"
                        class="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-center font-bold text-muted-foreground outline-none"
                      />
                    </td>
                    <td class="px-1 py-2.5 border-r border-border">
                      <input
                        type="text"
                        v-model="item.studentCount"
                        class="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-center font-bold text-muted-foreground outline-none"
                      />
                    </td>

                    <!-- Weeks -->
                    <template v-for="ref in yearSemesterRefs" :key="`weeks-${item.id}-${ref.semesterId}`">
                      <td class="px-1 py-2.5 bg-orange-50/5 border-r border-border">
                        <div class="flex items-center justify-center gap-1">
                          <button
                            @click="adjustSemesterValue(item.id, ref.semesterId, 'weeks', -1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >-</button>
                          <input
                            type="number"
                            v-model.number="entryFor(item, ref.semesterId).weeks"
                            @input="recalculateItem(item.id)"
                            class="w-10 bg-transparent border-none focus:ring-0 text-sm p-0 text-center text-orange-600 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            @click="adjustSemesterValue(item.id, ref.semesterId, 'weeks', 1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >+</button>
                        </div>
                      </td>
                    </template>

                    <!-- Hours -->
                    <template v-for="ref in yearSemesterRefs" :key="`hours-${item.id}-${ref.semesterId}`">
                      <td class="px-1 py-2.5 bg-slate-50/5 border-r border-border">
                        <div class="flex items-center justify-center gap-1">
                          <button
                            @click="adjustSemesterValue(item.id, ref.semesterId, 'hours', -1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >-</button>
                          <input
                            type="number"
                            step="0.5"
                            :value="formatHours(entryFor(item, ref.semesterId).hours)"
                            @change="entryFor(item, ref.semesterId).hours = Number(($event.target as HTMLInputElement).value) || 0; recalculateItem(item.id)"
                            class="w-10 bg-transparent border-none focus:ring-0 text-sm p-0 text-center text-slate-600 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            @click="adjustSemesterValue(item.id, ref.semesterId, 'hours', 1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >+</button>
                        </div>
                      </td>
                    </template>

                    <!-- Hours per group -->
                    <template v-for="ref in yearSemesterRefs" :key="`pergroup-${item.id}-${ref.semesterId}`">
                      <td class="px-1 py-2.5 bg-green-50/5 text-center font-black text-green-600 border-r border-border text-sm w-16">
                        {{ formatHours(hoursPerGroup(entryFor(item, ref.semesterId))) }}
                      </td>
                    </template>

                    <!-- Group Count -->
                    <template v-for="ref in yearSemesterRefs" :key="`groups-${item.id}-${ref.semesterId}`">
                      <td class="px-1 py-2.5 border-r border-border">
                        <div class="flex items-center justify-center gap-1">
                          <button
                            @click="adjustSemesterValue(item.id, ref.semesterId, 'groupCount', -1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >-</button>
                          <input
                            type="number"
                            v-model.number="entryFor(item, ref.semesterId).groupCount"
                            @input="recalculateItem(item.id)"
                            class="w-10 bg-transparent border-none focus:ring-0 text-sm p-0 text-center font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            @click="adjustSemesterValue(item.id, ref.semesterId, 'groupCount', 1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >+</button>
                        </div>
                      </td>
                    </template>

                    <td
                      class="px-4 py-2.5 text-center font-black text-base border-r border-border"
                      :class="item.id.endsWith('_ind') ? 'bg-amber-500/10 text-amber-600' : 'bg-muted/10 text-foreground'"
                    >
                      {{ item.totalHours }}
                      <div v-if="item.id.endsWith('_ind')" class="text-[9px] font-black uppercase tracking-tight mt-0.5">Инд. часы</div>
                    </td>
                    <td class="px-4 py-2.5 text-center">
                      <button
                        @click="deleteItem(item.id)"
                        class="text-muted-foreground hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-500/10 active:scale-90"
                      >
                        <IconTrash class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="orphanEntriesFor(item).length" class="bg-red-500/5">
                    <td :colspan="6 + semesterCount * 4" class="px-4 py-1.5 text-[11px] font-bold text-red-500">
                      <span
                        v-for="entry in orphanEntriesFor(item)"
                        :key="entry.semesterId"
                        class="inline-flex items-center gap-1 mr-3"
                      >
                        <span class="uppercase tracking-wide">Семестр не найден</span>
                        (id: {{ entry.semesterId }}) — {{ formatHours(hoursPerGroup(entry)) }} ч./группу × {{ entry.groupCount }} гр.
                      </span>
                    </td>
                  </tr>
                  </template>

                  <tr v-if="currentWorkloadItems.length === 0">
                    <td :colspan="6 + semesterCount * 4" class="px-6 py-20 text-center">
                      <div class="flex flex-col items-center justify-center">
                        <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground/30">
                          <IconLayoutGrid class="w-8 h-8" />
                        </div>
                        <p class="text-xl font-bold text-muted-foreground">Нагрузка пуста</p>
                        <p class="text-sm text-muted-foreground mt-2">Добавьте предметы для формирования нагрузки преподавателя</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="currentWorkloadItems.length > 0">
                  <tr class="bg-muted/20 border-t border-border">
                    <td :colspan="4 + semesterCount * 4" class="px-6 py-5 font-bold text-right text-muted-foreground uppercase tracking-wider">
                      Итоговая нагрузка:
                    </td>
                    <td class="px-6 py-5 font-black text-center text-2xl text-foreground">
                      {{ totalCurrentWorkloadHours }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div v-if="currentWorkloadItems.length > 0" class="p-6 bg-muted/10 border-t border-border flex justify-end">
              <button
                @click="showSaveConfirm = true"
                class="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-green-500/30 active:scale-95"
              >
                <IconSave class="w-6 h-6" />
                СОХРАНИТЬ НАГРУЗКУ
              </button>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center h-[40vh] bg-card rounded-[40px] border border-border shadow-sm">
            <div class="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
              <IconUsers class="w-10 h-10" />
            </div>
            <h2 class="text-2xl font-bold text-foreground mb-2">Выберите преподавателя</h2>
            <p class="text-muted-foreground text-center max-w-md font-medium px-4">
              Выберите преподавателя из списка выше, чтобы начать распределение учебной нагрузки
            </p>
          </div>
        </div>

        <!-- Saved Workloads Section -->
        <div class="mt-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div class="flex items-center gap-4 flex-1">
              <h2 class="text-2xl font-bold text-foreground flex items-center gap-3 shrink-0">
                <IconLayoutGrid class="w-6 h-6 text-primary" />
                Сохраненная нагрузка
              </h2>
              <SearchInput
                v-model="savedWorkloadSearchQuery"
                placeholder="Поиск по ФИО или дисциплине..."
                wrapperClass="flex-1 max-w-md"
              />
            </div>
            <button
              @click="downloadAllWorkloads"
              class="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all shadow-sm active:scale-95 w-fit"
            >
              <IconDownload class="w-[18px] h-[18px]" />
              <span class="hidden sm:inline">Скачать все</span>
            </button>
          </div>

          <div v-if="filteredWorkloads.length > 0" class="flex flex-col gap-4">
            <div
              v-for="workload in filteredWorkloads"
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
                    @click="viewingWorkload = workload; close()"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <IconEye class="w-[18px] h-[18px] text-primary shrink-0" />
                    <span>Просмотр нагрузки</span>
                  </button>
                  <div class="my-1 border-t border-border" />
                  <button
                    @click="toggleAddedToSchedule(workload); close()"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <IconCalendar class="w-[18px] h-[18px] text-emerald-500 shrink-0" />
                    <span>{{ workload.addedToSchedule ? 'Убрать из расписания' : 'Добавить в управление расписанием' }}</span>
                  </button>
                  <button
                    @click="openGenerate(workload); close()"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <IconBookOpen class="w-[18px] h-[18px] text-blue-500 shrink-0" />
                    <span>{{ workload.journalsCreatedSemesters?.length ? 'Журналы (создать/обновить)' : 'Создать журналы у преподавателя' }}</span>
                  </button>
                  <button
                    @click="editWorkload(workload); close()"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <IconEdit class="w-[18px] h-[18px] text-muted-foreground shrink-0" />
                    <span>Редактировать нагрузку</span>
                  </button>
                  <button
                    @click="downloadWorkload(workload); close()"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <IconDownload class="w-[18px] h-[18px] text-muted-foreground shrink-0" />
                    <span>Скачать нагрузку</span>
                  </button>
                  <div class="my-1 border-t border-border" />
                  <button
                    @click="deleteConfirmId = workload.id ?? null; close()"
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
      </div>
    </div>

    <!-- Modals -->
    <!-- Save Confirmation -->
    <GuardedPopover
      id="workload-save-popup"
      kind="popup"
      :guard-unsaved="false"
      :opened="showSaveConfirm"
      @popup:closed="showSaveConfirm = false"
    >
      <template #default="{ requestClose }">
        <div class="flex flex-col h-full bg-background">
          <PopoverHeader title="Сохранить нагрузку?" :on-cancel="requestClose" />
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div class="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500">
              <IconSave class="w-8 h-8" />
            </div>
            <p class="text-muted-foreground font-medium leading-relaxed max-w-md">
              Вы собираетесь сохранить распределение нагрузки для преподавателя <span class="text-foreground font-bold">{{ selectedTeacherName }}</span>. Данные будут доступны в списке ниже.
            </p>
          </div>
          <PopoverFooter
            save-text="Сохранить"
            :is-loading="workloadStore.loading"
            :on-save="handleSaveWorkload"
            :on-cancel="requestClose"
          />
        </div>
      </template>
    </GuardedPopover>

    <!-- Delete Confirmation -->
    <GuardedPopover
      id="workload-delete-popup"
      kind="popup"
      :guard-unsaved="false"
      :opened="!!deleteConfirmId"
      @popup:closed="deleteConfirmId = null"
    >
      <template #default="{ requestClose }">
        <div class="flex flex-col h-full bg-background">
          <PopoverHeader title="Удалить нагрузку?" :on-cancel="requestClose" />
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
              <IconTrash class="w-8 h-8" />
            </div>
            <p class="text-muted-foreground font-medium leading-relaxed max-w-md">
              Это действие необратимо. Вся информация о нагрузке этого преподавателя будет удалена.
            </p>
          </div>
          <PopoverFooter :on-cancel="requestClose">
            <template #save>
              <button
                @click="handleDeleteWorkload"
                class="w-auto py-3.5 px-8 text-[15px] font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                Удалить навсегда
              </button>
            </template>
          </PopoverFooter>
        </div>
      </template>
    </GuardedPopover>

    <!-- View workload (read-only) -->
    <GuardedPopover
      id="workload-view-popup"
      kind="popup"
      :guard-unsaved="false"
      :opened="!!viewingWorkload"
      @popup:closed="viewingWorkload = null"
    >
      <template #default="{ requestClose }">
        <div class="flex flex-col h-full bg-background">
          <PopoverHeader title="Просмотр нагрузки" :on-cancel="requestClose" />
          <div v-if="viewingWorkload" class="flex-1 overflow-y-auto p-5">
            <div class="flex items-center gap-4 mb-5">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <IconUser class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-foreground leading-tight">{{ viewingWorkload.teacherName }}</h3>
                <div class="text-muted-foreground text-xs font-bold mt-0.5 uppercase tracking-wider">
                  {{ getAcademicYearName(viewingWorkload.academicYearId) }} • {{ viewingWorkload.totalHours }} ч. • {{ disciplineCount(viewingWorkload.items) }} предм.
                </div>
              </div>
            </div>
            <div class="space-y-2.5">
              <div
                v-for="(item, idx) in previewItems(viewingWorkload.items)"
                :key="idx"
                class="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">{{ item.index }}</span>
                    <h4 class="font-bold text-foreground truncate">{{ item.description }}</h4>
                  </div>
                  <div class="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span v-if="item.department">{{ item.department }}</span>
                    <span v-if="item.department">•</span>
                    <span>{{ item.course }} курс</span>
                    <span>•</span>
                    <span>
                      группы
                      {{
                        sortedSemesterEntries(item)
                          .map((e) => e.groupCount)
                          .join('/')
                      }}
                    </span>
                  </div>
                </div>
                <span class="text-xl font-black text-foreground shrink-0">{{ item.totalHours }} ч.</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </GuardedPopover>

    <!-- Journal-creation wizard -->
    <WorkloadJournalWizard
      :workload="generateTarget"
      @close="generateTarget = null"
      @created="onJournalsCreated"
    />

    <!-- Add Subject Modal -->
    <GuardedPopover
      id="workload-add-subject-popup"
      kind="popup"
      :guard-unsaved="false"
      :opened="isAddingSubject"
      @popup:closed="onAddModalClosed"
    >
      <template #default="{ requestClose }">
      <div class="flex flex-col h-full bg-background">
        <PopoverHeader title="Добавить дисциплину в нагрузку" :on-cancel="requestClose" />

        <!-- Source tabs -->
        <div class="flex gap-1 mx-4 mt-3 p-1 bg-muted/40 rounded-xl">
          <button
            @click="addTab = 'rup'"
            class="flex-1 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider"
            :class="addTab === 'rup' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          >
            Учебный план (РУП)
          </button>
          <button
            @click="addTab = 'spectrum'"
            class="flex-1 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider"
            :class="addTab === 'spectrum' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          >
            Спектр дисциплин
          </button>
        </div>

        <div class="p-4 pb-2">
          <SearchInput v-model="subjectSearchQuery" placeholder="Поиск по названию или коду..." />
        </div>

        <div class="overflow-y-auto flex-1 px-2 pb-2 space-y-1.5">
          <div
            v-for="rup in addTabEntries"
            :key="rup.id"
            @click="toggleSelectSubject(rup)"
            class="w-full text-left p-3 rounded-xl transition-all border flex items-start gap-3 relative"
            :class="isAlreadyAdded(rup)
              ? 'bg-muted/30 border-border opacity-50 cursor-not-allowed'
              : isSubjectSelected(rup.id)
                ? 'bg-primary/5 border-primary/40 cursor-pointer'
                : 'border-transparent hover:bg-muted/30 hover:border-border cursor-pointer'"
            :title="isAlreadyAdded(rup) ? 'Уже добавлено в нагрузку' : ''"
          >
            <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <IconBookOpen class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">{{ rup.moduleIndex }}</span>
                <h3 class="font-bold text-foreground truncate">{{ rup.moduleName }}</h3>
                <span
                  v-if="hasIndividual(rup)"
                  class="text-[10px] font-black text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded uppercase"
                >
                  + инд. {{ individualTotal(rup) }}ч
                </span>
                <span
                  v-if="isAlreadyAdded(rup)"
                  class="text-[10px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded uppercase"
                >
                  Уже добавлено
                </span>
              </div>
              <p
                v-if="rup.learningOutcome"
                class="text-xs text-muted-foreground truncate mt-0.5 mb-0"
              >{{ rup.learningOutcome }}</p>

              <!-- meta + inline specialty/language chips -->
              <div class="flex items-center gap-2 flex-wrap mt-1.5" @click.stop>
                <span class="text-[11px] font-black text-muted-foreground uppercase">Семестр: {{ rupSemesters(rup) }}</span>
                <span class="w-1 h-1 rounded-full bg-muted-foreground/40" />
                <span class="text-[11px] font-black text-muted-foreground uppercase">{{ rup.totalHours }} ч.</span>
                <span class="w-1 h-1 rounded-full bg-muted-foreground/40" />
                <button
                  v-for="sp in rupSpecialtyChips(rup)"
                  :key="sp.id"
                  @click.stop="toggleRowSpec(rup, sp.id)"
                  class="!w-auto shrink-0 px-1.5 py-0.5 text-[10px] font-black rounded border transition-all"
                  :class="rowSpecsFor(rup).includes(sp.id)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-card border-border text-muted-foreground hover:border-emerald-500/40'"
                >{{ sp.label }}</button>
                <span class="w-1 h-1 rounded-full bg-muted-foreground/40" />
                <button
                  v-for="l in LANG_CODES"
                  :key="l"
                  @click.stop="toggleRowLang(rup, l)"
                  class="!w-auto shrink-0 px-1.5 py-0.5 text-[10px] font-black rounded border uppercase transition-all"
                  :class="rowLangsFor(rup).includes(l)
                    ? 'bg-amber-500/15 text-amber-600 border-amber-500/40'
                    : 'bg-card border-border text-muted-foreground hover:border-amber-500/40'"
                >{{ l }}</button>
                <label v-if="hasIndividual(rup)" class="flex items-center gap-1.5 text-[11px] font-bold text-foreground cursor-pointer ml-1">
                  <input type="checkbox" :checked="rowIndivFor(rup)" @change="toggleRowIndiv(rup)" />
                  инд.
                </label>
              </div>
            </div>
            <div
              v-if="isSubjectSelected(rup.id)"
              class="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0"
            >
              <IconCheckSm class="w-3.5 h-3.5" />
            </div>
          </div>
          <div v-if="addTabEntries.length === 0" class="p-8 text-center text-muted-foreground">
            {{ addTab === 'rup' ? 'Предметы в РУП не найдены' : 'Дисциплины спектра не найдены' }}
          </div>
        </div>

        <PopoverFooter
          :save-text="`Добавить (${selectedAddCount})`"
          :disabled="selectedAddCount === 0"
          :on-save="confirmAddSubjects"
          :on-cancel="requestClose"
        />
      </div>
      </template>
    </GuardedPopover>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7Page, f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import SearchInput from "@/components/ui/SearchInput.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import WorkloadJournalWizard from "@/components/Workload/WorkloadJournalWizard.vue";
import DropdownMenu from "@/components/ui/DropdownMenu.vue";
import { useWorkloadStore } from "@/stores/workloadStore";
import { useTeacherStore, type Teacher } from "@/stores/teacherStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useRupEntryStore, type RupEntry } from "@/stores/rupEntryStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useSidebar } from "@/composables/useSidebar";
import type { WorkloadItem, WorkloadSemesterEntry, SavedWorkload } from "@/types/workload";
import {
  formatHours,
  recalcWorkloadItem,
  computeWorkloadTotal,
  seedWorkloadItemsFromRup,
  findSemesterEntry,
  hoursPerGroup,
  type YearSemesterRef,
} from "@/lib/workloadHours";
import { buildWorkloadXlsxMatrix, buildAllWorkloadsXlsxMatrix } from "@/lib/workloadXlsx";
import * as Excel from "exceljs/dist/exceljs.min.js";

// Icons
import IconUser from "~icons/lucide/user";
import IconCheckSm from "~icons/lucide/check";
import IconPlus from "~icons/lucide/plus";
import IconTrash from "~icons/lucide/trash-2";
import IconSave from "~icons/lucide/save";
import IconEye from "~icons/lucide/eye";
import IconDownload from "~icons/lucide/download";
import IconCalendar from "~icons/lucide/calendar";
import IconEdit from "~icons/lucide/edit-2";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconBookOpen from "~icons/lucide/book-open";
import IconUsers from "~icons/lucide/users";
import IconLayoutGrid from "~icons/lucide/layout-grid";

const { contentMargin } = useSidebar();
const workloadStore = useWorkloadStore();
const teacherStore = useTeacherStore();
const academicYearStore = useAcademicYearStore();
const rupEntryStore = useRupEntryStore();
const specialtyStore = useSpecialtyStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();

const { teachers } = storeToRefs(teacherStore);
const { academicYearOptions, getActiveAcademicYear } = storeToRefs(academicYearStore);
const { rupEntries } = storeToRefs(rupEntryStore);
const { specialties } = storeToRefs(specialtyStore);
const { allWorkloads, selectedTeacherId, selectedAcademicYearId, currentWorkloadItems, editingWorkloadId } = storeToRefs(workloadStore);

const activeNavItem = ref("workload");
const isAddingSubject = ref(false);
const subjectSearchQuery = ref("");
const addTab = ref<"rup" | "spectrum">("rup");
const selectedAdds = ref<Record<string, true>>({});
// Per-row chip state (independent of selection), keyed by rupEntry id.
const rowSpecs = ref<Record<string, string[]>>({});
const rowLangs = ref<Record<string, string[]>>({});
const rowIndiv = ref<Record<string, boolean>>({});
const LANG_CODES = ["ru", "kk", "en"];
// concept spectrum catalog → resolved against real RUP entries by title
const SPECTRUM_TITLES = ["История Казахстана", "Всемирная история", "Гармония"];
const savedWorkloadSearchQuery = ref("");
const deleteConfirmId = ref<string | null>(null);
const showSaveConfirm = ref(false);
const viewingWorkload = ref<SavedWorkload | null>(null);
const generateTarget = ref<SavedWorkload | null>(null);

function openGenerate(workload: SavedWorkload) {
  generateTarget.value = workload;
}

function onJournalsCreated(count: number) {
  generateTarget.value = null;
  f7.toast.create({ text: `Создано журналов: ${count}`, closeTimeout: 2500 }).open();
}

async function toggleAddedToSchedule(workload: SavedWorkload) {
  if (!workload.id) return;
  try {
    await workloadStore.setAddedToSchedule(workload.id, !workload.addedToSchedule);
  } catch {
    f7.dialog.alert("Ошибка при обновлении статуса");
  }
}

const activeAcademicYearId = computed(() => getActiveAcademicYear.value?.id || "");

// Semester count logic
const semesterCount = computed(() => {
  if (!selectedAcademicYearId.value) return 2;
  const semesters = academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(selectedAcademicYearId.value);
  return semesters.length || 2;
});

/**
 * The selected year's semesters as `YearSemesterRef`s (id + 1-based number +
 * configured `weeksCount`), sorted by number. Feeds seedWorkloadItemsFromRup
 * so a newly added discipline gets an explicit `semesters[]` entry for every
 * semester of the year — including the third and beyond, which used to get
 * nothing and silently lost their hours (audit defect #1).
 */
const yearSemesterRefs = computed<YearSemesterRef[]>(() => {
  if (!selectedAcademicYearId.value) return [];
  return academicYearSemesterStore
    .getAcademicYearSemestersByAcademicYear(selectedAcademicYearId.value)
    .map((s) => ({ semesterId: s.id, number: s.semesterNumber, weeks: s.weeksCount }))
    .sort((a, b) => a.number - b.number);
});

const selectedTeacherName = computed(() => {
  const teacher = teachers.value.find(t => t.id === selectedTeacherId.value);
  return teacher ? getTeacherFullName(teacher) : "";
});

function getTeacherFullName(teacher: Teacher) {
  return `${teacher.surname} ${teacher.firstName} ${teacher.patronymic}`.trim();
}

const teacherOptions = computed(() =>
  teachers.value.map((t) => ({ value: t.id, text: getTeacherFullName(t) }))
);

// Semester IDs that belong to the selected academic year — used as secondary
// signal when a distributionEntry's academicYearId is missing.
const selectedYearSemesterIds = computed<Set<string>>(() => {
  if (!selectedAcademicYearId.value) return new Set();
  return new Set(
    academicYearSemesterStore
      .getAcademicYearSemestersByAcademicYear(selectedAcademicYearId.value)
      .map((s) => s.id)
  );
});

const filteredRup = computed(() => {
  return rupEntries.value.filter(item => {
    if (!selectedAcademicYearId.value) {
      // No year filter applied — show everything.
      const search = subjectSearchQuery.value.toLowerCase();
      return item.moduleName.toLowerCase().includes(search) || item.moduleIndex.toLowerCase().includes(search);
    }

    const dists = item.distributionEntries ?? [];

    const matchesYear = dists.length === 0
      // No distribution rows: fall back to the RUP entry's own year.
      ? item.academicYearId === selectedAcademicYearId.value
      : dists.some((d) => {
          // 1st: distributionEntry.academicYearId (most explicit).
          if (d.academicYearId) return d.academicYearId === selectedAcademicYearId.value;
          // 2nd: resolve semesterId → academicYearSemester → academicYearId.
          return selectedYearSemesterIds.value.has(d.semesterId);
        });

    if (!matchesYear) return false;

    const search = subjectSearchQuery.value.toLowerCase();
    return item.moduleName.toLowerCase().includes(search) || item.moduleIndex.toLowerCase().includes(search);
  });
});

// Spectrum = curated subset of real RUP entries by title (safe: real rupEntry ids).
const addTabEntries = computed(() => {
  if (addTab.value === "rup") return filteredRup.value;
  return filteredRup.value.filter((r) => SPECTRUM_TITLES.includes(r.moduleName));
});

function hasIndividual(rup: RupEntry) {
  return individualTotal(rup) > 0;
}
// Total individual hours for a subject: sum of per-semester distribution
// individualHours, else fall back to the RUP entry's top-level fields
// (individualAdditionalHours wins over individualHours, matching
// scheduleHours.resolveIndividualBudget + RupEntryViewPopover's convention).
function individualTotal(rup: RupEntry) {
  const distSum = (rup.distributionEntries || []).reduce(
    (sum, d) => sum + (parseFloat(d.individualHours || "0") || 0),
    0
  );
  if (distSum > 0) return distSum;
  const additional = parseFloat(rup.individualAdditionalHours || "0") || 0;
  if (additional > 0) return additional;
  return parseFloat(rup.individualHours || "0") || 0;
}
function isSubjectSelected(id: string) {
  return id in selectedAdds.value;
}
// Subjects already in the current workload (by rupEntry id, ignoring _ind children).
const alreadyAddedSubjectIds = computed(() => {
  const ids = new Set<string>();
  for (const it of currentWorkloadItems.value) {
    if (it.id.endsWith("_ind")) continue;
    if (it.subjectId) ids.add(it.subjectId);
  }
  return ids;
});
function isAlreadyAdded(rup: RupEntry) {
  return alreadyAddedSubjectIds.value.has(rup.id);
}
function toggleSelectSubject(rup: RupEntry) {
  if (isAlreadyAdded(rup)) return; // guard: prevent double-add
  if (isSubjectSelected(rup.id)) delete selectedAdds.value[rup.id];
  else selectedAdds.value[rup.id] = true;
}
const selectedAddCount = computed(() => Object.keys(selectedAdds.value).length);

// --- per-row chips ---
function specShortLabel(id: string) {
  const sp: any = specialties.value.find((s: any) => s.id === id || s._id === id);
  return sp?.codeName || (sp?.name || id).split(/[\s-]+/)[0];
}
// Show only the specialties that are actually listed on this RUP entry.
function rupSpecialtyChips(rup: RupEntry) {
  const ids = new Set(rup.specialtyIds ?? []);
  return [...specialties.value]
    .filter((s: any) => ids.has(s.id))
    .map((s: any) => ({
      id: s.id,
      label: s.codeName || specShortLabel(s.id),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ru"));
}
function rowSpecsFor(rup: RupEntry): string[] {
  return rowSpecs.value[rup.id] ?? rup.specialtyIds ?? [];
}
function toggleRowSpec(rup: RupEntry, sid: string) {
  const cur = rowSpecs.value[rup.id] ? [...rowSpecs.value[rup.id]] : [...(rup.specialtyIds ?? [])];
  const i = cur.indexOf(sid);
  if (i >= 0) cur.splice(i, 1);
  else cur.push(sid);
  rowSpecs.value[rup.id] = cur;
}
function rowLangsFor(rup: RupEntry): string[] {
  return rowLangs.value[rup.id] ?? [rup.language || "ru"];
}
function toggleRowLang(rup: RupEntry, l: string) {
  const cur = rowLangs.value[rup.id] ? [...rowLangs.value[rup.id]] : [rup.language || "ru"];
  const i = cur.indexOf(l);
  if (i >= 0) { if (cur.length > 1) cur.splice(i, 1); }
  else cur.push(l);
  rowLangs.value[rup.id] = cur;
}
function rowIndivFor(rup: RupEntry) {
  // Default ON when the RUP carries individual hours — matches concept behaviour
  // (concept unconditionally spawns the paired _ind row); the user can still
  // uncheck it in the add-modal.
  return rowIndiv.value[rup.id] ?? hasIndividual(rup);
}
function toggleRowIndiv(rup: RupEntry) {
  rowIndiv.value[rup.id] = !rowIndivFor(rup);
}
function rupSemesters(rup: RupEntry) {
  const nums = (rup.distributionEntries || [])
    .filter((d) => parseFloat(d.hours || "0") > 0)
    .map((d) => academicYearSemesterStore.getAcademicYearSemesterById(d.semesterId)?.semesterNumber)
    .filter((n): n is number => typeof n === "number");
  return [...new Set(nums)].sort((a, b) => a - b).join(", ") || "—";
}

function confirmAddSubjects() {
  for (const rupId of Object.keys(selectedAdds.value)) {
    const rup = rupEntries.value.find((r) => r.id === rupId);
    if (!rup) continue;
    // Belt-and-suspenders: skip if the subject slipped through (e.g. added in
    // another tab / from stale selection).
    if (isAlreadyAdded(rup)) continue;
    addSubjectFromRup(rup, {
      specialtyIds: rowSpecsFor(rup),
      language: rowLangsFor(rup)[0],
      individual: rowIndivFor(rup),
    });
  }
  selectedAdds.value = {};
  isAddingSubject.value = false;
}

function onAddModalClosed() {
  isAddingSubject.value = false;
  selectedAdds.value = {};
  rowSpecs.value = {};
  rowLangs.value = {};
  rowIndiv.value = {};
  subjectSearchQuery.value = "";
  addTab.value = "rup";
}

const filteredWorkloads = computed(() => {
  return allWorkloads.value.filter(w => {
    if (selectedAcademicYearId.value && w.academicYearId !== selectedAcademicYearId.value) return false;
    // When a teacher is selected, narrow the saved list to that teacher.
    if (selectedTeacherId.value && w.teacherId !== selectedTeacherId.value) return false;
    const search = savedWorkloadSearchQuery.value.toLowerCase();
    const matchesTeacher = w.teacherName.toLowerCase().includes(search);
    const matchesSubject = w.items.some(item => item.description?.toLowerCase().includes(search));
    return matchesTeacher || matchesSubject;
  });
});

const totalCurrentWorkloadHours = computed(() => computeWorkloadTotal(currentWorkloadItems.value));

function onSelectTeacher(id: string | null) {
  selectedTeacherId.value = id;
  if (!editingWorkloadId.value) {
    currentWorkloadItems.value = [];
  }
}

function addSubjectFromRup(
  rup: RupEntry,
  opts: { language?: string; individual?: boolean; specialtyIds?: string[] } = {}
) {
  const chosenSpecs = opts.specialtyIds?.length ? opts.specialtyIds : rup.specialtyIds;
  const items = seedWorkloadItemsFromRup(rup, {
    department: getSpecialtyCodes(chosenSpecs),
    language: opts.language || rup.language || "ru",
    individual: opts.individual,
    specialtyIds: chosenSpecs,
    yearSemesters: yearSemesterRefs.value,
  });
  currentWorkloadItems.value.push(...items);
}

function getSpecialtyCodes(ids: string[]) {
  return ids.map(id => specialties.value.find(s => s.id === id)?.codeName || id).join(', ');
}

function recalculateItem(id: string) {
  const item = currentWorkloadItems.value.find(i => i.id === id);
  if (!item) return;
  recalcWorkloadItem(item);
}

/**
 * Returns the item's array entry for a semester, creating one on demand
 * (defensive: shouldn't happen post-backfill, but an item might predate the
 * year's semester). Mutates `item.semesters` in place — never rebuilds the
 * array — so bound `v-model`s keep their identity and focus across renders.
 */
function entryFor(item: WorkloadItem, semesterId: string): WorkloadSemesterEntry {
  const existing = findSemesterEntry(item, semesterId);
  if (existing) return existing;
  const ref = yearSemesterRefs.value.find((r) => r.semesterId === semesterId);
  const created: WorkloadSemesterEntry = {
    semesterId,
    weeks: ref?.weeks ?? 18,
    hours: 0,
    groupCount: 0,
  };
  if (!item.semesters) item.semesters = [];
  item.semesters.push(created);
  return created;
}

/** Array entries whose semesterId no longer resolves to a semester of the
 * selected year (e.g. the semester was reassigned/deleted). Fail-visible
 * per C1 policy — shown read-only, still counted in totalHours. */
function orphanEntriesFor(item: WorkloadItem): WorkloadSemesterEntry[] {
  if (!item.semesters?.length) return [];
  const known = new Set(yearSemesterRefs.value.map((r) => r.semesterId));
  return item.semesters.filter((e) => !known.has(e.semesterId));
}

/** item.semesters sorted by the owning academic year's semester number
 * (orphans — unresolvable semesterId — sort last). Used by the read-only
 * view popup, which may show a workload from a year other than the
 * currently-selected one. */
function sortedSemesterEntries(item: WorkloadItem): WorkloadSemesterEntry[] {
  return [...(item.semesters ?? [])].sort((a, b) => {
    const na = academicYearSemesterStore.getAcademicYearSemesterById(a.semesterId)?.semesterNumber ?? Infinity;
    const nb = academicYearSemesterStore.getAcademicYearSemesterById(b.semesterId)?.semesterNumber ?? Infinity;
    return na - nb;
  });
}

function adjustSemesterValue(
  id: string,
  semesterId: string,
  field: "weeks" | "hours" | "groupCount",
  delta: number
) {
  const item = currentWorkloadItems.value.find(i => i.id === id);
  if (!item) return;
  const entry = entryFor(item, semesterId);
  entry[field] = Math.max(0, (entry[field] || 0) + delta);
  recalculateItem(id);
}

function deleteItem(id: string) {
  // Cascade: deleting a discipline also removes its paired individual-hours row.
  const indId = `${id}_ind`;
  currentWorkloadItems.value = currentWorkloadItems.value.filter(
    i => i.id !== id && i.id !== indId
  );
}

// Disciplines excluding paired individual-hours (_ind) rows.
function disciplineCount(items: WorkloadItem[]) {
  return items.filter(i => !i.id.endsWith("_ind")).length;
}
function previewItems(items: WorkloadItem[]) {
  return items.filter(i => !i.id.endsWith("_ind"));
}

async function handleSaveWorkload() {
  if (!selectedTeacherId.value || currentWorkloadItems.value.length === 0) return;

  const workload: SavedWorkload = {
    teacherId: selectedTeacherId.value,
    teacherName: selectedTeacherName.value,
    academicYearId: selectedAcademicYearId.value || activeAcademicYearId.value,
    items: currentWorkloadItems.value,
    totalHours: totalCurrentWorkloadHours.value,
  };

  if (editingWorkloadId.value) {
    workload.id = editingWorkloadId.value;
  }

  try {
    await workloadStore.saveWorkload(workload);
    f7.toast.create({ text: "Нагрузка сохранена", closeTimeout: 2000 }).open();
    workloadStore.resetCurrentWorkload();
    showSaveConfirm.value = false;
  } catch (err) {
    // Surface the real cause (validation, network) — it was previously
    // swallowed, which is why save failures were hard to diagnose.
    console.error("saveWorkload failed", err);
    f7.dialog.alert("Ошибка при сохранении нагрузки");
  }
}

function editWorkload(workload: SavedWorkload) {
  selectedTeacherId.value = workload.teacherId || null;
  currentWorkloadItems.value = JSON.parse(JSON.stringify(workload.items));
  editingWorkloadId.value = workload.id || null;
  selectedAcademicYearId.value = workload.academicYearId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleDeleteWorkload() {
  if (!deleteConfirmId.value) return;
  try {
    await workloadStore.deleteWorkload(deleteConfirmId.value);
    f7.toast.create({ text: "Нагрузка удалена", closeTimeout: 2000 }).open();
    deleteConfirmId.value = null;
  } catch (err) {
    f7.dialog.alert("Ошибка при удалении нагрузки");
  }
}

function getAcademicYearName(id: string) {
  return academicYearOptions.value.find(o => o.value === id)?.text || id;
}

/** The given academic year's semesters as sorted YearSemesterRefs — same
 * shape/source as `yearSemesterRefs`, but resolvable for ANY year (exports
 * can cover a workload/year other than the currently-selected one). */
function refsForYear(academicYearId: string): YearSemesterRef[] {
  return academicYearSemesterStore
    .getAcademicYearSemestersByAcademicYear(academicYearId)
    .map((s) => ({ semesterId: s.id, number: s.semesterNumber, weeks: s.weeksCount }))
    .sort((a, b) => a.number - b.number);
}

/** Thin exceljs wrapper: matrix (headers + rows of cell values) -> a single
 * worksheet -> Blob -> anchor-click download. Mirrors the buffer-building
 * lib / DOM-adjacent glue split used by convex/excel/lib/workloadExport.ts. */
async function downloadXlsxMatrix(matrix: (string | number)[][], sheetName: string, filename: string) {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRows(matrix);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename);
}

async function downloadWorkload(workload: SavedWorkload) {
  const matrix = buildWorkloadXlsxMatrix(workload, refsForYear(workload.academicYearId));
  await downloadXlsxMatrix(
    matrix,
    "Нагрузка",
    `Нагрузка_${workload.teacherName}_${getAcademicYearName(workload.academicYearId)}.xlsx`
  );
}

async function downloadAllWorkloads() {
  // Button reads "Скачать всё" — export the entire saved list, not the
  // currently-filtered subset (search / teacher / year filters are for
  // display only; a "download only what I see" flow would be per-row).
  if (allWorkloads.value.length === 0) return;

  const matrix = buildAllWorkloadsXlsxMatrix(allWorkloads.value, getAcademicYearName, refsForYear);
  await downloadXlsxMatrix(
    matrix,
    "Сводная нагрузка",
    `Сводная_нагрузка_${getAcademicYearName(selectedAcademicYearId.value || 'все')}.xlsx`
  );
}

// Default the year to the active one once academic years have loaded.
watch(
  activeAcademicYearId,
  (id) => {
    if (id && !selectedAcademicYearId.value) {
      selectedAcademicYearId.value = id;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Custom styles for the table and inputs */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}

.bg-background {
  background-color: hsl(var(--background));
}

.text-foreground {
  color: hsl(var(--foreground));
}

.border-border {
  border-color: hsl(var(--border));
}

.bg-card {
  background-color: hsl(var(--card));
}

.bg-muted {
  background-color: hsl(var(--muted));
}
</style>
