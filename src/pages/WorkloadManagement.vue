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
            <div class="relative w-full sm:w-auto">
              <button
                @click="isTeacherDropdownOpen = !isTeacherDropdownOpen"
                class="flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer shadow-sm min-w-[250px] justify-between group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <IconUser class="w-[18px] h-[18px]" />
                  </div>
                  <span class="text-sm font-bold text-foreground">{{ selectedTeacherName || 'Выберите преподавателя' }}</span>
                </div>
                <IconChevronDown
                  class="w-[18px] h-[18px] text-muted-foreground transition-transform duration-300"
                  :class="{ 'rotate-180': isTeacherDropdownOpen }"
                />
              </button>

              <div
                v-if="isTeacherDropdownOpen"
                class="absolute right-0 top-full mt-2 w-full sm:w-[300px] bg-card rounded-2xl shadow-2xl border border-border z-50 overflow-hidden"
              >
                <div class="p-3 border-b border-border">
                  <div class="relative">
                    <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Поиск преподавателя..."
                      v-model="teacherSearchQuery"
                      class="w-full pl-10 pr-4 py-2.5 bg-muted/50 border-transparent rounded-xl text-sm focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all outline-none font-medium text-foreground"
                    />
                  </div>
                </div>
                <div class="max-h-72 overflow-y-auto p-2">
                  <button
                    v-for="teacher in filteredTeachers"
                    :key="teacher.id"
                    @click="selectTeacher(teacher)"
                    class="w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-between mb-1"
                    :class="selectedTeacherId === teacher.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                  >
                    <span>{{ getTeacherFullName(teacher) }}</span>
                    <IconCheck v-if="selectedTeacherId === teacher.id" class="w-[18px] h-[18px] text-primary" />
                  </button>
                </div>
              </div>
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

        <div v-if="selectedAcademicYearId === activeAcademicYearId" class="mb-12">
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
                    <th rowspan="2" class="px-4 py-3 font-bold border-r border-border min-w-[280px]">Предмет</th>
                    <th rowspan="2" class="px-3 py-3 font-bold border-r border-border min-w-[140px]">Специальность</th>
                    <th rowspan="2" class="px-2 py-3 font-bold text-center border-r border-border w-16">Курс</th>
                    <th rowspan="2" class="px-2 py-3 font-bold text-center border-r border-border w-16 whitespace-nowrap">Студ.</th>
                    <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold bg-orange-50/10 text-orange-600">Недели в семестрах</th>
                    <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold bg-slate-50/10 text-slate-600">Часы в неделю</th>
                    <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold bg-green-50/10 text-green-600">Часы на предмет</th>
                    <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold">Количество групп по семестрам</th>
                    <th rowspan="2" class="px-4 py-3 text-center font-bold border-r border-border w-20">Всего</th>
                    <th rowspan="2" class="px-4 py-3 text-center w-16 font-bold">Удалить</th>
                  </tr>
                  <tr class="bg-muted/10">
                    <template v-for="i in semesterCount" :key="`weeks-h-${i}`">
                      <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border">{{ i }}</th>
                    </template>
                    <template v-for="i in semesterCount" :key="`hours-h-${i}`">
                      <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border">{{ i }}</th>
                    </template>
                    <template v-for="i in semesterCount" :key="`pergroup-h-${i}`">
                      <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border w-16">{{ i }}</th>
                    </template>
                    <template v-for="i in semesterCount" :key="`groups-h-${i}`">
                      <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border">{{ i }}</th>
                    </template>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr v-for="item in currentWorkloadItems" :key="item.id" class="hover:bg-muted/20 transition-colors group">
                    <td class="px-4 py-2.5 font-bold text-foreground border-r border-border">
                      <div class="truncate max-w-[320px]" :title="item.description">{{ item.description }}</div>
                      <div class="text-[10px] text-muted-foreground font-medium mt-0.5">{{ item.index }}</div>
                    </td>
                    <td class="px-2 py-2.5 border-r border-border">
                      <select
                        v-model="item.department"
                        class="w-full bg-transparent border-none focus:ring-0 text-xs p-0 font-bold text-muted-foreground cursor-pointer outline-none"
                      >
                        <option v-for="spec in specialties" :key="spec.id" :value="spec.codeName">{{ spec.codeName }}</option>
                      </select>
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
                    <template v-for="i in semesterCount" :key="`weeks-${item.id}-${i}`">
                      <td class="px-1 py-2.5 bg-orange-50/5 border-r border-border">
                        <div class="flex items-center justify-center gap-1">
                          <button
                            @click="adjustValue(item.id, `weeks${i}`, -1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >-</button>
                          <input
                            type="number"
                            v-model="item[`weeks${i}`]"
                            @input="recalculateItem(item.id)"
                            class="w-10 bg-transparent border-none focus:ring-0 text-sm p-0 text-center text-orange-600 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            @click="adjustValue(item.id, `weeks${i}`, 1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >+</button>
                        </div>
                      </td>
                    </template>

                    <!-- Hours -->
                    <template v-for="i in semesterCount" :key="`hours-${item.id}-${i}`">
                      <td class="px-1 py-2.5 bg-slate-50/5 border-r border-border">
                        <div class="flex items-center justify-center gap-1">
                          <button
                            @click="adjustValue(item.id, `hours${i}`, -1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >-</button>
                          <input
                            type="number"
                            step="0.5"
                            v-model="item[`hours${i}`]"
                            @input="recalculateItem(item.id)"
                            class="w-10 bg-transparent border-none focus:ring-0 text-sm p-0 text-center text-slate-600 font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            @click="adjustValue(item.id, `hours${i}`, 1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >+</button>
                        </div>
                      </td>
                    </template>

                    <!-- Hours per group -->
                    <template v-for="i in semesterCount" :key="`pergroup-${item.id}-${i}`">
                      <td class="px-1 py-2.5 bg-green-50/5 text-center font-black text-green-600 border-r border-border text-sm w-16">
                        {{ formatHours(item[`hoursPerGroup${i}`]) }}
                      </td>
                    </template>

                    <!-- Group Count -->
                    <template v-for="i in semesterCount" :key="`groups-${item.id}-${i}`">
                      <td class="px-1 py-2.5 border-r border-border">
                        <div class="flex items-center justify-center gap-1">
                          <button
                            @click="adjustValue(item.id, `groupCount${i}`, -1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >-</button>
                          <input
                            type="number"
                            v-model="item[`groupCount${i}`]"
                            @input="recalculateItem(item.id)"
                            class="w-10 bg-transparent border-none focus:ring-0 text-sm p-0 text-center font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            @click="adjustValue(item.id, `groupCount${i}`, 1)"
                            class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                          >+</button>
                        </div>
                      </td>
                    </template>

                    <td class="px-4 py-2.5 text-center font-black text-base text-foreground bg-muted/10 border-r border-border">
                      {{ item.totalHours }}
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
              <div class="relative flex-1 max-w-md">
                <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" />
                <input
                  type="text"
                  placeholder="Поиск по ФИО или дисциплине..."
                  v-model="savedWorkloadSearchQuery"
                  class="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-foreground"
                />
              </div>
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
                  <div class="text-3xl font-black text-foreground">{{ workload.items.length }}</div>
                </div>
              </div>

              <div class="flex-1 flex flex-col gap-1.5 text-sm">
                <div v-for="(item, idx) in workload.items.slice(0, 2)" :key="idx" class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground font-bold truncate max-w-[220px]">
                    {{ item.description }}
                  </span>
                  <span class="text-muted-foreground/60 font-black">{{ item.totalHours }} ч.</span>
                </div>
                <div v-if="workload.items.length > 2" class="text-xs font-bold text-primary">
                  + еще {{ workload.items.length - 2 }} предмета
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="editWorkload(workload)"
                  class="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-colors"
                  title="Редактировать"
                >
                  <IconEdit class="w-5 h-5" />
                </button>
                <button
                  @click="downloadWorkload(workload)"
                  class="p-2 hover:bg-green-500/10 text-muted-foreground hover:text-green-500 rounded-xl transition-colors"
                  title="Скачать CSV"
                >
                  <IconDownload class="w-5 h-5" />
                </button>
                <button
                  @click="deleteConfirmId = workload.id"
                  class="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-colors"
                  title="Удалить"
                >
                  <IconTrash class="w-5 h-5" />
                </button>
              </div>
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
    <f7-popup :opened="showSaveConfirm" @popup:closed="showSaveConfirm = false">
      <div class="flex flex-col items-center justify-center h-full p-8 bg-background text-center">
        <div class="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500">
          <IconSave class="w-8 h-8" />
        </div>
        <h3 class="text-2xl font-black text-foreground mb-4">Сохранить нагрузку?</h3>
        <p class="text-muted-foreground font-medium mb-10 leading-relaxed max-w-md">
          Вы собираетесь сохранить распределение нагрузки для преподавателя <span class="text-foreground font-bold">{{ selectedTeacherName }}</span>. Данные будут доступны в списке ниже.
        </p>
        <div class="flex flex-col gap-3 w-full max-w-sm">
          <button
            @click="handleSaveWorkload"
            class="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-500/30 transition-all active:scale-95"
          >
            ДА, СОХРАНИТЬ
          </button>
          <button
            @click="showSaveConfirm = false"
            class="w-full py-4 bg-muted hover:bg-muted/80 text-muted-foreground rounded-2xl font-bold transition-all active:scale-95"
          >
            ОТМЕНА
          </button>
        </div>
      </div>
    </f7-popup>

    <!-- Delete Confirmation -->
    <f7-popup :opened="!!deleteConfirmId" @popup:closed="deleteConfirmId = null">
      <div class="flex flex-col items-center justify-center h-full p-8 bg-background text-center">
        <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
          <IconTrash class="w-8 h-8" />
        </div>
        <h3 class="text-2xl font-black text-foreground mb-4">Удалить нагрузку?</h3>
        <p class="text-muted-foreground font-medium mb-10 leading-relaxed max-w-md">
          Это действие необратимо. Вся информация о нагрузке этого преподавателя будет удалена.
        </p>
        <div class="flex flex-col gap-3 w-full max-w-sm">
          <button
            @click="handleDeleteWorkload"
            class="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-500/30 transition-all active:scale-95"
          >
            УДАЛИТЬ НАВСЕГДА
          </button>
          <button
            @click="deleteConfirmId = null"
            class="w-full py-4 bg-muted hover:bg-muted/80 text-muted-foreground rounded-2xl font-bold transition-all active:scale-95"
          >
            ОТМЕНА
          </button>
        </div>
      </div>
    </f7-popup>

    <!-- Add Subject Modal -->
    <f7-popup :opened="isAddingSubject" @popup:closed="isAddingSubject = false">
      <div class="flex flex-col h-full bg-background">
        <div class="p-6 border-b border-border flex items-center justify-between bg-muted/10">
          <h2 class="text-xl font-bold text-foreground">Добавить предмет в нагрузку</h2>
          <button
            @click="isAddingSubject = false"
            class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <IconX class="w-6 h-6" />
          </button>
        </div>

        <div class="p-4 border-b border-border">
          <div class="relative">
            <IconSearch class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию или коду..."
              v-model="subjectSearchQuery"
              class="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-foreground"
            />
          </div>
        </div>

        <div class="overflow-y-auto flex-1 p-2">
          <button
            v-for="rup in filteredRup"
            :key="rup.id"
            @click="addSubjectFromRup(rup)"
            class="w-full text-left p-4 hover:bg-muted/30 rounded-xl transition-colors border border-transparent hover:border-border flex items-start gap-4 group mb-1"
          >
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
              <IconBookOpen class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">{{ rup.moduleIndex }}</span>
                <h3 class="font-bold text-foreground truncate">{{ rup.moduleName }}</h3>
              </div>
              <p class="text-sm text-muted-foreground line-clamp-1">
                Специальность: {{ getSpecialtyCodes(rup.specialtyIds) }} | {{ rup.language }}
              </p>
            </div>
          </button>
          <div v-if="filteredRup.length === 0" class="p-8 text-center text-muted-foreground">
            Предметы в РУП не найдены
          </div>
        </div>
      </div>
    </f7-popup>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { f7Page, f7Popup, f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import { useWorkloadStore } from "@/stores/workloadStore";
import { useTeacherStore, type Teacher } from "@/stores/teacherStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useRupEntryStore, type RupEntry } from "@/stores/rupEntryStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useSidebar } from "@/composables/useSidebar";
import type { WorkloadItem, SavedWorkload } from "@/types/workload";

// Icons
import IconUser from "~icons/lucide/user";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconSearch from "~icons/lucide/search";
import IconCheck from "~icons/lucide/check";
import IconPlus from "~icons/lucide/plus";
import IconTrash from "~icons/lucide/trash-2";
import IconSave from "~icons/lucide/save";
import IconDownload from "~icons/lucide/download";
import IconCalendar from "~icons/lucide/calendar";
import IconEdit from "~icons/lucide/edit-2";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconBookOpen from "~icons/lucide/book-open";
import IconUsers from "~icons/lucide/users";
import IconLayoutGrid from "~icons/lucide/layout-grid";
import IconX from "~icons/lucide/x";

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
const isTeacherDropdownOpen = ref(false);
const teacherSearchQuery = ref("");
const isAddingSubject = ref(false);
const subjectSearchQuery = ref("");
const savedWorkloadSearchQuery = ref("");
const deleteConfirmId = ref<string | null>(null);
const showSaveConfirm = ref(false);

const activeAcademicYearId = computed(() => getActiveAcademicYear.value?.id || "");

// Semester count logic
const semesterCount = computed(() => {
  if (!selectedAcademicYearId.value) return 2;
  const semesters = academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(selectedAcademicYearId.value);
  return semesters.length || 2;
});

const selectedTeacherName = computed(() => {
  const teacher = teachers.value.find(t => t.id === selectedTeacherId.value);
  return teacher ? getTeacherFullName(teacher) : "";
});

function getTeacherFullName(teacher: Teacher) {
  return `${teacher.surname} ${teacher.firstName} ${teacher.patronymic}`.trim();
}

const filteredTeachers = computed(() => {
  return teachers.value.filter(t => 
    getTeacherFullName(t).toLowerCase().includes(teacherSearchQuery.value.toLowerCase())
  );
});

const filteredRup = computed(() => {
  return rupEntries.value.filter(item => {
    if (selectedAcademicYearId.value && item.academicYearId !== selectedAcademicYearId.value) return false;
    const search = subjectSearchQuery.value.toLowerCase();
    return item.moduleName.toLowerCase().includes(search) || item.moduleIndex.toLowerCase().includes(search);
  });
});

const filteredWorkloads = computed(() => {
  return allWorkloads.value.filter(w => {
    if (selectedAcademicYearId.value && w.academicYearId !== selectedAcademicYearId.value) return false;
    const search = savedWorkloadSearchQuery.value.toLowerCase();
    const matchesTeacher = w.teacherName.toLowerCase().includes(search);
    const matchesSubject = w.items.some(item => item.description?.toLowerCase().includes(search));
    return matchesTeacher || matchesSubject;
  });
});

const totalCurrentWorkloadHours = computed(() => {
  return currentWorkloadItems.value.reduce((sum, item) => sum + parseInt(item.totalHours || '0'), 0);
});

function selectTeacher(teacher: Teacher) {
  selectedTeacherId.value = teacher.id;
  isTeacherDropdownOpen.value = false;
  teacherSearchQuery.value = "";
  if (!editingWorkloadId.value) {
    currentWorkloadItems.value = [];
  }
}

function addSubjectFromRup(rup: RupEntry) {
  const newItem: WorkloadItem = {
    id: crypto.randomUUID(),
    subjectId: rup.id,
    department: getSpecialtyCodes(rup.specialtyIds),
    course: "1", // Fallback, could be derived
    studentCount: "0",
    weeks1: "18",
    weeks2: "20",
    hours1: "0",
    hours2: "0",
    hoursPerGroup1: "0",
    hoursPerGroup2: "0",
    groupCount1: "1",
    groupCount2: "1",
    totalHours: "0",
    index: rup.moduleIndex,
    description: rup.moduleName
  };

  // Set initial hours from distribution entries if available
  rup.distributionEntries.forEach((entry, idx) => {
    const semNum = idx + 1;
    if (semNum <= semesterCount.value) {
        newItem[`hoursPerGroup${semNum}`] = entry.hours || "0";
        const weeks = parseFloat(newItem[`weeks${semNum}`]) || 1;
        newItem[`hours${semNum}`] = (parseFloat(entry.hours || "0") / weeks).toFixed(1);
    }
  });

  currentWorkloadItems.value.push(newItem);
  recalculateItem(newItem.id);
  isAddingSubject.value = false;
}

function getSpecialtyCodes(ids: string[]) {
  return ids.map(id => specialties.value.find(s => s.id === id)?.codeName || id).join(', ');
}

function recalculateItem(id: string) {
  const item = currentWorkloadItems.value.find(i => i.id === id);
  if (!item) return;

  let total = 0;
  for (let i = 1; i <= semesterCount.value; i++) {
    const weeks = parseFloat(item[`weeks${i}`] || '0');
    const hours = parseFloat(item[`hours${i}`] || '0');
    const groupCount = parseFloat(item[`groupCount${i}`] || '0');
    
    const hoursPerGroup = weeks * hours;
    item[`hoursPerGroup${i}`] = hoursPerGroup.toString();
    total += hoursPerGroup * groupCount;
  }

  item.totalHours = Math.round(total).toString();
}

function adjustValue(id: string, field: string, delta: number) {
  const item = currentWorkloadItems.value.find(i => i.id === id);
  if (!item) return;
  const val = parseFloat(item[field] || '0');
  item[field] = Math.max(0, val + delta).toString();
  recalculateItem(id);
}

function deleteItem(id: string) {
  currentWorkloadItems.value = currentWorkloadItems.value.filter(i => i.id !== id);
}

function formatHours(val: any) {
  const n = parseFloat(val || '0');
  return Number.isInteger(n) ? n : n.toFixed(1);
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

function downloadWorkload(workload: SavedWorkload) {
  const headers = ['Предмет', 'Отделение', 'Курс', 'Студенты', 'Недели 1', 'Недели 2', 'Часы 1', 'Часы 2', 'На группу 1', 'На группу 2', 'Группы 1', 'Группы 2', 'Всего часов'];
  const rows = workload.items.map(item => [
    item.description,
    item.department,
    item.course,
    item.studentCount,
    item.weeks1,
    item.weeks2,
    item.hours1,
    item.hours2,
    item.hoursPerGroup1,
    item.hoursPerGroup2,
    item.groupCount1,
    item.groupCount2,
    item.totalHours
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Нагрузка_${workload.teacherName}_${getAcademicYearName(workload.academicYearId)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadAllWorkloads() {
  if (filteredWorkloads.value.length === 0) return;
  
  const headers = ['Преподаватель', 'Учебный год', 'Предмет', 'Отделение', 'Курс', 'Студенты', 'Недели 1', 'Недели 2', 'Часы 1', 'Часы 2', 'На группу 1', 'На группу 2', 'Группы 1', 'Группы 2', 'Всего часов'];
  const rows: any[][] = [];
  
  filteredWorkloads.value.forEach(workload => {
    workload.items.forEach(item => {
      rows.push([
        workload.teacherName,
        getAcademicYearName(workload.academicYearId),
        item.description,
        item.department,
        item.course,
        item.studentCount,
        item.weeks1,
        item.weeks2,
        item.hours1,
        item.hours2,
        item.hoursPerGroup1,
        item.hoursPerGroup2,
        item.groupCount1,
        item.groupCount2,
        item.totalHours
      ]);
    });
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Сводная_нагрузка_${getAcademicYearName(selectedAcademicYearId.value || 'все')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(() => {
  if (!selectedAcademicYearId.value) {
    selectedAcademicYearId.value = activeAcademicYearId.value;
  }
});
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
