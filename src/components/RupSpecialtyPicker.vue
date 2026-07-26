<template>
  <div class="mb-6">
    <TagsSelector
      :model-value="modelValue"
      @update:model-value="(v: string[]) => emit('update:modelValue', v)"
      :items="specialtyOptions"
      label="Специальности"
      placeholder="Выберите специальности..."
      display-field="text"
      :show-search="false"
      helper-text="Выберите одну или несколько специальностей для данного модуля"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import TagsSelector from "@/components/ui/TagsSelector.vue";
import { useSpecialtyStore } from "@/stores/specialtyStore";

/**
 * Extracted from RupEntryPopup (spec P3, step 2). Thin v-model wrapper around
 * TagsSelector: state stays with the parent (many other pieces of the form
 * read `selectedSpecialtyIds`), while store access, option shape, and the
 * on-mount `fetchSpecialties` call move here — parent no longer knows about
 * the specialty store.
 */
defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();

const specialtyStore = useSpecialtyStore();

const specialtyOptions = computed(() =>
  specialtyStore.specialties.map((s) => ({
    id: s.id,
    text: s.codeName || s.name,
    codeName: s.codeName,
    name: s.name,
  }))
);

onMounted(() => {
  void specialtyStore.fetchSpecialties();
});
</script>
