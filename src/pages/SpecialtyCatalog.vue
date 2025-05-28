<template>
  <f7-page
    name="specialty-catalog"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      class="hidden md:block flex-shrink-0 border-b border-border"
    />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold">Каталог специальностей</h1>
            <div class="flex gap-2">
              <f7-input
                type="text"
                placeholder="Поиск..."
                class="border border-border rounded-lg"
                clear-button
              ></f7-input>
              <f7-input
                type="text"
                placeholder="2024-2025"
                class="border border-border rounded-lg w-32 text-center"
                readonly
              ></f7-input>
            </div>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm"
          >
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-muted/50">
                    <th class="px-4 py-3 text-left">№</th>
                    <th class="px-4 py-3 text-left">Ф</th>
                    <th class="px-4 py-3 text-left">Код</th>
                    <th class="px-4 py-3 text-left">Наименование</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(specialty, index) in specialties"
                    :key="specialty.id"
                    :id="`specialty-item-${specialty.id}`"
                    class="border-b border-border hover:bg-muted/30"
                    :class="{ 'bg-red-100': specialty.isHighlighted }"
                    @click="selectSpecialty(specialty)"
                  >
                    <td class="px-4 py-3">{{ index + 1 }}</td>
                    <td class="px-4 py-3">{{ specialty.codeName }}</td>
                    <td class="px-4 py-3">{{ specialty.code }}</td>
                    <td class="px-4 py-3">
                      {{ specialty.name }}
                      <div class="text-sm text-muted-foreground">
                        {{ specialty.details }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #fixed>
      <AddSpecialtyButton />
    </template>

    <EditSpecialtyButton
      v-if="selectedSpecialty"
      :key="`edit-${selectedSpecialty.id}`"
      :specialty="selectedSpecialty"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7Page, f7Input } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddSpecialtyButton from "@/components/AddSpecialtyButton.vue";
import EditSpecialtyButton from "@/components/EditSpecialtyButton.vue";
import { useSpecialtyStore, type Specialty } from "@/stores/specialtyStore";
import { storeToRefs } from "pinia";

const searchbarEnabled = ref(false);
const activeNavItem = ref("specialty-catalog");
const specialtyStore = useSpecialtyStore();
const { specialties } = storeToRefs(specialtyStore);
const selectedSpecialty = ref<Specialty | null>(null);

const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};

const selectSpecialty = (specialty: Specialty) => {
  selectedSpecialty.value = specialty;
};
</script>
